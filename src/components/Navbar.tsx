import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, User, X, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, role, signIn, logOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // We now only show admin UI if they actually have the admin role
  const isAdminView = role === 'admin' && location.pathname.startsWith('/admin');

  return (
    <>
    <nav className="bg-[#0A0A0A] text-white sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to={isAdminView ? "/admin" : "/"} onClick={() => setIsMobileMenuOpen(false)} className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2 group z-50 relative">
          <span className="text-[#F4511E] group-hover:text-white transition-colors duration-300">CAMP NEW</span> BURGER
          {isAdminView && <span className="text-xs bg-[#F4511E] text-white px-2 py-0.5 rounded uppercase font-bold ml-2">Admin</span>}
        </Link>
        
        {!isAdminView ? (
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/menu" className="font-bold text-sm tracking-wide text-gray-300 hover:text-white transition-colors">MENU</Link>
            <Link to="/#location" className="font-bold text-sm tracking-wide text-gray-300 hover:text-white transition-colors">LOCATION</Link>
            
            {role === 'admin' && (
              <Link to="/admin" className="font-bold text-sm tracking-wide text-[#F4511E] hover:text-white transition-colors flex items-center gap-1.5">
                <Shield size={16} />
                ADMIN
              </Link>
            )}

            {user ? (
              <button onClick={logOut} className="font-bold text-sm tracking-wide text-gray-300 hover:text-white transition-colors">LOG OUT</button>
            ) : (
              <button onClick={signIn} className="font-bold text-sm tracking-wide text-gray-300 hover:text-white transition-colors">SIGN IN</button>
            )}

            <Link to="/cart" className="bg-white hover:bg-gray-100 text-[#111111] px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md">
              <ShoppingCart size={18} />
              <span className="text-sm">CART</span>
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="bg-[#F4511E] text-white text-xs px-2 py-0.5 rounded-full shadow-inner"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/admin" className="font-bold text-sm text-gray-300 hover:text-[#F4511E] transition-colors">Dashboard</Link>
            <Link to="/admin/orders" className="font-bold text-sm text-gray-300 hover:text-[#F4511E] transition-colors">Orders</Link>
            <Link to="/admin/menu" className="font-bold text-sm text-gray-300 hover:text-[#F4511E] transition-colors">Menu Manager</Link>
            <Link to="/" className="font-bold text-sm text-gray-500 hover:text-white transition-colors">Storefront</Link>
          </div>
        )}

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center gap-6">
          {!isAdminView && (
            <Link to="/cart" className="relative active:scale-95 transition-transform text-gray-300 hover:text-white">
              <ShoppingCart size={24} />
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute -top-2 -right-2 bg-[#F4511E] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-300 hover:text-white transition-colors">
            <MenuIcon size={28} />
          </button>
        </div>
      </div>
    </nav>
    
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-[#0A0A0A] border-l border-white/10 z-[70] shadow-2xl flex flex-col p-6 md:hidden"
          >
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2">
                <X size={28} />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 text-xl font-bold tracking-wide">
              {!isAdminView ? (
                <>
                  <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#F4511E] transition-colors">MENU</Link>
                  <Link to="/#location" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#F4511E] transition-colors">LOCATION</Link>
                  
                  {role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F4511E] hover:text-white transition-colors flex items-center gap-2">
                      <Shield size={20} />
                      ADMIN
                    </Link>
                  )}

                  <div className="border-t border-white/10 my-2 pt-6">
                    {user ? (
                      <button onClick={() => { logOut(); setIsMobileMenuOpen(false); }} className="text-gray-400 hover:text-white transition-colors text-left w-full">LOG OUT</button>
                    ) : (
                      <button onClick={() => { signIn(); setIsMobileMenuOpen(false); }} className="text-[#F4511E] hover:text-white transition-colors text-left w-full">SIGN IN</button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#F4511E] transition-colors">Dashboard</Link>
                  <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#F4511E] transition-colors">Orders</Link>
                  <Link to="/admin/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#F4511E] transition-colors">Menu Manager</Link>
                  <div className="border-t border-white/10 my-2 pt-6">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors block">Storefront</Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
