import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowRight, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  const deliveryFee = 40;
  const total = cartTotal + deliveryFee;

  if (cartCount === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-[70vh] flex items-center justify-center bg-[#FFF8F0] px-6"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-lg w-full"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
            className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
          >
            <ShoppingCart size={40} />
          </motion.div>
          <h2 className="text-3xl font-extrabold mb-4 text-[#111111] tracking-tight">YOUR CART IS EMPTY</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed text-lg">Add something delicious from the menu to get started.</p>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Link to="/menu" className="bg-[#111111] hover:bg-[#F4511E] text-white px-8 py-4 rounded-full font-bold text-lg inline-block transition-colors shadow-md hover:shadow-xl">
              BROWSE MENU
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFF8F0] min-h-screen py-12 px-6 pb-32 md:pb-12"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-[#111111] tracking-tight">YOUR ORDER</h1>
        
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  key={item.menuItem.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.2 } }}
                  className="bg-white p-4 md:p-6 rounded-3xl flex items-center gap-6 shadow-sm border border-gray-100 group"
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 relative">
                    <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg md:text-xl font-bold text-[#111111] leading-tight pr-4">{item.menuItem.name}</h3>
                      <button onClick={() => removeFromCart(item.menuItem.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-red-50">
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-4">
                      <span className="font-extrabold text-[#111111] text-xl">₹{item.menuItem.price * item.quantity}</span>
                      <div className="flex items-center bg-[#111111] text-white rounded-full overflow-hidden shadow-sm">
                        <motion.button whileTap={{ backgroundColor: '#1f2937' }} onClick={() => updateQuantity(item.menuItem.id, -1)} className="px-3 md:px-4 py-1 hover:bg-gray-800 transition-colors font-bold text-lg">−</motion.button>
                        <AnimatePresence mode="popLayout">
                          <motion.span 
                            key={item.quantity}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="px-2 md:px-4 font-bold text-sm inline-block"
                          >
                            {item.quantity}
                          </motion.span>
                        </AnimatePresence>
                        <motion.button whileTap={{ backgroundColor: '#1f2937' }} onClick={() => updateQuantity(item.menuItem.id, 1)} className="px-3 md:px-4 py-1 hover:bg-gray-800 transition-colors font-bold text-lg">+</motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="md:col-span-1">
            <motion.div 
              layout
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24"
            >
              <h3 className="text-xl font-bold mb-6 text-[#111111] tracking-tight">ORDER SUMMARY</h3>
              
              <div className="space-y-4 mb-6 text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-bold text-[#111111]">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#111111]">₹{deliveryFee}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-6 mb-8 flex justify-between items-end">
                <span className="text-xl font-bold text-[#111111]">TOTAL</span>
                <motion.span 
                  key={total}
                  initial={{ scale: 1.1, color: "#F4511E" }}
                  animate={{ scale: 1, color: "#F4511E" }}
                  className="text-4xl font-extrabold tracking-tighter"
                >
                  ₹{total}
                </motion.span>
              </div>
              
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#F4511E] hover:bg-[#d84013] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#F4511E]/20 hover:shadow-[#F4511E]/40"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
