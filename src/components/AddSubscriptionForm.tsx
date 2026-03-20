'use client';

import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { motion, AnimatePresence } from 'framer-motion';

interface AddSubscriptionFormProps {
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
}

const COLORS = [
  '#818CF8', // indigo-400
  '#F472B6', // pink-400
  '#FBBF24', // amber-400
  '#34D399', // emerald-400
  '#60A5FA', // blue-400
  '#A78BFA', // violet-400
  '#F87171', // red-400
  '#22D3EE', // cyan-400
];

export const AddSubscriptionForm: React.FC<AddSubscriptionFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    onAdd({
      name,
      price: parseFloat(price.replace(/[^0-9]/g, '')),
      color: randomColor,
    });

    setName('');
    setPrice('');
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-5 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all ring-1 ring-white/20 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus className="w-8 h-8 relative z-10" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
              
              <div className="flex justify-between items-center p-8 border-zinc-800">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-2xl font-black text-white">New Buddy</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors text-xs font-bold"
                >
                  ESC
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    What is it?
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Netflix, Spotify, Gym..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Monthly Damage (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPrice(val ? parseInt(val).toLocaleString('id-ID') : '');
                    }}
                    placeholder="150.000"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full group bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-50 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                >
                  Launch Bubble
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
