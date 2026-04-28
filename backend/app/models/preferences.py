"""User preferences: saved screener presets + the working-set basket.

Both are owned by ``user_id`` even though auth is currently stubbed (the
local user is always ``id=1``); when real auth flips on this becomes
per-user automatically.
"""
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class ScreenerPreset(Base):
    """A named bag of screener filters + sort.

    ``filters`` and ``sort`` are stored as JSON so we can extend the schema
    without migrations. The shape mirrors the ``ScreenerQuery`` pydantic
    model (see ``schemas/stock.py``).
    """
    __tablename__ = "screener_presets"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_preset_user_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    filters = Column(JSON, nullable=False, default=dict)
    sort = Column(JSON, nullable=False, default=dict)  # {"by": ..., "dir": ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BasketItem(Base):
    """One ticker in the user's working set (backtest basket).

    Single basket per user keeps the UX simple; promote to named baskets
    later by adding a ``basket_id`` column + Basket parent table.
    """
    __tablename__ = "basket_items"
    __table_args__ = (
        UniqueConstraint("user_id", "stock_id", name="uq_basket_user_stock"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    note = Column(String(500))
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    stock = relationship("Stock", lazy="joined")
