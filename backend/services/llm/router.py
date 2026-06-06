"""LLM feedback service — POST /feedback/generate.

A single Groq (openai/gpt-oss-20b) call takes the recorded session context
(question + full transcript + per-segment arousal/dominance/valence) and
returns transcript scores, qualitative feedback, and a model answer.

Transcript-quality scoring (clarity/structure/relevance/conciseness) is folded
into this one call, so the separate /analysis endpoint stays reserved.
"""

import json
import os

from fastapi import APIRouter, HTTPException
from groq import Groq
from pydantic import ValidationError

from services.llm.schemas import (
    FullSessionFeedbackResponse,
    ReviewContextPayload,
    SessionFeedbackResponse,
    SessionReviewPayload,
)

FEEDBACK_MODEL = "openai/gpt-oss-20b"
_groq = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

router = APIRouter()


# JSON schema handed to Groq structured outputs. strict=false (best-effort):
# gpt-oss-20b occasionally 400s under strict constrained decoding, so we
# validate the response ourselves and retry once.
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "transcriptScores": {
            "type": "object",
            "properties": {
                "clarity": {"type": "number"},
                "structure": {"type": "number"},
                "relevance": {"type": "number"},
                "conciseness": {"type": "number"},
            },
            "required": ["clarity", "structure", "relevance", "conciseness"],
        },
        "feedback": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "improvements": {"type": "array", "items": {"type": "string"}},
                "deliveryNotes": {"type": "string"},
            },
            "required": ["summary", "strengths", "improvements", "deliveryNotes"],
        },
        "modelAnswer": {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        },
    },
    "required": ["transcriptScores", "feedback", "modelAnswer"],
}

_SYSTEM_PROMPT = """You are an expert interview coach reviewing a candidate's \
spoken answer to an interview question.

You receive:
- The interview question.
- The full transcript of the candidate's spoken answer.
- The transcript broken into timestamped segments. Each segment carries three \
delivery signals derived from the candidate's voice, each in the range 0..1:
    - arousal: vocal energy / activation (low = flat/calm, high = energetic)
    - dominance: assertiveness / confidence in tone
    - valence: positivity / warmth of tone
These are tone-and-delivery signals only. Never treat them as clinical, \
emotional, or diagnostic labels.

Produce a single JSON object with:
1. transcriptScores: four numbers in 0..1 rating the ANSWER TEXT only:
    - clarity: how clearly ideas are expressed
    - structure: logical organization (e.g. STAR for behavioral answers)
    - relevance: how well it answers the question asked
    - conciseness: brevity without rambling or filler
2. feedback:
    - summary: 2-3 sentence cohesive overview of how the candidate did overall, \
covering both content and delivery.
    - strengths: 2-4 specific things that went well. When relevant, reference \
specific moments in the answer (quote a short phrase or cite the approximate \
timestamp) and tie delivery signals to those moments.
    - improvements: 2-4 specific, actionable suggestions. Reference specific \
segments where delivery (e.g. low arousal sounding flat, low valence sounding \
cold) or content could improve.
    - deliveryNotes: a short paragraph on vocal delivery overall, grounded in \
the per-segment arousal/dominance/valence trends.
3. modelAnswer: a concise, strong example answer to the same question (a few \
sentences) the candidate could learn from.

Be specific and grounded in the provided transcript and segments. Do not invent \
facts the candidate did not say. Output only the JSON object."""

_SESSION_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "overallSummary": {"type": "string"},
        "overallStrengths": {"type": "array", "items": {"type": "string"}},
        "overallImprovements": {"type": "array", "items": {"type": "string"}},
        "overallDeliveryNotes": {"type": "string"},
        "questionReviews": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "text": {"type": "string"},
                        },
                        "required": ["id", "text"],
                    },
                    "transcriptScores": _RESPONSE_SCHEMA["properties"][
                        "transcriptScores"
                    ],
                    "feedback": _RESPONSE_SCHEMA["properties"]["feedback"],
                    "modelAnswer": _RESPONSE_SCHEMA["properties"]["modelAnswer"],
                },
                "required": ["question", "transcriptScores", "feedback", "modelAnswer"],
            },
        },
    },
    "required": [
        "overallSummary",
        "overallStrengths",
        "overallImprovements",
        "overallDeliveryNotes",
        "questionReviews",
    ],
}

