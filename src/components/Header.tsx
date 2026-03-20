'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  totalBurn: number;
}

const BubbleClusterLogo = () => (
  <div className="relative w-9 h-9 flex items-center justify-center group pointer-events-none">
    <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full scale-150 animate-pulse" />
    <svg viewBox="0 0 40 40" className="w-full h-full relative z-10 drop-shadow-2xl">
      <defs>
        <linearGradient id="bubble1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="bubble2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="18" r="10" fill="url(#bubble1)" className="opacity-80 translate-x-1" />
      <circle cx="14" cy="24" r="8" fill="url(#bubble2)" className="opacity-70 -translate-y-1" />
      <circle cx="26" cy="26" r="12" fill="rgba(99, 102, 241, 0.4)" className="backdrop-blur-sm" />
    </svg>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ totalBurn }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl px-8 py-4 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-rose-500/5 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <BubbleClusterLogo />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter leading-none italic">
              Messy
            </h1>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">
              The Beautiful Mess of Your Subscriptions
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">
            Monthly Burn
          </span>
          <motion.span 
            key={totalBurn}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-white tabular-nums tracking-tight"
          >
            {formatCurrency(totalBurn)}
          </motion.span>
        </div>
      </div>
    </header>
  );
};
