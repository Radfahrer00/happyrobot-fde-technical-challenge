import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CallRecord(Base):
    __tablename__ = "call_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    call_id: Mapped[str] = mapped_column(
        String, unique=True, index=True, default=lambda: str(uuid.uuid4())
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    mc_number: Mapped[str] = mapped_column(String, nullable=False)
    carrier_name: Mapped[str | None] = mapped_column(String, nullable=True)
    load_id: Mapped[str | None] = mapped_column(String, nullable=True)
    agreed_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    loadboard_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    # outcome: booking_confirmed | negotiation_failed | carrier_ineligible |
    #          no_suitable_loads | call_transferred | other
    outcome: Mapped[str] = mapped_column(String, nullable=False)
    # sentiment: positive | neutral | frustrated | confused | other
    sentiment: Mapped[str] = mapped_column(String, nullable=False)
    negotiation_rounds: Mapped[int] = mapped_column(Integer, default=0)
