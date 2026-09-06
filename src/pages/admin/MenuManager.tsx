import React, { useEffect, useState } from 'react';
import { fetchMenu, createMenuItem, updateMenuAvailability } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MenuItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function MenuManager() {
  const { idToken } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isVegetarian: false
  });

  const loadMenu = () => {
    fetchMenu().then(setItems).catch(console.error);
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleToggle = async (id: number, isAvailable: boolean) => {
    if (!idToken) return;
    try {
      await updateMenuAvailability(id, !isAvailable, idToken);
      showToast(isAvailable ? 'Item marked out of stock' : 'Item marked available');
      loadMenu();
    } catch (e) {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setSaving(true);
    try {
      await createMenuItem({
        ...formData,
        price: parseInt(formData.price)
      }, idToken);
      setShowAdd(false);
      showToast('Menu item saved successfully');
      loadMenu();
      setFormData({ name: '', description: '', price: '', category: '', imageUrl: '', isVegetarian: false });
    } catch (e) {
      showToast('Failed to add item', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#111111]">Menu Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#111111] text-white px-6 py-2 rounded-full font-bold">
          {showAdd ? 'CANCEL' : '+ ADD MENU ITEM'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <input required placeholder="Item Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border rounded px-4 py-3" />
            <input required placeholder="Category (e.g. Burgers, Sides)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border rounded px-4 py-3" />
            <input required type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border rounded px-4 py-3" />
          </div>
          <div className="space-y-4">
            <input required placeholder="Image URL (Unsplash or real image)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-gray-50 border rounded px-4 py-3" />
            <textarea required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border rounded px-4 py-3" rows={2} />
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input type="checkbox" checked={formData.isVegetarian} onChange={e => setFormData({...formData, isVegetarian: e.target.checked})} className="w-5 h-5" />
              Vegetarian Item
            </label>
          </div>
          <div className="md:col-span-2 text-right">
            <motion.button 
              disabled={saving}
              whileTap={saving ? {} : { scale: 0.95 }}
              type="submit" 
              className={`bg-[#F4511E] text-white px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 ml-auto ${saving ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {saving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : 'SAVE ITEM'}
            </motion.button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold mb-2">Your menu is empty</h3>
          <p className="text-gray-500">Add your first menu item to start accepting orders.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold">Item</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold text-right">Price</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="p-4 flex items-center gap-4">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                    <div>
                      <p className="font-bold text-[#111111]">{item.name}</p>
                      {item.isVegetarian && <span className="text-[10px] text-green-600 font-bold">VEG</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4 text-right font-bold">₹{item.price}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggle(item.id, item.isAvailable)}
                      className={`px-4 py-1 rounded font-bold text-sm ${item.isAvailable ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
