import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OnboardingModal() {
  const { isNewUserSession, clearNewUserSession, idToken, updateDbUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: 'Burgers', icon: '🍔' },
    { name: 'Sides', icon: '🍟' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Combos', icon: '🍱' },
    { name: 'Desserts', icon: '🍦' },
  ];

  const handleSelect = async (category: string) => {
    if (!idToken) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ favoriteCategory: category })
      });
      
      if (res.ok) {
        updateDbUser({ favoriteCategory: category });
        addToast(`Awesome! We'll show you more ${category}.`, "success");
        clearNewUserSession();
      } else {
        throw new Error('Failed to update favorite category');
      }
    } catch (error) {
      console.error(error);
      addToast("Something went wrong.", "error");
      clearNewUserSession();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isNewUserSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0A0A0A] rounded-3xl p-8 border border-white/10 shadow-2xl text-white text-center overflow-hidden"
          >
            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white">
                What are you <span className="text-[#F4511E]">craving?</span>
              </h2>
              <p className="text-gray-400 text-sm">
                Pick your favorite and we'll personalize your menu.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
              {categories.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => handleSelect(cat.name)}
                  disabled={loading}
                  className={`
                    ${idx === categories.length - 1 && categories.length % 2 !== 0 ? 'col-span-2' : ''}
                    group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                    bg-white/5 border border-white/10 hover:bg-[#F4511E] hover:border-[#F4511E]
                    transition-all duration-300 disabled:opacity-50
                  `}
                >
                  <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                  <span className="font-bold text-sm">{cat.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={clearNewUserSession}
              disabled={loading}
              className="text-gray-500 hover:text-white text-sm font-bold tracking-wide underline decoration-transparent hover:decoration-white transition-all relative z-10"
            >
              Skip for now
            </button>
            
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#F4511E] opacity-20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#F4511E] opacity-20 blur-[100px] rounded-full pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
