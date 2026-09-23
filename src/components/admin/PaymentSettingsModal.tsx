import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchPaymentSettings, updatePaymentSettings, uploadImage } from '../../api';
import { PaymentSettings } from '../../types';
import { X, QrCode, Upload, Check, Copy, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PaymentSettingsModal({ isOpen, onClose, onSaved }: Props) {
  const { idToken } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: 'paytm.s2tb8xn@pty',
    payeeName: 'Camp New Burger',
    qrImageUrl: '',
    isEnabled: true,
    instructions: 'Scan with Google Pay, PhonePe, Paytm, or BHIM. Enter your 12-digit UPI UTR number to complete payment.'
  });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchPaymentSettings()
        .then(data => {
          if (data) {
            setSettings({
              upiId: data.upiId || 'paytm.s2tb8xn@pty',
              payeeName: data.payeeName || 'Camp New Burger',
              qrImageUrl: data.qrImageUrl || '',
              isEnabled: data.isEnabled ?? true,
              instructions: data.instructions || 'Scan with Google Pay, PhonePe, Paytm, or BHIM.'
            });
          }
        })
        .catch(err => {
          console.error('Error fetching settings:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG/JPG)', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadImage(file, idToken);
      setSettings(prev => ({ ...prev, qrImageUrl: res.url }));
      showToast('QR Code image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload QR image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;

    setSaving(true);
    try {
      await updatePaymentSettings(settings, idToken);
      showToast('Payment & QR Code settings saved!');
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testUri = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=100&cu=INR`;
  const previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(testUri)}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#F4511E]/10 text-[#F4511E] flex items-center justify-center">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111111] tracking-tight">Store QR & UPI Payment</h2>
              <p className="text-sm text-gray-500">Configure your store's QR code for customer online payments</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin text-[#F4511E] mb-2" size={32} />
              <p className="text-sm">Loading payment configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Store UPI ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Store UPI ID / VPA
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm, store@upi"
                  value={settings.upiId}
                  onChange={e => setSettings(prev => ({ ...prev, upiId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Customers scan or send payment directly to this UPI address.
                </p>
              </div>

              {/* Payee Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Payee / Restaurant Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Camp New Burger"
                  value={settings.payeeName}
                  onChange={e => setSettings(prev => ({ ...prev, payeeName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
                />
              </div>

              {/* QR Code Upload / Custom Standee */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Upload Your Own Standee / Custom QR Image (Optional)
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  {settings.qrImageUrl ? (
                    <div className="relative group shrink-0">
                      <img 
                        src={settings.qrImageUrl} 
                        alt="Uploaded QR Code" 
                        className="w-24 h-24 object-contain rounded-xl bg-white border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, qrImageUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center text-gray-400 shrink-0">
                      <QrCode size={28} />
                      <span className="text-[10px] mt-1 font-bold">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-gray-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition-all">
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Upload QR Screenshot</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Upload your Google Pay, PhonePe, or Paytm printed QR code screenshot.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4">
                <img 
                  src={previewQrUrl} 
                  alt="Live Dynamic QR Preview" 
                  className="w-16 h-16 bg-white p-1 rounded-xl shadow-sm border border-emerald-100 shrink-0" 
                />
                <div className="text-xs">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <Sparkles size={14} /> Dynamic Amount QR Ready
                  </div>
                  <p className="text-emerald-700 mt-0.5">
                    Our checkout automatically generates dynamic QR codes with exact order amounts for each customer.
                  </p>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="font-bold text-sm text-[#111111] block">Enable Online UPI QR Payment</span>
                  <span className="text-xs text-gray-500">Allow customers to choose Online UPI QR at checkout</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={e => setSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                  className="w-5 h-5 text-[#F4511E] rounded focus:ring-[#F4511E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full font-extrabold text-sm bg-[#F4511E] hover:bg-[#d84013] text-white shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save QR Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
