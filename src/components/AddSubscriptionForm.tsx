'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface AddSubscriptionFormProps {
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
}

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Add Subscription</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Subscription Name
                </label>
                <input
                  type="text"
                  maxLength={20}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Netflix, Spotify, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Monthly Cost (Rp)
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
                  placeholder="50.000"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                Add Bubble
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
