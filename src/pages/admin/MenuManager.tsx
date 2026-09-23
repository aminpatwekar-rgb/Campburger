import React, { useEffect, useState, useRef } from 'react';
import { fetchMenu, createMenuItem, updateMenuItem, updateMenuAvailability, deleteMenuItem, fetchUploads, uploadImage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MenuItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Trash2, AlertTriangle, X, UploadCloud, Copy, Check, Plus, FolderOpen, Pencil } from 'lucide-react';
import ImageUploadBox from '../../components/ImageUploadBox';

export default function MenuManager() {
  const { idToken } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploads, setUploads] = useState<Array<{ filename: string; url: string; size: number; createdAt: string }>>([]);
  const [uploadingStandalone, setUploadingStandalone] = useState(false);
  const [standaloneDragging, setStandaloneDragging] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const standaloneInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isVegetarian: false
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    isVegetarian: false,
    isAvailable: true
  });

  const loadMenu = () => {
    fetchMenu().then(setItems).catch(console.error);
  };

  const loadUploads = () => {
    if (!idToken) return;
    fetchUploads(idToken)
      .then(setUploads)
      .catch((err) => console.error("Could not load uploads:", err));
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (idToken) {
      loadUploads();
    }
  }, [idToken]);

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

  const handleDelete = async () => {
    if (!idToken || !itemToDelete) return;
    setDeleting(true);
    try {
      await deleteMenuItem(itemToDelete.id, idToken);
      showToast(`"${itemToDelete.name}" deleted from menu`, 'success');
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to delete item', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStandaloneUpload = async (file: File) => {
    if (!idToken) {
      showToast('Please sign in as admin to upload images', 'error');
      return;
    }
    setUploadingStandalone(true);
    try {
      await uploadImage(file, idToken);
      showToast(`Image "${file.name}" uploaded successfully!`, 'success');
      loadUploads();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingStandalone(false);
      if (standaloneInputRef.current) {
        standaloneInputRef.current.value = '';
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    showToast('Image URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const useImageForNewItem = (url: string, filename?: string) => {
    setShowAdd(true);
    let inferredName = '';
    if (filename) {
      inferredName = filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      name: prev.name || inferredName
    }));
    window.scrollTo({ top: 120, behavior: 'smooth' });
    showToast('Image selected for new menu item!', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    if (!formData.imageUrl) {
      showToast('Please provide an image for the menu item', 'error');
      return;
    }
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

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl,
      isVegetarian: item.isVegetarian,
      isAvailable: item.isAvailable
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !editingItem) return;
    if (!editFormData.imageUrl) {
      showToast('Please provide an image for the menu item', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await updateMenuItem(editingItem.id, {
        ...editFormData,
        price: parseInt(editFormData.price)
      }, idToken);
      showToast(`"${editFormData.name}" updated successfully!`, 'success');
      setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...updated } : item));
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update item', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage food items, prices, and upload image assets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowUploader(!showUploader);
              if (!showUploader) loadUploads();
            }}
            className={`px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all border shadow-sm ${
              showUploader
                ? 'bg-orange-50 border-[#F4511E] text-[#F4511E]'
                : 'bg-white border-gray-200 text-[#111111] hover:bg-gray-50'
            }`}
          >
            <UploadCloud size={18} className="text-[#F4511E]" />
            {showUploader ? 'HIDE IMAGE BOX' : 'UPLOAD IMAGES'}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#111111] hover:bg-[#222222] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm"
          >
            {showAdd ? 'CANCEL' : '+ ADD MENU ITEM'}
          </button>
        </div>
      </div>

      {/* Standalone Image Upload Box */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#F4511E] flex items-center justify-center">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111111]">Image Upload Center</h2>
                    <p className="text-xs text-gray-500">
                      Upload images of every file type (PNG, JPG, WEBP, SVG, GIF, AVIF, BMP, ICO, TIFF, HEIC)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setStandaloneDragging(true);
                }}
                onDragLeave={() => setStandaloneDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setStandaloneDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleStandaloneUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => !uploadingStandalone && standaloneInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  standaloneDragging
                    ? 'border-[#F4511E] bg-orange-50/60 scale-[1.01]'
                    : 'border-gray-300 hover:border-[#F4511E] bg-gray-50/50 hover:bg-orange-50/20'
                } ${uploadingStandalone ? 'pointer-events-none opacity-80' : ''}`}
              >
                <input
                  ref={standaloneInputRef}
                  type="file"
                  accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .avif, .bmp, .ico, .tiff, .tif, .heic, .heif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleStandaloneUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {uploadingStandalone ? (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-[#F4511E]" size={36} />
                    <p className="text-sm font-bold text-gray-700">Uploading and saving image...</p>
                    <p className="text-xs text-gray-400">Storing image in server uploads</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#F4511E] flex items-center justify-center">
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">
                        <span className="text-[#F4511E]">Click to upload</span> or drag and drop image here
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Any image format accepted: PNG, JPG, JPEG, WEBP, SVG, GIF, AVIF, BMP, ICO, TIFF, HEIC
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Uploaded Images Gallery */}
              {uploads.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <FolderOpen size={16} className="text-[#F4511E]" />
                      Uploaded Image Assets ({uploads.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {uploads.map((upload) => (
                      <div
                        key={upload.filename}
                        className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0 relative">
                          <img
                            src={upload.url}
                            alt={upload.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate" title={upload.filename}>
                            {upload.filename}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {(upload.size / 1024).toFixed(1)} KB
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(upload.url)}
                              className="text-[11px] font-bold text-gray-600 hover:text-[#F4511E] flex items-center gap-1 transition-colors"
                              title="Copy URL"
                            >
                              {copiedUrl === upload.url ? (
                                <><Check size={12} className="text-emerald-600" /> Copied</>
                              ) : (
                                <><Copy size={12} /> Copy URL</>
                              )}
                            </button>
                            <span className="text-gray-300">•</span>
                            <button
                              type="button"
                              onClick={() => useImageForNewItem(upload.url, upload.filename)}
                              className="text-[11px] font-bold text-[#F4511E] hover:underline flex items-center gap-0.5"
                            >
                              <Plus size={12} /> Use for item
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Menu Item Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Item Name</label>
              <input
                required
                placeholder="e.g. Crispy Tandoori Burger"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Category</label>
              <input
                required
                placeholder="Burgers, Combos, Sides, Drinks, Desserts"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Price (₹)</label>
              <input
                required
                type="number"
                placeholder="Price in INR"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                required
                placeholder="Short mouth-watering description of the item"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer font-bold text-sm text-gray-800 pt-2">
              <input
                type="checkbox"
                checked={formData.isVegetarian}
                onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                className="w-5 h-5 accent-[#111111] rounded"
              />
              <span>Vegetarian Item (shows green veg symbol)</span>
            </label>
          </div>

          <div className="space-y-4 flex flex-col">
            <ImageUploadBox
              value={formData.imageUrl}
              onChange={(url) => setFormData({...formData, imageUrl: url})}
              idToken={idToken}
              required
              label="Item Image (Upload Any Format)"
            />

            <div className="mt-auto pt-6 text-right flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-6 py-3 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <motion.button 
                disabled={saving}
                whileTap={saving ? {} : { scale: 0.95 }}
                type="submit" 
                className={`bg-[#F4511E] text-white px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm ${saving ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {saving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : 'SAVE MENU ITEM'}
              </motion.button>
            </div>
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
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleToggle(item.id, item.isAvailable)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${item.isAvailable ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                      >
                        {item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => handleStartEdit(item)}
                        title="Edit item"
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        title="Delete item"
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !savingEdit && setEditingItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 z-10 max-h-[92vh] overflow-y-auto"
            >
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditingItem(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#111111]">Edit Menu Item</h3>
                  <p className="text-xs text-gray-500">Update item details, pricing, availability, and photo</p>
                </div>
              </div>

              <form onSubmit={handleUpdateSubmit} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Item Name</label>
                    <input
                      required
                      placeholder="e.g. Veg Cheese Burger"
                      value={editFormData.name}
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Category</label>
                    <input
                      required
                      placeholder="Burgers, Combos, Sides, Drinks"
                      value={editFormData.category}
                      onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Price (₹)</label>
                    <input
                      required
                      type="number"
                      placeholder="Price in INR"
                      value={editFormData.price}
                      onChange={e => setEditFormData({...editFormData, price: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      required
                      placeholder="Delicious description"
                      value={editFormData.description}
                      onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F4511E] focus:outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="pt-1 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer font-bold text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={editFormData.isVegetarian}
                        onChange={e => setEditFormData({...editFormData, isVegetarian: e.target.checked})}
                        className="w-5 h-5 accent-[#111111] rounded"
                      />
                      <span>Vegetarian Item</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer font-bold text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={editFormData.isAvailable}
                        onChange={e => setEditFormData({...editFormData, isAvailable: e.target.checked})}
                        className="w-5 h-5 accent-[#111111] rounded"
                      />
                      <span>In Stock (Available for ordering)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col">
                  <ImageUploadBox
                    value={editFormData.imageUrl}
                    onChange={(url) => setEditFormData({...editFormData, imageUrl: url})}
                    idToken={idToken}
                    required
                    label="Item Image (Upload New or Keep Existing)"
                  />

                  <div className="mt-auto pt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => setEditingItem(null)}
                      className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={savingEdit ? {} : { scale: 0.96 }}
                      disabled={savingEdit}
                      type="submit"
                      className="px-7 py-2.5 rounded-full text-sm font-bold text-white bg-[#F4511E] hover:bg-[#d84315] flex items-center gap-2 shadow-sm shadow-orange-200 disabled:opacity-60 transition-colors"
                    >
                      {savingEdit ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setItemToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10"
            >
              <button
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <h3 className="text-xl font-extrabold text-[#111111]">Delete Menu Item?</h3>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl mb-5 border border-gray-100">
                <img
                  src={itemToDelete.imageUrl}
                  alt={itemToDelete.name}
                  className="w-14 h-14 rounded-xl object-cover bg-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#111111] truncate">{itemToDelete.name}</h4>
                  <p className="text-xs text-gray-500">{itemToDelete.category} • ₹{itemToDelete.price}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to permanently remove this item from the menu? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={deleting ? {} : { scale: 0.96 }}
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 shadow-sm shadow-red-200 disabled:opacity-60 transition-colors"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Item
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