_SESSION_SYSTEM_PROMPT = """You are an expert interview coach reviewing a \
candidate's full mock interview session.

You receive multiple question-and-answer pairs. Each answer includes the \
question text, full transcript, and timestamped segments with delivery signals \
(arousal, dominance, valence — each 0..1). These are tone-and-delivery signals \
only, not clinical labels.

Produce a single JSON object with:
1. overallSummary: 3-5 sentence overview of how the candidate performed across \
the whole session (content and delivery trends).
2. overallStrengths: 3-5 session-level strengths.
3. overallImprovements: 3-5 session-level, actionable improvements.
4. overallDeliveryNotes: one paragraph on vocal delivery patterns across answers.
5. questionReviews: one entry per question answered, in the same order provided. \
Each entry must include:
    - question: echo back the exact id and text from the input
    - transcriptScores: clarity/structure/relevance/conciseness (0..1) for that answer
    - feedback: summary, strengths, improvements, deliveryNotes for that answer
    - modelAnswer: a strong example answer for that question

Be specific and grounded in the transcripts. Do not invent facts. Output only JSON."""


def _require_groq() -> None:
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")


def _build_user_prompt(payload: ReviewContextPayload) -> str:
    seg_lines = []
    for i, seg in enumerate(payload.transcript.segments, start=1):
        seg_lines.append(
            f"  Segment {i} [{seg.start:.2f}s-{seg.end:.2f}s] "
            f"(arousal={seg.arousal:.2f}, dominance={seg.dominance:.2f}, "
            f"valence={seg.valence:.2f}): {seg.text}"
        )
    segments_block = "\n".join(seg_lines) if seg_lines else "  (no segments)"

    return (
        f"QUESTION:\n{payload.question.text}\n\n"
        f"FULL TRANSCRIPT:\n{payload.transcript.text}\n\n"
        f"TIMESTAMPED SEGMENTS WITH DELIVERY SCORES:\n{segments_block}"
    )


def _call_groq(user_prompt: str, *, session: bool = False) -> str:
    completion = _groq.chat.completions.create(
        model=FEEDBACK_MODEL,
        messages=[
            {
                "role": "system",
                "content": _SESSION_SYSTEM_PROMPT if session else _SYSTEM_PROMPT,
            },
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "session_feedback" if session else "answer_feedback",
                "strict": False,
                "schema": _SESSION_RESPONSE_SCHEMA if session else _RESPONSE_SCHEMA,
            },
        },
    )
    return completion.choices[0].message.content or ""


def _build_session_user_prompt(payload: SessionReviewPayload) -> str:
    blocks = []
    for n, answer in enumerate(payload.answers, start=1):
        blocks.append(f"=== ANSWER {n} ===\n{_build_user_prompt(answer)}")
    return "\n\n".join(blocks)


def _generate_with_retry(
    user_prompt: str,
    *,
    session: bool = False,
) -> dict:
    last_error: Exception | None = None
    for _ in range(2):
        try:
            raw = _call_groq(user_prompt, session=session)
        except Exception as exc:
            last_error = exc
            continue

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            last_error = exc
            continue

    raise HTTPException(
        status_code=502,
        detail=f"Feedback generation failed: {last_error}",
    )


@router.post("/generate", response_model=SessionFeedbackResponse)
async def generate(payload: ReviewContextPayload) -> SessionFeedbackResponse:
    """Generate transcript scores + qualitative feedback + a model answer for a
    recorded interview answer using a single Groq call."""
    _require_groq()

    if not payload.transcript.text.strip():
        raise HTTPException(status_code=422, detail="Transcript is empty.")

    user_prompt = _build_user_prompt(payload)

    try:
        data = _generate_with_retry(user_prompt)
        return SessionFeedbackResponse.model_validate(data)
    except HTTPException:
        raise
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Feedback generation failed: {exc}",
        ) from exc


@router.post("/generate-session", response_model=FullSessionFeedbackResponse)
async def generate_session(
    payload: SessionReviewPayload,
) -> FullSessionFeedbackResponse:
    """Generate holistic session feedback plus per-question reviews in one Groq call."""
    _require_groq()

    if not payload.answers:
        raise HTTPException(status_code=422, detail="No answers provided.")

    for answer in payload.answers:
        if not answer.transcript.text.strip():
            raise HTTPException(
                status_code=422, detail="One or more transcripts are empty."
            )

    user_prompt = _build_session_user_prompt(payload)

    try:
        data = _generate_with_retry(user_prompt, session=True)
        return FullSessionFeedbackResponse.model_validate(data)
    except HTTPException:
        raise
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Session feedback generation failed: {exc}",
        ) from exc
