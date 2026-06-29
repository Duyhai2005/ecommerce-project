import type {
  Address,
  AppState,
  Category,
  Conversation,
  Notification,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductStatus,
  ProductVariant,
  Shop,
  User
} from "@/types/models";

const now = "2026-06-29T08:00:00.000Z";

export const categories: Category[] = [
  { id: "cat-men", name: "Thời trang nam", slug: "thoi-trang-nam", sortOrder: 1 },
  { id: "cat-women", name: "Thời trang nữ", slug: "thoi-trang-nu", sortOrder: 2 },
  { id: "cat-electronics", name: "Thiết bị điện tử", slug: "thiet-bi-dien-tu", sortOrder: 3 },
  { id: "cat-phone", name: "Linh kiện điện thoại", slug: "linh-kien-dien-thoai", sortOrder: 4 },
  { id: "cat-shoes", name: "Giày dép", slug: "giay-dep", sortOrder: 5 },
  { id: "cat-beauty", name: "Sắc đẹp", slug: "sac-dep", sortOrder: 6 },
  { id: "cat-home", name: "Nhà cửa", slug: "nha-cua", sortOrder: 7 },
  { id: "cat-accessory", name: "Phụ kiện", slug: "phu-kien", sortOrder: 8 },
  { id: "cat-bag", name: "Túi ví", slug: "tui-vi", sortOrder: 9 },
  { id: "cat-other", name: "Khác", slug: "khac", sortOrder: 10, isDefaultOther: true }
];

export const users: User[] = [
  {
    id: "u-customer",
    fullName: "Nguyễn Minh An",
    email: "customer@demo.vn",
    phone: "0901000001",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    gender: "FEMALE",
    birthday: "1998-08-12",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER"]
  },
  {
    id: "u-seller",
    fullName: "Trần Quốc Huy",
    email: "seller@demo.vn",
    phone: "0901000002",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
    gender: "MALE",
    birthday: "1992-04-21",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER", "SELLER"]
  },
  {
    id: "u-seller-2",
    fullName: "Lê Hải Yến",
    email: "yen.shop@demo.vn",
    phone: "0901000003",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
    gender: "FEMALE",
    birthday: "1994-11-03",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER", "SELLER"]
  },
  {
    id: "u-seller-pending",
    fullName: "Phạm Gia Bảo",
    email: "pending@demo.vn",
    phone: "0901000004",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: false,
    status: "ACTIVE",
    roles: ["CUSTOMER"]
  },
  {
    id: "u-admin",
    fullName: "Admin hệ thống",
    email: "admin@demo.vn",
    phone: "0901000005",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["ADMIN"]
  },
  {
    id: "u-supporter",
    fullName: "Supporter Linh",
    email: "supporter@demo.vn",
    phone: "0901000006",
    avatarUrl: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["SUPPORTER"]
  },
  {
    id: "u-locked",
    fullName: "Tài khoản bị khóa",
    email: "locked@demo.vn",
    phone: "0901000007",
    avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: true,
    status: "LOCKED",
    lockedUntil: "2026-07-05T10:00:00.000Z",
    lockReason: "Vi phạm chính sách giao dịch của sàn.",
    roles: ["CUSTOMER"]
  },
  {
    id: "u-seller-3",
    fullName: "Đỗ Nam Khánh",
    email: "khanh.tech@demo.vn",
    phone: "0901000008",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER", "SELLER"]
  },
  {
    id: "u-seller-4",
    fullName: "Mai Phương Thảo",
    email: "thao.home@demo.vn",
    phone: "0901000009",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80",
    emailVerified: true,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER", "SELLER"]
  },
  {
    id: "u-customer-2",
    fullName: "Hoàng Nhật Minh",
    email: "minh@demo.vn",
    phone: "0901000010",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80",
    emailVerified: false,
    phoneVerified: true,
    status: "ACTIVE",
    roles: ["CUSTOMER"]
  }
];

