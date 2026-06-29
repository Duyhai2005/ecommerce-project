export type Role = "CUSTOMER" | "SELLER" | "ADMIN" | "SUPPORTER";
export type UserStatus = "ACTIVE" | "LOCKED" | "DELETED";
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "CLOSED";
export type ProductStatus = "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DELETED";
export type VariantStatus = ProductStatus;
export type OrderStatus =
  | "PLACED"
  | "READY_TO_SHIP"
  | "SHIPPING"
  | "COMPLETED"
  | "DELIVERY_FAILED"
  | "CANCELLED";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "PARTIAL_REFUND_PENDING"
  | "PARTIALLY_REFUNDED";
export type PaymentMethod = "MOCK" | "BANK_TRANSFER" | "MOMO" | "CREDIT_CARD";
export type AddressType = "HOME" | "OFFICE";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  birthday?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: UserStatus;
  lockedUntil?: string;
  lockReason?: string;
  roles: Role[];
}

export interface Address {
  id: string;
  userId: string;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  addressType: AddressType;
  isDefault: boolean;
}

export interface Shop {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  logoUrl: string;
  description: string;
  phone: string;
  email: string;
  pickupAddress: string;
  shippingFee: number;
  shippingProviderName: string;
  status: SellerStatus;
  rejectedReason?: string;
  totalSold: number;
  totalRevenue: number;
  approvedAt?: string;
  closedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isDefaultOther?: boolean;
}

export interface Inventory {
  quantity: number;
  reservedQuantity: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantName: string;
  price: number;
  salePrice?: number;
  saleStartAt?: string;
  saleEndAt?: string;
  imageUrl: string;
  status: VariantStatus;
  inventory: Inventory;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  brand?: string;
  origin: string;
  warranty?: string;
  status: ProductStatus;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  categoryIds: string[];
  imageUrls: string[];
  thumbnailUrl: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  isSelected: boolean;
}

export interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  productImageSnapshot: string;
  sellerNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ShipmentSnapshot {
  shippingProviderName: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  addressType: AddressType;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
}

export interface TimelineEntry {
  id: string;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  note: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  sellerId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  sellerConfirmed: boolean;
  sellerConfirmedAt?: string;
  subtotalAmount: number;
  shippingFee: number;
  productDiscountAmount: number;
  shippingDiscountAmount: number;
  totalAmount: number;
  customerNote?: string;
  paymentExpiresAt: string;
  sellerConfirmExpiresAt: string;
  completedAt?: string;
  cancelledAt?: string;
  items: OrderItem[];
  shipment: ShipmentSnapshot;
  timeline: TimelineEntry[];
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentCode: string;
  userId: string;
  paymentMethod: PaymentMethod;
  paymentGateway?: string;
  paymentStatus: PaymentStatus;
  amount: number;
  transactionCode?: string;
  expiresAt: string;
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  orderCodes: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: "ORDER" | "PAYMENT" | "SELLER" | "REPORT" | "CHAT";
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  customerName: string;
  assignedSupporter: string;
  status: "OPEN" | "CLOSED";
  mode: "AI" | "SUPPORTER";
  lastMessageAt: string;
  messages: {
    id: string;
    sender: "CUSTOMER" | "SUPPORTER" | "AI";
    text: string;
    createdAt: string;
    isRead: boolean;
  }[];
}

export interface AppState {
  users: User[];
  shops: Shop[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  cartItems: CartItem[];
  addresses: Address[];
  orders: Order[];
  payments: Payment[];
  notifications: Notification[];
  conversations: Conversation[];
  sessionUserId?: string;
  activeRole: Role | "GUEST";
  lastCheckoutPaymentCode?: string;
}
