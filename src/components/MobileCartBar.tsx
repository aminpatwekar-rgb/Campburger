import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function MobileCartBar() {
  const { cartCount, cartTotal } = useCart();
  const location = useLocation();

  // Don't show on admin routes, checkout, or cart itself
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname === '/cart' ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/order-confirmation')
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="md:hidden fixed bottom-4 left-4 right-4 z-50"
        >
          <Link
            to="/cart"
            className="bg-[#111111] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={24} className="text-[#F4511E]" />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-[#F4511E] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                >
                  {cartCount}
                </motion.span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-300">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
                <span className="font-bold">₹{cartTotal}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 font-bold text-[#F4511E]">
              VIEW CART
              <ArrowRight size={18} />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
