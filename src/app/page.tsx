/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Product, PaginatedResponse, Category } from '@/types';

// Layout
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartDrawer from '@/components/cart/CartDrawer';

// Home
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DealsSection from '@/components/home/DealsSection';
import CouponOffers from '@/components/home/CouponOffers';

// Products
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters from '@/components/products/ProductFilters';
import ProductDetail from '@/components/products/ProductDetail';

// Cart
import CartPage from '@/components/cart/CartPage';

// Checkout
import CheckoutPage from '@/components/checkout/CheckoutPage';

// Orders
import OrderHistory from '@/components/orders/OrderHistory';
import OrderDetail from '@/components/orders/OrderDetail';

// Auth
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ForgotPassword from '@/components/auth/ForgotPassword';
import ProfilePage from '@/components/auth/ProfilePage';
import AddressesPage from '@/components/auth/AddressesPage';

// Help
import HelpCenter from '@/components/help/HelpCenter';

// Admin
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProductManager from '@/components/admin/AdminProductManager';
import AdminOrderManager from '@/components/admin/AdminOrderManager';
import AdminUserManager from '@/components/admin/AdminUserManager';

// Hooks
import { useAccountStatusGuard } from '@/hooks/use-account-status-guard';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { usePWA } from '@/hooks/use-pwa';

// PWA
import InstallBanner from '@/components/pwa/InstallBanner';

// UI
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function Home() {
  const {
    currentPage,
    selectedCategoryId,
    searchQuery,
    setSelectedCategoryId,
    setSearchQuery,
    navigate,
    _hasHydrated,
  } = useStore();

  // Periodically verify user's account is still active
  useAccountStatusGuard();

  // Register service worker
  useServiceWorker();

  // PWA install prompt
  const pwa = usePWA();

  // Products page state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({
    categoryId: selectedCategoryId || undefined,
    search: searchQuery || undefined,
    brand: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
    sortBy: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentPage]);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Sync filters from store values
  const [storeSynced, setStoreSynced] = useState(false);
  useEffect(() => {
    if (!storeSynced && _hasHydrated && (selectedCategoryId || searchQuery)) {
      setFilters((prev) => ({
        ...prev,
        categoryId: selectedCategoryId || undefined,
        search: searchQuery || undefined,
      }));
      setStoreSynced(true);
    }
  }, [selectedCategoryId, searchQuery, storeSynced, _hasHydrated]);

  // Fetch products when on products page
  const fetchProductsData = () => {
    setProductsLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.set('categoryId', filters.categoryId as string);
    if (filters.search) params.set('search', filters.search as string);
    if (filters.brand) params.set('brand', filters.brand as string);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.rating) params.set('rating', filters.rating.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy as string);
    params.set('page', productsPage.toString());
    params.set('limit', '20');

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data: PaginatedResponse<Product>) => {
        setProducts(data.data || []);
        setProductsTotal(data.total || 0);
        setProductsTotalPages(data.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (currentPage !== 'products') return;
    fetchProductsData();
  }, [currentPage, filters, productsPage, _hasHydrated]);

  const handleFilterChange = (newFilters: Record<string, string | number | undefined>) => {
    setFilters(newFilters);
    setProductsPage(1);
    // Sync back to store
    if (newFilters.categoryId !== undefined) setSelectedCategoryId(newFilters.categoryId as string | null);
    if (newFilters.search !== undefined) setSearchQuery(newFilters.search as string);
  };

  const handleResetFilters = () => {
    setFilters({ categoryId: undefined, search: undefined, brand: undefined, minPrice: undefined, maxPrice: undefined, rating: undefined, sortBy: '' });
    setSelectedCategoryId(null);
    setSearchQuery('');
    setProductsPage(1);
  };

  // Show a loading skeleton until the store has hydrated from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header skeleton */}
        <div className="sticky top-0 z-40 h-16 bg-gradient-to-r from-green-700 via-green-600 to-emerald-500" />
        {/* Main content skeleton with shimmer */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="skeleton-shimmer h-[340px] rounded-2xl mb-10" />
          <div className="skeleton-shimmer h-8 w-52 mb-6 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton-shimmer h-36 rounded-xl mb-3" />
                <div className="skeleton-shimmer h-3 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-12">
            <div className="skeleton-shimmer h-7 w-40 mb-5 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton-shimmer h-48 rounded-xl mb-3" />
                  <div className="skeleton-shimmer h-4 w-3/4 rounded mb-2" />
                  <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
        {/* Footer skeleton */}
        <div className="h-80 mt-8 bg-gradient-to-b from-gray-900 to-gray-950" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-0">
            <HeroBanner />
            <CategoryGrid />
            <CouponOffers />
            <FeaturedProducts />
            <DealsSection />
          </div>
        );

      case 'products':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {productsLoading ? 'Loading...' : `${productsTotal} products found`}
            </p>
            <div className="flex gap-6">
              <ProductFilters
                onFilterChange={handleFilterChange}
                activeFilters={filters}
                onReset={handleResetFilters}
              />
              <div className="flex-1 min-w-0">
                <ProductGrid products={products} loading={productsLoading} />
                {/* Pagination */}
                {productsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pb-16 md:pb-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsPage <= 1}
                      onClick={() => setProductsPage(productsPage - 1)}
                      className="border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 px-3">
                      Page {productsPage} of {productsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsPage >= productsTotalPages}
                      onClick={() => setProductsPage(productsPage + 1)}
                      className="border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'product-detail':
        return <ProductDetail />;

      case 'cart':
        return <CartPage />;

      case 'checkout':
        return <CheckoutPage />;

      case 'orders':
        return <OrderHistory />;

      case 'order-detail':
        return <OrderDetail />;

      case 'login':
        return <LoginForm />;

      case 'register':
        return <RegisterForm />;

      case 'forgot-password':
        return <ForgotPassword />;

      case 'profile':
        return <ProfilePage />;

      case 'addresses':
        return <AddressesPage />;

      case 'help':
        return <HelpCenter />;

      case 'admin':
        return <AdminWrapper />;

      default:
        return (
          <div className="space-y-0">
            <HeroBanner />
            <CategoryGrid />
            <CouponOffers />
            <FeaturedProducts />
            <DealsSection />
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">
          {renderPage()}
        </main>
        <Footer />
        <CartDrawer />
        <MobileNav />
        <InstallBanner
          isInstallable={pwa.isInstallable}
          isInstalled={pwa.isInstalled}
          isOffline={pwa.isOffline}
          isStandalone={pwa.isStandalone}
          onInstall={pwa.installApp}
          onDismiss={pwa.dismissInstall}
        />
      </div>
    </ErrorBoundary>
  );
}

// Admin wrapper with tabs
function AdminWrapper() {
  const { adminTab, setAdminTab, user, navigate } = useStore();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('home');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('home')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage your store</p>
        </div>
      </div>

      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList className="mb-8 bg-gray-100 rounded-xl p-1 h-auto">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 px-4 py-2 text-sm font-medium transition-all"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 px-4 py-2 text-sm font-medium transition-all"
          >
            <Package className="size-4" />
            Products
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 px-4 py-2 text-sm font-medium transition-all"
          >
            <Users className="size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 px-4 py-2 text-sm font-medium transition-all"
          >
            <ClipboardList className="size-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>
        <TabsContent value="products">
          <AdminProductManager />
        </TabsContent>
        <TabsContent value="users">
          <AdminUserManager />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
