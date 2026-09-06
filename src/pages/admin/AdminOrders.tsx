import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function AdminOrders() {
  const { idToken } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = () => {
    if (idToken) {
      fetchAdminOrders(idToken).then(setOrders).catch(console.error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [idToken]);

  const handleStatusChange = async (orderId: number, status: string) => {
    if (!idToken) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status, idToken);
      showToast(`Order updated to ${status}`);
      loadOrders();
    } catch (error) {
      console.error(error);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-12 max-w-7xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-8 text-[#111111]">Active Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold mb-2">No orders yet</h3>
          <p className="text-gray-500">New customer orders will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map(order => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={order.id} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative"
              >
                {updatingId === order.id && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl z-10 backdrop-blur-[1px]">
                    <Loader2 className="animate-spin text-[#F4511E]" size={32} />
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-[#111111]">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <span className="bg-gray-100 px-3 py-1 rounded text-sm font-bold">{order.paymentMethod} • ₹{order.total}</span>
              </div>
              
              <div className="mb-6 bg-gray-50 p-4 rounded-xl">
                <p className="font-bold mb-1">{order.customerName}</p>
                <p className="text-sm text-gray-600 mb-2">{order.customerPhone}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{order.deliveryAddress}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <select 
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 text-[#111111] font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="Received">Received</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
