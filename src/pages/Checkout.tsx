import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../api';
import { ArrowRight, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, idToken, signIn } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    landmark: '',
    instructions: '',
    paymentMethod: 'COD'
  });

  const deliveryFee = 40;
  const total = cartTotal + deliveryFee;

  if (cart.length === 0) return <Navigate to="/cart" />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !idToken) {
      signIn();
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        deliveryLandmark: formData.landmark,
        deliveryInstructions: formData.instructions,
        paymentMethod: formData.paymentMethod,
        items: cart.map(c => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          price: c.menuItem.price
        }))
      };
      
      const newOrder = await placeOrder(orderData, idToken);
      clearCart();
      navigate(`/order-confirmation/${newOrder.id}`);
    } catch (err: any) {
      setError(err.message || 'We couldn\'t place your order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFF8F0] min-h-screen py-12 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-[#111111]">CHECKOUT</h1>
        
        {!user ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mb-8"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-gray-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sign in to checkout</h2>
            <p className="text-gray-500 mb-6">You need an account to place an order and track it.</p>
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={signIn}
              className="bg-[#111111] hover:bg-gray-800 text-white px-8 py-3 rounded-full font-bold transition-all shadow"
            >
              Sign In with Google
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 gap-12">
            <form onSubmit={handleSubmit} className="md:col-span-2 space-y-8">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, x: 0 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      x: [-5, 5, -5, 5, 0], // subtle shake
                    }}
                    transition={{ duration: 0.4 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-200"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <h2 className="text-2xl font-bold mb-6 text-[#111111]">1. Contact Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <h2 className="text-2xl font-bold mb-6 text-[#111111]">2. Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Complete Address</label>
                    <textarea required name="address" rows={3} value={formData.address} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                    <input type="text" name="instructions" placeholder="e.g. Leave at the door" value={formData.instructions} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <h2 className="text-2xl font-bold mb-6 text-[#111111]">3. Payment</h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-[#F4511E] bg-[#F4511E]/5 rounded-xl cursor-pointer transition-colors">
                    <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="w-5 h-5 text-[#F4511E] focus:ring-[#F4511E]" />
                    <span className="ml-3 font-bold text-lg">Cash on Delivery</span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-100 rounded-xl cursor-pointer opacity-50">
                    <input disabled type="radio" name="paymentMethod" value="UPI" className="w-5 h-5" />
                    <span className="ml-3 font-bold text-lg">Online Payment (Coming Soon)</span>
                  </label>
                </div>
              </motion.div>

              <motion.button 
                type="submit"
                disabled={loading}
                whileTap={loading ? {} : { scale: 0.98 }}
                className={`w-full py-5 rounded-full font-bold text-xl flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#F4511E] hover:bg-[#d84013] text-white shadow-lg hover:shadow-xl'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>PLACING ORDER...</span>
                  </>
                ) : (
                  <>
                    <span>PLACE ORDER • ₹{total}</span>
                    <ArrowRight size={24} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="md:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24"
              >
                <h3 className="text-xl font-bold mb-6 text-[#111111]">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.menuItem.name}</span>
                      <span className="font-medium text-[#111111]">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-6 space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#111111]">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-[#111111]">₹{deliveryFee}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                  <span className="text-lg font-bold text-[#111111]">Total</span>
                  <span className="text-2xl font-bold text-[#F4511E]">₹{total}</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