export const shops: Shop[] = [
  {
    id: "shop-style",
    userId: "u-seller",
    shopName: "Urban Style",
    shopSlug: "urban-style",
    logoUrl: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=240&q=80",
    description: "Thời trang nam nữ tối giản, dễ mặc hằng ngày.",
    phone: "0912000101",
    email: "hello@urbanstyle.vn",
    pickupAddress: "12 Nguyễn Trãi, Quận 1, TP.HCM",
    shippingFee: 28000,
    shippingProviderName: "Giao hàng nhanh nội thành",
    status: "APPROVED",
    totalSold: 4280,
    totalRevenue: 820000000,
    approvedAt: "2026-05-10T09:00:00.000Z"
  },
  {
    id: "shop-tech",
    userId: "u-seller-3",
    shopName: "TechNest",
    shopSlug: "technest",
    logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=240&q=80",
    description: "Thiết bị điện tử và phụ kiện điện thoại chính hãng.",
    phone: "0912000102",
    email: "care@technest.vn",
    pickupAddress: "45 Cầu Giấy, Hà Nội",
    shippingFee: 35000,
    shippingProviderName: "ShipPro",
    status: "APPROVED",
    totalSold: 3120,
    totalRevenue: 1360000000,
    approvedAt: "2026-04-18T09:00:00.000Z"
  },
  {
    id: "shop-beauty",
    userId: "u-seller-2",
    shopName: "Glow Lab",
    shopSlug: "glow-lab",
    logoUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80",
    description: "Mỹ phẩm, chăm sóc da và phụ kiện làm đẹp.",
    phone: "0912000103",
    email: "support@glowlab.vn",
    pickupAddress: "33 Lê Văn Sỹ, Quận 3, TP.HCM",
    shippingFee: 26000,
    shippingProviderName: "Beauty Express",
    status: "APPROVED",
    totalSold: 2190,
    totalRevenue: 540000000,
    approvedAt: "2026-03-22T09:00:00.000Z"
  },
  {
    id: "shop-home",
    userId: "u-seller-4",
    shopName: "HomeCraft",
    shopSlug: "homecraft",
    logoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=240&q=80",
    description: "Đồ dùng nhà cửa gọn đẹp, bền và dễ phối.",
    phone: "0912000104",
    email: "home@homecraft.vn",
    pickupAddress: "78 Bạch Đằng, Đà Nẵng",
    shippingFee: 42000,
    shippingProviderName: "Miền Trung Delivery",
    status: "APPROVED",
    totalSold: 1655,
    totalRevenue: 430000000,
    approvedAt: "2026-02-12T09:00:00.000Z"
  },
  {
    id: "shop-shoes",
    userId: "u-customer-2",
    shopName: "StepUp",
    shopSlug: "stepup",
    logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80",
    description: "Giày dép năng động cho đi học, đi làm và du lịch.",
    phone: "0912000105",
    email: "hi@stepup.vn",
    pickupAddress: "19 Nguyễn Huệ, Huế",
    shippingFee: 30000,
    shippingProviderName: "Step Delivery",
    status: "APPROVED",
    totalSold: 980,
    totalRevenue: 300000000,
    approvedAt: "2026-01-20T09:00:00.000Z"
  },
  {
    id: "shop-pending",
    userId: "u-seller-pending",
    shopName: "Bao Gadget",
    shopSlug: "bao-gadget",
    logoUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=240&q=80",
    description: "Đang chờ duyệt hồ sơ người bán.",
    phone: "0912000106",
    email: "bao@gadget.vn",
    pickupAddress: "2 Trần Hưng Đạo, Cần Thơ",
    shippingFee: 32000,
    shippingProviderName: "Local Ship",
    status: "PENDING",
    totalSold: 0,
    totalRevenue: 0
  },
  {
    id: "shop-rejected",
    userId: "u-locked",
    shopName: "Deal Lạ",
    shopSlug: "deal-la",
    logoUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=240&q=80",
    description: "Hồ sơ thiếu thông tin liên hệ hợp lệ.",
    phone: "0912000107",
    email: "deal@demo.vn",
    pickupAddress: "Không rõ",
    shippingFee: 25000,
    shippingProviderName: "Tự giao",
    status: "REJECTED",
    rejectedReason: "Email shop và địa chỉ kho chưa xác minh được.",
    totalSold: 0,
    totalRevenue: 0
  },
  {
    id: "shop-suspended",
    userId: "u-customer",
    shopName: "Old Corner",
    shopSlug: "old-corner",
    logoUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=240&q=80",
    description: "Shop đang bị tạm ngưng để rà soát báo cáo.",
    phone: "0912000108",
    email: "old@corner.vn",
    pickupAddress: "99 Lê Lợi, TP.HCM",
    shippingFee: 28000,
    shippingProviderName: "Tự giao",
    status: "SUSPENDED",
    totalSold: 122,
    totalRevenue: 24000000
  },
  {
    id: "shop-closed",
    userId: "u-supporter",
    shopName: "Closed Sample",
    shopSlug: "closed-sample",
    logoUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=240&q=80",
    description: "Shop đã đóng, chỉ dùng để demo trạng thái.",
    phone: "0912000109",
    email: "closed@demo.vn",
    pickupAddress: "N/A",
    shippingFee: 0,
    shippingProviderName: "N/A",
    status: "CLOSED",
    totalSold: 88,
    totalRevenue: 12000000,
    closedAt: "2026-06-01T09:00:00.000Z"
  }
];

