import React, { useEffect, useState } from 'react';
import { fetchAdminStats, fetchAdminOrders } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, ShoppingBag, Clock, CheckCircle, PackageOpen, Plus, List, Users } from 'lucide-react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { Order, DashboardStats } from '../../types';

function AnimatedNumber({ value, prefix = "" }: { value: number, prefix?: string }) {
  const spring = useSpring(0, { bounce: 0, duration: 1000 });
  const display = useTransform(spring, (current) => `${prefix}${Math.floor(current)}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function Dashboard() {
  const { idToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (idToken) {
      fetchAdminStats(idToken).then(setStats).catch(console.error);
      fetchAdminOrders(idToken).then(orders => setRecentOrders(orders.slice(0, 5))).catch(console.error);
    }
  }, [idToken]);

  if (!stats) return <div className="p-8 min-h-screen bg-[#FFF8F0]">Loading stats...</div>;

  const statCards = [
    { label: "Today's Orders", value: stats.todaysOrders, icon: ShoppingBag, color: 'bg-blue-500', isCurrency: false },
    { label: "Today's Revenue", value: stats.todaysRevenue, icon: TrendingUp, color: 'bg-green-500', isCurrency: true },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: 'bg-[#FFB300]', isCurrency: false },
    { label: "Completed", value: stats.completedOrders, icon: CheckCircle, color: 'bg-[#F4511E]', isCurrency: false },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: 'bg-indigo-500', isCurrency: false }
  ];

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hasNoData = stats.todaysOrders === 0 && stats.todaysRevenue === 0 && stats.pendingOrders === 0 && stats.completedOrders === 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-12 max-w-7xl mx-auto bg-[#FFF8F0] min-h-screen"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium">{currentDate}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/admin/menu" className="bg-[#111111] hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md">
            <Plus size={18} />
            <span className="text-sm">Add Menu Item</span>
          </Link>
          <Link to="/admin/orders" className="bg-white hover:bg-gray-50 text-[#111111] border border-gray-200 px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-sm">
            <List size={18} />
            <span className="text-sm">View All Orders</span>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 relative"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-[#111111]">
                    <AnimatedNumber value={stat.value} prefix={stat.isCurrency ? "₹" : ""} />
                  </p>
                  {stat.value === 0 && hasNoData && (
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">No Data</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-extrabold mb-6 text-[#111111]">Recent Orders</h2>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <PackageOpen size={40} />
            </div>
            <h3 className="text-2xl font-extrabold mb-3 text-[#111111]">No orders yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Orders will appear here once customers start purchasing from your storefront.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold text-gray-600 text-sm tracking-wider uppercase">Order ID</th>
                  <th className="p-4 font-bold text-gray-600 text-sm tracking-wider uppercase">Customer</th>
                  <th className="p-4 font-bold text-gray-600 text-sm tracking-wider uppercase">Date & Time</th>
                  <th className="p-4 font-bold text-right text-gray-600 text-sm tracking-wider uppercase">Total</th>
                  <th className="p-4 font-bold text-center text-gray-600 text-sm tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-extrabold text-[#111111]">{order.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-[#111111]">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right font-extrabold text-[#111111]">₹{order.total}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-[#F4511E]/10 text-[#F4511E]'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
