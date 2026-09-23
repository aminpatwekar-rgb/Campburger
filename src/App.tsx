import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import MobileCartBar from './components/MobileCartBar';
import OnboardingModal from './components/OnboardingModal';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import Dashboard from './pages/admin/Dashboard';
import MenuManager from './pages/admin/MenuManager';
import AdminOrders from './pages/admin/AdminOrders';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="w-8 h-8 border-4 border-[#F4511E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user || role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#111111] font-sans flex flex-col">
      <Navbar />
      <OnboardingModal />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/track/:id" element={<OrderTracking />} />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="/orders" element={<OrderTracking />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/menu" element={<AdminRoute><MenuManager /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        </Routes>
      </main>
      <MobileCartBar />
      <footer className="bg-[#0A0A0A] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
          <div className="md:col-span-1">
            <h3 className="font-bold text-2xl mb-4 tracking-tight">
              <span className="text-[#F4511E]">CAMP NEW</span> BURGER
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Premium burgers engineered for maximum flavor. Prepared fresh, made to order, and served hot.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6 tracking-wide">QUICK LINKS</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/menu" className="text-gray-400 hover:text-white transition-colors">Menu</Link></li>
              <li><Link to="/#location" className="text-gray-400 hover:text-white transition-colors">Location</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6 tracking-wide">LOCATION</h3>
            <ul className="space-y-4 text-gray-400">
              <li>Pune-Solapur Road</li>
              <li>Loni Kalbhor</li>
              <li>Pune, Maharashtra</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6 tracking-wide">HOURS & CONTACT</h3>
            <ul className="space-y-4 text-gray-400">
              <li><span className="block text-white mb-1">Open Daily</span> 12:00 PM - 10:00 PM</li>
              <li><span className="block text-white mt-4 mb-1">Dine-in, Pickup & Delivery Available</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Camp New Burger. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