const imagePool = [
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1585386959984-a41552231658?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&w=900&q=80"
];

type ProductSeed = {
  name: string;
  sellerId: string;
  cats: string[];
  base: number;
  status?: ProductStatus;
  brand?: string;
};

const productSeeds: ProductSeed[] = [
  { name: "Áo sơ mi linen form rộng", sellerId: "shop-style", cats: ["cat-men", "cat-women"], base: 329000, brand: "Urban" },
  { name: "Quần jeans straight fit", sellerId: "shop-style", cats: ["cat-men"], base: 459000, brand: "Urban" },
  { name: "Váy midi hoa nhí", sellerId: "shop-style", cats: ["cat-women"], base: 399000, brand: "Mira" },
  { name: "Áo khoác chống nắng nhẹ", sellerId: "shop-style", cats: ["cat-women", "cat-accessory"], base: 289000 },
  { name: "Túi tote canvas daily", sellerId: "shop-style", cats: ["cat-bag", "cat-accessory"], base: 189000 },
  { name: "Tai nghe bluetooth chống ồn", sellerId: "shop-tech", cats: ["cat-electronics", "cat-accessory"], base: 1290000, brand: "SoundUp" },
  { name: "Bàn phím cơ mini 68 phím", sellerId: "shop-tech", cats: ["cat-electronics"], base: 890000, brand: "KeyNest" },
  { name: "Sạc nhanh USB-C 65W", sellerId: "shop-tech", cats: ["cat-phone", "cat-electronics"], base: 390000, brand: "Volt" },
  { name: "Ốp lưng chống sốc MagSafe", sellerId: "shop-tech", cats: ["cat-phone", "cat-accessory"], base: 219000 },
  { name: "Đồng hồ thông minh Lite", sellerId: "shop-tech", cats: ["cat-electronics", "cat-accessory"], base: 1590000, brand: "Wristly" },
  { name: "Serum phục hồi da B5", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 449000, brand: "Glow Lab" },
  { name: "Kem chống nắng SPF50", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 329000, brand: "SunClear" },
  { name: "Son tint mềm môi", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 199000, brand: "Lumi" },
  { name: "Máy rửa mặt silicon", sellerId: "shop-beauty", cats: ["cat-beauty", "cat-electronics"], base: 520000, status: "OUT_OF_STOCK" },
  { name: "Bộ cọ trang điểm 12 món", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 259000 },
  { name: "Đèn bàn đọc sách LED", sellerId: "shop-home", cats: ["cat-home", "cat-electronics"], base: 360000, brand: "HomeCraft" },
  { name: "Kệ gỗ để bàn 3 tầng", sellerId: "shop-home", cats: ["cat-home"], base: 420000 },
  { name: "Bộ ga giường cotton", sellerId: "shop-home", cats: ["cat-home"], base: 690000, brand: "Sleepy" },
  { name: "Ly giữ nhiệt nắp bật", sellerId: "shop-home", cats: ["cat-home", "cat-accessory"], base: 249000 },
  { name: "Máy khuếch tán tinh dầu", sellerId: "shop-home", cats: ["cat-home", "cat-electronics"], base: 499000, status: "HIDDEN" },
  { name: "Sneaker trắng basic", sellerId: "shop-shoes", cats: ["cat-shoes"], base: 620000, brand: "StepUp" },
  { name: "Sandal quai ngang êm chân", sellerId: "shop-shoes", cats: ["cat-shoes", "cat-women"], base: 310000 },
  { name: "Giày chạy bộ nhẹ", sellerId: "shop-shoes", cats: ["cat-shoes"], base: 790000, brand: "RunDay" },
  { name: "Dép đi mưa chống trượt", sellerId: "shop-shoes", cats: ["cat-shoes"], base: 159000 },
  { name: "Ví da mini nhiều ngăn", sellerId: "shop-style", cats: ["cat-bag", "cat-accessory"], base: 279000 },
  { name: "Áo polo pique nam", sellerId: "shop-style", cats: ["cat-men"], base: 259000 },
  { name: "Cáp sạc bện nylon 2m", sellerId: "shop-tech", cats: ["cat-phone", "cat-accessory"], base: 129000 },
  { name: "Giá đỡ laptop nhôm", sellerId: "shop-tech", cats: ["cat-electronics", "cat-home"], base: 450000 },
  { name: "Mặt nạ đất sét dịu da", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 289000 },
  { name: "Tẩy trang dạng dầu", sellerId: "shop-beauty", cats: ["cat-beauty"], base: 349000 },
  { name: "Hộp đựng đồ trong suốt", sellerId: "shop-home", cats: ["cat-home"], base: 179000 },
  { name: "Thảm chân phòng tắm", sellerId: "shop-home", cats: ["cat-home"], base: 199000 },
  { name: "Loa bluetooth mini", sellerId: "shop-tech", cats: ["cat-electronics"], base: 590000 },
  { name: "Balo laptop chống nước", sellerId: "shop-style", cats: ["cat-bag", "cat-accessory"], base: 520000 },
  { name: "Giày lười công sở", sellerId: "shop-shoes", cats: ["cat-shoes", "cat-men"], base: 690000 },
  { name: "Pin dự phòng 10000mAh", sellerId: "shop-tech", cats: ["cat-phone", "cat-electronics"], base: 480000, status: "DELETED" }
];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const products: Product[] = productSeeds.map((seed, index) => {
  const id = `p-${String(index + 1).padStart(2, "0")}`;
  const status = seed.status ?? "ACTIVE";
  const thumbnailUrl = imagePool[index % imagePool.length];
  return {
    id,
    sellerId: seed.sellerId,
    name: seed.name,
    slug: slugify(seed.name),
    shortDescription: "Sản phẩm được chọn lọc từ shop đã duyệt, giá hiển thị theo biến thể hiện tại.",
    description:
      "Thiết kế dành cho nhu cầu mua sắm thực tế trên marketplace nhiều seller. Thông tin sản phẩm gồm ảnh, biến thể, tồn kho, thương hiệu, xuất xứ và bảo hành nếu có.",
    brand: seed.brand,
    origin: index % 3 === 0 ? "Việt Nam" : index % 3 === 1 ? "Hàn Quốc" : "Trung Quốc",
    warranty: index % 4 === 0 ? "Bảo hành 6 tháng" : undefined,
    status,
    averageRating: Number((4.1 + (index % 8) * 0.1).toFixed(1)),
    reviewCount: 18 + index * 7,
    soldCount: 45 + index * 31,
    viewCount: 900 + index * 215,
    categoryIds: seed.cats,
    imageUrls: [
      thumbnailUrl,
      imagePool[(index + 3) % imagePool.length],
      imagePool[(index + 6) % imagePool.length]
    ],
    thumbnailUrl,
    createdAt: `2026-06-${String((index % 27) + 1).padStart(2, "0")}T07:30:00.000Z`
  };
});

