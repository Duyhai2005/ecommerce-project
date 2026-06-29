"use client";

import { Minus, Plus, Star, Store } from "lucide-react";
import { Button, IconButton, Panel, StatusBadge, cn } from "@/components/common/ui";
import {
  formatDate,
  formatVnd,
  getPrimaryVariant,
  getProductPriceRange,
  orderStatusLabel,
  productStatusLabel,
  sellerStatusLabel
} from "@/lib/helpers";
import type { Category, Order, Product, ProductVariant, Shop } from "@/types/models";

export function PriceDisplay({
  price,
  salePrice,
  compact
}: {
  price: number;
  salePrice?: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", compact && "gap-1")}>
      <span className={cn("font-bold text-coral", compact ? "text-sm" : "text-lg")}>{formatVnd(salePrice ?? price)}</span>
      {salePrice ? <span className="text-xs text-muted line-through">{formatVnd(price)}</span> : null}
    </div>
  );
}

export function RatingStars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {typeof count === "number" ? <span>({count})</span> : null}
    </span>
  );
}

export function ProductCard({
  product,
  variants,
  shop,
  categories,
  onAdd
}: {
  product: Product;
  variants: ProductVariant[];
  shop?: Shop;
  categories: Category[];
  onAdd?: (variantId: string) => void;
}) {
  const primaryVariant = getPrimaryVariant(product, variants);
  const priceRange = getProductPriceRange(product, variants);
  const category = categories.find((item) => product.categoryIds.includes(item.id));
  const href = `/shops/${shop?.shopSlug}/products/${product.slug}`;
  return (
    <article className="group overflow-hidden rounded-panel border border-line bg-white transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <a href={href} className="block">
        <div className="aspect-square overflow-hidden bg-canvas">
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={product.status} label={productStatusLabel[product.status]} />
            {category ? <span className="truncate text-xs text-muted">{category.name}</span> : null}
          </div>
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink">{product.name}</h3>
          {shop ? (
            <p className="flex items-center gap-1 truncate text-xs text-muted">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              {shop.shopName}
            </p>
          ) : null}
          <PriceDisplay price={priceRange.min} salePrice={primaryVariant?.salePrice} compact />
          <div className="flex items-center justify-between gap-2">
            <RatingStars rating={product.averageRating} count={product.reviewCount} />
            <span className="text-xs text-muted">Đã bán {product.soldCount}</span>
          </div>
        </div>
      </a>
      {primaryVariant && onAdd ? (
        <div className="border-t border-line p-3">
          <Button
            className="w-full"
            variant="secondary"
            disabled={product.status !== "ACTIVE" || primaryVariant.status !== "ACTIVE"}
            onClick={() => onAdd(primaryVariant.id)}
          >
            Thêm giỏ
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <a
      href={`/shops/${shop.shopSlug}`}
      className="block rounded-panel border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
    >
      <div className="flex items-start gap-3">
        <img src={shop.logoUrl} alt={shop.shopName} className="h-14 w-14 rounded-panel object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-ink">{shop.shopName}</h3>
            <StatusBadge status={shop.status} label={sellerStatusLabel[shop.status]} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{shop.description}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-panel bg-canvas p-2">
          <p className="text-xs text-muted">Đã bán</p>
          <p className="font-bold text-ink">{shop.totalSold.toLocaleString("vi-VN")}</p>
        </div>
        <div className="rounded-panel bg-canvas p-2">
          <p className="text-xs text-muted">Phí ship</p>
          <p className="font-bold text-ink">{formatVnd(shop.shippingFee)}</p>
        </div>
      </div>
    </a>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-panel border border-line bg-white">
      <IconButton
        aria-label="Giảm số lượng"
        className="h-10 w-10 rounded-none border-0"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <span className="min-w-10 px-2 text-center text-sm font-bold">{value}</span>
      <IconButton
        aria-label="Tăng số lượng"
        className="h-10 w-10 rounded-none border-0"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  return (
    <ol className="space-y-3">
      {order.timeline.map((entry, index) => (
        <li key={entry.id} className="flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <div>
            <p className="font-semibold text-ink">{orderStatusLabel[entry.newStatus]}</p>
            <p className="text-sm text-muted">{entry.note}</p>
            <p className="text-xs text-muted">{formatDate(entry.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Panel className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </Panel>
  );
}
