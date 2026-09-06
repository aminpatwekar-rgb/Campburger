import React, { useEffect, useState } from 'react';
import { fetchMenu } from '../api';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag } from 'lucide-react';

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { addToCart, cart, updateQuantity } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    fetchMenu().then(data => {
      setItems(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const categories = [
    { id: 'All', label: 'All', emoji: '🍔' },
    { id: 'Burgers', label: 'Burgers', emoji: '🍔' },
    { id: 'Sides', label: 'Sides', emoji: '🍟' },
    { id: 'Drinks', label: 'Drinks', emoji: '🥤' },
    { id: 'Combos', label: 'Combos', emoji: '🍱' },
    { id: 'Desserts', label: 'Desserts', emoji: '🍦' },
  ];

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(i => i.category === activeCategory);

  const getCartQuantity = (itemId: number) => {
    const found = cart.find(c => c.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#FFF8F0] min-h-screen pb-24"
    >
      <div className="bg-[#0A0A0A] pt-16 pb-8 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">MENU</h1>
          <p className="text-gray-400 mb-8">Fire-grilled favorites, camp-side since day one.</p>
          
          {/* Categories */}
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? "text-white" 
                    : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                {activeCategory === cat.id && (
                  <motion.div 
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-[#F4511E] rounded-full shadow-[0_0_15px_rgba(244,81,30,0.4)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-lg">{cat.emoji}</span>
                <span className="relative z-10">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3,4,5,6].map(n => (
               <div key={n} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse h-[400px]">
                 <div className="aspect-[4/3] bg-gray-200"></div>
                 <div className="p-6">
                   <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                   <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                   <div className="h-4 bg-gray-200 rounded w-4/5 mb-6"></div>
                   <div className="h-10 bg-gray-200 rounded-full w-24 mt-auto float-right"></div>
                 </div>
               </div>
             ))}
           </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 px-6 bg-white rounded-3xl border border-gray-200 text-center max-w-2xl mx-auto shadow-sm"
          >
            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-3xl font-extrabold mb-4 text-[#111111]">Menu Coming Soon</h3>
            <p className="text-gray-500 text-lg">We haven't added any items to our menu just yet. Please check back shortly to place your order.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => {
                const qty = getCartQuantity(item.id);
                
                return (
                  <motion.div 
                    key={item.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 flex flex-col group transition-shadow duration-300"
                  >
                    <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
                      <motion.img 
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="text-white font-bold tracking-widest text-sm border-2 border-white px-4 py-2 rounded">OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#F4511E] transition-colors">{item.name}</h3>
                        {item.isVegetarian && <span className="text-green-700 bg-green-100 text-[10px] font-bold px-2 py-1 rounded border border-green-200">VEG</span>}
                      </div>
                      <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-1 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto h-12">
                        <span className="text-2xl font-extrabold text-[#111111]">₹{item.price}</span>
                        
                        {!item.isAvailable ? (
                          <button disabled className="bg-gray-100 text-gray-400 px-6 py-2.5 rounded-full font-bold text-sm cursor-not-allowed">
                            UNAVAILABLE
                          </button>
                        ) : qty > 0 ? (
                          <div className="flex items-center bg-[#111111] text-white rounded-full overflow-hidden shadow-md">
                            <motion.button whileTap={{ backgroundColor: '#1f2937' }} onClick={() => updateQuantity(item.id, -1)} className="px-4 py-2 hover:bg-gray-800 transition-colors font-bold text-lg">−</motion.button>
                            <AnimatePresence mode="popLayout">
                               <motion.span 
                                 key={qty}
                                 initial={{ y: -10, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 exit={{ y: 10, opacity: 0 }}
                                 className="px-4 font-bold inline-block"
                               >
                                 {qty}
                               </motion.span>
                            </AnimatePresence>
                            <motion.button whileTap={{ backgroundColor: '#1f2937' }} onClick={() => updateQuantity(item.id, 1)} className="px-4 py-2 hover:bg-gray-800 transition-colors font-bold text-lg">+</motion.button>
                          </div>
                        ) : (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              addToCart(item);
                              showToast(`${item.name} added to cart`);
                            }}
                            className="bg-[#F4511E] hover:bg-[#d84013] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg"
                          >
                            + ADD
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