export const variants: ProductVariant[] = products.flatMap((product, productIndex) => {
  const base = productSeeds[productIndex].base;
  const variantNames = productIndex % 3 === 0 ? ["Default", "Đen", "Kem"] : productIndex % 3 === 1 ? ["S", "M", "L", "XL"] : ["Tiêu chuẩn", "Cao cấp"];
  return variantNames.map((variantName, index) => {
    const variantStatus =
      product.status === "DELETED"
        ? "DELETED"
        : product.status === "HIDDEN"
          ? "HIDDEN"
          : product.status === "OUT_OF_STOCK"
            ? "OUT_OF_STOCK"
            : index === 2 && productIndex % 7 === 0
              ? "OUT_OF_STOCK"
              : "ACTIVE";
    return {
      id: `${product.id}-v-${index + 1}`,
      productId: product.id,
      sku: `${product.sellerId.toUpperCase()}-${product.id.toUpperCase()}-${index + 1}`,
      variantName,
      price: base + index * 45000,
      salePrice: index === 0 || productIndex % 4 === 0 ? Math.round((base + index * 45000) * 0.88) : undefined,
      saleStartAt: "2026-06-01T00:00:00.000Z",
      saleEndAt: "2026-07-15T23:59:59.000Z",
      imageUrl: product.imageUrls[index % product.imageUrls.length],
      status: variantStatus,
      inventory: {
        quantity: variantStatus === "OUT_OF_STOCK" || variantStatus === "DELETED" ? 0 : 18 + productIndex * 2 + index,
        reservedQuantity: variantStatus === "ACTIVE" ? index + (productIndex % 4) : 0
      }
    };
  });
});

