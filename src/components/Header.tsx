import React from 'react';
import { Wallet } from 'lucide-react';

interface HeaderProps {
  totalBurn: number;
}

export const Header: React.FC<HeaderProps> = ({ totalBurn }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">
          SubViz
        </h1>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
          Total Monthly Burn
        </span>
        <span className="text-2xl font-black text-white tabular-nums drop-shadow-sm">
          {formatCurrency(totalBurn)}
        </span>
      </div>
    </header>
  );
};
