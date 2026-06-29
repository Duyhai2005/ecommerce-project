import type {
  Address,
  CartItem,
  Category,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  Role,
  SellerStatus,
  Shop,
  User
} from "@/types/models";

export const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);

export const formatDate = (value?: string) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};

export const currentPrice = (variant: ProductVariant) => variant.salePrice ?? variant.price;

export const getProductVariants = (product: Product, variants: ProductVariant[]) =>
  variants.filter((variant) => variant.productId === product.id);

export const getProductPriceRange = (product: Product, variants: ProductVariant[]) => {
  const prices = getProductVariants(product, variants).map(currentPrice);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

export const getPrimaryVariant = (product: Product, variants: ProductVariant[]) =>
  getProductVariants(product, variants).find((variant) => variant.status === "ACTIVE") ??
  getProductVariants(product, variants)[0];

export const getShop = (shops: Shop[], sellerId: string) => shops.find((shop) => shop.id === sellerId);

export const getCategoryNames = (categories: Category[], product: Product) =>
  product.categoryIds
    .map((id) => categories.find((category) => category.id === id)?.name)
    .filter(Boolean)
    .join(", ");

export const roleLabel: Record<Role | "GUEST", string> = {
  GUEST: "Khách",
  CUSTOMER: "Khách hàng",
  SELLER: "Người bán",
  ADMIN: "Admin",
  SUPPORTER: "Supporter"
};

export const sellerStatusLabel: Record<SellerStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  SUSPENDED: "Tạm ngưng",
  CLOSED: "Đã đóng"
};

export const productStatusLabel: Record<Product["status"], string> = {
  ACTIVE: "Đang bán",
  HIDDEN: "Đang ẩn",
  OUT_OF_STOCK: "Hết hàng",
  DELETED: "Đã xóa"
};

export const orderStatusLabel: Record<Order["orderStatus"], string> = {
  PLACED: "Đã đặt hàng",
  READY_TO_SHIP: "Sẵn sàng giao",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  DELIVERY_FAILED: "Giao thất bại",
  CANCELLED: "Đã hủy"
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
  CANCELLED: "Đã hủy",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  PARTIAL_REFUND_PENDING: "Chờ hoàn một phần",
  PARTIALLY_REFUNDED: "Đã hoàn một phần"
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  MOCK: "Thanh toán giả lập",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  CREDIT_CARD: "Thẻ tín dụng"
};

export type ProductQuery = {
  keyword?: string;
  categorySlug?: string;
  shopSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sellerId?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "sold" | "rating";
};

