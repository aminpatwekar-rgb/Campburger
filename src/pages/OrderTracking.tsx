import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchOrder, fetchMyOrders, uploadPaymentProof, submitOrderPaymentProof } from '../api';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  Home,
  Radio,
  ShoppingBag,
  ArrowRight,
  Phone,
  MapPin,
  Receipt,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  QrCode,
  Upload,
  Loader2,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderItemDetail {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
}

interface FirestoreOrder {
  id: number;
  orderNumber: string;
  userId?: number;
  userUid?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  deliveryInstructions?: string;
  status: 'Received' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentMethod: string;
  paymentStatus?: string;
  paymentProofUrl?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItemDetail[];
  createdAt: string;
  updatedAt: string;
}

const statusPipeline = [
  {
    id: 'Received',
    label: 'Order Received',
    desc: 'Order placed & received by Camp New Burger',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500'
  },
  {
    id: 'Confirmed',
    label: 'Confirmed',
    desc: 'Accepted by restaurant & sent to kitchen queue',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500'
  },
  {
    id: 'Preparing',
    label: 'Preparing in Kitchen',
    desc: 'Chef is freshly grilling patties and toasting buns',
    icon: ChefHat,
    color: 'text-[#F4511E]',
    bgColor: 'bg-[#F4511E]'
  },
  {
    id: 'Ready',
    label: 'Order Ready',
    desc: 'Packed hot and sealed, waiting for delivery partner',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500'
  },
  {
    id: 'Out for Delivery',
    label: 'Out for Delivery',
    desc: 'Delivery partner is on the way to your doorstep',
    icon: Truck,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500'
  },
  {
    id: 'Delivered',
    label: 'Delivered',
    desc: 'Order delivered successfully. Enjoy your meal!',
    icon: Home,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500'
  }
];

