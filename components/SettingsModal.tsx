
import React from 'react';
import { Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  isClosing: boolean;
  activeTheme: Theme;
  onClose: () => void;
  onThemeSelect: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  isClosing,
  activeTheme,
  onClose,
  onThemeSelect
}) => {
  if (!isOpen) return null;

  const overlayAnimation = isClosing ? "animate-fadeOut" : "animate-fadeIn";
  const dialogAnimation = isClosing ? "animate-light-out" : "animate-light-in";

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-md transition-all pointer-events-auto ${overlayAnimation}`}
        onClick={onClose}
      />
      
      {/* Modal Content - Minimalist centering */}
      <div 
        className={`relative w-[calc(100%-48px)] max-w-[400px] rounded-[48px] overflow-hidden shadow-[0_30px_90px_-15px_rgba(0,0,0,0.6)] pointer-events-auto ${dialogAnimation}`}
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}
      >
        <div className="p-10 pt-14 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all active:scale-90"
          >
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">المظهر</h3>
          <p className="text-gray-500 text-[11px] font-black uppercase tracking-[4px] mb-12 opacity-50">تخصيص البيئة</p>

          <div className="grid grid-cols-3 gap-5">
            <ThemeOption 
              active={activeTheme === Theme.DARK}
              themeName="داكن"
              colorClass="bg-[#0c0c0c] border border-white/5 shadow-2xl"
              onClick={() => onThemeSelect(Theme.DARK)}
            />
            <ThemeOption 
              active={activeTheme === Theme.LIGHT}
              themeName="فاتح"
              colorClass="bg-white border border-gray-200 shadow-xl"
              onClick={() => onThemeSelect(Theme.LIGHT)}
            />
            <ThemeOption 
              active={activeTheme === Theme.MEDIUM}
              themeName="مريح"
              colorClass="bg-[#1a1a1a] border border-indigo-500/10 shadow-xl"
              onClick={() => onThemeSelect(Theme.MEDIUM)}
            />
          </div>

          <div className="mt-14 pt-8 border-t border-black/5 flex justify-between items-center opacity-20">
            <span className="text-[10px] font-black tracking-[4px] text-gray-500 uppercase">CREATIVE PRO</span>
            <span className="text-[10px] font-mono font-black text-[#6b46ff]">WORKSPACE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeOption: React.FC<{
  active: boolean;
  themeName: string;
  colorClass: string;
  onClick: () => void;
}> = ({ active, themeName, colorClass, onClick }) => (
  <button 
    onClick={onClick}
    className={`group flex flex-col items-center gap-4 transition-all duration-300 ${active ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className={`w-full aspect-[4/5] rounded-[28px] ${colorClass} flex items-center justify-center transition-all ${active ? 'ring-4 ring-indigo-500/30' : ''}`}>
       <div className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
         <div className="w-6 h-6 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-pulse" />
       </div>
    </div>
    <span className={`text-[13px] font-black transition-colors ${active ? 'text-indigo-600' : 'text-gray-500'}`}>{themeName}</span>
  </button>
);
