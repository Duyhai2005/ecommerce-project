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
import type { Address, AppState, OrderStatus, PaymentMethod, PaymentStatus, Product, Role, SellerStatus, User } from "@/types/models";

const STORAGE_KEY = "shepoo-marketplace-state-v1";

const cloneState = (): AppState => JSON.parse(JSON.stringify(initialState)) as AppState;

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

export const useMarketplaceStore = () => {
  const [state, setState] = useState<AppState>(() => cloneState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setState(hydrateSavedState(JSON.parse(saved) as AppState));
    }
    setReady(true);
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

  const login = useCallback((email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const hydrated = hydrateSavedState(state);
    const user = hydrated.users.find((entry) => entry.email.trim().toLowerCase() === normalizedEmail);

    if (!user) {
      return { ok: false, message: "Không tìm thấy tài khoản mock." };
    }

    if (user.status === "LOCKED") {
      return {
        ok: false,
        message: `Tài khoản bị khóa. Lý do: ${user.lockReason ?? "Không rõ"}.`
      };
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

  const register = useCallback((payload: Pick<User, "fullName" | "email" | "phone">) => {
    setState((prev) => {
      const user: User = {
        id: `u-new-${prev.users.length + 1}`,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
        emailVerified: false,
        phoneVerified: false,
        status: "ACTIVE",
        roles: ["CUSTOMER"]
      };
      return { ...prev, users: [...prev.users, user], sessionUserId: user.id, activeRole: "CUSTOMER" };
    });
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, sessionUserId: undefined, activeRole: "GUEST" }));
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
    cartRows,
    login,
    register,
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
