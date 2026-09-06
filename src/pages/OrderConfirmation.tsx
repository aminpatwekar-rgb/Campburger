import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { idToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (idToken && id) {
      fetchOrder(id, idToken).then(data => {
        setOrder(data);
        setLoading(false);
      }).catch(err => {
        setError(err.message);
        setLoading(false);
      });
    }
  }, [id, idToken]);

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center bg-[#FFF8F0]">Loading...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FFF8F0] px-6 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h2>
        <p className="text-gray-600 mb-8">{error || 'Could not load order details.'}</p>
        <Link to="/menu" className="bg-[#111111] text-white px-8 py-3 rounded-full font-bold">BACK TO MENU</Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFF8F0] min-h-[80vh] py-20 px-6 flex items-center justify-center"
    >
      <div className="max-w-md w-full text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 relative overflow-hidden"
        >
          {/* Custom SVG for drawing the checkmark smoothly */}
          <motion.svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-12 h-12"
          >
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              d="M20 6L9 17l-5-5"
            />
          </motion.svg>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 text-[#111111]">ORDER CONFIRMED!</h1>
          <p className="text-xl font-medium text-gray-500 mb-8">Order {order.orderNumber}</p>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 text-left"
        >
          <p className="text-gray-600 mb-6 text-center">Your order has been received and is being processed.</p>
          
          <div className="space-y-4 mb-6">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium text-[#111111]">{item.quantity}x {item.menuItem.name}</span>
                <span className="text-gray-600">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-4 flex justify-between items-center font-bold">
            <span>Total Paid (COD)</span>
            <span className="text-xl text-[#F4511E]">₹{order.total}</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col gap-4"
        >
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link to={`/track/${order.id}`} className="bg-[#F4511E] hover:bg-[#d84013] shadow text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-colors">
              <span>TRACK ORDER</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
          <Link to="/menu" className="text-gray-500 hover:text-[#111111] font-bold py-4 transition-colors">
            BACK TO MENU
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
