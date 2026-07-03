"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { initialState } from "@/data/mock";
import {
  canCustomerCancel,
  canSellerCancel,
  createOrderFromGroup,
  createPaymentFromOrders,
  getCartRows,
  makeOrderCode,
  makePaymentCode,
  selectedCheckoutGroups
} from "@/lib/helpers";
import { AUTH_BASE_PATH, ApiError, apiFetch } from "@/lib/api";
import type { Address, AppState, OrderStatus, PaymentMethod, PaymentStatus, Product, Role, SellerStatus, User } from "@/types/models";

const STORAGE_KEY = "shepoo-marketplace-state-v2";
const VERIFICATION_CONTEXT_KEY = "shepoo-verification-context-v2";
const LEGACY_STORAGE_KEYS = ["shepoo-marketplace-state-v1", "shepoo-verification-context-v1"];
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80";
const AUTH_ROUTES = {
  me: `${AUTH_BASE_PATH}/me`,
  login: `${AUTH_BASE_PATH}/login`,
  register: `${AUTH_BASE_PATH}/register`,
  verifyEmail: `${AUTH_BASE_PATH}/verify-email`,
  resendEmail: `${AUTH_BASE_PATH}/verify-email/send`,
  verifyPhone: `${AUTH_BASE_PATH}/verify-phone`,
  resendPhone: `${AUTH_BASE_PATH}/verify-phone/send`,
  logout: `${AUTH_BASE_PATH}/logout`
};

type BackendUser = {
  publicId?: string;
  public_id?: string;
  fullName?: string;
  full_name?: string;
  fullname?: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  gender?: User["gender"] | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  emailVerifiedAt?: string | null;
  email_verified_at?: string | null;
  phoneVerifiedAt?: string | null;
  phone_verified_at?: string | null;
  status?: User["status"];
  lockedUntil?: string | null;
  locked_until?: string | null;
  lockReason?: string | null;
  lock_reason?: string | null;
  roles?: Role[];
};

type BackendRegisterResponse = {
  fullname: string;
  username: string;
  email: string;
  phone: string;
};

type RegistrationStatusResponse = {
  message: string;
  registrationId?: string | null;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  completed: boolean;
};

type MessageResponse = {
  message: string;
};

type BackendStatusResponse = {
  completed: boolean;
  message?: string;
};

