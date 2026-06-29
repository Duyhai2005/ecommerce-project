"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Box,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PackageCheck,
  PanelLeft,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TicketPercent,
  Truck,
  User,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { hotKeywords } from "@/data/mock";
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Panel,
  Radio,
  SearchField,
  Section,
  Select,
  StatusBadge,
  Textarea,
  Toast,
  cn
} from "@/components/common/ui";
import {
  MetricCard,
  OrderTimeline,
  PriceDisplay,
  ProductCard,
  QuantityStepper,
  RatingStars,
  ShopCard
} from "@/components/marketplace/cards";
import {
  canCustomerCancel,
  filterProducts,
  formatDate,
  formatVnd,
  getCategoryNames,
  getPrimaryVariant,
  getProductPriceRange,
  groupCartByShop,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  productStatusLabel,
  roleLabel,
  searchSuggestions,
  selectedCheckoutGroups,
  sellerStatusLabel
} from "@/lib/helpers";
import { useMarketplaceStore } from "@/store/use-marketplace-store";
import type { AddressType, Order, PaymentMethod, Product, ProductVariant, SellerStatus, Shop } from "@/types/models";

type ToastTone = "success" | "danger" | "info";
type ToastState = { message: string; tone: ToastTone } | undefined;

const brandName = "Shepoo";

const linkClass =
  "inline-flex min-h-10 items-center gap-2 rounded-panel px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white hover:text-primary";

const activeLinkClass = "bg-white text-primary shadow-sm";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const roleHomePath = (role: string) => {
  if (role === "ADMIN") return "/admin";
  if (role === "SUPPORTER") return "/supporter";
  if (role === "SELLER") return "/seller";
  return "/";
};

function RedirectTo({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
      <Panel className="w-full max-w-md text-center">
        <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-muted">Đang chuyển hướng...</p>
      </Panel>
    </main>
  );
}

