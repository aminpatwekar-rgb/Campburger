import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus, updateOrderPaymentStatus } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../types';
import PaymentSettingsModal from '../../components/admin/PaymentSettingsModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  QrCode, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Banknote, 
  Check, 
  AlertCircle,
  ExternalLink,
  Eye,
  X,
  Phone,
  MessageCircle,
  Maximize2
} from 'lucide-react';

export default function AdminOrders() {
  const { idToken } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewProofImage, setPreviewProofImage] = useState<string | null>(null);

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

  const handlePaymentStatusToggle = async (orderId: number, currentStatus: string) => {
    if (!idToken) return;
    setUpdatingPaymentId(orderId);
    const newStatus = currentStatus.includes('Paid') ? 'Pending' : 'Paid (Verified)';
    try {
      await updateOrderPaymentStatus(orderId, newStatus, idToken);
      showToast(`Payment marked as ${newStatus}`);
      loadOrders();
    } catch (error) {
      console.error(error);
      showToast('Failed to update payment status', 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['Received', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(order.status);
    if (statusFilter === 'upi_pending') return order.paymentMethod === 'UPI' && !order.paymentStatus.includes('Verified');
    if (statusFilter === 'delivered') return order.status === 'Delivered';
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen bg-[#FFF8F0]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111111] tracking-tight">Orders Management</h1>
          <p className="text-gray-500 text-sm">Monitor live kitchen status, verify UPI QR payments, and dispatch orders.</p>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="bg-white hover:bg-gray-50 text-[#111111] border-2 border-gray-200 px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
        >
          <QrCode size={18} className="text-[#F4511E]" />
          <span>Configure Store QR / UPI</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'all', label: `All Orders (${orders.length})` },
          { id: 'active', label: `Active In Kitchen (${orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length})` },
          { id: 'upi_pending', label: `UPI Orders (${orders.filter(o => o.paymentMethod === 'UPI').length})` },
          { id: 'delivered', label: `Completed (${orders.filter(o => o.status === 'Delivered').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-wide uppercase transition-all ${
              statusFilter === tab.id
                ? 'bg-[#111111] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold mb-2">No matching orders</h3>
          <p className="text-gray-500">Orders will appear here as customers place them.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map(order => {
              const isUpi = order.paymentMethod === 'UPI';
              const isPaid = order.paymentStatus.includes('Paid');

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={order.id} 
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col relative"
                >
                  {updatingId === order.id && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-3xl z-10 backdrop-blur-[1px]">
                      <Loader2 className="animate-spin text-[#F4511E]" size={32} />
                    </div>
                  )}

                  {/* Header with Order ID & Amount */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-2xl text-[#111111] tracking-tight">{order.orderNumber}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-black text-xl text-[#F4511E]">₹{order.total}</span>
                  </div>

                  {/* Payment Method & Verification Card */}
                  <div className={`p-3.5 rounded-2xl mb-4 border ${isUpi ? 'bg-indigo-50/60 border-indigo-200' : 'bg-amber-50/60 border-amber-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-gray-800">
                        {isUpi ? (
                          <>
                            <QrCode size={15} className="text-indigo-600" />
                            UPI QR Payment
                          </>
                        ) : (
                          <>
                            <Banknote size={15} className="text-amber-700" />
                            Cash on Delivery
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => handlePaymentStatusToggle(order.id, order.paymentStatus)}
                        disabled={updatingPaymentId === order.id}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                        }`}
                        title="Click to toggle payment verification"
                      >
                        {updatingPaymentId === order.id ? (
                          <Loader2 className="animate-spin" size={10} />
                        ) : isPaid ? (
                          <Check size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{isPaid ? 'Verified Paid' : 'Mark as Paid'}</span>
                      </button>
                    </div>

                    <p className="text-xs font-mono font-medium text-gray-600 truncate">
                      Status: <span className="font-bold text-gray-900">{order.paymentStatus}</span>
                    </p>

                    {/* Receipt Screenshot Preview Button if uploaded */}
                    {order.paymentProofUrl && (
                      <div className="mt-2.5 pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={order.paymentProofUrl} 
                            alt="Receipt" 
                            className="w-8 h-8 rounded-lg object-cover border border-indigo-300 shadow-xs cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewProofImage(order.paymentProofUrl || null)}
                          />
                          <span className="text-[11px] font-bold text-indigo-950">Payment Proof Attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewProofImage(order.paymentProofUrl || null)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                        >
                          <Eye size={12} />
                          <span>View Proof</span>
                        </button>
                      </div>
                    )}
                  </div>
                
                  {/* Customer Info */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-2xl text-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-[#111111]">{order.customerName}</p>
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`tel:${order.customerPhone}`}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#F4511E] hover:border-[#F4511E] transition-colors"
                          title="Call Customer"
                        >
                          <Phone size={13} />
                        </a>
                        <a 
                          href={`https://wa.me/91${order.customerPhone.replace(/[^0-9]/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 font-mono">{order.customerPhone}</p>
                    <p className="text-gray-600 text-xs line-clamp-2">{order.deliveryAddress}</p>
                    {order.deliveryInstructions && (
                      <p className="text-xs text-[#F4511E] font-medium mt-2 bg-white p-2 rounded-xl border border-gray-100">
                        <span className="font-bold">Note:</span> {order.deliveryInstructions}
                      </p>
                    )}
                  </div>

                  {/* Order Status Selector */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <label className="block text-[11px] uppercase tracking-wider font-extrabold text-gray-400 mb-1.5">
                      Kitchen / Delivery Status
                    </label>
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-[#111111] font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#F4511E] text-sm"
                    >
                      <option value="Received">Received</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing in Kitchen</option>
                      <option value="Ready">Ready for Pickup</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Payment & QR Settings Modal */}
      <PaymentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadOrders}
      />

      {/* Payment Proof Screenshot Lightbox Modal */}
      <AnimatePresence>
        {previewProofImage && (
          <div 
            onClick={() => setPreviewProofImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative cursor-default"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111]">Customer Payment Receipt</h3>
                  <p className="text-xs text-gray-500">Cross-reference amount and UTR in your UPI app</p>
                </div>
                <button
                  onClick={() => setPreviewProofImage(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-gray-900 flex items-center justify-center max-h-[70vh] overflow-auto">
                <img 
                  src={previewProofImage} 
                  alt="Customer Payment Receipt" 
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
                />
              </div>

              <div className="p-4 bg-white flex items-center justify-between">
                <a
                  href={previewProofImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  <span>Open Full Image in New Tab</span>
                </a>
                <button
                  onClick={() => setPreviewProofImage(null)}
                  className="bg-[#111111] hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
