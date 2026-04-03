import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Page, Product, CartItem, User, Address, Order, Category, DeliverySlot, Coupon } from '@/types';

interface AppState {
  // Navigation
  currentPage: Page;
  previousPage: Page | null;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  selectedCategoryId: string | null;
  navigate: (page: Page) => void;
  selectProduct: (id: string) => void;
  selectOrder: (id: string) => void;
  selectCategory: (id: string | null) => void;
  goBack: () => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;

  // Cart
  cartItems: CartItem[];
  cartLoading: boolean;
  setCartItems: (items: CartItem[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartMrpTotal: () => number;
  getCartCount: () => number;
  getCartDiscount: () => number;

  // Delivery
  selectedAddress: Address | null;
  selectedSlot: DeliverySlot | null;
  setSelectedAddress: (address: Address | null) => void;
  setSelectedSlot: (slot: DeliverySlot | null) => void;

  // Coupon
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  setCouponDiscount: (discount: number) => void;
  clearCoupon: () => void;

  // Admin
  adminTab: string;
  setAdminTab: (tab: string) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Feedback
  showFeedbackForm: boolean;
  setShowFeedbackForm: (show: boolean) => void;

  // Location
  deliveryLocation: {
    label: string;
    address: string;
    lat: number | null;
    lng: number | null;
    detectedAt: string | null;
  };
  setDeliveryLocation: (location: { label: string; address: string; lat?: number; lng?: number }) => void;

  // Hydration
  _hasHydrated: boolean;
  _setHasHydrated: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'home',
      previousPage: null,
      selectedProductId: null,
      selectedOrderId: null,
      selectedCategoryId: null,
      navigate: (page) => set({ currentPage: page, previousPage: get().currentPage }),
      selectProduct: (id) => set({ selectedProductId: id }),
      selectOrder: (id) => set({ selectedOrderId: id }),
      selectCategory: (id) => set({ selectedCategoryId: id }),
      goBack: () => {
        const prev = get().previousPage;
        if (prev) set({ currentPage: prev, previousPage: 'home' });
        else set({ currentPage: 'home' });
      },

      // Auth
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, appliedCoupon: null, couponDiscount: 0 }),
      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },

      // Cart
      cartItems: [],
      cartLoading: false,
      setCartItems: (items) => set({ cartItems: items }),
      addToCart: (product, quantity = 1) => {
        const items = get().cartItems;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ cartItems: [...items, { productId: product.id, quantity, product }] });
        }
      },
      removeFromCart: (productId) => {
        set({ cartItems: get().cartItems.filter((i) => i.productId !== productId) });
      },
      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
        } else {
          set({
            cartItems: get().cartItems.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ cartItems: [] }),
      getCartTotal: () => {
        return get().cartItems.reduce((sum, i) => {
          const price = i.product?.price ?? 0;
          return sum + price * i.quantity;
        }, 0);
      },
      getCartMrpTotal: () => {
        return get().cartItems.reduce((sum, i) => {
          const mrp = i.product?.mrp ?? 0;
          return sum + mrp * i.quantity;
        }, 0);
      },
      getCartCount: () => {
        return get().cartItems.reduce((sum, i) => sum + i.quantity, 0);
      },
      getCartDiscount: () => {
        return get().getCartMrpTotal() - get().getCartTotal();
      },

      // Delivery
      selectedAddress: null,
      selectedSlot: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setSelectedSlot: (slot) => set({ selectedSlot: slot }),

      // Coupon
      appliedCoupon: null,
      couponDiscount: 0,
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      setCouponDiscount: (discount) => set({ couponDiscount: discount }),
      clearCoupon: () => set({ appliedCoupon: null, couponDiscount: 0 }),

      // Admin
      adminTab: 'dashboard',
      setAdminTab: (tab) => set({ adminTab: tab }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      cartDrawerOpen: false,
      setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Feedback
      showFeedbackForm: false,
      setShowFeedbackForm: (show) => set({ showFeedbackForm: show }),

      // Location
      deliveryLocation: {
        label: 'BiharSharif',
        address: 'BiharSharif, Bihar, India',
        lat: null,
        lng: null,
        detectedAt: null,
      },
      setDeliveryLocation: (location) => set({
        deliveryLocation: {
          label: location.label,
          address: location.address,
          lat: location.lat ?? null,
          lng: location.lng ?? null,
          detectedAt: new Date().toISOString(),
        },
      }),

      // Hydration
      _hasHydrated: false,
      _setHasHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'smartbasket-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cartItems: state.cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        currentPage: state.currentPage,
        selectedCategoryId: state.selectedCategoryId,
        appliedCoupon: state.appliedCoupon,
        couponDiscount: state.couponDiscount,
        deliveryLocation: state.deliveryLocation,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Zustand rehydration error:', error);
          }
          // Clear stale searchQuery from old persisted data
          try {
            const raw = localStorage.getItem('smartbasket-store');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.state?.searchQuery) {
                delete parsed.state.searchQuery;
                localStorage.setItem('smartbasket-store', JSON.stringify(parsed));
              }
            }
          } catch {}
          state?._setHasHydrated();
        };
      },
    }
  )
);
