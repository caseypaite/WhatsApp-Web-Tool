import React from 'react';
import { X, AlertCircle, Check } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg', flash }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white w-full ${maxWidth} shadow-xl my-8 border border-[#dcdcde] animate-in zoom-in-95 duration-200 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]">
          <h2 className="text-sm font-semibold text-[#1d2327]">{title}</h2>
          <button type="button" 
            onClick={onClose}
            className="p-1 text-[#646970] hover:text-[#d63638] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {subtitle && <p className="text-xs text-[#646970] mb-4 italic">{subtitle}</p>}

          {flash && (
            <div className={`mb-4 p-3 border-l-4 shadow-sm animate-in fade-in duration-200 ${
              flash.type === 'error' ? 'bg-[#fcf0f1] border-[#d63638] text-[#d63638]' : 'bg-[#edfaef] border-[#00a32a] text-[#00a32a]'
            }`}>
              <div className="flex items-center gap-2">
                {flash.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <p className="text-sm font-medium">{flash.message}</p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
