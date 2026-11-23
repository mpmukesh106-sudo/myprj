import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full ${maxWidth} rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#0b132b]/80">
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto p-6 text-sm text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