export const addresses: Address[] = [
  {
    id: "addr-1",
    userId: "u-customer",
    receiverName: "Nguyễn Minh An",
    phone: "0901000001",
    province: "TP.HCM",
    district: "Quận 7",
    ward: "Tân Phú",
    detailAddress: "Số 12 đường Nguyễn Lương Bằng",
    addressType: "HOME",
    isDefault: true
  },
  {
    id: "addr-2",
    userId: "u-customer",
    receiverName: "Nguyễn Minh An",
    phone: "0901000001",
    province: "TP.HCM",
    district: "Quận 1",
    ward: "Bến Nghé",
    detailAddress: "Tầng 8, 22 Lê Thánh Tôn",
    addressType: "OFFICE",
    isDefault: false
  },
  {
    id: "addr-3",
    userId: "u-seller",
    receiverName: "Trần Quốc Huy",
    phone: "0901000002",
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Dịch Vọng",
    detailAddress: "Ngõ 68 Xuân Thủy",
    addressType: "HOME",
    isDefault: true
  }
];

const variantById = new Map(variants.map((variant) => [variant.id, variant]));
const productById = new Map(products.map((product) => [product.id, product]));
const shopById = new Map(shops.map((shop) => [shop.id, shop]));

const currentPrice = (variant: ProductVariant) => variant.salePrice ?? variant.price;

const makeOrderItem = (id: string, productId: string, variantOffset: number, quantity: number): OrderItem => {
  const product = productById.get(productId)!;
  const variant = variants.filter((item) => item.productId === productId)[variantOffset] ?? variants.find((item) => item.productId === productId)!;
  const shop = shopById.get(product.sellerId)!;
  return {
    id,
    productId,
    variantId: variant.id,
    productNameSnapshot: product.name,
    variantNameSnapshot: variant.variantName,
    productImageSnapshot: product.thumbnailUrl,
    sellerNameSnapshot: shop.shopName,
    skuSnapshot: variant.sku,
    unitPrice: currentPrice(variant),
    quantity,
    subtotal: currentPrice(variant) * quantity
  };
};

const makeOrder = (
  id: string,
  orderCode: string,
  sellerId: string,
  status: Order["orderStatus"],
  paymentStatus: Order["paymentStatus"],
  sellerConfirmed: boolean,
  items: OrderItem[]
): Order => {
  const shop = shopById.get(sellerId)!;
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const createdAt = `2026-06-${String(10 + Number(id.replace(/\D/g, ""))).padStart(2, "0")}T09:00:00.000Z`;
  return {
    id,
    orderCode,
    userId: "u-customer",
    sellerId,
    orderStatus: status,
    paymentStatus,
    sellerConfirmed,
    sellerConfirmedAt: sellerConfirmed ? "2026-06-20T12:00:00.000Z" : undefined,
    subtotalAmount: subtotal,
    shippingFee: shop.shippingFee,
    productDiscountAmount: 0,
    shippingDiscountAmount: 0,
    totalAmount: subtotal + shop.shippingFee,
    customerNote: "Giao trong giờ hành chính nếu có thể.",
    paymentExpiresAt: "2026-06-30T09:00:00.000Z",
    sellerConfirmExpiresAt: "2026-07-01T09:00:00.000Z",
    completedAt: status === "COMPLETED" ? "2026-06-26T16:00:00.000Z" : undefined,
    cancelledAt: status === "CANCELLED" ? "2026-06-22T10:00:00.000Z" : undefined,
    items,
    shipment: {
      shippingProviderName: shop.shippingProviderName,
      receiverName: "Nguyễn Minh An",
      receiverPhone: "0901000001",
      province: "TP.HCM",
      district: "Quận 7",
      ward: "Tân Phú",
      detailAddress: "Số 12 đường Nguyễn Lương Bằng",
      addressType: "HOME",
      shippedAt: status === "SHIPPING" || status === "COMPLETED" ? "2026-06-23T09:00:00.000Z" : undefined,
      deliveredAt: status === "COMPLETED" ? "2026-06-26T16:00:00.000Z" : undefined,
      failedAt: status === "DELIVERY_FAILED" ? "2026-06-24T18:00:00.000Z" : undefined
    },
    timeline: [
      { id: `${id}-log-1`, newStatus: "PLACED", note: "Đã đặt hàng", createdAt },
      ...(paymentStatus === "PAID"
        ? [{ id: `${id}-log-2`, oldStatus: "PLACED" as const, newStatus: "PLACED" as const, note: "Đã thanh toán", createdAt: "2026-06-20T10:00:00.000Z" }]
        : []),
      ...(sellerConfirmed
        ? [{ id: `${id}-log-3`, oldStatus: "PLACED" as const, newStatus: "READY_TO_SHIP" as const, note: "Shop đã xác nhận", createdAt: "2026-06-20T12:00:00.000Z" }]
        : []),
      ...(status === "SHIPPING" || status === "COMPLETED"
        ? [{ id: `${id}-log-4`, oldStatus: "READY_TO_SHIP" as const, newStatus: "SHIPPING" as const, note: "Đang giao", createdAt: "2026-06-23T09:00:00.000Z" }]
        : []),
      ...(status === "COMPLETED"
        ? [{ id: `${id}-log-5`, oldStatus: "SHIPPING" as const, newStatus: "COMPLETED" as const, note: "Giao thành công", createdAt: "2026-06-26T16:00:00.000Z" }]
        : [])
    ],
    createdAt
  };
};

