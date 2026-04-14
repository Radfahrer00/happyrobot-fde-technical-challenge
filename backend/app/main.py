from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import calls, carriers, loads, negotiations


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Seed demo data on first run
    _maybe_seed()
    yield


def _maybe_seed():
    """Seed ~150 historical call records if the DB is empty."""
    db = SessionLocal()
    try:
        from app.models import CallRecord

        if db.query(CallRecord).count() == 0:
            from app.data.seed_calls import generate_seed_records

            records = generate_seed_records()
            db.bulk_save_objects(records)
            db.commit()
    finally:
        db.close()


app = FastAPI(
    title="Acme Logistics – Carrier Desk API",
    description="Inbound carrier sales automation backend for the HappyRobot AI agent.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(carriers.router)
app.include_router(loads.router)
app.include_router(negotiations.router)
app.include_router(calls.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "acme-carrier-desk-api"}
