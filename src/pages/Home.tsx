import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMenu } from '../api';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { Flame, Star, Zap, MapPin } from 'lucide-react';

export default function Home() {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [pickedItems, setPickedItems] = useState<MenuItem[]>([]);
  const { addToCart } = useCart();
  const { dbUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu().then(data => {
      setPopularItems(data.slice(0, 3));
      
      if (dbUser?.favoriteCategory) {
        const matching = data.filter(item => item.category.toLowerCase() === dbUser.favoriteCategory.toLowerCase());
        setPickedItems(matching.slice(0, 3));
      } else {
        setPickedItems([]);
      }
      
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [dbUser?.favoriteCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen bg-[#FFF8F0]"
    >
      {/* Hero Section */}
      <section className="bg-[#0A0A0A] text-white py-16 md:py-24 px-6 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F4511E]/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[#F4511E] font-bold tracking-widest text-sm mb-4 block uppercase">
              Camp New Burger
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
              BURGERS.<br/>FRIES.<br/>COMBOS.<br/>
              <span className="text-[#F4511E]">MADE FRESH.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-md leading-relaxed">
              Premium ingredients, bold flavors, and quick service. Order your perfect meal right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/menu" className="group relative bg-[#F4511E] text-white px-8 py-4 rounded-full font-bold text-lg text-center overflow-hidden transition-all shadow-[0_0_20px_rgba(244,81,30,0.3)] hover:shadow-[0_0_30px_rgba(244,81,30,0.5)]">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  ORDER NOW
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </Link>
              <Link to="/menu" className="bg-transparent border border-white/20 hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold text-lg text-center transition-colors">
                VIEW MENU
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="aspect-square bg-gradient-to-tr from-gray-900 to-[#1a1a1a] rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center relative border border-white/5"
            >
              <img 
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop" 
                alt="Premium Burger" 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none"></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Picked for You */}
      {dbUser?.favoriteCategory && pickedItems.length > 0 && !loading && (
        <section className="pt-20 pb-4 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#111111] tracking-tight">
                  PICKED FOR YOU: <span className="text-[#F4511E] uppercase">{dbUser.favoriteCategory}</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">Because you told us what you're craving.</p>
              </motion.div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {pickedItems.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 flex flex-col group transition-shadow duration-300 relative"
                >
                  <div className="absolute top-4 left-4 z-10 bg-[#F4511E] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-[#F4511E]">
                    TOP PICK
                  </div>
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#F4511E] transition-colors mb-2">{item.name}</h3>
                    <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-extrabold text-[#111111]">₹{item.price}</span>
                      <motion.button 
                        whileTap={item.isAvailable ? { scale: 0.95 } : {}}
                        onClick={() => {
                          addToCart(item);
                          showToast(`${item.name} added to cart`);
                        }}
                        disabled={!item.isAvailable}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                          item.isAvailable 
                            ? "bg-[#111111] hover:bg-[#F4511E] text-white shadow-md group-hover:shadow-lg" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        + ADD
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Items */}
      <section className={`${dbUser?.favoriteCategory && pickedItems.length > 0 ? 'pt-10' : 'py-20'} pb-20 px-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">POPULAR ITEMS</h2>
              <p className="text-gray-500 mt-2 font-medium">Customer favorites ready for you.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-6 md:mt-0"
            >
              <Link to="/menu" className="text-[#F4511E] font-bold hover:text-[#d84013] flex items-center gap-1 transition-colors">
                SEE FULL MENU <span aria-hidden="true">&rarr;</span>
              </Link>
            </motion.div>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
               {[1,2,3].map(n => (
                 <div key={n} className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col animate-pulse h-96">
                   <div className="aspect-[4/3] bg-gray-200"></div>
                   <div className="p-6">
                     <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                     <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                   </div>
                 </div>
               ))}
            </div>
          ) : popularItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="py-16 px-6 bg-white rounded-3xl border border-gray-200 text-center max-w-2xl mx-auto shadow-sm"
            >
              <div className="text-5xl mb-4">🍔</div>
              <h3 className="text-2xl font-bold mb-2 text-[#111111]">MENU COMING SOON</h3>
              <p className="text-gray-500 mb-6">We're cooking up something special. Check back shortly!</p>
              <Link to="/" className="bg-[#111111] hover:bg-gray-800 text-white px-8 py-3 rounded-full font-bold transition-colors inline-block">
                CHECK BACK SOON
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {popularItems.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 flex flex-col group transition-shadow duration-300"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold tracking-widest text-sm border-2 border-white px-4 py-2 rounded">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#F4511E] transition-colors">{item.name}</h3>
                      {item.isVegetarian && <span className="text-green-700 bg-green-100 text-[10px] font-bold px-2 py-1 rounded border border-green-200">VEG</span>}
                    </div>
                    <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-extrabold text-[#111111]">₹{item.price}</span>
                      <motion.button 
                        whileTap={item.isAvailable ? { scale: 0.95 } : {}}
                        onClick={() => {
                          addToCart(item);
                          showToast(`${item.name} added to cart`);
                        }}
                        disabled={!item.isAvailable}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                          item.isAvailable 
                            ? "bg-[#111111] hover:bg-[#F4511E] text-white shadow-md group-hover:shadow-lg" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        + ADD
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-[#0A0A0A] text-white">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">WHY CAMP NEW BURGER</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">We focus on the things that matter. Good food, bold flavors, and satisfying portions.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4511E]/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 text-[#F4511E]">
                <Flame size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-wide">Made to Order</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Prepared fresh when you place your order. Quality ingredients crafted into perfect meals.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4511E]/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 text-[#F4511E]">
                <Star size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-wide">Bold Flavors</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Signature recipes engineered to hit the spot perfectly. Every bite is packed with taste.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4511E]/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 text-[#F4511E]">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-wide">Fast & Hot</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Quick service designed for your busy life. Perfect for pickup or local delivery.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>
      
      {/* Location */}
      <section id="location" className="py-24 px-6 border-t border-gray-200">
         <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <div className="w-12 h-12 bg-orange-100 text-[#F4511E] rounded-xl flex items-center justify-center mb-6">
               <MapPin size={24} />
             </div>
             <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#111111] tracking-tight">VISIT US</h2>
             <p className="text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
               Drop by our location in Loni Kalbhor for the best burgers in town. Dine-in, pickup, and delivery available.
             </p>
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
               <h4 className="font-bold text-[#111111] text-lg mb-2">Camp New Burger</h4>
               <p className="text-gray-600 mb-1">Pune-Solapur Road</p>
               <p className="text-gray-600">Loni Kalbhor, Pune</p>
             </div>
             
             <motion.a 
               href="https://maps.google.com/?q=Loni+Kalbhor,+Pune" 
               target="_blank"
               rel="noopener noreferrer"
               whileHover={{ y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="inline-block bg-[#111111] hover:bg-[#F4511E] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-md hover:shadow-xl"
             >
                GET DIRECTIONS
             </motion.a>
           </motion.div>
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="h-full min-h-[400px] bg-gray-100 rounded-3xl overflow-hidden relative shadow-inner border border-gray-200"
           >
             {/* Map Placeholder representing real integration */}
             <div className="absolute inset-0 bg-[#e5e3df] flex flex-col items-center justify-center">
               <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" alt="Map representation" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#F4511E] text-white rounded-full flex items-center justify-center shadow-xl animate-bounce">
                    <MapPin size={32} />
                  </div>
                  <div className="mt-2 bg-white px-4 py-2 rounded-lg shadow-md font-bold text-[#111111]">
                    We are here
                  </div>
               </div>
             </div>
           </motion.div>
         </div>
      </section>
    </motion.div>
  );
}
