import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, ChefHat, Package, Truck, Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrderTracking() {
  const { id } = useParams();
  const { idToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-refresh order status every 10 seconds
  useEffect(() => {
    let interval: any;
    const fetchOrderData = () => {
      if (idToken && id) {
        fetchOrder(id, idToken).then(data => {
          setOrder(data);
          setLoading(false);
        }).catch(err => {
          setError(err.message);
          setLoading(false);
        });
      }
    };
    
    fetchOrderData();
    interval = setInterval(fetchOrderData, 10000);
    
    return () => clearInterval(interval);
  }, [id, idToken]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">Loading...</div>;
  if (error || !order) return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]"><p className="text-red-500">{error || 'Order not found'}</p></div>;

  const statuses = [
    { id: 'Received', label: 'Order Received', icon: Clock },
    { id: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'Preparing', label: 'Preparing', icon: ChefHat },
    { id: 'Ready', label: 'Ready', icon: Package },
    { id: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
    { id: 'Delivered', label: 'Delivered', icon: Home }
  ];

  const currentIndex = statuses.findIndex(s => s.id === order.status);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFF8F0] min-h-screen py-12 px-6"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111111]">{order.orderNumber}</h1>
          <span className="bg-[#111111] text-white px-4 py-1 rounded-full font-bold text-sm">
            {order.paymentMethod} • ₹{order.total}
          </span>
        </div>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
          <div className="relative">
            {/* Background line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-gray-100 rounded-full"></div>
            
            {/* Animated filled line */}
            <motion.div 
              className="absolute left-[23px] top-4 w-1 bg-green-500 rounded-full origin-top"
              initial={{ height: "0%" }}
              animate={{ height: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            ></motion.div>
            
            <div className="space-y-12">
              {statuses.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = currentIndex > idx;
                const isCurrent = currentIndex === idx;
                const isPending = currentIndex < idx;
                
                return (
                  <div key={s.id} className="relative flex items-center gap-6 z-10">
                    <motion.div 
                      layout
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-500 ${
                        isCurrent ? 'bg-[#F4511E] text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-gray-100 text-gray-400'
                      }`}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={isCurrent ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                    >
                      <Icon size={20} />
                    </motion.div>
                    <div>
                      <h3 className={`font-bold text-lg transition-colors duration-500 ${isCurrent ? 'text-[#F4511E]' : isCompleted ? 'text-[#111111]' : 'text-gray-400'}`}>
                        {s.label}
                      </h3>
                      {isCurrent && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-500 mt-1 font-medium"
                        >
                          Currently {s.id.toLowerCase()}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link to="/menu" className="text-gray-500 hover:text-[#111111] font-bold py-4 transition-colors">
            BACK TO MENU
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
