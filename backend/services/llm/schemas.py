"""Pydantic models for POST /feedback/generate.

The frontend aggregates the recorded session (question + full transcript +
per-segment arousal/dominance/valence) and posts it here. A single Groq call
returns transcript scores, qualitative feedback, and a model answer.
"""

from pydantic import BaseModel, Field


class Question(BaseModel):
    id: str
    text: str


class ScoredSegment(BaseModel):
    """A timestamped transcript segment with its delivery (A/D/V) scores."""

    start: float
    end: float
    text: str
    arousal: float
    dominance: float
    valence: float


class Transcript(BaseModel):
    text: str
    segments: list[ScoredSegment]


class ReviewContextPayload(BaseModel):
    """Request body for POST /feedback/generate."""

    question: Question
    transcript: Transcript


class TranscriptScores(BaseModel):
    clarity: float = Field(ge=0.0, le=1.0)
    structure: float = Field(ge=0.0, le=1.0)
    relevance: float = Field(ge=0.0, le=1.0)
    conciseness: float = Field(ge=0.0, le=1.0)


class QualitativeFeedback(BaseModel):
    summary: str
    strengths: list[str]
    improvements: list[str]
    deliveryNotes: str


class ModelAnswer(BaseModel):
    text: str


class SessionFeedbackResponse(BaseModel):
    """Response body for POST /feedback/generate — matches the frontend
    SessionReviewResult feedback/scores shape."""

    transcriptScores: TranscriptScores
    feedback: QualitativeFeedback
    modelAnswer: ModelAnswer
