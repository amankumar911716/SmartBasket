'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Grid3X3,
  ShoppingCart,
  Package,
  UserCircle,
  LogOut,
  Settings,
  ClipboardList,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MobileNav() {
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    navigate,
    isAuthenticated,
    user,
    logout,
    currentPage,
  } = useStore();

  const handleNavigate = (page: Parameters<typeof navigate>[0]) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('home');
    toast({ title: 'Logged out successfully' });
  };

  const navItems = [
    { icon: Home, label: 'Home', page: 'home' as const },
    { icon: Grid3X3, label: 'Browse Products', page: 'products' as const },
    { icon: ShoppingCart, label: 'My Cart', page: 'cart' as const },
    { icon: Package, label: 'My Orders', page: 'orders' as const },
    { icon: UserCircle, label: 'My Profile', page: 'profile' as const },
    { icon: ClipboardList, label: 'My Addresses', page: 'addresses' as const },
  ];

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-72 p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SmartBasket" className="h-10 w-10 rounded-lg" />
            <div>
              <p className="font-bold"><span className="text-red-300">Smart</span><span className="text-amber-300">Basket</span></p>
              {isAuthenticated ? (
                <p className="text-xs text-emerald-100">{user?.name}</p>
              ) : (
                <p className="text-xs text-emerald-100">Welcome, Guest</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-2">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3">Menu</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'text-green-600 bg-green-50 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}

          <Separator className="my-2" />

          {isAuthenticated && user?.role === 'admin' && (
            <button
              onClick={() => handleNavigate('admin')}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                currentPage === 'admin'
                  ? 'text-green-600 bg-green-50 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="size-4" />
              Admin Panel
            </button>
          )}

          {!isAuthenticated ? (
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => handleNavigate('login')}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigate('register')}
                className="w-full py-2.5 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Register
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