export const filterProducts = (
  products: Product[],
  variants: ProductVariant[],
  shops: Shop[],
  categories: Category[],
  query: ProductQuery
) => {
  const keyword = query.keyword?.trim().toLowerCase();
  const category = query.categorySlug ? categories.find((item) => item.slug === query.categorySlug) : undefined;
  const shop = query.shopSlug ? shops.find((item) => item.shopSlug === query.shopSlug) : undefined;

  const filtered = products.filter((product) => {
    const productShop = shops.find((item) => item.id === product.sellerId);
    const price = getProductPriceRange(product, variants).min;
    const inKeyword =
      !keyword ||
      product.name.toLowerCase().includes(keyword) ||
      product.shortDescription.toLowerCase().includes(keyword) ||
      productShop?.shopName.toLowerCase().includes(keyword) ||
      product.categoryIds.some((id) => categories.find((item) => item.id === id)?.name.toLowerCase().includes(keyword));

    return (
      inKeyword &&
      (!category || product.categoryIds.includes(category.id)) &&
      (!shop || product.sellerId === shop.id) &&
      (!query.sellerId || product.sellerId === query.sellerId) &&
      (!query.rating || product.averageRating >= query.rating) &&
      (!query.minPrice || price >= query.minPrice) &&
      (!query.maxPrice || price <= query.maxPrice)
    );
  });

  return [...filtered].sort((a, b) => {
    if (query.sort === "price-asc") return getProductPriceRange(a, variants).min - getProductPriceRange(b, variants).min;
    if (query.sort === "price-desc") return getProductPriceRange(b, variants).min - getProductPriceRange(a, variants).min;
    if (query.sort === "sold") return b.soldCount - a.soldCount;
    if (query.sort === "rating") return b.averageRating - a.averageRating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const searchSuggestions = (
  keyword: string,
  products: Product[],
  shops: Shop[],
  categories: Category[]
) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];
  const productHits = products
    .filter((product) => product.name.toLowerCase().includes(normalized))
    .slice(0, 4)
    .map((product) => ({ label: product.name, href: `/shops/${getShop(shops, product.sellerId)?.shopSlug}/products/${product.slug}`, type: "Sản phẩm" }));
  const shopHits = shops
    .filter((shop) => shop.shopName.toLowerCase().includes(normalized))
    .slice(0, 3)
    .map((shop) => ({ label: shop.shopName, href: `/shops/${shop.shopSlug}`, type: "Shop" }));
  const categoryHits = categories
    .filter((category) => category.name.toLowerCase().includes(normalized))
    .slice(0, 3)
    .map((category) => ({ label: category.name, href: `/categories/${category.slug}`, type: "Danh mục" }));
  return [...productHits, ...shopHits, ...categoryHits].slice(0, 8);
};

export const getCartRows = (
  cartItems: CartItem[],
  products: Product[],
  variants: ProductVariant[],
  shops: Shop[]
) =>
  cartItems
    .map((item) => {
      const variant = variants.find((entry) => entry.id === item.variantId);
      const product = variant ? products.find((entry) => entry.id === variant.productId) : undefined;
      const shop = product ? shops.find((entry) => entry.id === product.sellerId) : undefined;
      if (!variant || !product || !shop) return undefined;
      const unavailable =
        product.status !== "ACTIVE" ||
        variant.status !== "ACTIVE" ||
        variant.inventory.quantity <= 0 ||
        shop.status !== "APPROVED";
      return {
        item,
        variant,
        product,
        shop,
        unitPrice: currentPrice(variant),
        subtotal: currentPrice(variant) * item.quantity,
        unavailable,
        reason:
          product.status === "DELETED"
            ? "Sản phẩm đã bị xóa"
            : product.status === "HIDDEN" || variant.status === "HIDDEN"
              ? "Sản phẩm/biến thể đang ẩn"
              : product.status === "OUT_OF_STOCK" || variant.status === "OUT_OF_STOCK" || variant.inventory.quantity <= 0
                ? "Hết hàng"
                : shop.status !== "APPROVED"
                  ? "Shop không còn hoạt động"
                  : ""
      };
    })
    .filter((row): row is CartRow => Boolean(row));

export type CartRow = {
  item: CartItem;
  variant: ProductVariant;
  product: Product;
  shop: Shop;
  unitPrice: number;
  subtotal: number;
  unavailable: boolean;
  reason: string;
};

export const groupCartByShop = (rows: CartRow[]) =>
  rows.reduce<Record<string, { shop: Shop; rows: CartRow[]; subtotal: number; shippingFee: number; total: number }>>(
    (acc, row) => {
      if (!acc[row.shop.id]) {
        acc[row.shop.id] = { shop: row.shop, rows: [], subtotal: 0, shippingFee: row.shop.shippingFee, total: 0 };
      }
      acc[row.shop.id].rows.push(row);
      if (row.item.isSelected && !row.unavailable) {
        acc[row.shop.id].subtotal += row.subtotal;
        acc[row.shop.id].total += row.subtotal;
      }
      return acc;
    },
    {}
  );

export const selectedCheckoutGroups = (rows: CartRow[]) =>
  Object.values(groupCartByShop(rows.filter((row) => row.item.isSelected && !row.unavailable))).map((group) => ({
    ...group,
    total: group.subtotal + group.shippingFee
  }));

export const makeOrderCode = (count: number) => `OD-260629-${String(count + 1).padStart(3, "0")}`;
export const makePaymentCode = (count: number) => `PAY-260629-${String(count + 1).padStart(3, "0")}`;

export const createOrderFromGroup = (
  code: string,
  user: User,
  group: ReturnType<typeof selectedCheckoutGroups>[number],
  address: Address,
  customerNote: string,
  existingCount: number
): Order => {
  const items: OrderItem[] = group.rows.map((row, index) => ({
    id: `oi-new-${existingCount}-${index}`,
    productId: row.product.id,
    variantId: row.variant.id,
    productNameSnapshot: row.product.name,
    variantNameSnapshot: row.variant.variantName,
    productImageSnapshot: row.product.thumbnailUrl,
    sellerNameSnapshot: row.shop.shopName,
    skuSnapshot: row.variant.sku,
    unitPrice: row.unitPrice,
    quantity: row.item.quantity,
    subtotal: row.subtotal
  }));

  return {
    id: `order-new-${existingCount}-${group.shop.id}`,
    orderCode: code,
    userId: user.id,
    sellerId: group.shop.id,
    orderStatus: "PLACED",
    paymentStatus: "PENDING",
    sellerConfirmed: false,
    subtotalAmount: group.subtotal,
    shippingFee: group.shippingFee,
    productDiscountAmount: 0,
    shippingDiscountAmount: 0,
    totalAmount: group.total,
    customerNote,
    paymentExpiresAt: "2026-06-30T08:00:00.000Z",
    sellerConfirmExpiresAt: "2026-07-01T08:00:00.000Z",
    items,
    shipment: {
      shippingProviderName: group.shop.shippingProviderName,
      receiverName: address.receiverName,
      receiverPhone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      detailAddress: address.detailAddress,
      addressType: address.addressType
    },
    timeline: [
      {
        id: `${code}-log-1`,
        newStatus: "PLACED",
        note: "Đã đặt hàng từ checkout nhiều shop",
        createdAt: "2026-06-29T08:00:00.000Z"
      }
    ],
    createdAt: "2026-06-29T08:00:00.000Z"
  };
};

export const createPaymentFromOrders = (
  code: string,
  userId: string,
  method: PaymentMethod,
  orders: Order[],
  count: number
): Payment => ({
  id: `pay-new-${count}`,
  paymentCode: code,
  userId,
  paymentMethod: method,
  paymentGateway: method === "MOCK" ? "MOCK_GATEWAY" : method,
  paymentStatus: "PENDING",
  amount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
  expiresAt: "2026-06-30T08:00:00.000Z",
  orderCodes: orders.map((order) => order.orderCode),
  createdAt: "2026-06-29T08:00:00.000Z"
});

export const canCustomerCancel = (order: Order) => order.paymentStatus !== "PAID" && !order.sellerConfirmed && order.orderStatus === "PLACED";

export const canSellerCancel = (order: Order) => order.paymentStatus !== "PAID" && !order.sellerConfirmed && order.orderStatus === "PLACED";

export const statusTone = (status: string) => {
  if (["ACTIVE", "APPROVED", "PAID", "COMPLETED", "READY_TO_SHIP"].includes(status)) return "success";
  if (["PENDING", "PLACED", "SHIPPING", "PARTIAL_REFUND_PENDING", "REFUND_PENDING"].includes(status)) return "warning";
  if (["FAILED", "REJECTED", "SUSPENDED", "LOCKED", "OUT_OF_STOCK", "DELIVERY_FAILED"].includes(status)) return "danger";
  if (["HIDDEN", "CLOSED", "DELETED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(status)) return "neutral";
  return "neutral";
};