export default function OrderTracking() {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, idToken, signIn, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(paramId ? parseInt(paramId) : null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const prevStatusesRef = useRef<Record<number, string>>({});

  const handleUploadReceiptForOrder = async (orderId: number, file: File) => {
    if (!idToken) return;
    setUploadingReceipt(true);
    try {
      const uploadRes = await uploadPaymentProof(file, idToken);
      await submitOrderPaymentProof(orderId, { paymentProofUrl: uploadRes.url }, idToken);
      showToast('Payment receipt uploaded! Kitchen will verify.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload receipt', 'error');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Sync selectedOrderId when param changes
  useEffect(() => {
    if (paramId) {
      setSelectedOrderId(parseInt(paramId));
    }
  }, [paramId]);

  // Real-time Firestore monitoring for customer orders
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeFirestore: Unsubscribe | null = null;
    let singleUnsubscribe: Unsubscribe | null = null;

    try {
      // 1. Primary Firestore query for all orders belonging to userUid
      const ordersCol = collection(db, 'orders');
      const userOrdersQuery = query(ordersCol, where('userUid', '==', user.uid));

      unsubscribeFirestore = onSnapshot(
        userOrdersQuery,
        (snapshot) => {
          setIsLiveConnected(true);
          setLastSyncTime(new Date());

          const list: FirestoreOrder[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FirestoreOrder;
            list.push(data);
          });

          // Sort by creation time descending (most recent first)
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          // Check for status changes to notify user
          list.forEach((ord) => {
            const prevStatus = prevStatusesRef.current[ord.id];
            if (prevStatus && prevStatus !== ord.status) {
              showToast(
                `Order ${ord.orderNumber} is now ${ord.status}!`,
                ord.status === 'Delivered' ? 'success' : 'info'
              );
            }
            prevStatusesRef.current[ord.id] = ord.status;
          });

          setOrders(list);
          setLoading(false);

          // If no selected order yet, pick the first active order, or the latest order
          if (!selectedOrderId && list.length > 0) {
            const active = list.find((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
            setSelectedOrderId(active ? active.id : list[0].id);
          }
        },
        (error) => {
          console.warn('Firestore snapshot listener error:', error);
          setIsLiveConnected(false);
          // Fallback to REST API if Firestore listener fails or permission issue
          if (idToken) {
            fetchMyOrders(idToken)
              .then((apiOrders) => {
                setOrders(apiOrders);
                setLoading(false);
              })
              .catch(console.error);
          }
        }
      );

      // 2. If a specific paramId is provided, also attach single doc listener as backup
      if (paramId) {
        const singleDocRef = doc(db, 'orders', paramId);
        singleUnsubscribe = onSnapshot(
          singleDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as FirestoreOrder;
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === data.id);
                if (exists) {
                  return prev.map((o) => (o.id === data.id ? data : o));
                }
                return [data, ...prev];
              });
            }
          },
          (err) => console.warn('Single doc listener warning:', err)
        );
      }
    } catch (e) {
      console.error('Error setting up Firestore listener:', e);
      setIsLiveConnected(false);
    }

    // Also trigger initial API fetch to ensure backend syncs any Postgres orders to Firestore
    if (idToken) {
      fetchMyOrders(idToken).catch(() => {});
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (singleUnsubscribe) singleUnsubscribe();
    };
  }, [user, idToken, paramId]);

  // Separate active vs past orders
  const activeOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pastOrders = orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled');

  // Currently focused order
  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;
  const currentOrder =
    orders.find((o) => o.id === selectedOrderId) ||
    displayedOrders[0] ||
    activeOrders[0] ||
    orders[0] ||
    null;

  // Manual fallback refresh
  const handleManualRefresh = () => {
    if (!idToken) return;
    setLoading(true);
    fetchMyOrders(idToken)
      .then((data) => {
        setOrders(data);
        showToast('Orders refreshed', 'info');
      })
      .catch((err) => showToast(err.message || 'Failed to refresh', 'error'))
      .finally(() => setLoading(false));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F4511E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold text-sm">Loading Order Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] py-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#F4511E] flex items-center justify-center mx-auto mb-6">
            <Radio size={32} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111111] mb-3">Live Order Tracking</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Sign in to track your active burger orders in real time with live kitchen and delivery status updates.
          </p>
          <button
            onClick={signIn}
            className="w-full bg-[#111111] hover:bg-[#222222] text-white py-3.5 rounded-full font-bold text-sm tracking-wide transition-colors shadow-md"
          >
            SIGN IN WITH GOOGLE
          </button>
          <div className="mt-6">
            <Link to="/menu" className="text-sm font-bold text-gray-400 hover:text-[#F4511E] transition-colors">
              Explore Our Menu First →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = currentOrder
    ? statusPipeline.findIndex((s) => s.id === currentOrder.status)
    : -1;
  const isCancelled = currentOrder?.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4511E]">Live Order Tracker</span>
              <span className="text-gray-300">•</span>
              {/* Real-time Firestore Connection Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                  isLiveConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                <span>{isLiveConnected ? 'Firestore Real-Time Live' : 'Connecting...'}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
              Order Tracking Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              title="Refresh status"
              className="p-2.5 rounded-full bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm transition-all active:scale-95"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              to="/menu"
              className="bg-[#111111] hover:bg-[#222222] text-white px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-sm flex items-center gap-2"
            >
              <ShoppingBag size={16} />
              <span>ORDER MORE</span>
            </Link>
          </div>
        </div>

        {/* Tabs: Active Orders vs Order History */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => {
              setActiveTab('active');
              if (activeOrders.length > 0 && (!currentOrder || currentOrder.status === 'Delivered' || currentOrder.status === 'Cancelled')) {
                setSelectedOrderId(activeOrders[0].id);
              }
            }}
            className={`flex items-center gap-2 font-bold text-sm py-2 px-4 rounded-full transition-all ${
              activeTab === 'active'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#111111] hover:bg-white/60'
            }`}
          >
            <Radio size={16} className={activeOrders.length > 0 ? 'animate-pulse' : ''} />
            <span>Active Orders</span>
            {activeOrders.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'active' ? 'bg-white text-[#F4511E]' : 'bg-[#F4511E] text-white'
                }`}
              >
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              if (pastOrders.length > 0 && (!currentOrder || (currentOrder.status !== 'Delivered' && currentOrder.status !== 'Cancelled'))) {
                setSelectedOrderId(pastOrders[0].id);
              }
            }}
            className={`flex items-center gap-2 font-bold text-sm py-2 px-4 rounded-full transition-all ${
              activeTab === 'history'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#111111] hover:bg-white/60'
            }`}
          >
            <Clock size={16} />
            <span>Order History</span>
            {pastOrders.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'history' ? 'bg-white text-[#111111]' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {pastOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Empty State when no orders exist in current tab */}
        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-xl mx-auto my-12">
            <div className="w-20 h-20 rounded-full bg-orange-50 text-[#F4511E] flex items-center justify-center mx-auto mb-6">
              {activeTab === 'active' ? <ShoppingBag size={36} /> : <Receipt size={36} />}
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-2">
              {activeTab === 'active' ? 'No Active Orders Right Now' : 'No Past Orders Found'}
            </h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              {activeTab === 'active'
                ? 'When you place an order, its real-time preparation and delivery progress will appear here live.'
                : 'You have no completed orders yet. Start exploring our mouth-watering burgers!'}
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-[#F4511E] hover:bg-[#d84013] text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <span>BROWSE MENU & ORDER</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Order Switcher / Selector (for multiple orders) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {activeTab === 'active' ? 'Active Orders' : 'Past Orders'} ({displayedOrders.length})
                </h3>
                <span className="text-[11px] text-gray-400">Select to view</span>
              </div>

              <div className="space-y-3">
                {displayedOrders.map((ord) => {
                  const isSelected = currentOrder?.id === ord.id;
                  const activeConfig = statusPipeline.find((s) => s.id === ord.status);

                  return (
                    <motion.div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrderId(ord.id);
                        navigate(`/track/${ord.id}`, { replace: true });
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        isSelected
                          ? 'bg-white border-[#F4511E] shadow-md ring-2 ring-orange-100'
                          : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-[#111111]">
                              {ord.orderNumber}
                            </span>
                            {ord.status !== 'Delivered' && ord.status !== 'Cancelled' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(ord.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className="font-extrabold text-sm text-[#111111]">
                          ₹{ord.total}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            ord.status === 'Cancelled'
                              ? 'bg-red-100 text-red-700'
                              : ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-orange-100 text-[#F4511E]'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                          {ord.items?.length || 1} item{ord.items?.length === 1 ? '' : 's'}
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Status Tracker & Order Details */}
            {currentOrder && (
              <div className="lg:col-span-8 space-y-6">
                {/* Main Tracking Card */}
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-200 relative overflow-hidden">
                  {/* Top order summary header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#111111]">
                          {currentOrder.orderNumber}
                        </h2>
                        {currentOrder.status !== 'Delivered' && currentOrder.status !== 'Cancelled' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live Updating
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Placed on{' '}
                        {new Date(currentOrder.createdAt).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">
                        {currentOrder.paymentMethod === 'UPI' ? 'UPI QR Payment' : 'Cash on Delivery'}
                      </span>
                      <span className="text-2xl font-black text-[#F4511E]">
                        ₹{currentOrder.total}
                      </span>
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        currentOrder.paymentStatus?.includes('Paid') 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentOrder.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* UPI Verification & Screenshot Card */}
                  {currentOrder.paymentMethod === 'UPI' && (
                    <div className="mb-6 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {currentOrder.paymentProofUrl ? (
                          <a 
                            href={currentOrder.paymentProofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="relative group shrink-0"
                          >
                            <img 
                              src={currentOrder.paymentProofUrl} 
                              alt="Receipt" 
                              className="w-12 h-12 rounded-xl object-cover border border-indigo-300 shadow-xs group-hover:opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={16} className="text-white" />
                            </div>
                          </a>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <QrCode size={20} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-indigo-950">Store UPI Payment</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              currentOrder.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {currentOrder.paymentStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600">
                            {currentOrder.paymentProofUrl 
                              ? 'Payment receipt attached and sent to kitchen.'
                              : 'Paid via GPay, PhonePe, or Paytm? Attach your screenshot here.'}
                          </p>
                        </div>
                      </div>

                      {!currentOrder.paymentProofUrl && (
                        <label className="shrink-0 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs">
                          {uploadingReceipt ? (
                            <>
                              <Loader2 className="animate-spin" size={13} />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} />
                              <span>Attach Receipt</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            disabled={uploadingReceipt}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadReceiptForOrder(currentOrder.id, file);
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Cancelled Banner */}
                  {isCancelled ? (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center mb-8">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-red-800 mb-1">This order was cancelled</h3>
                      <p className="text-sm text-red-600">
                        If you have questions or were charged, please contact Camp New Burger support.
                      </p>
                    </div>
                  ) : (
                    /* Step-by-Step Animated Real-Time Status Pipeline */
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
                          Live Progress Tracker
                        </h3>
                        <span className="text-xs text-gray-500">
                          {currentOrder.status === 'Delivered'
                            ? 'Completed'
                            : `Step ${Math.min(currentStatusIndex + 1, 6)} of 6`}
                        </span>
                      </div>

                      <div className="relative pl-2 sm:pl-4">
                        {/* Background connection vertical line */}
                        <div className="absolute left-[26px] sm:left-[34px] top-6 bottom-6 w-1 bg-gray-100 rounded-full" />

                        {/* Dynamic filled line with smooth animation */}
                        <motion.div
                          className="absolute left-[26px] sm:left-[34px] top-6 w-1 bg-emerald-500 rounded-full origin-top"
                          initial={{ height: '0%' }}
                          animate={{
                            height:
                              currentStatusIndex >= 0
                                ? `${(currentStatusIndex / (statusPipeline.length - 1)) * 100}%`
                                : '0%'
                          }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />

                        {/* Pipeline stages */}
                        <div className="space-y-8">
                          {statusPipeline.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = currentStatusIndex > idx;
                            const isCurrent = currentStatusIndex === idx;
                            const isPending = currentStatusIndex < idx;

                            return (
                              <div key={step.id} className="relative flex items-start gap-4 sm:gap-6 z-10">
                                {/* Stage Icon Bubble */}
                                <motion.div
                                  layout
                                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-sm transition-all duration-500 ${
                                    isCurrent
                                      ? 'bg-[#F4511E] text-white shadow-orange-200 shadow-lg scale-105'
                                      : isCompleted
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                  animate={
                                    isCurrent && currentOrder.status !== 'Delivered'
                                      ? { scale: [1, 1.08, 1] }
                                      : { scale: 1 }
                                  }
                                  transition={
                                    isCurrent && currentOrder.status !== 'Delivered'
                                      ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
                                      : {}
                                  }
                                >
                                  <Icon size={22} />
                                </motion.div>

                                {/* Stage Text Content */}
                                <div className="pt-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={`font-bold text-base md:text-lg transition-colors ${
                                        isCurrent
                                          ? 'text-[#F4511E]'
                                          : isCompleted
                                          ? 'text-[#111111]'
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {step.label}
                                    </h4>
                                    {isCurrent && currentOrder.status !== 'Delivered' && (
                                      <span className="text-[10px] uppercase font-extrabold bg-orange-100 text-[#F4511E] px-2 py-0.5 rounded-full">
                                        Active
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                  <p
                                    className={`text-xs md:text-sm mt-0.5 leading-relaxed ${
                                      isCurrent
                                      ? 'text-gray-700 font-medium'
                                      : isCompleted
                                      ? 'text-gray-500'
                                      : 'text-gray-400'
                                    }`}
                                  >
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items Breakdown */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-[#F4511E]" />
                      Ordered Items
                    </h3>

                    <div className="space-y-3 mb-6">
                      {currentOrder.items && currentOrder.items.length > 0 ? (
                        currentOrder.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-gray-200 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-bold text-sm text-[#111111]">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                  Qty: <span className="font-bold">{item.quantity}</span> × ₹{item.price}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-[#111111]">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Item details loading...</p>
                      )}
                    </div>

                    {/* Cost summary table */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>₹{currentOrder.subtotal || currentOrder.total - (currentOrder.deliveryFee || 40)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee</span>
                        <span>₹{currentOrder.deliveryFee ?? 40}</span>
                      </div>
                      <div className="flex justify-between text-base font-extrabold text-[#111111] pt-2 border-t border-gray-200">
                        <span>Grand Total ({currentOrder.paymentMethod})</span>
                        <span className="text-[#F4511E]">₹{currentOrder.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Contact Details */}
                  <div className="mt-6 pt-6 border-t border-gray-100 grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <MapPin size={14} className="text-[#F4511E]" />
                        <span>Delivery Address</span>
                      </div>
                      <p className="font-bold text-sm text-[#111111]">{currentOrder.customerName}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{currentOrder.deliveryAddress}</p>
                      {currentOrder.deliveryLandmark && (
                        <p className="text-xs text-gray-400 mt-1">Landmark: {currentOrder.deliveryLandmark}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <Phone size={14} className="text-[#F4511E]" />
                        <span>Contact & Instructions</span>
                      </div>
                      <p className="font-bold text-sm text-[#111111]">{currentOrder.customerPhone}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Instructions:{' '}
                        {currentOrder.deliveryInstructions || 'None provided'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Payment Status: <span className="font-bold">{currentOrder.paymentStatus || 'Pending'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
