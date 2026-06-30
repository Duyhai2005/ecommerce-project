"""create remaining mvp01 tables

Revision ID: 20260630_1600
Revises: 20260630_1057
Create Date: 2026-06-30 16:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

revision: str = "20260630_1600"
down_revision: str | Sequence[str] | None = "20260630_1057"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def uint_bigint() -> mysql.BIGINT:
    return mysql.BIGINT(unsigned=True)


def pk_column() -> sa.Column:
    return sa.Column(
        "id",
        uint_bigint(),
        autoincrement=True,
        nullable=False,
    )


def uint_fk_column(name: str, *, nullable: bool = False, **kwargs) -> sa.Column:
    return sa.Column(name, uint_bigint(), nullable=nullable, **kwargs)


def uint_int_column(
    name: str,
    *,
    nullable: bool = False,
    default: int | None = None,
) -> sa.Column:
    kwargs = {"nullable": nullable}
    if default is not None:
        kwargs["server_default"] = sa.text(str(default))
    return sa.Column(name, mysql.INTEGER(unsigned=True), **kwargs)


def money_column(
    name: str,
    *,
    precision: int = 12,
    scale: int = 2,
    nullable: bool = False,
    default: str | None = None,
) -> sa.Column:
    kwargs = {"nullable": nullable}
    if default is not None:
        kwargs["server_default"] = sa.text(default)
    return sa.Column(name, sa.Numeric(precision, scale), **kwargs)


def bool_column(
    name: str,
    *,
    nullable: bool = False,
    default: int | None = None,
) -> sa.Column:
    kwargs = {"nullable": nullable}
    if default is not None:
        kwargs["server_default"] = sa.text(str(default))
    return sa.Column(name, sa.Boolean(), **kwargs)


def created_at_column() -> sa.Column:
    return sa.Column("created_at", sa.DateTime(), nullable=False)


def updated_at_column() -> sa.Column:
    return sa.Column("updated_at", sa.DateTime(), nullable=True)


def upgrade() -> None:
    op.create_table(
        "user_addresses",
        pk_column(),
        uint_fk_column("user_id"),
        sa.Column("receiver_name", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("ward", sa.String(length=100), nullable=False),
        sa.Column("detail_address", sa.String(length=255), nullable=False),
        sa.Column("address_type", sa.String(length=30), nullable=False),
        bool_column("is_default", default=0),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_addresses_user_id",
        "user_addresses",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_addresses_is_default",
        "user_addresses",
        ["is_default"],
        unique=False,
    )

    op.create_table(
        "seller_profiles",
        pk_column(),
        sa.Column("public_id", sa.CHAR(length=36), nullable=False),
        uint_fk_column("user_id"),
        sa.Column("shop_name", sa.String(length=150), nullable=False),
        sa.Column("shop_slug", sa.String(length=180), nullable=False),
        sa.Column("shop_logo_url", sa.String(length=500), nullable=True),
        sa.Column("shop_description", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("pickup_address", sa.String(length=500), nullable=False),
        money_column("shipping_fee", default="0.00"),
        sa.Column("shipping_provider_name", sa.String(length=150), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("rejected_reason", sa.String(length=500), nullable=True),
        uint_int_column("total_sold", default=0),
        money_column("total_revenue", precision=14, default="0.00"),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("shop_name"),
        sa.UniqueConstraint("shop_slug"),
    )
    op.create_index(
        "ix_seller_profiles_status",
        "seller_profiles",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_seller_profiles_created_at",
        "seller_profiles",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "seller_documents",
        pk_column(),
        uint_fk_column("seller_id"),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("document_url", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        created_at_column(),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_seller_documents_seller_id",
        "seller_documents",
        ["seller_id"],
        unique=False,
    )
    op.create_index(
        "ix_seller_documents_status",
        "seller_documents",
        ["status"],
        unique=False,
    )

    op.create_table(
        "categories",
        pk_column(),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False),
        bool_column("is_default_other", default=0),
        uint_int_column("sort_order", default=0),
        created_at_column(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(
        "ix_categories_sort_order",
        "categories",
        ["sort_order"],
        unique=False,
    )

    op.create_table(
        "category_suggestions",
        pk_column(),
        uint_fk_column("seller_id"),
        sa.Column("suggested_name", sa.String(length=150), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        created_at_column(),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_category_suggestions_seller_id",
        "category_suggestions",
        ["seller_id"],
        unique=False,
    )
    op.create_index(
        "ix_category_suggestions_status",
        "category_suggestions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "products",
        pk_column(),
        sa.Column("public_id", sa.CHAR(length=36), nullable=False),
        uint_fk_column("seller_id"),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=280), nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("origin", sa.String(length=120), nullable=True),
        sa.Column("warranty_info", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        money_column("average_rating", precision=3, default="0.00"),
        uint_int_column("review_count", default=0),
        uint_int_column("sold_count", default=0),
        uint_int_column("view_count", default=0),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("seller_id", "slug", name="uq_products_seller_id_slug"),
    )
    op.create_index("ix_products_seller_id", "products", ["seller_id"], unique=False)
    op.create_index("ix_products_status", "products", ["status"], unique=False)
    op.create_index("ix_products_created_at", "products", ["created_at"], unique=False)
    op.create_index("ix_products_sold_count", "products", ["sold_count"], unique=False)
    op.create_index(
        "ix_products_average_rating",
        "products",
        ["average_rating"],
        unique=False,
    )
    op.create_index(
        "ix_products_fulltext_search",
        "products",
        ["name", "short_description", "description"],
        unique=False,
        mysql_prefix="FULLTEXT",
    )

    op.create_table(
        "product_categories",
        uint_fk_column("product_id"),
        uint_fk_column("category_id"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("product_id", "category_id"),
    )
    op.create_index(
        "ix_product_categories_category_id",
        "product_categories",
        ["category_id"],
        unique=False,
    )

    op.create_table(
        "product_images",
        pk_column(),
        uint_fk_column("product_id"),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        bool_column("is_thumbnail", default=0),
        uint_int_column("sort_order", default=0),
        created_at_column(),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_product_images_product_id",
        "product_images",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_images_is_thumbnail",
        "product_images",
        ["is_thumbnail"],
        unique=False,
    )

    op.create_table(
        "product_variants",
        pk_column(),
        sa.Column("public_id", sa.CHAR(length=36), nullable=False),
        uint_fk_column("product_id"),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("variant_name", sa.String(length=150), nullable=False),
        money_column("price"),
        money_column("sale_price", nullable=True),
        sa.Column("sale_start_at", sa.DateTime(), nullable=True),
        sa.Column("sale_end_at", sa.DateTime(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index(
        "ix_product_variants_product_id",
        "product_variants",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_variants_sku",
        "product_variants",
        ["sku"],
        unique=False,
    )
    op.create_index(
        "ix_product_variants_status",
        "product_variants",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_product_variants_price",
        "product_variants",
        ["price"],
        unique=False,
    )
    op.create_index(
        "ix_product_variants_sale_price",
        "product_variants",
        ["sale_price"],
        unique=False,
    )

    op.create_table(
        "inventories",
        pk_column(),
        uint_fk_column("variant_id"),
        uint_int_column("quantity", default=0),
        uint_int_column("reserved_quantity", default=0),
        updated_at_column(),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("variant_id"),
    )

    op.create_table(
        "inventory_transactions",
        pk_column(),
        uint_fk_column("variant_id"),
        sa.Column("transaction_type", sa.String(length=30), nullable=False),
        sa.Column("quantity_change", sa.Integer(), nullable=False),
        uint_int_column("quantity_before"),
        uint_int_column("quantity_after"),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        uint_fk_column("reference_id", nullable=True),
        sa.Column("note", sa.String(length=500), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_inventory_transactions_variant_id",
        "inventory_transactions",
        ["variant_id"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_transactions_transaction_type",
        "inventory_transactions",
        ["transaction_type"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_transactions_created_at",
        "inventory_transactions",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "carts",
        pk_column(),
        uint_fk_column("user_id"),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "cart_items",
        pk_column(),
        uint_fk_column("cart_id"),
        uint_fk_column("variant_id"),
        uint_int_column("quantity"),
        bool_column("is_selected", default=1),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cart_id", "variant_id", name="uq_cart_items_cart_variant"),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"], unique=False)
    op.create_index(
        "ix_cart_items_variant_id",
        "cart_items",
        ["variant_id"],
        unique=False,
    )
    op.create_index(
        "ix_cart_items_is_selected",
        "cart_items",
        ["is_selected"],
        unique=False,
    )

    op.create_table(
        "orders",
        pk_column(),
        sa.Column("public_id", sa.CHAR(length=36), nullable=False),
        sa.Column("order_code", sa.String(length=50), nullable=False),
        uint_fk_column("user_id"),
        uint_fk_column("seller_id"),
        sa.Column("order_status", sa.String(length=30), nullable=False),
        sa.Column("payment_status", sa.String(length=30), nullable=False),
        bool_column("seller_confirmed", default=0),
        sa.Column("seller_confirmed_at", sa.DateTime(), nullable=True),
        money_column("subtotal_amount"),
        money_column("shipping_fee", default="0.00"),
        money_column("product_discount_amount", default="0.00"),
        money_column("shipping_discount_amount", default="0.00"),
        money_column("total_amount"),
        sa.Column("customer_note", sa.String(length=500), nullable=True),
        sa.Column("payment_expires_at", sa.DateTime(), nullable=False),
        sa.Column("seller_confirm_expires_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("order_code"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"], unique=False)
    op.create_index("ix_orders_seller_id", "orders", ["seller_id"], unique=False)
    op.create_index("ix_orders_order_status", "orders", ["order_status"], unique=False)
    op.create_index(
        "ix_orders_payment_status",
        "orders",
        ["payment_status"],
        unique=False,
    )
    op.create_index("ix_orders_created_at", "orders", ["created_at"], unique=False)
    op.create_index(
        "ix_orders_payment_expires_at",
        "orders",
        ["payment_expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_orders_seller_confirm_expires_at",
        "orders",
        ["seller_confirm_expires_at"],
        unique=False,
    )

    op.create_table(
        "order_items",
        pk_column(),
        uint_fk_column("order_id"),
        uint_fk_column("product_id", nullable=True),
        uint_fk_column("variant_id", nullable=True),
        sa.Column("product_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("variant_name_snapshot", sa.String(length=150), nullable=False),
        sa.Column("product_image_snapshot", sa.String(length=500), nullable=True),
        sa.Column("seller_name_snapshot", sa.String(length=150), nullable=False),
        sa.Column("sku_snapshot", sa.String(length=100), nullable=True),
        money_column("unit_price"),
        uint_int_column("quantity"),
        money_column("subtotal"),
        created_at_column(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"], unique=False)
    op.create_index(
        "ix_order_items_product_id",
        "order_items",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_order_items_variant_id",
        "order_items",
        ["variant_id"],
        unique=False,
    )

    op.create_table(
        "shipments",
        pk_column(),
        uint_fk_column("order_id"),
        sa.Column("shipping_provider_name", sa.String(length=150), nullable=True),
        sa.Column("receiver_name", sa.String(length=150), nullable=False),
        sa.Column("receiver_phone", sa.String(length=20), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("ward", sa.String(length=100), nullable=False),
        sa.Column("detail_address", sa.String(length=255), nullable=False),
        sa.Column("address_type", sa.String(length=30), nullable=False),
        sa.Column("shipped_at", sa.DateTime(), nullable=True),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.Column("failed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )

    op.create_table(
        "order_status_logs",
        pk_column(),
        uint_fk_column("order_id"),
        sa.Column("old_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_order_status_logs_order_id",
        "order_status_logs",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        "ix_order_status_logs_new_status",
        "order_status_logs",
        ["new_status"],
        unique=False,
    )
    op.create_index(
        "ix_order_status_logs_created_at",
        "order_status_logs",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "order_cancellations",
        pk_column(),
        uint_fk_column("order_id"),
        uint_fk_column("cancelled_by_user_id", nullable=True),
        sa.Column("cancelled_by_type", sa.String(length=30), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=False),
        created_at_column(),
        sa.ForeignKeyConstraint(["cancelled_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )

    op.create_table(
        "payments",
        pk_column(),
        sa.Column("public_id", sa.CHAR(length=36), nullable=False),
        sa.Column("payment_code", sa.String(length=50), nullable=False),
        uint_fk_column("user_id"),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("payment_gateway", sa.String(length=50), nullable=True),
        sa.Column("payment_status", sa.String(length=30), nullable=False),
        money_column("amount"),
        sa.Column("transaction_code", sa.String(length=100), nullable=True),
        sa.Column("gateway_response", sa.JSON(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("failed_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("payment_code"),
        sa.UniqueConstraint("transaction_code"),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"], unique=False)
    op.create_index(
        "ix_payments_payment_status",
        "payments",
        ["payment_status"],
        unique=False,
    )
    op.create_index(
        "ix_payments_payment_method",
        "payments",
        ["payment_method"],
        unique=False,
    )
    op.create_index("ix_payments_created_at", "payments", ["created_at"], unique=False)

    op.create_table(
        "payment_orders",
        uint_fk_column("payment_id"),
        uint_fk_column("order_id"),
        created_at_column(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.PrimaryKeyConstraint("payment_id", "order_id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index(
        "ix_payment_orders_order_id",
        "payment_orders",
        ["order_id"],
        unique=False,
    )

    op.create_table(
        "refunds",
        pk_column(),
        uint_fk_column("payment_id"),
        uint_fk_column("order_id"),
        money_column("amount"),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("refund_status", sa.String(length=30), nullable=False),
        sa.Column("gateway_response", sa.JSON(), nullable=True),
        sa.Column("refunded_at", sa.DateTime(), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refunds_payment_id", "refunds", ["payment_id"], unique=False)
    op.create_index("ix_refunds_order_id", "refunds", ["order_id"], unique=False)
    op.create_index(
        "ix_refunds_refund_status",
        "refunds",
        ["refund_status"],
        unique=False,
    )

    op.create_table(
        "seller_payouts",
        pk_column(),
        uint_fk_column("seller_id"),
        uint_fk_column("order_id"),
        money_column("amount"),
        sa.Column("payout_status", sa.String(length=30), nullable=False),
        sa.Column("bank_account_name", sa.String(length=150), nullable=True),
        sa.Column("bank_account_number", sa.String(length=50), nullable=True),
        sa.Column("bank_name", sa.String(length=150), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        created_at_column(),
        updated_at_column(),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index(
        "ix_seller_payouts_seller_id",
        "seller_payouts",
        ["seller_id"],
        unique=False,
    )
    op.create_index(
        "ix_seller_payouts_payout_status",
        "seller_payouts",
        ["payout_status"],
        unique=False,
    )
    op.create_index(
        "ix_seller_payouts_created_at",
        "seller_payouts",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "coupons",
        pk_column(),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("coupon_type", sa.String(length=30), nullable=False),
        sa.Column("discount_type", sa.String(length=30), nullable=False),
        money_column("discount_value"),
        money_column("max_discount_amount", nullable=True),
        money_column("min_order_amount", nullable=True),
        uint_int_column("usage_limit"),
        uint_int_column("used_count", default=0),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        created_at_column(),
        updated_at_column(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(
        "ix_coupons_coupon_type",
        "coupons",
        ["coupon_type"],
        unique=False,
    )
    op.create_index("ix_coupons_status", "coupons", ["status"], unique=False)
    op.create_index("ix_coupons_start_at", "coupons", ["start_at"], unique=False)
    op.create_index("ix_coupons_end_at", "coupons", ["end_at"], unique=False)

    op.create_table(
        "coupon_usages",
        pk_column(),
        uint_fk_column("coupon_id"),
        uint_fk_column("user_id"),
        uint_fk_column("order_id"),
        sa.Column("coupon_type_snapshot", sa.String(length=30), nullable=False),
        money_column("discount_amount"),
        sa.Column("used_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["coupon_id"], ["coupons.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "coupon_id", name="uq_coupon_usages_user_coupon"),
        sa.UniqueConstraint(
            "order_id",
            "coupon_type_snapshot",
            name="uq_coupon_usages_order_coupon_type",
        ),
    )
    op.create_index(
        "ix_coupon_usages_order_id",
        "coupon_usages",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        "ix_coupon_usages_coupon_id",
        "coupon_usages",
        ["coupon_id"],
        unique=False,
    )

    op.create_table(
        "product_reviews",
        pk_column(),
        uint_fk_column("user_id"),
        uint_fk_column("product_id"),
        uint_fk_column("order_item_id"),
        sa.Column("rating", mysql.TINYINT(unsigned=True), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        created_at_column(),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_product_reviews_rating"),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_item_id"),
    )
    op.create_index(
        "ix_product_reviews_product_id",
        "product_reviews",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_reviews_user_id",
        "product_reviews",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_reviews_rating",
        "product_reviews",
        ["rating"],
        unique=False,
    )
    op.create_index(
        "ix_product_reviews_created_at",
        "product_reviews",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "review_images",
        pk_column(),
        uint_fk_column("review_id"),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        created_at_column(),
        sa.ForeignKeyConstraint(["review_id"], ["product_reviews.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_review_images_review_id",
        "review_images",
        ["review_id"],
        unique=False,
    )

    op.create_table(
        "violation_reports",
        pk_column(),
        uint_fk_column("reporter_id"),
        uint_fk_column("product_id"),
        sa.Column("reason_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "reporter_id",
            "product_id",
            name="uq_violation_reports_reporter_product",
        ),
    )
    op.create_index(
        "ix_violation_reports_product_id",
        "violation_reports",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_violation_reports_status",
        "violation_reports",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_violation_reports_created_at",
        "violation_reports",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "violation_report_images",
        pk_column(),
        uint_fk_column("report_id"),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        created_at_column(),
        sa.ForeignKeyConstraint(["report_id"], ["violation_reports.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_violation_report_images_report_id",
        "violation_report_images",
        ["report_id"],
        unique=False,
    )

    op.create_table(
        "moderation_logs",
        pk_column(),
        uint_fk_column("report_id", nullable=True),
        uint_fk_column("product_id", nullable=True),
        uint_fk_column("seller_id", nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["report_id"], ["violation_reports.id"]),
        sa.ForeignKeyConstraint(["seller_id"], ["seller_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_moderation_logs_report_id",
        "moderation_logs",
        ["report_id"],
        unique=False,
    )
    op.create_index(
        "ix_moderation_logs_product_id",
        "moderation_logs",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_moderation_logs_seller_id",
        "moderation_logs",
        ["seller_id"],
        unique=False,
    )
    op.create_index(
        "ix_moderation_logs_action",
        "moderation_logs",
        ["action"],
        unique=False,
    )
    op.create_index(
        "ix_moderation_logs_created_at",
        "moderation_logs",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "notifications",
        pk_column(),
        uint_fk_column("recipient_id"),
        sa.Column("notification_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        uint_fk_column("reference_id", nullable=True),
        bool_column("is_read", default=0),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notifications_recipient_id",
        "notifications",
        ["recipient_id"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_notification_type",
        "notifications",
        ["notification_type"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_is_read",
        "notifications",
        ["is_read"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_created_at",
        "notifications",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "search_logs",
        pk_column(),
        uint_fk_column("user_id", nullable=True),
        sa.Column("keyword", sa.String(length=255), nullable=False),
        uint_int_column("result_count", nullable=True),
        created_at_column(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_search_logs_user_id", "search_logs", ["user_id"], unique=False)
    op.create_index("ix_search_logs_keyword", "search_logs", ["keyword"], unique=False)
    op.create_index(
        "ix_search_logs_created_at",
        "search_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("search_logs")
    op.drop_table("notifications")
    op.drop_table("moderation_logs")
    op.drop_table("violation_report_images")
    op.drop_table("violation_reports")
    op.drop_table("review_images")
    op.drop_table("product_reviews")
    op.drop_table("coupon_usages")
    op.drop_table("coupons")
    op.drop_table("seller_payouts")
    op.drop_table("refunds")
    op.drop_table("payment_orders")
    op.drop_table("payments")
    op.drop_table("order_cancellations")
    op.drop_table("order_status_logs")
    op.drop_table("shipments")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("inventory_transactions")
    op.drop_table("inventories")
    op.drop_table("product_variants")
    op.drop_table("product_images")
    op.drop_table("product_categories")
    op.drop_table("products")
    op.drop_table("category_suggestions")
    op.drop_table("categories")
    op.drop_table("seller_documents")
    op.drop_table("seller_profiles")
    op.drop_table("user_addresses")
