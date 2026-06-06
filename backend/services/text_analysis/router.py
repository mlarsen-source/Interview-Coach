from fastapi import APIRouter

router = APIRouter()


# Reserved. Transcript-quality scoring (clarity/structure/relevance/conciseness)
# is currently produced by the combined Groq call in services/llm/router.py
# (POST /feedback/generate), so no endpoints are defined here yet.