type VerificationContext = {
  registrationId?: string | null;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const cloneState = (): AppState => JSON.parse(JSON.stringify(initialState)) as AppState;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0(3|5|7|8|9)\d{8}$/;

const normalizeAuthEmail = (email: string) => email.trim().toLowerCase();

const normalizeAuthPhone = (phone: string) => {
  const compact = phone.trim().replace(/[\s.\-()]/g, "");
  if (compact.startsWith("+84")) return `0${compact.slice(3)}`;
  if (compact.startsWith("84") && compact.length === 11) return `0${compact.slice(2)}`;
  return compact;
};

const authIdentifier = (identifier: string) => {
  const value = identifier.trim();
  if (value.includes("@")) return normalizeAuthEmail(value);
  const phone = normalizeAuthPhone(value);
  return PHONE_RE.test(phone) ? phone : value;
};

const validateRegistrationPayload = (
  payload: Pick<User, "fullName" | "email" | "phone"> & { password: string; confirmPassword: string }
) => {
  const fullName = payload.fullName.trim();
  const email = normalizeAuthEmail(payload.email);
  const phone = normalizeAuthPhone(payload.phone);
  const password = payload.password.trim();
  const confirmPassword = payload.confirmPassword.trim();

  if (fullName.length < 2) return { ok: false as const, message: "Ho ten phai co it nhat 2 ky tu." };
  if (!EMAIL_RE.test(email)) return { ok: false as const, message: "Email khong hop le." };
  if (!PHONE_RE.test(phone)) return { ok: false as const, message: "So dien thoai khong hop le." };
  if (password.length < 8) return { ok: false as const, message: "Mat khau phai co it nhat 8 ky tu." };
  if (password !== confirmPassword) return { ok: false as const, message: "Mat khau xac nhan khong khop." };
  return { ok: true as const, fullName, email, phone, password, confirmPassword };
};

const usernameFromRegistration = (email: string, phone: string) => {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const cleaned = localPart.replace(/[^a-z0-9_]/g, "").slice(0, 32);
  if (cleaned.length >= 2) return cleaned;
  return `user${phone.slice(-6)}`.slice(0, 40);
};

const backendRegisterToStatus = (result: BackendRegisterResponse): RegistrationStatusResponse => ({
  message: "Dang ky thanh cong. Vui long xac thuc email neu backend da gui ma.",
  registrationId: result.username,
  email: result.email,
  phone: result.phone,
  emailVerified: false,
  phoneVerified: false,
  completed: false
});

const statusToVerificationContext = (status: RegistrationStatusResponse): VerificationContext => ({
  registrationId: status.registrationId,
  email: status.email,
  phone: status.phone,
  emailVerified: status.emailVerified,
  phoneVerified: status.phoneVerified
});

const readVerificationContext = () => {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(VERIFICATION_CONTEXT_KEY);
  return raw ? (JSON.parse(raw) as VerificationContext) : undefined;
};

const persistVerificationContext = (context: VerificationContext | undefined) => {
  if (typeof window === "undefined") return;
  if (context) {
    window.localStorage.setItem(VERIFICATION_CONTEXT_KEY, JSON.stringify(context));
  } else {
    window.localStorage.removeItem(VERIFICATION_CONTEXT_KEY);
  }
};

const roleHomePath = (role: Role | "GUEST") => {
  if (role === "ADMIN") return "/admin";
  if (role === "SUPPORTER") return "/supporter";
  if (role === "SELLER") return "/seller";
  return "/";
};

const mergeById = <T extends { id: string }>(seed: T[], saved?: T[]) => {
  const savedMap = new Map((saved ?? []).map((item) => [item.id, item]));
  const merged = seed.map((item) => savedMap.get(item.id) ?? item);
  const extraSaved = (saved ?? []).filter((item) => !seed.some((seedItem) => seedItem.id === item.id));
  return [...merged, ...extraSaved];
};

const hydrateSavedState = (saved: AppState): AppState => {
  const seed = cloneState();
  return {
    ...seed,
    ...saved,
    users: mergeById(seed.users, saved.users),
    shops: mergeById(seed.shops, saved.shops),
    categories: mergeById(seed.categories, saved.categories),
    products: mergeById(seed.products, saved.products),
    variants: mergeById(seed.variants, saved.variants),
    addresses: mergeById(seed.addresses, saved.addresses),
    orders: mergeById(seed.orders, saved.orders),
    payments: mergeById(seed.payments, saved.payments),
    notifications: mergeById(seed.notifications, saved.notifications),
    conversations: mergeById(seed.conversations, saved.conversations),
    cartItems: saved.cartItems ?? seed.cartItems,
    activeRole: saved.activeRole ?? seed.activeRole
  };
};

const preferredRoleFor = (user: User) =>
  user.roles.includes("ADMIN")
    ? "ADMIN"
    : user.roles.includes("SUPPORTER")
      ? "SUPPORTER"
      : user.roles.includes("SELLER")
        ? "SELLER"
        : "CUSTOMER";

const normalizeBackendUser = (user: BackendUser): User => ({
  id: user.publicId ?? user.public_id ?? user.email,
  fullName: user.fullName ?? user.full_name ?? user.fullname ?? user.email,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl ?? user.avatar_url ?? DEFAULT_AVATAR,
  gender: user.gender ?? undefined,
  birthday: user.dateOfBirth ?? user.date_of_birth ?? undefined,
  emailVerified: Boolean(user.emailVerifiedAt ?? user.email_verified_at),
  phoneVerified: Boolean(user.phoneVerifiedAt ?? user.phone_verified_at),
  status: user.status ?? "ACTIVE",
  lockedUntil: user.lockedUntil ?? user.locked_until ?? undefined,
  lockReason: user.lockReason ?? user.lock_reason ?? undefined,
  roles: user.roles ?? ["CUSTOMER"]
});

const applyBackendUser = (prev: AppState, backendUser: BackendUser): AppState => {
  const user = normalizeBackendUser(backendUser);
  const users = prev.users.some((entry) => entry.id === user.id)
    ? prev.users.map((entry) => (entry.id === user.id ? { ...entry, ...user } : entry))
    : [...prev.users, user];

  return {
    ...prev,
    users,
    sessionUserId: user.id,
    activeRole: preferredRoleFor(user)
  };
};

export const useMarketplaceStore = () => {
  const [state, setState] = useState<AppState>(() => cloneState());
  const [verificationContext, setVerificationContext] = useState<VerificationContext | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setState(hydrateSavedState(JSON.parse(saved) as AppState));
    }
    setVerificationContext(readVerificationContext());
    setReady(true);

    apiFetch<BackendUser>(AUTH_ROUTES.me)
      .then((user) => {
        if (!cancelled) {
          setState((prev) => applyBackendUser(prev, user));
        }
      })
      .catch((error) => {
        if (!cancelled && error instanceof ApiError && ["NOT_AUTHENTICATED", "USER_NOT_VERIFIED"].includes(error.code ?? "")) {
          setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [ready, state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId),
    [state.sessionUserId, state.users]
  );

  const currentShop = useMemo(() => {
    if (!currentUser) return undefined;
    return state.shops.find((shop) => shop.userId === currentUser.id);
  }, [currentUser, state.shops]);

  const cartRows = useMemo(
    () => getCartRows(state.cartItems, state.products, state.variants, state.shops),
    [state.cartItems, state.products, state.shops, state.variants]
  );

  const login = useCallback(async (identifier: string, password: string) => {
    const normalizedIdentifier = authIdentifier(identifier);
    try {
      const loginResult = await apiFetch<MessageResponse | BackendStatusResponse>(AUTH_ROUTES.login, {
        method: "POST",
        body: JSON.stringify({
          identifier: normalizedIdentifier,
          password
        })
      });
      const backendUser = await apiFetch<BackendUser>(AUTH_ROUTES.me);
      const user = normalizeBackendUser(backendUser);
      setState((prev) => applyBackendUser(prev, backendUser));
      const preferredRole = preferredRoleFor(user);
      const message =
        "message" in loginResult && loginResult.message
          ? loginResult.message
          : `Da dang nhap bang ${user.fullName}.`;
      return {
        ok: true,
        message,
        redirectTo: roleHomePath(preferredRole)
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
    }

    const hydrated = hydrateSavedState(state);
    const user = hydrated.users.find(
      (entry) =>
        normalizeAuthEmail(entry.email) === normalizedIdentifier ||
        normalizeAuthPhone(entry.phone) === normalizedIdentifier
    );

    if (!user) {
      return { ok: false, message: "Khong tim thay tai khoan." };
    }

    if (user.status === "LOCKED") {
      return {
        ok: false,
        message: `Tài khoản bị khóa. Lý do: ${user.lockReason ?? "Không rõ"}.`
      };
    }

    if (!user.emailVerified || !user.phoneVerified) {
      return { ok: false, message: "Tai khoan chua xac thuc email va so dien thoai." };
    }

    const preferredRole = user.roles.includes("ADMIN")
      ? "ADMIN"
      : user.roles.includes("SUPPORTER")
        ? "SUPPORTER"
        : user.roles.includes("SELLER")
          ? "SELLER"
          : "CUSTOMER";

    setState({ ...hydrated, sessionUserId: user.id, activeRole: preferredRole });
    return { ok: true, message: `Đã đăng nhập bằng ${user.fullName}.`, redirectTo: roleHomePath(preferredRole) };
  }, [state]);

  const register = useCallback(async (
    payload: Pick<User, "fullName" | "email" | "phone"> & { password: string; confirmPassword: string }
  ) => {
    const validation = validateRegistrationPayload(payload);
    if (!validation.ok) {
      return { ok: false, message: validation.message };
    }

    try {
      const result = await apiFetch<BackendRegisterResponse>(AUTH_ROUTES.register, {
        method: "POST",
        body: JSON.stringify({
          fullname: validation.fullName,
          username: usernameFromRegistration(validation.email, validation.phone),
          email: validation.email,
          phone: validation.phone,
          password: validation.password,
          confirm_password: validation.confirmPassword
        })
      });
      const registrationStatus = backendRegisterToStatus(result);
      const context = statusToVerificationContext(registrationStatus);
      persistVerificationContext(context);
      setVerificationContext(context);
      setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));

      let message = registrationStatus.message;
      try {
        const query = new URLSearchParams({ phone: validation.phone });
        const otpResult = await apiFetch<MessageResponse>(`${AUTH_ROUTES.resendPhone}?${query.toString()}`, {
          method: "POST"
        });
        message = otpResult.message;
      } catch (error) {
        message =
          error instanceof ApiError
            ? `Dang ky thanh cong, nhung chua gui duoc OTP: ${error.message}`
            : "Dang ky thanh cong, nhung chua gui duoc OTP. Hay bam Gui lai ma.";
      }

      return {
        ok: true,
        message,
        redirectTo: "/verify-phone"
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
      return {
        ok: false,
        message: "Khong ket noi duoc backend dang ky. Hay chay backend o http://127.0.0.1:8000 roi thu lai."
      };
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    if (!token.trim()) return { ok: false, message: "Vui long nhap ma xac thuc email." };

    try {
      const query = new URLSearchParams({ token: token.trim() });
      const result = await apiFetch<BackendStatusResponse>(`${AUTH_ROUTES.verifyEmail}?${query.toString()}`, {
        method: "POST"
      });
      const status: RegistrationStatusResponse = {
        message: result.message ?? "Xac thuc email thanh cong.",
        registrationId: verificationContext?.registrationId,
        email: verificationContext?.email ?? "",
        phone: verificationContext?.phone ?? "",
        emailVerified: result.completed,
        phoneVerified: verificationContext?.phoneVerified ?? false,
        completed: result.completed
      };
      if (status.completed) {
        persistVerificationContext(undefined);
        setVerificationContext(undefined);
        setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));
      } else {
        const context = statusToVerificationContext(status);
        persistVerificationContext(context);
        setVerificationContext(context);
      }
      return {
        ok: true,
        message: status.message,
        redirectTo: status.completed ? "/login" : status.phoneVerified ? "/verify-email" : "/verify-phone"
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "Khong the xac thuc email luc nay." };
    }
  }, []);

  const verifyPhone = useCallback(async (phone: string, otp: string) => {
    const normalizedPhone = normalizeAuthPhone(phone);
    if (!PHONE_RE.test(normalizedPhone)) return { ok: false, message: "So dien thoai khong hop le." };
    if (!/^\d{6}$/.test(otp.trim())) return { ok: false, message: "OTP phai gom 6 chu so." };

    try {
      const query = new URLSearchParams({ phone: normalizedPhone, otp: otp.trim() });
      const result = await apiFetch<BackendStatusResponse>(`${AUTH_ROUTES.verifyPhone}?${query.toString()}`, {
        method: "POST"
      });
      const status: RegistrationStatusResponse = {
        message: result.message ?? "Xac thuc so dien thoai thanh cong.",
        registrationId: verificationContext?.registrationId,
        email: verificationContext?.email ?? currentUser?.email ?? "",
        phone: normalizedPhone,
        emailVerified: verificationContext?.emailVerified ?? currentUser?.emailVerified ?? false,
        phoneVerified: result.completed,
        completed: Boolean((verificationContext?.emailVerified ?? currentUser?.emailVerified) && result.completed)
      };
      if (status.completed) {
        persistVerificationContext(undefined);
        setVerificationContext(undefined);
        setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));
      } else {
        const context = statusToVerificationContext(status);
        persistVerificationContext(context);
        setVerificationContext(context);
      }
      return {
        ok: true,
        message: status.message,
        redirectTo: status.completed ? "/login" : status.emailVerified ? "/verify-phone" : "/verify-email"
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "Khong the xac thuc so dien thoai luc nay." };
    }
  }, [currentUser?.email, currentUser?.emailVerified, verificationContext?.email, verificationContext?.emailVerified, verificationContext?.registrationId]);

  const resendEmailVerification = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        email: verificationContext?.email ?? "",
        full_name: currentUser?.fullName ?? verificationContext?.email?.split("@")[0] ?? ""
      });
      const result = await apiFetch<MessageResponse>(`${AUTH_ROUTES.resendEmail}?${query.toString()}`, {
        method: "POST"
      });
      return { ok: true, message: result.message };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "Khong the gui lai ma xac thuc email luc nay." };
    }
  }, [currentUser?.fullName, verificationContext?.email]);

  const resendPhoneVerification = useCallback(async (phoneOverride?: string) => {
    const normalizedPhone = normalizeAuthPhone(phoneOverride ?? verificationContext?.phone ?? currentUser?.phone ?? "");
    if (!PHONE_RE.test(normalizedPhone)) return { ok: false, message: "So dien thoai khong hop le." };

    try {
      const query = new URLSearchParams({ phone: normalizedPhone });
      const result = await apiFetch<MessageResponse>(`${AUTH_ROUTES.resendPhone}?${query.toString()}`, {
        method: "POST"
      });
      const context: VerificationContext = {
        registrationId: verificationContext?.registrationId,
        email: verificationContext?.email ?? currentUser?.email ?? "",
        phone: normalizedPhone,
        emailVerified: verificationContext?.emailVerified ?? currentUser?.emailVerified ?? false,
        phoneVerified: false
      };
      persistVerificationContext(context);
      setVerificationContext(context);
      return { ok: true, message: result.message };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "Khong the gui lai OTP luc nay." };
    }
  }, [currentUser?.email, currentUser?.emailVerified, currentUser?.phone, verificationContext?.email, verificationContext?.emailVerified, verificationContext?.phone, verificationContext?.registrationId]);

  const logout = useCallback(async () => {
    try {
      await apiFetch<{ message: string }>(AUTH_ROUTES.logout, { method: "POST" });
    } catch {
      // Keep logout local even if the backend is offline.
    } finally {
      setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));
    }
  }, []);

  const switchRole = useCallback((role: Role | "GUEST") => {
    setState((prev) => {
      const user = prev.users.find((entry) => entry.id === prev.sessionUserId);
      if (role === "GUEST") return { ...prev, activeRole: "GUEST" };
      if (!user?.roles.includes(role)) return prev;
      return { ...prev, activeRole: role };
    });
  }, []);

  const addToCart = useCallback((variantId: string, quantity: number) => {
    if (!state.sessionUserId) {
      return { ok: false, message: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng." };
    }
    setState((prev) => {
      const existing = prev.cartItems.find((item) => item.variantId === variantId);
      if (existing) {
        return {
          ...prev,
          cartItems: prev.cartItems.map((item) =>
            item.variantId === variantId ? { ...item, quantity: item.quantity + quantity, isSelected: true } : item
          )
        };
      }
      return {
        ...prev,
        cartItems: [
          ...prev.cartItems,
          { id: `cart-${prev.cartItems.length + 1}`, variantId, quantity, isSelected: true }
        ]
      };
    });
    return { ok: true, message: "Đã thêm vào giỏ hàng." };
  }, [state.sessionUserId]);

  const updateCartItem = useCallback((cartItemId: string, changes: { quantity?: number; isSelected?: boolean }) => {
    setState((prev) => ({
      ...prev,
      cartItems: prev.cartItems.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: Math.max(1, changes.quantity ?? item.quantity), isSelected: changes.isSelected ?? item.isSelected }
          : item
      )
    }));
  }, []);

  const removeCartItem = useCallback((cartItemId: string) => {
    setState((prev) => ({ ...prev, cartItems: prev.cartItems.filter((item) => item.id !== cartItemId) }));
  }, []);

  const selectAllCart = useCallback((selected: boolean) => {
    setState((prev) => ({ ...prev, cartItems: prev.cartItems.map((item) => ({ ...item, isSelected: selected })) }));
  }, []);

  const checkout = useCallback((addressId: string, method: PaymentMethod, note: string) => {
    if (!currentUser) return { ok: false, message: "Bạn cần đăng nhập để checkout.", paymentCode: undefined };
    const address = state.addresses.find((item) => item.id === addressId);
    if (!address) return { ok: false, message: "Vui lòng chọn địa chỉ giao hàng.", paymentCode: undefined };
    const rows = getCartRows(state.cartItems, state.products, state.variants, state.shops);
    const selectedUnavailable = rows.find((row) => row.item.isSelected && row.unavailable);
    if (selectedUnavailable) {
      return { ok: false, message: `Checkout thất bại: ${selectedUnavailable.reason}.`, paymentCode: undefined };
    }
    const groups = selectedCheckoutGroups(rows);
    if (!groups.length) return { ok: false, message: "Chưa có sản phẩm hợp lệ được chọn.", paymentCode: undefined };

    let paymentCode = "";
    setState((prev) => {
      const orders = groups.map((group, index) =>
        createOrderFromGroup(makeOrderCode(prev.orders.length + index), currentUser, group, address, note, prev.orders.length + index)
      );
      paymentCode = makePaymentCode(prev.payments.length);
      const payment = createPaymentFromOrders(paymentCode, currentUser.id, method, orders, prev.payments.length);
      const checkedVariantIds = new Set(groups.flatMap((group) => group.rows.map((row) => row.variant.id)));
      return {
        ...prev,
        orders: [...orders, ...prev.orders],
        payments: [payment, ...prev.payments],
        cartItems: prev.cartItems.filter((item) => !checkedVariantIds.has(item.variantId)),
        lastCheckoutPaymentCode: payment.paymentCode
      };
    });
    return { ok: true, message: "Đã tạo payment chung và tách đơn theo shop.", paymentCode };
  }, [currentUser, state.addresses, state.cartItems, state.products, state.shops, state.variants]);

  const updatePaymentStatus = useCallback((paymentCode: string, status: PaymentStatus) => {
    setState((prev) => {
      const payment = prev.payments.find((item) => item.paymentCode === paymentCode);
      const linkedCodes = new Set(payment?.orderCodes ?? []);
      return {
        ...prev,
        payments: prev.payments.map((item) =>
          item.paymentCode === paymentCode
            ? {
                ...item,
                paymentStatus: status,
                paidAt: status === "PAID" ? "2026-06-29T08:30:00.000Z" : item.paidAt,
                failedAt: status === "FAILED" ? "2026-06-29T08:30:00.000Z" : item.failedAt,
                cancelledAt: status === "CANCELLED" ? "2026-06-29T08:30:00.000Z" : item.cancelledAt
              }
            : item
        ),
        orders: prev.orders.map((order) =>
          linkedCodes.has(order.orderCode)
            ? {
                ...order,
                paymentStatus: status === "PAID" ? "PAID" : status === "FAILED" ? "FAILED" : status === "CANCELLED" ? "CANCELLED" : order.paymentStatus
              }
            : order
        )
      };
    });
  }, []);

  const retryPayment = useCallback((paymentCode: string) => {
    updatePaymentStatus(paymentCode, "PENDING");
  }, [updatePaymentStatus]);

  const cancelCustomerOrder = useCallback((orderCode: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.orderCode === orderCode && canCustomerCancel(order)
          ? {
              ...order,
              orderStatus: "CANCELLED",
              paymentStatus: "CANCELLED",
              cancelledAt: "2026-06-29T08:45:00.000Z",
              timeline: [
                ...order.timeline,
                {
                  id: `${order.orderCode}-cancel`,
                  oldStatus: order.orderStatus,
                  newStatus: "CANCELLED",
                  note: "Khách hàng hủy khi chưa thanh toán và shop chưa xác nhận",
                  createdAt: "2026-06-29T08:45:00.000Z"
                }
              ]
            }
          : order
      )
    }));
  }, []);

  const updateSellerOrder = useCallback((orderCode: string, nextStatus: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.orderCode !== orderCode) return order;
        if (nextStatus === "CANCELLED" && !canSellerCancel(order)) return order;
        if (nextStatus === "READY_TO_SHIP" && order.paymentStatus !== "PAID") return order;
        if (nextStatus === "SHIPPING" && (order.paymentStatus !== "PAID" || !order.sellerConfirmed)) return order;
        return {
          ...order,
          sellerConfirmed: nextStatus === "READY_TO_SHIP" || nextStatus === "SHIPPING" || order.sellerConfirmed,
          sellerConfirmedAt:
            nextStatus === "READY_TO_SHIP" || nextStatus === "SHIPPING"
              ? "2026-06-29T09:00:00.000Z"
              : order.sellerConfirmedAt,
          orderStatus: nextStatus,
          completedAt: nextStatus === "COMPLETED" ? "2026-06-29T09:00:00.000Z" : order.completedAt,
          cancelledAt: nextStatus === "CANCELLED" ? "2026-06-29T09:00:00.000Z" : order.cancelledAt,
          timeline: [
            ...order.timeline,
            {
              id: `${order.orderCode}-${nextStatus}`,
              oldStatus: order.orderStatus,
              newStatus: nextStatus,
              note: "Người bán cập nhật trạng thái theo rule MVP",
              createdAt: "2026-06-29T09:00:00.000Z"
            }
          ]
        };
      })
    }));
  }, []);

  const updateSellerStatus = useCallback((shopId: string, status: SellerStatus, reason?: string) => {
    setState((prev) => ({
      ...prev,
      shops: prev.shops.map((shop) =>
        shop.id === shopId
          ? {
              ...shop,
              status,
              rejectedReason: status === "REJECTED" ? reason ?? "Hồ sơ chưa đạt yêu cầu." : shop.rejectedReason,
              approvedAt: status === "APPROVED" ? "2026-06-29T09:30:00.000Z" : shop.approvedAt,
              closedAt: status === "CLOSED" ? "2026-06-29T09:30:00.000Z" : shop.closedAt
            }
          : shop
      ),
      users:
        status === "APPROVED"
          ? prev.users.map((user) => {
              const shop = prev.shops.find((item) => item.id === shopId);
              if (shop?.userId !== user.id || user.roles.includes("SELLER")) return user;
              return { ...user, roles: [...user.roles, "SELLER"] };
            })
          : prev.users
    }));
  }, []);

  const toggleUserLock = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === userId
          ? user.status === "LOCKED"
            ? { ...user, status: "ACTIVE", lockedUntil: undefined, lockReason: undefined }
            : {
                ...user,
                status: "LOCKED",
                lockedUntil: "2026-07-29T00:00:00.000Z",
                lockReason: "Admin khóa thủ công từ dashboard."
              }
          : user
      )
    }));
  }, []);

  const saveProduct = useCallback((product: Product, productVariants = state.variants.filter((variant) => variant.productId === product.id)) => {
    setState((prev) => {
      const exists = prev.products.some((item) => item.id === product.id);
      const incomingVariantIds = new Set(productVariants.map((variant) => variant.id));
      return {
        ...prev,
        products: exists ? prev.products.map((item) => (item.id === product.id ? product : item)) : [product, ...prev.products],
        variants: [
          ...prev.variants.filter((variant) => variant.productId !== product.id || !incomingVariantIds.has(variant.id)),
          ...productVariants
        ]
      };
    });
  }, [state.variants]);

  const addAddress = useCallback((address: Omit<Address, "id" | "userId">) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses.map((item) =>
          item.userId === currentUser.id && address.isDefault ? { ...item, isDefault: false } : item
        ),
        { ...address, id: `addr-${prev.addresses.length + 1}`, userId: currentUser.id }
      ]
    }));
  }, [currentUser]);

  const resetDemo = useCallback(() => {
    const fresh = cloneState();
    setState(fresh);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state,
    ready,
    currentUser,
    currentShop,
    verificationContext,
    cartRows,
    login,
    register,
    verifyEmail,
    verifyPhone,
    resendEmailVerification,
    resendPhoneVerification,
    logout,
    switchRole,
    addToCart,
    updateCartItem,
    removeCartItem,
    selectAllCart,
    checkout,
    updatePaymentStatus,
    retryPayment,
    cancelCustomerOrder,
    updateSellerOrder,
    updateSellerStatus,
    toggleUserLock,
    saveProduct,
    addAddress,
    resetDemo
  };
};