export const orders: Order[] = [
  makeOrder("order-1", "OD-260629-001", "shop-style", "PLACED", "PENDING", false, [
    makeOrderItem("oi-1", "p-01", 0, 1),
    makeOrderItem("oi-2", "p-05", 0, 2)
  ]),
  makeOrder("order-2", "OD-260629-002", "shop-tech", "READY_TO_SHIP", "PAID", true, [
    makeOrderItem("oi-3", "p-06", 0, 1)
  ]),
  makeOrder("order-3", "OD-260629-003", "shop-beauty", "SHIPPING", "PAID", true, [
    makeOrderItem("oi-4", "p-11", 0, 1),
    makeOrderItem("oi-5", "p-13", 1, 2)
  ]),
  makeOrder("order-4", "OD-260629-004", "shop-home", "COMPLETED", "PAID", true, [
    makeOrderItem("oi-6", "p-16", 0, 1)
  ]),
  makeOrder("order-5", "OD-260629-005", "shop-shoes", "CANCELLED", "CANCELLED", false, [
    makeOrderItem("oi-7", "p-21", 0, 1)
  ]),
  makeOrder("order-6", "OD-260629-006", "shop-tech", "DELIVERY_FAILED", "PAID", true, [
    makeOrderItem("oi-8", "p-27", 0, 2)
  ]),
  makeOrder("order-7", "OD-260629-007", "shop-style", "COMPLETED", "PAID", true, [
    makeOrderItem("oi-9", "p-26", 1, 2)
  ]),
  makeOrder("order-8", "OD-260629-008", "shop-beauty", "PLACED", "FAILED", false, [
    makeOrderItem("oi-10", "p-30", 0, 1)
  ])
];

export const payments: Payment[] = [
  {
    id: "pay-1",
    paymentCode: "PAY-260629-001",
    userId: "u-customer",
    paymentMethod: "MOCK",
    paymentGateway: "MOCK_GATEWAY",
    paymentStatus: "PENDING",
    amount: orders[0].totalAmount,
    expiresAt: "2026-06-30T09:00:00.000Z",
    orderCodes: ["OD-260629-001"],
    createdAt: orders[0].createdAt
  },
  {
    id: "pay-2",
    paymentCode: "PAY-260629-002",
    userId: "u-customer",
    paymentMethod: "MOMO",
    paymentGateway: "MOMO",
    paymentStatus: "PAID",
    amount: orders[1].totalAmount + orders[2].totalAmount,
    transactionCode: "MOMO20260629002",
    expiresAt: "2026-06-30T09:00:00.000Z",
    paidAt: "2026-06-20T10:00:00.000Z",
    orderCodes: ["OD-260629-002", "OD-260629-003"],
    createdAt: "2026-06-20T09:00:00.000Z"
  },
  {
    id: "pay-3",
    paymentCode: "PAY-260629-003",
    userId: "u-customer",
    paymentMethod: "BANK_TRANSFER",
    paymentGateway: "BANK",
    paymentStatus: "FAILED",
    amount: orders[7].totalAmount,
    expiresAt: "2026-06-30T09:00:00.000Z",
    failedAt: "2026-06-21T10:30:00.000Z",
    orderCodes: ["OD-260629-008"],
    createdAt: orders[7].createdAt
  },
  {
    id: "pay-4",
    paymentCode: "PAY-260629-004",
    userId: "u-customer",
    paymentMethod: "CREDIT_CARD",
    paymentGateway: "CARD",
    paymentStatus: "PAID",
    amount: orders[3].totalAmount + orders[6].totalAmount,
    transactionCode: "CARD20260629004",
    expiresAt: "2026-06-30T09:00:00.000Z",
    paidAt: "2026-06-20T11:00:00.000Z",
    orderCodes: ["OD-260629-004", "OD-260629-007"],
    createdAt: "2026-06-20T10:20:00.000Z"
  }
];

