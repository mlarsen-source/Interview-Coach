from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # loads backend/.env into os.environ before any service code runs

from services.tone_delivery_analyzer.router import router as emotion_router
from services.tone_delivery_analyzer.router import startup as emotion_startup
from services.speech_to_text.router import router as speech_router
from services.llm.router import router as llm_router
from services.text_analysis.router import router as text_analysis_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    emotion_startup()
    yield


app = FastAPI(title="Interview Coach API", lifespan=lifespan)

# TODO: production — replace localhost:3000 with the deployed frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(speech_router,        prefix="/speech",   tags=["speech"])
app.include_router(emotion_router,       prefix="/emotion",  tags=["emotion"])
app.include_router(llm_router,           prefix="/feedback", tags=["feedback"])
app.include_router(text_analysis_router, prefix="/analysis", tags=["analysis"])


@app.get("/health")
def health():
    return {"status": "ok"}