export function AppShell() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const store = useMarketplaceStore();
  const [toast, setToast] = useState<ToastState>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isDashboardRoute = ["seller", "admin", "supporter"].includes(segments[0] ?? "");
  const currentRoles = store.currentUser?.roles ?? [];
  const forcedDashboardPath = !isDashboardRoute
    ? currentRoles.includes("ADMIN")
      ? "/admin"
      : currentRoles.includes("SUPPORTER")
        ? "/supporter"
        : store.currentUser && store.state.activeRole === "SELLER"
          ? "/seller"
          : ""
    : "";

  const showToast = (message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(undefined), 2600);
  };

  const findPaymentForOrder = (orderCode: string) =>
    store.state.payments.find((payment) => payment.orderCodes.includes(orderCode));

  const canContinuePayment = (order: Order) =>
    order.orderStatus !== "CANCELLED" && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");

  const goToPaymentForOrder = (order: Order) => {
    const payment = findPaymentForOrder(order.orderCode);
    if (!payment) {
      showToast("Không tìm thấy payment liên kết với đơn hàng.", "danger");
      return;
    }
    window.location.href = `/payment/${payment.paymentCode}`;
  };

  const publicChrome = !isDashboardRoute && !forcedDashboardPath;

  if (!store.ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
        <Panel className="w-full max-w-md text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-bold">Đang mở Shepoo</h1>
          <p className="mt-1 text-sm text-muted">Khởi tạo mock store và giao diện frontend.</p>
        </Panel>
      </main>
    );
  }

  const content = (() => {
    if (forcedDashboardPath) return <RedirectTo href={forcedDashboardPath} />;
    if (segments[0] === "seller") return renderSellerRoutes();
    if (segments[0] === "admin") return renderAdminRoutes();
    if (segments[0] === "supporter") return renderSupporterRoutes();
    return renderMarketplaceRoutes();
  })();

  return (
    <div className="min-h-screen">
      {publicChrome ? <MarketplaceHeader /> : null}
      {content}
      {publicChrome ? <MarketplaceFooter /> : null}
      <Toast message={toast?.message} tone={toast?.tone} />
    </div>
  );

  function MarketplaceHeader() {
    const [query, setQuery] = useState("");
    const suggestions = searchSuggestions(query, store.state.products, store.state.shops, store.state.categories);
    const selectedCount = store.cartRows.reduce((sum, row) => sum + row.item.quantity, 0);
    const currentRoles = store.currentUser?.roles ?? [];
    const canSwitchBuyerSeller = currentRoles.includes("CUSTOMER") && currentRoles.includes("SELLER");

    return (
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex shrink-0 items-center gap-2" aria-label="Shepoo trang chủ">
              <span className="flex h-10 w-10 items-center justify-center rounded-panel bg-primary text-lg font-black text-white">
                S
              </span>
              <span className="hidden text-xl font-black text-ink sm:inline">{brandName}</span>
            </a>
            <div className="relative min-w-0 flex-1">
              <SearchField value={query} onChange={setQuery} />
              {query ? (
                <div className="absolute left-0 right-0 top-12 z-50 rounded-panel border border-line bg-white p-2 shadow-soft">
                  {suggestions.length ? (
                    suggestions.map((item) => (
                      <a
                        key={`${item.type}-${item.href}`}
                        href={item.href}
                        className="flex items-center justify-between rounded-panel px-3 py-2 text-sm hover:bg-canvas"
                      >
                        <span className="truncate font-semibold text-ink">{item.label}</span>
                        <span className="text-xs text-muted">{item.type}</span>
                      </a>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted">Không có gợi ý phù hợp.</p>
                  )}
                </div>
              ) : null}
            </div>
            <IconButton aria-label="Mở menu" className="lg:hidden" onClick={() => setMobileNavOpen((value) => !value)}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </IconButton>
            <nav className="hidden items-center gap-1 lg:flex">
              <a className={linkClass} href="/products">
                <Search className="h-4 w-4" aria-hidden="true" />
                Sản phẩm
              </a>
              <a className={linkClass} href="/chat">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Chat
              </a>
              <a className={linkClass} href="/cart">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Giỏ hàng
                <span className="rounded-[6px] bg-coral px-1.5 py-0.5 text-xs text-white">{selectedCount}</span>
              </a>
              {store.currentUser ? (
                <>
                  <a className={linkClass} href="/account">
                    <User className="h-4 w-4" aria-hidden="true" />
                    {store.currentUser.fullName.split(" ").slice(-1)}
                  </a>
                  {canSwitchBuyerSeller ? (
                    <Button
                      variant="secondary"
                      className="px-3"
                      onClick={() => {
                        store.switchRole("SELLER");
                        window.location.href = "/seller";
                      }}
                    >
                      <Store className="h-4 w-4" aria-hidden="true" />
                      Kênh người bán
                    </Button>
                  ) : null}
                  <IconButton aria-label="Đăng xuất" onClick={store.logout}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </>
              ) : (
                <>
                  <a className={linkClass} href="/login">
                    Đăng nhập
                  </a>
                  <a className="inline-flex min-h-10 items-center rounded-panel bg-primary px-3 py-2 text-sm font-bold text-white" href="/register">
                    Đăng ký
                  </a>
                </>
              )}
            </nav>
          </div>
          <div className="mt-3 hidden gap-2 overflow-x-auto lg:flex">
            {store.state.categories.map((category) => (
              <a
                key={category.id}
                className="shrink-0 rounded-panel border border-line bg-white px-3 py-1.5 text-sm font-semibold text-muted hover:border-primary/40 hover:text-primary"
                href={`/categories/${category.slug}`}
              >
                {category.name}
              </a>
            ))}
          </div>
          {mobileNavOpen ? (
            <div className="mt-3 grid gap-2 lg:hidden">
              {[
                ["/products", "Sản phẩm"],
                ["/cart", "Giỏ hàng"],
                ["/account", "Tài khoản"],
                ["/seller/register", "Đăng ký người bán"],
                ["/chat", "Chat hỗ trợ"]
              ].map(([href, label]) => (
                <a key={href} href={href} className="rounded-panel border border-line bg-white px-3 py-2 text-sm font-semibold">
                  {label}
                </a>
              ))}
              {canSwitchBuyerSeller ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    store.switchRole("SELLER");
                    window.location.href = "/seller";
                  }}
                >
                  <Store className="h-4 w-4" aria-hidden="true" />
                  Kênh người bán
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  function MarketplaceFooter() {
    return (
      <footer className="mt-8 border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Chính sách mua hàng", "Thanh toán online, không COD, không return request trong rule hiện tại."],
            ["Hỗ trợ", "Chat AI, supporter, theo dõi payment và order trên cùng tài khoản."],
            ["Marketplace", "Nhiều seller, mỗi order thuộc một shop, payment có thể nối nhiều order."],
            ["Người bán", "Shop cần admin duyệt; sản phẩm public sau khi shop được duyệt."]
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </footer>
    );
  }

  function renderMarketplaceRoutes() {
    const root = segments[0] ?? "";
    if (root === "") return <HomePage />;
    if (root === "products") return <ProductListingPage title="Tất cả sản phẩm" />;
    if (root === "search") return <ProductListingPage title="Tìm kiếm sản phẩm" />;
    if (root === "categories") return <ProductListingPage title={`Danh mục ${categoryBySlug(segments[1])?.name ?? ""}`} categorySlug={segments[1]} />;
    if (root === "shops" && segments[2] === "products") return <ProductDetailPage shopSlug={segments[1]} productSlug={segments[3]} />;
    if (root === "shops") return <ShopPage shopSlug={segments[1]} />;
    if (root === "login") return <AuthPage mode="login" />;
    if (root === "register") return <AuthPage mode="register" />;
    if (root === "verify-email") return <VerificationPage type="email" />;
    if (root === "verify-phone") return <VerificationPage type="phone" />;
    if (root === "forgot-password") return <PasswordPage mode="forgot" />;
    if (root === "reset-password") return <PasswordPage mode="reset" />;
    if (root === "cart") return <CartPage />;
    if (root === "checkout" && segments[1] === "success") return <CheckoutSuccessPage />;
    if (root === "checkout") return <CheckoutPage />;
    if (root === "payment") return <PaymentPage paymentCode={segments[1]} />;
    if (root === "account") return <AccountPage section={segments[1]} detailId={segments[2]} />;
    if (root === "chat") return <ChatPage />;
    return <NotFoundPage />;
  }

  function HomePage() {
    const approvedShops = store.state.shops.filter((shop) => shop.status === "APPROVED");
    const bestSellers = [...store.state.products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
    const newest = [...store.state.products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
    const heroProduct = bestSellers[0];
    const heroShop = store.state.shops.find((shop) => shop.id === heroProduct.sellerId);
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-panel border border-line bg-white">
            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
              <div className="p-5 sm:p-7">
                <StatusBadge status="APPROVED" label="Marketplace nhiều seller" />
                <h1 className="mt-4 text-3xl font-black tracking-normal text-ink sm:text-5xl">{brandName}</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted">
                  Mua sắm theo sản phẩm, shop và category. Checkout nhiều shop sẽ tự tách thành nhiều đơn nhưng chỉ có một payment chung.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {hotKeywords.map((keyword) => (
                    <a
                      key={keyword}
                      href={`/search?q=${encodeURIComponent(keyword)}`}
                      className="rounded-panel border border-line bg-canvas px-3 py-1.5 text-sm font-semibold text-muted hover:border-primary/40 hover:text-primary"
                    >
                      {keyword}
                    </a>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => (window.location.href = "/products")}>Mua ngay</Button>
                  <Button variant="secondary" onClick={() => (window.location.href = store.currentUser ? "/seller/register" : "/login")}>
                    Đăng ký trở thành người bán
                  </Button>
                </div>
              </div>
              <a href={`/shops/${heroShop?.shopSlug}/products/${heroProduct.slug}`} className="relative min-h-72 bg-canvas">
                <img src={heroProduct.thumbnailUrl} alt={heroProduct.name} className="h-full w-full object-cover" />
                <div className="absolute inset-x-4 bottom-4 rounded-panel border border-white/70 bg-white/95 p-3 shadow-soft backdrop-blur">
                  <p className="inline-flex rounded-[6px] bg-amber/20 px-2 py-1 text-xs font-bold uppercase text-primary">Đang bán chạy</p>
                  <h2 className="mt-1 text-lg font-black text-ink">{heroProduct.name}</h2>
                  <p className="text-sm text-muted">{heroShop?.shopName}</p>
                </div>
              </a>
            </div>
          </div>
          <div className="grid gap-4">
            <Panel>
              <div className="flex items-center gap-3">
                <WalletCards className="h-9 w-9 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted">Thanh toán</p>
                  <p className="font-bold">MOCK, chuyển khoản, MoMo, thẻ tín dụng</p>
                </div>
              </div>
            </Panel>
            <Panel>
              <div className="flex items-center gap-3">
                <Truck className="h-9 w-9 text-coral" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted">Vận hành marketplace</p>
                  <p className="font-bold">Mỗi shop tự xác nhận và cập nhật giao hàng</p>
                </div>
              </div>
            </Panel>
            <Panel>
              <div className="flex items-center gap-3">
                <Bot className="h-9 w-9 text-sky" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted">AI & supporter</p>
                  <p className="font-bold">Chat sản phẩm, order info, chuyển người hỗ trợ</p>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <Section title="Danh mục một cấp">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {store.state.categories.map((category) => (
              <a key={category.id} href={`/categories/${category.slug}`} className="rounded-panel border border-line bg-white p-4 font-bold hover:border-primary/40 hover:text-primary">
                {category.name}
              </a>
            ))}
          </div>
        </Section>

        <Section title="Sản phẩm bán chạy" action={<a className={linkClass} href="/products">Xem tất cả</a>}>
          <ProductGrid products={bestSellers} />
        </Section>

        <Section title="Sản phẩm mới">
          <ProductGrid products={newest} />
        </Section>

        <Section title="Shop nổi bật">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {approvedShops.slice(0, 6).map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function ProductGrid({ products }: { products: Product[] }) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variants={store.state.variants}
            shop={shopById(product.sellerId)}
            categories={store.state.categories}
            onAdd={(variantId) => {
              const result = store.addToCart(variantId, 1);
              showToast(result.message, result.ok ? "success" : "danger");
            }}
          />
        ))}
      </div>
    );
  }

  function ProductListingPage({
    title,
    categorySlug,
    shopSlug
  }: {
    title: string;
    categorySlug?: string;
    shopSlug?: string;
  }) {
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "sold" | "rating">("newest");
    const [sellerId, setSellerId] = useState("");
    const [rating, setRating] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const products = filterProducts(store.state.products, store.state.variants, store.state.shops, store.state.categories, {
      keyword,
      categorySlug,
      shopSlug,
      sellerId: sellerId || undefined,
      rating: rating ? Number(rating) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort
    });
    const filterPanel = (
      <div className="grid gap-3">
        <Field label="Từ khóa">
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên sản phẩm, shop, danh mục" />
        </Field>
        <Field label="Khoảng giá">
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Từ" />
            <Input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Đến" />
          </div>
        </Field>
        <Field label="Seller">
          <Select value={sellerId} onChange={(event) => setSellerId(event.target.value)}>
            <option value="">Tất cả shop</option>
            {store.state.shops.filter((shop) => shop.status === "APPROVED").map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shopName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rating tối thiểu">
          <Select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="">Tất cả</option>
            <option value="4">Từ 4 sao</option>
            <option value="4.5">Từ 4.5 sao</option>
          </Select>
        </Field>
        <Button
          variant="secondary"
          onClick={() => {
            setKeyword("");
            setSellerId("");
            setRating("");
            setMinPrice("");
            setMaxPrice("");
          }}
        >
          Reset filter
        </Button>
      </div>
    );
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Section
          title={title}
          description="Filter theo giá, category, rating, seller; không filter theo thuộc tính variant như màu/size/RAM."
          action={
            <div className="flex gap-2">
              <IconButton aria-label="Mở filter" className="lg:hidden" onClick={() => setFiltersOpen((value) => !value)}>
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </IconButton>
              <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="w-44">
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng</option>
                <option value="price-desc">Giá giảm</option>
                <option value="sold">Bán chạy</option>
                <option value="rating">Rating cao</option>
              </Select>
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <Panel>{filterPanel}</Panel>
            </aside>
            {filtersOpen ? <Panel className="lg:hidden">{filterPanel}</Panel> : null}
            <div>
              <p className="mb-3 text-sm text-muted">Tìm thấy {products.length} sản phẩm</p>
              {products.length ? <ProductGrid products={products} /> : <EmptyState title="Không có kết quả" description="Hãy đổi từ khóa hoặc reset bộ lọc để xem thêm sản phẩm." />}
            </div>
          </div>
        </Section>
      </main>
    );
  }

  function ShopPage({ shopSlug }: { shopSlug?: string }) {
    const shop = store.state.shops.find((item) => item.shopSlug === shopSlug);
    if (!shop) return <NotFoundPage />;
    const products = store.state.products.filter((product) => product.sellerId === shop.id);
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={shop.logoUrl} alt={shop.shopName} className="h-24 w-24 rounded-panel object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-ink">{shop.shopName}</h1>
                <StatusBadge status={shop.status} label={sellerStatusLabel[shop.status]} />
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{shop.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                <span>Đã bán {shop.totalSold.toLocaleString("vi-VN")}</span>
                <span>Phí ship {formatVnd(shop.shippingFee)}</span>
                <span>{shop.shippingProviderName}</span>
              </div>
            </div>
          </div>
        </Panel>
        <ProductListingPage title={`Sản phẩm của ${shop.shopName}`} shopSlug={shop.shopSlug} />
      </main>
    );
  }

  function ProductDetailPage({ shopSlug, productSlug }: { shopSlug?: string; productSlug?: string }) {
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [showReport, setShowReport] = useState(false);
    const shop = store.state.shops.find((item) => item.shopSlug === shopSlug);
    const product = shop ? store.state.products.find((item) => item.sellerId === shop.id && item.slug === productSlug) : undefined;
    if (!shop || !product) return <NotFoundPage />;
    const productVariants = store.state.variants.filter((variant) => variant.productId === product.id);
    const selectedVariant = productVariants.find((variant) => variant.id === selectedVariantId) ?? productVariants[0];
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel>
            <img src={selectedVariant?.imageUrl ?? product.thumbnailUrl} alt={product.name} className="aspect-square w-full rounded-panel object-cover" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.imageUrls.map((image) => (
                <img key={image} src={image} alt={product.name} className="aspect-square rounded-panel border border-line object-cover" />
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} label={productStatusLabel[product.status]} />
              <a href={`/shops/${shop.shopSlug}`} className="rounded-panel border border-line px-2 py-1 text-xs font-semibold text-primary">
                {shop.shopName}
              </a>
            </div>
            <h1 className="mt-3 text-3xl font-black text-ink">{product.name}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
              <RatingStars rating={product.averageRating} count={product.reviewCount} />
              <span>Đã bán {product.soldCount}</span>
              <span>{product.viewCount.toLocaleString("vi-VN")} lượt xem</span>
            </div>
            <div className="mt-4 rounded-panel bg-canvas p-4">
              <PriceDisplay price={selectedVariant?.price ?? 0} salePrice={selectedVariant?.salePrice} />
              {selectedVariant?.salePrice ? <p className="mt-1 text-xs text-muted">Sale đến {formatDate(selectedVariant.saleEndAt)}</p> : null}
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Biến thể">
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant.id === variant.id ? "primary" : "secondary"}
                      disabled={variant.status !== "ACTIVE"}
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      {variant.variantName}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field label="Số lượng">
                <QuantityStepper value={quantity} onChange={setQuantity} max={selectedVariant?.inventory.quantity ?? 1} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!selectedVariant || product.status !== "ACTIVE" || selectedVariant.status !== "ACTIVE"}
                  onClick={() => {
                    const result = store.addToCart(selectedVariant.id, quantity);
                    showToast(result.message, result.ok ? "success" : "danger");
                  }}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Thêm vào giỏ hàng
                </Button>
                <Button variant="secondary" onClick={() => setShowReport((value) => !value)}>
                  Báo cáo sản phẩm
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
              <InfoRow label="Thương hiệu" value={product.brand ?? "Không khai báo"} />
              <InfoRow label="Xuất xứ" value={product.origin} />
              <InfoRow label="Bảo hành" value={product.warranty ?? "Không áp dụng"} />
              <InfoRow label="Danh mục" value={getCategoryNames(store.state.categories, product) || "Chưa phân loại"} />
            </div>
          </Panel>
        </div>
        {showReport ? <ReportProductPanel product={product} /> : null}
        <Section title="Mô tả sản phẩm">
          <Panel>
            <p className="text-sm leading-7 text-muted">{product.shortDescription}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{product.description}</p>
          </Panel>
        </Section>
        <Section title="Đánh giá sản phẩm">
          <ReviewsModule product={product} />
        </Section>
      </main>
    );
  }

  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-panel border border-line bg-white p-3">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 font-semibold text-ink">{value}</p>
      </div>
    );
  }

  function ReportProductPanel({ product }: { product: Product }) {
    return (
      <Section title="Báo cáo sản phẩm">
        <Panel>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Lý do">
              <Select>
                <option>Hàng giả</option>
                <option>Lừa đảo</option>
                <option>Nội dung không phù hợp</option>
                <option>Mô tả sai</option>
                <option>Spam</option>
                <option>Khác</option>
              </Select>
            </Field>
            <Field label="Ảnh bằng chứng">
              <Input type="file" />
            </Field>
            <div className="flex items-end">
              <Button onClick={() => showToast(`Đã gửi báo cáo cho ${product.name}`, "success")}>Gửi báo cáo</Button>
            </div>
            <div className="md:col-span-3">
              <Field label="Mô tả chi tiết">
                <Textarea placeholder="Mô tả vấn đề bạn gặp phải" />
              </Field>
            </div>
          </div>
        </Panel>
      </Section>
    );
  }

  function ReviewsModule({ product }: { product?: Product }) {
    const relatedItems = store.state.orders
      .filter((order) => order.orderStatus === "COMPLETED")
      .flatMap((order) => order.items)
      .filter((item) => !product || item.productId === product.id);
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel>
          {relatedItems.length ? (
            <div className="space-y-4">
              {relatedItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={4.2 + (index % 4) * 0.2} />
                    <span className="text-sm font-semibold text-ink">Đánh giá đã mua hàng</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Sản phẩm {item.productNameSnapshot} đúng mô tả, đóng gói cẩn thận. Review chỉ mở cho order completed.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có đánh giá" description="Review chỉ hiển thị khi đơn đã hoàn thành và item chưa từng được đánh giá." />
          )}
        </Panel>
        <Panel>
          <h3 className="font-bold text-ink">Viết đánh giá</h3>
          <p className="mt-1 text-sm text-muted">Form mock đầy đủ cho module review sau khi order completed.</p>
          <div className="mt-4 grid gap-3">
            <Field label="Rating">
              <Select>
                <option>5 sao</option>
                <option>4 sao</option>
                <option>3 sao</option>
                <option>2 sao</option>
                <option>1 sao</option>
              </Select>
            </Field>
            <Field label="Nội dung">
              <Textarea placeholder="Chia sẻ trải nghiệm của bạn" />
            </Field>
            <Field label="Ảnh đánh giá">
              <Input type="file" multiple />
            </Field>
            <Button onClick={() => showToast("Đã lưu đánh giá mock.", "success")}>Gửi đánh giá</Button>
          </div>
        </Panel>
      </div>
    );
  }

  function AuthPage({ mode }: { mode: "login" | "register" }) {
    const [email, setEmail] = useState(mode === "login" ? "customer@demo.vn" : "");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-5 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <div>
          <StatusBadge status="ACTIVE" label="Mock auth/session" />
          <h1 className="mt-4 text-4xl font-black text-ink">{mode === "login" ? "Đăng nhập Shepoo" : "Tạo tài khoản khách hàng"}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Admin và supporter vào dashboard riêng sau đăng nhập. Seller chỉ có quyền sau khi shop được admin duyệt.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {["customer@demo.vn", "seller@demo.vn", "admin@demo.vn", "supporter@demo.vn", "locked@demo.vn"].map((demo) => (
              <Button key={demo} variant="secondary" onClick={() => setEmail(demo)}>
                {demo}
              </Button>
            ))}
          </div>
        </div>
        <Panel>
          <div className="grid gap-4">
            {mode === "register" ? (
              <>
                <Field label="Họ tên">
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Văn A" />
                </Field>
                <Field label="Số điện thoại">
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="090..." />
                </Field>
              </>
            ) : null}
            <Field label="Email">
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@demo.vn" />
            </Field>
            <Field label="Mật khẩu">
              <Input type="password" placeholder="Mock không kiểm tra mật khẩu" />
            </Field>
            <Button
              onClick={() => {
                if (mode === "login") {
                  const result = store.login(email);
                  showToast(result.message, result.ok ? "success" : "danger");
                  if (result.ok) window.location.href = result.redirectTo ?? "/";
                } else {
                  store.register({ fullName: fullName || "Khách hàng mới", email, phone: phone || "0900000000" });
                  showToast("Đã đăng ký tài khoản mock.", "success");
                  window.location.href = "/verify-email";
                }
              }}
            >
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </Button>
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <a href="/forgot-password" className="font-semibold text-primary">Quên mật khẩu</a>
              <a href={mode === "login" ? "/register" : "/login"} className="font-semibold text-primary">
                {mode === "login" ? "Tạo tài khoản" : "Đã có tài khoản"}
              </a>
            </div>
          </div>
        </Panel>
      </main>
    );
  }

  function VerificationPage({ type }: { type: "email" | "phone" }) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Panel>
          <ShieldCheck className="h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-black text-ink">{type === "email" ? "Xác thực email" : "Xác thực số điện thoại"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Màn hình đầy đủ cho luồng token/OTP. Backend sau này nối API gửi mã và xác minh tại đây.
          </p>
          <div className="mt-4 grid gap-3">
            <Field label={type === "email" ? "Mã xác thực email" : "OTP điện thoại"}>
              <Input placeholder={type === "email" ? "Nhập token email" : "Nhập 6 chữ số"} />
            </Field>
            <Button onClick={() => showToast("Xác thực mock thành công.", "success")}>Xác thực</Button>
          </div>
        </Panel>
      </main>
    );
  }

  function PasswordPage({ mode }: { mode: "forgot" | "reset" }) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Panel>
          <Lock className="h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-black text-ink">{mode === "forgot" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}</h1>
          <div className="mt-4 grid gap-3">
            {mode === "forgot" ? (
              <Field label="Email">
                <Input placeholder="email@demo.vn" />
              </Field>
            ) : (
              <>
                <Field label="Token reset">
                  <Input />
                </Field>
                <Field label="Mật khẩu mới">
                  <Input type="password" />
                </Field>
              </>
            )}
            <Button onClick={() => showToast("Đã gửi yêu cầu mock.", "success")}>{mode === "forgot" ? "Gửi link reset" : "Đổi mật khẩu"}</Button>
          </div>
        </Panel>
      </main>
    );
  }

  function CartPage() {
    if (!store.currentUser) {
      return <Unauthorized title="Giỏ hàng cần đăng nhập" description="Guest chỉ được xem và tìm kiếm sản phẩm, không có cart." />;
    }
    const groups = Object.values(groupCartByShop(store.cartRows));
    const selectedTotal = store.cartRows.filter((row) => row.item.isSelected && !row.unavailable).reduce((sum, row) => sum + row.subtotal, 0);
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Section title="Giỏ hàng" description="Cart item lưu theo variant, group theo shop và không có wishlist.">
          {groups.length ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Panel className="flex items-center justify-between gap-3">
                  <Checkbox label="Chọn tất cả" checked={store.cartRows.every((row) => row.item.isSelected)} onChange={(event) => store.selectAllCart(event.target.checked)} />
                  <Button variant="secondary" onClick={() => showToast("Đã đồng bộ giá hiện tại từ mock variants.", "success")}>
                    Cập nhật giá
                  </Button>
                </Panel>
                {groups.map((group) => (
                  <Panel key={group.shop.id}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <a href={`/shops/${group.shop.shopSlug}`} className="font-bold text-ink">{group.shop.shopName}</a>
                      <span className="text-sm text-muted">Phí ship {formatVnd(group.shop.shippingFee)}</span>
                    </div>
                    <div className="space-y-3">
                      {group.rows.map((row) => (
                        <div key={row.item.id} className="grid gap-3 border-t border-line pt-3 sm:grid-cols-[24px_76px_1fr_auto] sm:items-center">
                          <Checkbox checked={row.item.isSelected} onChange={(event) => store.updateCartItem(row.item.id, { isSelected: event.target.checked })} aria-label={`Chọn ${row.product.name}`} />
                          <img src={row.product.thumbnailUrl} alt={row.product.name} className="h-20 w-20 rounded-panel object-cover" />
                          <div>
                            <p className="font-bold text-ink">{row.product.name}</p>
                            <p className="text-sm text-muted">Biến thể: {row.variant.variantName}</p>
                            {row.unavailable ? <p className="mt-1 text-sm font-semibold text-coral">{row.reason}</p> : null}
                            <PriceDisplay price={row.variant.price} salePrice={row.variant.salePrice} compact />
                          </div>
                          <div className="flex items-center gap-2">
                            <QuantityStepper value={row.item.quantity} onChange={(value) => store.updateCartItem(row.item.id, { quantity: value })} max={row.variant.inventory.quantity || 1} />
                            <Button variant="ghost" onClick={() => store.removeCartItem(row.item.id)}>Xóa</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
              <Panel className="h-fit">
                <h2 className="text-lg font-bold">Tóm tắt</h2>
                <InfoRow label="Tiền hàng đã chọn" value={formatVnd(selectedTotal)} />
                <InfoRow label="Số shop" value={`${selectedCheckoutGroups(store.cartRows).length}`} />
                <Button className="mt-4 w-full" disabled={!selectedTotal} onClick={() => (window.location.href = "/checkout")}>
                  Checkout
                </Button>
              </Panel>
            </div>
          ) : (
            <EmptyState title="Giỏ hàng trống" description="Hãy thêm sản phẩm từ các shop đã duyệt để demo checkout nhiều seller." action={<Button onClick={() => (window.location.href = "/products")}>Mua sắm</Button>} />
          )}
        </Section>
      </main>
    );
  }

  function CheckoutPage() {
    const [addressId, setAddressId] = useState(store.state.addresses.find((item) => item.userId === store.currentUser?.id && item.isDefault)?.id ?? "");
    const [method, setMethod] = useState<PaymentMethod>("MOCK");
    const [note, setNote] = useState("");
    const [coupon, setCoupon] = useState("");
    const [shipCoupon, setShipCoupon] = useState("");
    if (!store.currentUser) return <Unauthorized title="Checkout cần đăng nhập" description="Guest không có cart và không được checkout." />;
    const rows = store.cartRows;
    const groups = selectedCheckoutGroups(rows);
    const total = groups.reduce((sum, group) => sum + group.total, 0);
    const addresses = store.state.addresses.filter((address) => address.userId === store.currentUser?.id);
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Section title="Checkout" description="Nhiều shop tạo nhiều orders, nhưng chỉ một payment cho toàn bộ lần checkout. Không hỗ trợ COD.">
          {groups.length ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <Panel>
                  <h2 className="font-bold">Địa chỉ giao hàng</h2>
                  <div className="mt-3 grid gap-2">
                    {addresses.map((address) => (
                      <Radio
                        key={address.id}
                        name="address"
                        checked={addressId === address.id}
                        onChange={() => setAddressId(address.id)}
                        label={`${address.receiverName} - ${address.phone} - ${address.detailAddress}, ${address.ward}, ${address.district}, ${address.province}`}
                      />
                    ))}
                    <Button variant="secondary" onClick={() => store.addAddress({ receiverName: "Địa chỉ mới", phone: "0909999999", province: "TP.HCM", district: "Quận 2", ward: "Thảo Điền", detailAddress: "Mock address API-ready", addressType: "HOME" as AddressType, isDefault: false })}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Thêm địa chỉ mock
                    </Button>
                  </div>
                </Panel>
                {groups.map((group) => (
                  <Panel key={group.shop.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{group.shop.shopName}</h3>
                      <span className="text-sm text-muted">Order riêng của shop này</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {group.rows.map((row) => (
                        <div key={row.item.id} className="flex gap-3 border-t border-line pt-3">
                          <img src={row.product.thumbnailUrl} alt={row.product.name} className="h-16 w-16 rounded-panel object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink">{row.product.name}</p>
                            <p className="text-sm text-muted">{row.variant.variantName} x {row.item.quantity}</p>
                          </div>
                          <p className="font-bold">{formatVnd(row.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <InfoRow label="Subtotal" value={formatVnd(group.subtotal)} />
                      <InfoRow label="Phí ship" value={formatVnd(group.shippingFee)} />
                      <InfoRow label="Tổng order" value={formatVnd(group.total)} />
                    </div>
                  </Panel>
                ))}
              </div>
              <Panel className="h-fit">
                <h2 className="font-bold">Payment chung</h2>
                <div className="mt-3 grid gap-3">
                  <Field label="Ghi chú khách hàng">
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú giao hàng" />
                  </Field>
                  <Field label="Mã giảm tiền">
                    <Input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Tối đa 1 mã" />
                  </Field>
                  <Field label="Mã giảm ship">
                    <Input value={shipCoupon} onChange={(event) => setShipCoupon(event.target.value)} placeholder="Tối đa 1 mã" />
                  </Field>
                  <Field label="Phương thức thanh toán">
                    <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
                      {Object.entries(paymentMethodLabel).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
                  </Field>
                  <InfoRow label="Số order sẽ tạo" value={`${groups.length}`} />
                  <InfoRow label="Tổng payment" value={formatVnd(total)} />
                  <Button
                    onClick={() => {
                      const result = store.checkout(addressId, method, note);
                      showToast(result.message, result.ok ? "success" : "danger");
                      if (result.ok) window.location.href = "/checkout/success";
                    }}
                  >
                    Đặt hàng
                  </Button>
                </div>
              </Panel>
            </div>
          ) : (
            <EmptyState title="Chưa có item để checkout" description="Chọn ít nhất một item hợp lệ trong giỏ hàng." action={<Button onClick={() => (window.location.href = "/cart")}>Về giỏ hàng</Button>} />
          )}
        </Section>
      </main>
    );
  }

  function CheckoutSuccessPage() {
    const payment = store.state.payments.find((item) => item.paymentCode === store.state.lastCheckoutPaymentCode) ?? store.state.payments[0];
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Panel className="text-center">
          <PackageCheck className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-3xl font-black text-ink">Đặt hàng thành công</h1>
          <p className="mt-2 text-sm text-muted">Một payment chung đã được tạo và liên kết với các order theo từng shop.</p>
          {payment ? (
            <div className="mt-5 grid gap-2 text-left">
              <InfoRow label="Payment code" value={payment.paymentCode} />
              <InfoRow label="Order codes" value={payment.orderCodes.join(", ")} />
              <InfoRow label="Tổng tiền" value={formatVnd(payment.amount)} />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button disabled={!payment} onClick={() => (window.location.href = `/payment/${payment?.paymentCode}`)}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Thanh toán
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/account/orders")}>Xem đơn hàng</Button>
          </div>
        </Panel>
      </main>
    );
  }

  function PaymentPage({ paymentCode }: { paymentCode?: string }) {
    const payment = store.state.payments.find((item) => item.paymentCode === paymentCode) ?? store.state.payments[0];
    if (!payment) return <NotFoundPage />;
    const linkedOrders = store.state.orders.filter((order) => payment.orderCodes.includes(order.orderCode));
    const canPayPayment = payment.paymentStatus === "PENDING" || payment.paymentStatus === "FAILED";
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Section title={`Payment ${payment.paymentCode}`} description="Payment có thể nối nhiều orders qua payment_orders. Hạn thanh toán mock là 1 ngày.">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Panel>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Trạng thái" value={paymentStatusLabel[payment.paymentStatus]} />
                <InfoRow label="Số tiền" value={formatVnd(payment.amount)} />
                <InfoRow label="Phương thức" value={paymentMethodLabel[payment.paymentMethod]} />
                <InfoRow label="Hạn thanh toán" value={formatDate(payment.expiresAt)} />
                <InfoRow label="Transaction code" value={payment.transactionCode ?? "Chưa có"} />
                <InfoRow label="Gateway" value={payment.paymentGateway ?? "Mock"} />
              </div>
              <h3 className="mt-5 font-bold">Orders liên kết</h3>
              <div className="mt-3 space-y-2">
                {linkedOrders.map((order) => (
                  <a key={order.id} href={`/account/orders/${order.orderCode}`} className="flex items-center justify-between rounded-panel border border-line p-3 hover:border-primary/40">
                    <span className="font-bold">{order.orderCode}</span>
                    <StatusBadge status={order.orderStatus} label={orderStatusLabel[order.orderStatus]} />
                  </a>
                ))}
              </div>
            </Panel>
            <Panel className="h-fit">
              <h3 className="font-bold">Hành động mock</h3>
              <div className="mt-3 grid gap-2">
                <Button disabled={!canPayPayment} onClick={() => { store.updatePaymentStatus(payment.paymentCode, "PAID"); showToast("Đã thanh toán đơn hàng.", "success"); }}>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {payment.paymentStatus === "PAID" ? "Đã thanh toán" : "Thanh toán ngay"}
                </Button>
                <Button variant="danger" onClick={() => { store.updatePaymentStatus(payment.paymentCode, "FAILED"); showToast("Đã đánh dấu payment failed.", "danger"); }}>Mark failed</Button>
                <Button variant="secondary" onClick={() => { store.retryPayment(payment.paymentCode); showToast("Đã retry payment.", "success"); }}>
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Retry payment
                </Button>
                <Button variant="ghost" onClick={() => { store.updatePaymentStatus(payment.paymentCode, "CANCELLED"); showToast("Đã hủy payment.", "info"); }}>Cancel</Button>
                <div className="my-1 border-t border-line" />
                <Button variant="secondary" onClick={() => (window.location.href = "/")}>
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Về màn hình chính
                </Button>
                <Button variant="secondary" onClick={() => (window.location.href = "/account/orders")}>Xem đơn hàng</Button>
              </div>
            </Panel>
          </div>
        </Section>
      </main>
    );
  }

  function AccountPage({ section, detailId }: { section?: string; detailId?: string }) {
    if (!store.currentUser) return <Unauthorized title="Tài khoản cần đăng nhập" description="Vui lòng đăng nhập để xem thông tin cá nhân." />;
    const currentSection = section ?? "overview";
    const nav = [
      ["overview", "/account", "Tổng quan"],
      ["profile", "/account/profile", "Hồ sơ"],
      ["security", "/account/security", "Bảo mật"],
      ["addresses", "/account/addresses", "Địa chỉ"],
      ["orders", "/account/orders", "Đơn hàng"],
      ["notifications", "/account/notifications", "Thông báo"],
      ["reviews", "/account/reviews", "Đánh giá"]
    ];
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[240px_1fr]">
        <Panel className="h-fit">
          <div className="flex items-center gap-3">
            <img src={store.currentUser.avatarUrl} alt={store.currentUser.fullName} className="h-12 w-12 rounded-panel object-cover" />
            <div className="min-w-0">
              <p className="truncate font-bold">{store.currentUser.fullName}</p>
              <p className="text-xs text-muted">{roleLabel[store.state.activeRole]}</p>
            </div>
          </div>
          <nav className="mt-4 grid gap-1">
            {nav.map(([key, href, label]) => (
              <a key={key} href={href} className={cn(linkClass, currentSection === key && activeLinkClass)}>
                {label}
              </a>
            ))}
          </nav>
        </Panel>
        <div>
          {currentSection === "overview" ? <AccountOverview /> : null}
          {currentSection === "profile" ? <AccountProfile /> : null}
          {currentSection === "security" ? <AccountSecurity /> : null}
          {currentSection === "addresses" ? <AddressBook /> : null}
          {currentSection === "orders" && detailId ? <OrderDetailPage orderCode={detailId} audience="customer" /> : null}
          {currentSection === "orders" && !detailId ? <OrdersList audience="customer" /> : null}
          {currentSection === "notifications" ? <NotificationsPage /> : null}
          {currentSection === "reviews" ? <ReviewsModule /> : null}
        </div>
      </main>
    );
  }

  function AccountOverview() {
    const userOrders = store.state.orders.filter((order) => order.userId === store.currentUser?.id);
    return (
      <Section title="Tổng quan tài khoản">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Đơn hàng" value={`${userOrders.length}`} />
          <MetricCard label="Địa chỉ" value={`${store.state.addresses.filter((item) => item.userId === store.currentUser?.id).length}`} />
          <MetricCard label="Email" value={store.currentUser?.emailVerified ? "Đã xác thực" : "Chưa xác thực"} />
          <MetricCard label="Số điện thoại" value={store.currentUser?.phoneVerified ? "Đã xác thực" : "Chưa xác thực"} />
        </div>
      </Section>
    );
  }

  function AccountProfile() {
    const user = store.currentUser!;
    return (
      <Section title="Hồ sơ cá nhân">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Họ tên"><Input defaultValue={user.fullName} /></Field>
            <Field label="Email"><Input defaultValue={user.email} /></Field>
            <Field label="Số điện thoại"><Input defaultValue={user.phone} /></Field>
            <Field label="Giới tính">
              <Select defaultValue={user.gender ?? "OTHER"}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </Select>
            </Field>
            <Field label="Ngày sinh"><Input type="date" defaultValue={user.birthday} /></Field>
            <Field label="Avatar"><Input type="file" /></Field>
          </div>
          <Button className="mt-4" onClick={() => showToast("Đã lưu hồ sơ mock.", "success")}>Lưu hồ sơ</Button>
        </Panel>
      </Section>
    );
  }

  function AccountSecurity() {
    return (
      <Section title="Bảo mật">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h3 className="font-bold">Đổi mật khẩu</h3>
            <div className="mt-3 grid gap-3">
              <Input type="password" placeholder="Mật khẩu hiện tại" />
              <Input type="password" placeholder="Mật khẩu mới" />
              <Button onClick={() => showToast("Đã đổi mật khẩu mock.", "success")}>Đổi mật khẩu</Button>
            </div>
          </Panel>
          <Panel>
            <h3 className="font-bold">Phiên đăng nhập</h3>
            <p className="mt-2 text-sm text-muted">Mock user_sessions hỗ trợ logout current và logout all devices.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={store.logout}>Logout current</Button>
              <Button variant="danger" onClick={store.logout}>Logout all devices</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function AddressBook() {
    const addresses = store.state.addresses.filter((address) => address.userId === store.currentUser?.id);
    return (
      <Section title="Địa chỉ giao hàng">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3">
            {addresses.map((address) => (
              <Panel key={address.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{address.receiverName} - {address.phone}</p>
                    <p className="mt-1 text-sm text-muted">{address.detailAddress}, {address.ward}, {address.district}, {address.province}</p>
                  </div>
                  <StatusBadge status={address.isDefault ? "ACTIVE" : "HIDDEN"} label={address.isDefault ? "Mặc định" : address.addressType} />
                </div>
              </Panel>
            ))}
          </div>
          <Panel>
            <h3 className="font-bold">Thêm địa chỉ</h3>
            <div className="mt-3 grid gap-3">
              <Input placeholder="Người nhận" />
              <Input placeholder="Số điện thoại" />
              <Input placeholder="Tỉnh/thành" />
              <Input placeholder="Quận/huyện" />
              <Input placeholder="Phường/xã" />
              <Textarea placeholder="Địa chỉ chi tiết" />
              <Select><option>HOME</option><option>OFFICE</option></Select>
              <Button onClick={() => showToast("Đã thêm địa chỉ mock.", "success")}>Thêm</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function OrdersList({ audience }: { audience: "customer" | "seller" }) {
    const [status, setStatus] = useState("");
    const orders = store.state.orders.filter((order) => {
      const belongs = audience === "customer" ? order.userId === store.currentUser?.id : order.sellerId === store.currentShop?.id;
      return belongs && (!status || order.orderStatus === status);
    });
    const renderOrderAction = (order: Order) => {
      if (audience !== "customer") return <span className="text-muted">Theo dõi</span>;

      const showPayment = canContinuePayment(order);
      const showCancel = canCustomerCancel(order);
      if (!showPayment && !showCancel) return <span className="text-muted">Theo dõi</span>;

      return (
        <div className="flex flex-wrap gap-2">
          {showPayment ? (
            <Button onClick={() => goToPaymentForOrder(order)}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Thanh toán
            </Button>
          ) : null}
          {showCancel ? <Button variant="danger" onClick={() => store.cancelCustomerOrder(order.orderCode)}>Hủy</Button> : null}
        </div>
      );
    };
    return (
      <Section
        title={audience === "customer" ? "Đơn hàng của tôi" : "Đơn hàng shop"}
        action={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-48">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(orderStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </Select>
        }
      >
        <DataTable
          columns={["Mã đơn", "Shop", "Trạng thái", "Thanh toán", "Tổng", "Hành động"]}
          rows={orders.map((order) => [
            <a key="code" className="font-bold text-primary" href={audience === "customer" ? `/account/orders/${order.orderCode}` : `/seller/orders/${order.orderCode}`}>{order.orderCode}</a>,
            shopById(order.sellerId)?.shopName ?? "-",
            <StatusBadge key="st" status={order.orderStatus} label={orderStatusLabel[order.orderStatus]} />,
            <StatusBadge key="pay" status={order.paymentStatus} label={paymentStatusLabel[order.paymentStatus]} />,
            formatVnd(order.totalAmount),
            renderOrderAction(order)
          ])}
        />
      </Section>
    );
  }

  function OrderDetailPage({ orderCode, audience }: { orderCode?: string; audience: "customer" | "seller" }) {
    const order = store.state.orders.find((item) => item.orderCode === orderCode);
    if (!order) return <NotFoundPage />;
    const shop = shopById(order.sellerId);
    return (
      <Section title={`Chi tiết đơn ${order.orderCode}`} description="Order item và shipment hiển thị snapshot tại thời điểm mua.">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={order.orderStatus} label={orderStatusLabel[order.orderStatus]} />
                <StatusBadge status={order.paymentStatus} label={paymentStatusLabel[order.paymentStatus]} />
                <span className="text-sm text-muted">{shop?.shopName}</span>
              </div>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 border-t border-line pt-3">
                    <img src={item.productImageSnapshot} alt={item.productNameSnapshot} className="h-16 w-16 rounded-panel object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{item.productNameSnapshot}</p>
                      <p className="text-sm text-muted">{item.variantNameSnapshot} - SKU {item.skuSnapshot}</p>
                    </div>
                    <p className="font-bold">{formatVnd(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <h3 className="font-bold">Timeline</h3>
              <div className="mt-3">
                <OrderTimeline order={order} />
              </div>
            </Panel>
          </div>
          <Panel className="h-fit">
            <h3 className="font-bold">Shipment snapshot</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {order.shipment.receiverName} - {order.shipment.receiverPhone}
              <br />
              {order.shipment.detailAddress}, {order.shipment.ward}, {order.shipment.district}, {order.shipment.province}
            </p>
            <div className="mt-4 grid gap-2">
              <InfoRow label="Subtotal" value={formatVnd(order.subtotalAmount)} />
              <InfoRow label="Phí ship" value={formatVnd(order.shippingFee)} />
              <InfoRow label="Tổng" value={formatVnd(order.totalAmount)} />
            </div>
            {audience === "customer" && canContinuePayment(order) ? (
              <div className="mt-4 grid gap-2">
                <Button onClick={() => goToPaymentForOrder(order)}>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Thanh toán
                </Button>
                {canCustomerCancel(order) ? <Button variant="danger" onClick={() => store.cancelCustomerOrder(order.orderCode)}>Hủy đơn</Button> : null}
              </div>
            ) : null}
            {audience === "seller" ? (
              <div className="mt-4 grid gap-2">
                <Button disabled={order.paymentStatus !== "PAID"} onClick={() => store.updateSellerOrder(order.orderCode, "READY_TO_SHIP")}>Xác nhận đơn</Button>
                <Button variant="secondary" disabled={order.paymentStatus !== "PAID" || !order.sellerConfirmed} onClick={() => store.updateSellerOrder(order.orderCode, "SHIPPING")}>Chuyển shipping</Button>
                <Button variant="secondary" onClick={() => store.updateSellerOrder(order.orderCode, "COMPLETED")}>Hoàn thành</Button>
                <Button variant="danger" onClick={() => store.updateSellerOrder(order.orderCode, "DELIVERY_FAILED")}>Giao thất bại</Button>
              </div>
            ) : null}
          </Panel>
        </div>
      </Section>
    );
  }

  function NotificationsPage() {
    const notifications = store.state.notifications.filter((item) => item.userId === store.currentUser?.id);
    return (
      <Section title="Thông báo">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Panel key={notification.id}>
              <div className="flex items-start gap-3">
                <Bell className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-bold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted">{notification.content}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(notification.createdAt)}</p>
                </div>
              </div>
            </Panel>
          ))}
          {!notifications.length ? <EmptyState title="Chưa có thông báo" description="Các notification về order, payment, report, chat sẽ hiển thị tại đây." /> : null}
        </div>
      </Section>
    );
  }

  function ChatPage() {
    const [mode, setMode] = useState<"AI" | "SUPPORTER">("AI");
    const conversation = store.state.conversations[0];
    return (
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Section title="Chat AI / Supporter" description="User được chọn chat AI hoặc supporter, có thể yêu cầu gặp nhân viên, hỗ trợ ảnh/file và trạng thái đã đọc.">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <Panel>
              <div className="grid gap-2">
                <Button variant={mode === "AI" ? "primary" : "secondary"} onClick={() => setMode("AI")}><Bot className="h-4 w-4" />Chat AI</Button>
                <Button variant={mode === "SUPPORTER" ? "primary" : "secondary"} onClick={() => setMode("SUPPORTER")}><MessageSquare className="h-4 w-4" />Gặp supporter</Button>
              </div>
              <div className="mt-4 space-y-2">
                {store.state.conversations.map((item) => (
                  <a key={item.id} href={`/supporter/conversations/${item.id}`} className="block rounded-panel border border-line p-3 hover:border-primary/40">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-xs text-muted">{item.mode} - {item.status}</p>
                  </a>
                ))}
              </div>
            </Panel>
            <ChatWindow conversationId={conversation.id} mode={mode} />
          </div>
        </Section>
      </main>
    );
  }

  function ChatWindow({ conversationId, mode }: { conversationId: string; mode?: "AI" | "SUPPORTER" }) {
    const conversation = store.state.conversations.find((item) => item.id === conversationId) ?? store.state.conversations[0];
    return (
      <Panel className="min-h-[560px]">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h3 className="font-bold">{conversation.title}</h3>
            <p className="text-sm text-muted">{mode ?? conversation.mode} - {conversation.status}</p>
          </div>
          <Button variant="secondary" onClick={() => showToast("Đã yêu cầu chuyển/tóm tắt AI mock.", "success")}>Transfer</Button>
        </div>
        <div className="mt-4 space-y-3">
          {conversation.messages.map((message) => (
            <div key={message.id} className={cn("flex", message.sender === "CUSTOMER" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-panel border p-3 text-sm", message.sender === "CUSTOMER" ? "border-primary bg-primary text-white" : "border-line bg-canvas text-ink")}>
                <p className="font-bold">{message.sender}</p>
                <p className="mt-1 leading-6">{message.text}</p>
                <p className="mt-1 text-xs opacity-75">{formatDate(message.createdAt)} - {message.isRead ? "Đã đọc" : "Chưa đọc"}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-[1fr_auto_auto]">
          <Input placeholder="Nhập tin nhắn" />
          <Input type="file" aria-label="Đính kèm ảnh hoặc file" />
          <Button onClick={() => showToast("Đã gửi tin nhắn mock.", "success")}>Gửi</Button>
        </div>
      </Panel>
    );
  }

  function renderSellerRoutes() {
    if (segments[1] === "register") return <SellerRegisterPage />;
    if (segments[1] === "pending") return <SellerStatusPage status="PENDING" />;
    if (segments[1] === "rejected") return <SellerStatusPage status="REJECTED" />;
    if (segments[1] === "suspended") return <SellerStatusPage status="SUSPENDED" />;
    return (
      <DashboardFrame kind="seller">
        {segments.length === 1 ? <SellerDashboard /> : null}
        {segments[1] === "profile" ? <SellerProfilePage /> : null}
        {segments[1] === "products" && segments[2] === "new" ? <ProductFormPage /> : null}
        {segments[1] === "products" && segments[3] === "edit" ? <ProductFormPage productId={segments[2]} /> : null}
        {segments[1] === "products" && !segments[2] ? <SellerProductsPage /> : null}
        {segments[1] === "inventory" ? <SellerInventoryPage /> : null}
        {segments[1] === "orders" && segments[2] ? <OrderDetailPage orderCode={segments[2]} audience="seller" /> : null}
        {segments[1] === "orders" && !segments[2] ? <OrdersList audience="seller" /> : null}
        {segments[1] === "revenue" ? <SellerRevenuePage /> : null}
        {segments[1] === "category-suggestions" ? <CategorySuggestionsPage /> : null}
      </DashboardFrame>
    );
  }

  function DashboardFrame({ kind, children }: { kind: "seller" | "admin" | "supporter"; children: ReactNode }) {
    const nav: Array<[string, string, LucideIcon]> =
      kind === "seller"
        ? [
            ["/seller", "Dashboard", LayoutDashboard],
            ["/seller/profile", "Hồ sơ shop", Store],
            ["/seller/products", "Sản phẩm", Package],
            ["/seller/inventory", "Tồn kho", Box],
            ["/seller/orders", "Đơn hàng", ShoppingBag],
            ["/seller/revenue", "Doanh thu", ChartNoAxesCombined],
            ["/seller/category-suggestions", "Đề xuất category", TicketPercent]
          ]
        : kind === "admin"
          ? [
              ["/admin", "Dashboard", LayoutDashboard],
              ["/admin/users", "Users", Users],
              ["/admin/sellers", "Sellers", Store],
              ["/admin/categories", "Categories", PanelLeft],
              ["/admin/products", "Products", Package],
              ["/admin/statistics", "Statistics", ChartNoAxesCombined],
              ["/admin/violation-reports", "Reports", ShieldCheck],
              ["/admin/supporters", "Supporters", MessageSquare],
              ["/admin/chats", "Chats", MessageSquare],
              ["/admin/system-reports", "System", ClipboardCheck],
              ["/admin/ai/knowledge", "AI Knowledge", Bot]
            ]
          : [
              ["/supporter", "Dashboard", LayoutDashboard],
              ["/supporter/conversations", "Conversations", MessageSquare]
            ];
    const homeHref = roleHomePath(kind.toUpperCase());
    const canSwitchToBuyer = kind === "seller" && (store.currentUser?.roles.includes("CUSTOMER") ?? false);

    return (
      <div className="min-h-screen bg-canvas">
        <div className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href={homeHref} className="flex items-center gap-2 font-black text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-panel bg-primary text-white">S</span>
              {brandName} {kind}
            </a>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">{store.currentUser?.fullName ?? "Guest"}</span>
              {canSwitchToBuyer ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    store.switchRole("CUSTOMER");
                    window.location.href = "/";
                  }}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Mua hàng
                </Button>
              ) : null}
              <IconButton
                aria-label="Đăng xuất"
                onClick={() => {
                  store.logout();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-panel border border-line bg-white p-3">
            <nav className="grid gap-1">
              {nav.map(([href, label, Icon]) => (
                <a key={href as string} href={href as string} className={cn(linkClass, pathname === href && activeLinkClass)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label as string}
                </a>
              ))}
            </nav>
          </aside>
          <main>{children ?? <NotFoundPage />}</main>
        </div>
      </div>
    );
  }

  function SellerRegisterPage() {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Section title="Đăng ký trở thành người bán" description="Một user chỉ có một shop. Submit tạo hồ sơ PENDING để admin duyệt.">
          <Panel>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên shop"><Input placeholder="Shepoo Store" /></Field>
              <Field label="Slug"><Input placeholder="shepoo-store" /></Field>
              <Field label="Logo"><Input type="file" /></Field>
              <Field label="Email shop"><Input placeholder="shop@demo.vn" /></Field>
              <Field label="Phone shop"><Input placeholder="090..." /></Field>
              <Field label="Phí ship cố định"><Input type="number" placeholder="30000" /></Field>
              <Field label="Đơn vị vận chuyển"><Input placeholder="Tự giao / GHN mock" /></Field>
              <Field label="Địa chỉ kho"><Input placeholder="Địa chỉ lấy hàng" /></Field>
              <div className="md:col-span-2"><Field label="Mô tả shop"><Textarea /></Field></div>
            </div>
            <Button className="mt-4" onClick={() => { showToast("Đã gửi hồ sơ shop, chuyển sang pending.", "success"); window.location.href = "/seller/pending"; }}>Gửi yêu cầu</Button>
          </Panel>
        </Section>
      </main>
    );
  }

  function SellerStatusPage({ status }: { status: SellerStatus }) {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === status);
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Panel>
          <StatusBadge status={status} label={sellerStatusLabel[status]} />
          <h1 className="mt-3 text-3xl font-black text-ink">Trạng thái shop: {sellerStatusLabel[status]}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {status === "PENDING" && "Hồ sơ đang chờ admin duyệt. Sau khi duyệt, user được cấp role SELLER."}
            {status === "REJECTED" && `Hồ sơ bị từ chối. Lý do: ${shop?.rejectedReason ?? "Chưa rõ"}.`}
            {status === "SUSPENDED" && "Shop bị tạm ngưng, không được truy cập dashboard bán hàng."}
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => (window.location.href = "/")}>Về marketplace</Button>
        </Panel>
      </main>
    );
  }

  function SellerDashboard() {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED");
    const sellerOrders = store.state.orders.filter((order) => order.sellerId === shop?.id);
    const revenue = sellerOrders.filter((order) => order.orderStatus === "COMPLETED").reduce((sum, order) => sum + order.totalAmount, 0);
    const waiting = sellerOrders.filter((order) => !order.sellerConfirmed && order.orderStatus === "PLACED").length;
    return (
      <Section title="Seller dashboard" description="Doanh thu chỉ tính order COMPLETED; không có low stock alert và không có best sellers theo rule hiện tại.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Doanh thu hoàn thành" value={formatVnd(revenue)} />
          <MetricCard label="Tổng đã bán" value={`${shop?.totalSold ?? 0}`} />
          <MetricCard label="Đơn cần xác nhận" value={`${waiting}`} detail="Deadline xác nhận 2 ngày" />
          <MetricCard label="Sản phẩm" value={`${store.state.products.filter((product) => product.sellerId === shop?.id).length}`} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel>
            <h3 className="font-bold">Shortcut</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => (window.location.href = "/seller/products/new")}>Tạo sản phẩm</Button>
              <Button variant="secondary" onClick={() => (window.location.href = "/seller/orders")}>Xem đơn hàng</Button>
            </div>
          </Panel>
          <Panel>
            <h3 className="font-bold">Nhắc hạn xác nhận</h3>
            <p className="mt-2 text-sm text-muted">Các đơn PLACED cần seller xác nhận trước `seller_confirm_expires_at`.</p>
          </Panel>
        </div>
      </Section>
    );
  }

  function SellerProfilePage() {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED");
    if (!shop) return <SellerRegisterPage />;
    return (
      <Section title="Hồ sơ shop">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên shop"><Input defaultValue={shop.shopName} /></Field>
            <Field label="Slug"><Input defaultValue={shop.shopSlug} /></Field>
            <Field label="Email"><Input defaultValue={shop.email} /></Field>
            <Field label="Phone"><Input defaultValue={shop.phone} /></Field>
            <Field label="Phí ship"><Input type="number" defaultValue={shop.shippingFee} /></Field>
            <Field label="Đơn vị vận chuyển"><Input defaultValue={shop.shippingProviderName} /></Field>
            <div className="md:col-span-2"><Field label="Địa chỉ kho"><Input defaultValue={shop.pickupAddress} /></Field></div>
            <div className="md:col-span-2"><Field label="Mô tả"><Textarea defaultValue={shop.description} /></Field></div>
          </div>
          <Button className="mt-4" onClick={() => showToast("Đã lưu hồ sơ shop mock.", "success")}>Lưu</Button>
        </Panel>
      </Section>
    );
  }

  function SellerProductsPage() {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED");
    const products = store.state.products.filter((product) => product.sellerId === shop?.id);
    return (
      <Section title="Quản lý sản phẩm" action={<Button onClick={() => (window.location.href = "/seller/products/new")}><Plus className="h-4 w-4" />Tạo sản phẩm</Button>}>
        <DataTable
          columns={["Sản phẩm", "Categories", "Variants", "Kho", "Đã bán", "Rating", "Status", "Action"]}
          rows={products.map((product) => {
            const productVariants = store.state.variants.filter((variant) => variant.productId === product.id);
            const stock = productVariants.reduce((sum, variant) => sum + variant.inventory.quantity, 0);
            return [
              <span key="name" className="font-bold">{product.name}</span>,
              getCategoryNames(store.state.categories, product) || "Bỏ trống",
              `${productVariants.length}`,
              `${stock}`,
              `${product.soldCount}`,
              product.averageRating.toFixed(1),
              <StatusBadge key="st" status={product.status} label={productStatusLabel[product.status]} />,
              <a key="edit" className="font-bold text-primary" href={`/seller/products/${product.id}/edit`}>Edit</a>
            ];
          })}
        />
      </Section>
    );
  }

  function ProductFormPage({ productId }: { productId?: string }) {
    const editing = store.state.products.find((product) => product.id === productId);
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED")!;
    const [name, setName] = useState(editing?.name ?? "");
    const [status, setStatus] = useState<Product["status"]>(editing?.status ?? "ACTIVE");
    const [categoryIds, setCategoryIds] = useState<string[]>(editing?.categoryIds ?? []);
    const [variantName, setVariantName] = useState("Default");
    const [price, setPrice] = useState("199000");
    const [quantity, setQuantity] = useState("20");
    const slug = slugify(name || "san-pham-moi");
    return (
      <Section title={editing ? "Sửa sản phẩm" : "Tạo sản phẩm"} description="Seller tạo sản phẩm public luôn sau khi shop approved; admin không duyệt từng sản phẩm.">
        <Panel>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-4">
              <Field label="Tên sản phẩm"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
              <InfoRow label="Slug preview" value={slug} />
              <Field label="Mô tả ngắn"><Textarea defaultValue={editing?.shortDescription} /></Field>
              <Field label="Mô tả dài"><Textarea defaultValue={editing?.description} /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Brand"><Input defaultValue={editing?.brand} /></Field>
                <Field label="Xuất xứ"><Input defaultValue={editing?.origin ?? "Việt Nam"} /></Field>
                <Field label="Bảo hành"><Input defaultValue={editing?.warranty} /></Field>
              </div>
              <Field label="Ảnh sản phẩm"><Input type="file" multiple /></Field>
              <Field label="Thumbnail"><Input type="file" /></Field>
              <Field label="Categories một cấp">
                <div className="grid gap-2 sm:grid-cols-2">
                  {store.state.categories.map((category) => (
                    <Checkbox
                      key={category.id}
                      label={category.name}
                      checked={categoryIds.includes(category.id)}
                      onChange={(event) => {
                        setCategoryIds((prev) => event.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id));
                      }}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <div className="grid gap-4">
              <Panel className="shadow-none">
                <h3 className="font-bold">Variant editor</h3>
                <div className="mt-3 grid gap-3">
                  <Field label="Variant name"><Input value={variantName} onChange={(event) => setVariantName(event.target.value)} /></Field>
                  <Field label="SKU"><Input placeholder="SKU tự nhập, không unique toàn sàn" /></Field>
                  <Field label="Giá"><Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
                  <Field label="Sale price"><Input type="number" placeholder="Có thể bỏ trống" /></Field>
                  <Field label="Sale window"><Input type="datetime-local" /></Field>
                  <Field label="Ảnh variant"><Input type="file" /></Field>
                  <Field label="Tồn kho"><Input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
                  <InfoRow label="Reserved quantity" value="Chỉ đọc từ inventory.reserved_quantity" />
                </div>
              </Panel>
              <Field label="Status">
                <Select value={status} onChange={(event) => setStatus(event.target.value as Product["status"])}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="HIDDEN">HIDDEN</option>
                  <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                  <option value="DELETED">DELETED</option>
                </Select>
              </Field>
              <Button
                onClick={() => {
                  const product: Product = {
                    id: editing?.id ?? `p-new-${store.state.products.length + 1}`,
                    sellerId: shop.id,
                    name: name || "Sản phẩm mới",
                    slug,
                    shortDescription: "Sản phẩm tạo từ form seller.",
                    description: "Mô tả dài của sản phẩm. Có thể nối API upload ảnh và variant sau.",
                    origin: "Việt Nam",
                    status,
                    averageRating: editing?.averageRating ?? 0,
                    reviewCount: editing?.reviewCount ?? 0,
                    soldCount: editing?.soldCount ?? 0,
                    viewCount: editing?.viewCount ?? 0,
                    categoryIds,
                    imageUrls: editing?.imageUrls ?? ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"],
                    thumbnailUrl: editing?.thumbnailUrl ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
                    createdAt: editing?.createdAt ?? "2026-06-29T09:00:00.000Z"
                  };
                  const variant: ProductVariant = {
                    id: `${product.id}-v-1`,
                    productId: product.id,
                    sku: `${shop.shopSlug}-${slug}-1`,
                    variantName: variantName || "Default",
                    price: Number(price) || 0,
                    imageUrl: product.thumbnailUrl,
                    status,
                    inventory: { quantity: Number(quantity) || 0, reservedQuantity: 0 }
                  };
                  store.saveProduct(product, [variant]);
                  showToast("Đã lưu sản phẩm và variant mock.", "success");
                  window.location.href = "/seller/products";
                }}
              >
                Lưu sản phẩm
              </Button>
            </div>
          </div>
        </Panel>
      </Section>
    );
  }

  function SellerInventoryPage() {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED");
    const products = store.state.products.filter((product) => product.sellerId === shop?.id);
    const productIds = new Set(products.map((product) => product.id));
    const variants = store.state.variants.filter((variant) => productIds.has(variant.productId));
    return (
      <Section title="Tồn kho theo variant" description="Không có low stock threshold; reserved quantity chỉ đọc.">
        <DataTable
          columns={["Variant", "SKU", "Sản phẩm", "Quantity", "Reserved", "Status", "Điều chỉnh"]}
          rows={variants.map((variant) => {
            const product = store.state.products.find((item) => item.id === variant.productId);
            return [
              variant.variantName,
              variant.sku,
              product?.name ?? "-",
              `${variant.inventory.quantity}`,
              `${variant.inventory.reservedQuantity}`,
              <StatusBadge key="st" status={variant.status} label={variant.status} />,
              <div key="adjust" className="flex items-center gap-2"><Input className="w-24" type="number" defaultValue={variant.inventory.quantity} /><Button variant="secondary" onClick={() => showToast("Đã điều chỉnh tồn kho mock.", "success")}>Lưu</Button></div>
            ];
          })}
        />
      </Section>
    );
  }

  function SellerRevenuePage() {
    const shop = store.currentShop ?? store.state.shops.find((item) => item.status === "APPROVED");
    const completed = store.state.orders.filter((order) => order.sellerId === shop?.id && order.orderStatus === "COMPLETED");
    const revenue = completed.reduce((sum, order) => sum + order.totalAmount, 0);
    return (
      <Section title="Doanh thu" description="Doanh thu chỉ tính đơn COMPLETED, cancelled không tính; không cần export Excel/PDF.">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Panel>
            <Field label="Khoảng thời gian">
              <Select><option>Ngày</option><option>Tháng</option><option>Năm</option></Select>
            </Field>
            <Field label="Từ ngày"><Input type="date" /></Field>
            <Field label="Đến ngày"><Input type="date" /></Field>
          </Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Revenue" value={formatVnd(revenue)} />
            <MetricCard label="Completed orders" value={`${completed.length}`} />
            <MetricCard label="Cancelled ignored" value={`${store.state.orders.filter((order) => order.sellerId === shop?.id && order.orderStatus === "CANCELLED").length}`} />
          </div>
        </div>
      </Section>
    );
  }

  function CategorySuggestionsPage() {
    return (
      <Section title="Đề xuất category">
        <Panel>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Tên category đề xuất"><Input /></Field>
            <Field label="Lý do"><Input /></Field>
            <div className="flex items-end"><Button onClick={() => showToast("Đã gửi đề xuất category.", "success")}>Gửi</Button></div>
          </div>
        </Panel>
      </Section>
    );
  }

  function renderAdminRoutes() {
    return (
      <DashboardFrame kind="admin">
        {segments.length === 1 ? <AdminDashboard /> : null}
        {segments[1] === "users" && segments[2] ? <AdminUserDetail userId={segments[2]} /> : null}
        {segments[1] === "users" && !segments[2] ? <AdminUsersPage /> : null}
        {segments[1] === "sellers" && segments[2] ? <AdminSellerDetail sellerId={segments[2]} /> : null}
        {segments[1] === "sellers" && !segments[2] ? <AdminSellersPage /> : null}
        {segments[1] === "categories" ? <AdminCategoriesPage /> : null}
        {segments[1] === "products" && segments[2] ? <AdminProductDetail productId={segments[2]} /> : null}
        {segments[1] === "products" && !segments[2] ? <AdminProductsPage /> : null}
        {segments[1] === "statistics" ? <AdminStatisticsPage /> : null}
        {segments[1] === "violation-reports" ? <ViolationReportsPage /> : null}
        {segments[1] === "supporters" ? <SupportersAdminPage /> : null}
        {segments[1] === "chats" ? <AdminChatsPage /> : null}
        {segments[1] === "system-reports" ? <SystemReportsPage /> : null}
        {segments[1] === "ai" && segments[2] === "knowledge" ? <AiKnowledgePage /> : null}
      </DashboardFrame>
    );
  }

  function AdminDashboard() {
    const completed = store.state.orders.filter((order) => order.orderStatus === "COMPLETED");
    return (
      <Section title="Admin dashboard">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Revenue toàn sàn" value={formatVnd(completed.reduce((sum, order) => sum + order.totalAmount, 0))} />
          <MetricCard label="New users" value={`${store.state.users.length}`} />
          <MetricCard label="New sellers" value={`${store.state.shops.length}`} />
          <MetricCard label="Pending sellers" value={`${store.state.shops.filter((shop) => shop.status === "PENDING").length}`} />
        </div>
      </Section>
    );
  }

  function AdminUsersPage() {
    return (
      <Section title="Quản lý users">
        <DataTable
          columns={["User", "Email", "Roles", "Status", "Action"]}
          rows={store.state.users.map((user) => [
            <a key="name" href={`/admin/users/${user.id}`} className="font-bold text-primary">{user.fullName}</a>,
            user.email,
            user.roles.join(", "),
            <StatusBadge key="st" status={user.status} label={user.status} />,
            <Button key="lock" variant={user.status === "LOCKED" ? "secondary" : "danger"} onClick={() => store.toggleUserLock(user.id)}>{user.status === "LOCKED" ? "Unlock" : "Lock"}</Button>
          ])}
        />
      </Section>
    );
  }

  function AdminUserDetail({ userId }: { userId?: string }) {
    const user = store.state.users.find((item) => item.id === userId);
    if (!user) return <NotFoundPage />;
    return (
      <Section title={`User ${user.fullName}`}>
        <Panel>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Roles" value={user.roles.join(", ")} />
            <InfoRow label="Status" value={user.status} />
            <InfoRow label="Lock reason" value={user.lockReason ?? "Không có"} />
          </div>
          <Button className="mt-4" variant={user.status === "LOCKED" ? "secondary" : "danger"} onClick={() => store.toggleUserLock(user.id)}>{user.status === "LOCKED" ? "Unlock user" : "Lock user"}</Button>
        </Panel>
      </Section>
    );
  }

  function AdminSellersPage() {
    const [status, setStatus] = useState("");
    const sellers = store.state.shops.filter((shop) => !status || shop.status === status);
    return (
      <Section title="Duyệt seller" action={<Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-44"><option value="">Tất cả</option>{Object.entries(sellerStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>}>
        <DataTable
          columns={["Shop", "Owner", "Status", "Sold", "Revenue", "Action"]}
          rows={sellers.map((shop) => [
            <a key="shop" className="font-bold text-primary" href={`/admin/sellers/${shop.id}`}>{shop.shopName}</a>,
            store.state.users.find((user) => user.id === shop.userId)?.fullName ?? "-",
            <StatusBadge key="st" status={shop.status} label={sellerStatusLabel[shop.status]} />,
            `${shop.totalSold}`,
            formatVnd(shop.totalRevenue),
            <div key="act" className="flex gap-2"><Button variant="secondary" onClick={() => store.updateSellerStatus(shop.id, "APPROVED")}>Approve</Button><Button variant="danger" onClick={() => store.updateSellerStatus(shop.id, "REJECTED", "Hồ sơ thiếu thông tin.")}>Reject</Button></div>
          ])}
        />
      </Section>
    );
  }

  function AdminSellerDetail({ sellerId }: { sellerId?: string }) {
    const shop = store.state.shops.find((item) => item.id === sellerId);
    if (!shop) return <NotFoundPage />;
    return (
      <Section title={`Seller ${shop.shopName}`} description="Admin không sửa hồ sơ shop, chỉ duyệt/từ chối/suspend/close.">
        <Panel>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow label="Status" value={sellerStatusLabel[shop.status]} />
            <InfoRow label="Owner" value={store.state.users.find((user) => user.id === shop.userId)?.fullName ?? "-"} />
            <InfoRow label="Sold" value={`${shop.totalSold}`} />
            <InfoRow label="Revenue" value={formatVnd(shop.totalRevenue)} />
            <InfoRow label="Pickup" value={shop.pickupAddress} />
            <InfoRow label="Rejected reason" value={shop.rejectedReason ?? "Không có"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => store.updateSellerStatus(shop.id, "APPROVED")}>Approve</Button>
            <Button variant="danger" onClick={() => store.updateSellerStatus(shop.id, "REJECTED", "Hồ sơ không hợp lệ.")}>Reject</Button>
            <Button variant="secondary" onClick={() => store.updateSellerStatus(shop.id, "SUSPENDED")}>Suspend</Button>
            <Button variant="ghost" onClick={() => store.updateSellerStatus(shop.id, "CLOSED")}>Close</Button>
          </div>
        </Panel>
      </Section>
    );
  }

  function AdminCategoriesPage() {
    return (
      <Section title="Quản lý categories một cấp">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <DataTable
            columns={["Name", "Slug", "Sort", "Default other"]}
            rows={store.state.categories.map((category) => [category.name, category.slug, `${category.sortOrder}`, category.isDefaultOther ? "Yes" : "No"])}
          />
          <Panel>
            <h3 className="font-bold">Category form</h3>
            <div className="mt-3 grid gap-3">
              <Input placeholder="Tên category" />
              <Input placeholder="Slug" />
              <Input type="number" placeholder="Sort order" />
              <Checkbox label="is_default_other" />
              <Button onClick={() => showToast("Đã lưu category mock.", "success")}>Lưu</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function AdminProductsPage() {
    return (
      <Section title="Readonly products toàn sàn" description="Admin không sửa trực tiếp sản phẩm seller; action hide/delete chỉ dùng khi xử lý report.">
        <DataTable
          columns={["Product", "Shop", "Category", "Status", "Sold", "Action"]}
          rows={store.state.products.map((product) => [
            <a key="p" className="font-bold text-primary" href={`/admin/products/${product.id}`}>{product.name}</a>,
            shopById(product.sellerId)?.shopName ?? "-",
            getCategoryNames(store.state.categories, product) || "-",
            <StatusBadge key="st" status={product.status} label={productStatusLabel[product.status]} />,
            `${product.soldCount}`,
            <span key="act" className="text-muted">Readonly</span>
          ])}
        />
      </Section>
    );
  }

  function AdminProductDetail({ productId }: { productId?: string }) {
    const product = store.state.products.find((item) => item.id === productId);
    if (!product) return <NotFoundPage />;
    return (
      <Section title={product.name} description="Chi tiết readonly, có panel xử lý report.">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Panel>
            <img src={product.thumbnailUrl} alt={product.name} className="aspect-[16/9] w-full rounded-panel object-cover" />
            <p className="mt-3 text-sm leading-6 text-muted">{product.description}</p>
          </Panel>
          <Panel>
            <h3 className="font-bold">Moderation action</h3>
            <div className="mt-3 grid gap-2">
              <Button variant="secondary" onClick={() => showToast("Đã ẩn sản phẩm mock.", "success")}>Hide product</Button>
              <Button variant="danger" onClick={() => showToast("Đã xóa mềm sản phẩm mock.", "danger")}>Delete product</Button>
              <Button variant="secondary" onClick={() => showToast("Đã khóa user seller mock.", "success")}>Lock seller user</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function AdminStatisticsPage() {
    return (
      <Section title="Statistics">
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard label="Revenue toàn sàn" value={formatVnd(store.state.orders.filter((order) => order.orderStatus === "COMPLETED").reduce((sum, order) => sum + order.totalAmount, 0))} />
          <MetricCard label="New users" value={`${store.state.users.length}`} />
          <MetricCard label="New sellers" value={`${store.state.shops.length}`} />
        </div>
      </Section>
    );
  }

  function ViolationReportsPage() {
    const reports = [
      ["VR-001", "Tai nghe bluetooth chống ồn", "Hàng giả", "PENDING"],
      ["VR-002", "Pin dự phòng 10000mAh", "Mô tả sai", "REVIEWING"],
      ["VR-003", "Máy khuếch tán tinh dầu", "Nội dung không phù hợp", "RESOLVED"]
    ];
    return (
      <Section title="Violation reports" description="User chỉ report product; admin xử lý hide/delete product, lock user hoặc reject report.">
        <DataTable
          columns={["Report", "Product", "Reason", "Status", "Actions"]}
          rows={reports.map((report) => [
            report[0],
            report[1],
            report[2],
            <StatusBadge key="st" status={report[3]} label={report[3]} />,
            <div key="actions" className="flex gap-2"><Button variant="secondary" onClick={() => showToast("Đã xử lý report mock.", "success")}>Resolve</Button><Button variant="ghost" onClick={() => showToast("Đã reject report mock.", "info")}>Reject</Button></div>
          ])}
        />
      </Section>
    );
  }

  function SupportersAdminPage() {
    const supporters = store.state.users.filter((user) => user.roles.includes("SUPPORTER"));
    return (
      <Section title="Supporter accounts">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <DataTable columns={["Name", "Email", "Status"]} rows={supporters.map((user) => [user.fullName, user.email, user.status])} />
          <Panel>
            <h3 className="font-bold">Tạo supporter</h3>
            <div className="mt-3 grid gap-3">
              <Input placeholder="Họ tên" />
              <Input placeholder="Email" />
              <Input placeholder="Phone" />
              <Button onClick={() => showToast("Đã tạo supporter mock.", "success")}>Tạo</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function AdminChatsPage() {
    return (
      <Section title="Admin xem chat" description="Admin chỉ xem nội dung chat, không can thiệp.">
        <DataTable
          columns={["Conversation", "Customer", "Supporter", "Status", "Mode"]}
          rows={store.state.conversations.map((conv) => [conv.title, conv.customerName, conv.assignedSupporter, conv.status, conv.mode])}
        />
      </Section>
    );
  }

  function SystemReportsPage() {
    return (
      <Section title="System reports">
        <DataTable
          columns={["Code", "Severity", "Module", "Status"]}
          rows={[
            ["SYS-001", "LOW", "payment mock", "OPEN"],
            ["SYS-002", "MEDIUM", "image upload", "WATCHING"]
          ]}
        />
      </Section>
    );
  }

  function AiKnowledgePage() {
    return (
      <Section title="AI knowledge/RAG" description="Module đầy đủ frontend để quản lý documents/chunks sau này, nguồn nghiệp vụ RAG còn chờ backend chốt.">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <DataTable
            columns={["Document", "Type", "Status", "Chunks", "Updated"]}
            rows={[
              ["Chính sách thanh toán online", "POLICY", "ACTIVE", "12", "29/06/2026"],
              ["FAQ mua hàng nhiều shop", "FAQ", "ACTIVE", "8", "29/06/2026"],
              ["Hướng dẫn bảo hành", "POLICY", "PROCESSING", "0", "29/06/2026"]
            ]}
          />
          <Panel>
            <h3 className="font-bold">Upload knowledge</h3>
            <div className="mt-3 grid gap-3">
              <Input placeholder="Tên tài liệu" />
              <Select><option>POLICY</option><option>FAQ</option><option>PRODUCT_GUIDE</option></Select>
              <Input type="file" />
              <Button onClick={() => showToast("Đã upload knowledge mock.", "success")}>Upload</Button>
            </div>
          </Panel>
        </div>
      </Section>
    );
  }

  function renderSupporterRoutes() {
    return (
      <DashboardFrame kind="supporter">
        {segments.length === 1 ? <SupporterDashboard /> : null}
        {segments[1] === "conversations" && segments[2] ? <ChatWindow conversationId={segments[2]} /> : null}
        {segments[1] === "conversations" && !segments[2] ? <SupporterConversations /> : null}
      </DashboardFrame>
    );
  }

  function SupporterDashboard() {
    return (
      <Section title="Supporter dashboard">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Assigned conversations" value={`${store.state.conversations.length}`} />
          <MetricCard label="Open" value={`${store.state.conversations.filter((conv) => conv.status === "OPEN").length}`} />
          <MetricCard label="Unread" value={`${store.state.conversations.flatMap((conv) => conv.messages).filter((msg) => !msg.isRead).length}`} />
        </div>
      </Section>
    );
  }

  function SupporterConversations() {
    return (
      <Section title="Conversations được phân">
        <DataTable
          columns={["Title", "Customer", "Mode", "Last message", "Action"]}
          rows={store.state.conversations.map((conv) => [
            conv.title,
            conv.customerName,
            conv.mode,
            formatDate(conv.lastMessageAt),
            <a key="open" className="font-bold text-primary" href={`/supporter/conversations/${conv.id}`}>Mở</a>
          ])}
        />
      </Section>
    );
  }

  function Unauthorized({ title, description }: { title: string; description: string }) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <ErrorState title={title} description={description} action={<Button onClick={() => (window.location.href = "/login")}>Đăng nhập</Button>} />
      </main>
    );
  }

  function NotFoundPage() {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState title="Không tìm thấy route" description="Route này chưa có dữ liệu mock hoặc đường dẫn không đúng." action={<Button onClick={() => (window.location.href = "/")}>Về trang chủ</Button>} />
      </main>
    );
  }

  function shopById(id?: string) {
    return store.state.shops.find((shop) => shop.id === id);
  }

  function categoryBySlug(slug?: string) {
    return store.state.categories.find((category) => category.slug === slug);
  }
}