export const notifications: Notification[] = [
  {
    id: "noti-1",
    userId: "u-customer",
    title: "Đặt hàng thành công",
    content: "Payment PAY-260629-002 đã liên kết 2 đơn từ 2 shop khác nhau.",
    type: "ORDER",
    createdAt: "2026-06-20T09:05:00.000Z"
  },
  {
    id: "noti-2",
    userId: "u-customer",
    title: "Shop đã xác nhận đơn",
    content: "TechNest đã xác nhận đơn OD-260629-002.",
    type: "ORDER",
    createdAt: "2026-06-20T12:05:00.000Z"
  },
  {
    id: "noti-3",
    userId: "u-seller",
    title: "Có đơn mới cần xác nhận",
    content: "Đơn OD-260629-001 cần được xác nhận trong 2 ngày.",
    type: "SELLER",
    createdAt: "2026-06-29T09:00:00.000Z"
  }
];

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Tư vấn tai nghe dưới 1.5 triệu",
    customerName: "Nguyễn Minh An",
    assignedSupporter: "Supporter Linh",
    status: "OPEN",
    mode: "AI",
    lastMessageAt: "2026-06-29T08:30:00.000Z",
    messages: [
      { id: "m-1", sender: "CUSTOMER", text: "Mình cần tai nghe chống ồn dưới 1.5 triệu.", createdAt: "2026-06-29T08:20:00.000Z", isRead: true },
      { id: "m-2", sender: "AI", text: "Bạn có thể xem Tai nghe bluetooth chống ồn của TechNest, giá hiện tại đang sale.", createdAt: "2026-06-29T08:21:00.000Z", isRead: true },
      { id: "m-3", sender: "CUSTOMER", text: "Cho mình gặp nhân viên để hỏi bảo hành.", createdAt: "2026-06-29T08:30:00.000Z", isRead: false }
    ]
  },
  {
    id: "conv-2",
    title: "Hỏi trạng thái đơn hàng",
    customerName: "Hoàng Nhật Minh",
    assignedSupporter: "Supporter Linh",
    status: "OPEN",
    mode: "SUPPORTER",
    lastMessageAt: "2026-06-29T07:50:00.000Z",
    messages: [
      { id: "m-4", sender: "CUSTOMER", text: "Đơn của mình đang giao đến đâu rồi?", createdAt: "2026-06-29T07:48:00.000Z", isRead: true },
      { id: "m-5", sender: "SUPPORTER", text: "Mình kiểm tra thấy đơn đang ở trạng thái giao hàng.", createdAt: "2026-06-29T07:50:00.000Z", isRead: true }
    ]
  }
];

export const initialState: AppState = {
  users,
  shops,
  categories,
  products,
  variants,
  cartItems: [
    { id: "cart-1", variantId: "p-01-v-1", quantity: 1, isSelected: true },
    { id: "cart-2", variantId: "p-06-v-1", quantity: 1, isSelected: true },
    { id: "cart-3", variantId: "p-14-v-1", quantity: 1, isSelected: false },
    { id: "cart-4", variantId: "p-36-v-1", quantity: 1, isSelected: false }
  ].filter((item) => variantById.has(item.variantId)),
  addresses,
  orders,
  payments,
  notifications,
  conversations,
  sessionUserId: undefined,
  activeRole: "GUEST",
  lastCheckoutPaymentCode: undefined
};

export const hotKeywords = ["tai nghe chống ồn", "sneaker trắng", "serum B5", "áo sơ mi linen", "đèn bàn LED"];
