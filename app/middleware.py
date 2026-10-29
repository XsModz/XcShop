from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category_id: Mapped[int | None] = mapped_column(ForeignKey("product_categories.id"), nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_vip: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    category: Mapped[ProductCategory | None] = relationship(back_populates="products")
    versions: Mapped[list["ProductVersion"]] = relationship(back_populates="product")
    inventory: Mapped[list["ProductInventory"]] = relationship(back_populates="product")
    storage_messages: Mapped[list["StorageMessageRef"]] = relationship(back_populates="product")


class ProductVersion(Base):
    __tablename__ = "product_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="")

    product: Mapped[Product] = relationship(back_populates="versions")


class ProductInventory(Base):
    __tablename__ = "product_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    stock_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped[Product] = relationship(back_populates="inventory")


class StorageMessageRef(Base):
    __tablename__ = "storage_message_refs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    chat_id: Mapped[int] = mapped_column(Integer, nullable=False)
    message_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product: Mapped[Product] = relationship(back_populates="storage_messages")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="created", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class License(Base):
    __tablename__ = "licenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class LicenseActivation(Base):
    __tablename__ = "license_activations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    license_id: Mapped[int] = mapped_column(ForeignKey("licenses.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    activated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Reseller(Base):
    __tablename__ = "resellers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ResellerProductAssignment(Base):
    __tablename__ = "reseller_product_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reseller_id: Mapped[int] = mapped_column(ForeignKey("resellers.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_uses: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    per_user_limit: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CouponRedemption(Base):
    __tablename__ = "coupon_redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    coupon_id: Mapped[int] = mapped_column(ForeignKey("coupons.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class BotSetting(Base):
    __tablename__ = "bot_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


__all__ = [
    "User",
    "ProductCategory",
    "Product",
    "ProductVersion",
    "ProductInventory",
    "StorageMessageRef",
    "Order",
    "License",
    "LicenseActivation",
    "Reseller",
    "ResellerProductAssignment",
    "Coupon",
    "CouponRedemption",
    "AdminAuditLog",
    "BotSetting",
]


