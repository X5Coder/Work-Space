
import React from 'react';
import { Theme, ThemeType } from '../types.ts';

interface SettingsDialogProps {
  isOpen: boolean;
  isClosing: boolean;
  activeTheme: ThemeType;
  onClose: () => void;
  onThemeSelect: (theme: ThemeType) => void;
}

export default function SettingsDialog({ isOpen, isClosing, activeTheme, onClose, onThemeSelect }: SettingsDialogProps) {
  if (!isOpen) return null;

  const overlayClass = isClosing ? 'animate-fadeOut' : 'animate-fadeIn';
  const dialogClass = isClosing ? 'animate-dialog-hide' : 'animate-dialog-show';

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 backdrop-blur-md z-[1100] ${overlayClass}`} onClick={onClose} />

      <div 
        className={`fixed top-1/2 left-1/2 z-[1101] w-[90%] max-w-[480px] rounded-[36px] overflow-hidden ${dialogClass}`}
        style={{ 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.4)',
        }}
      >
        <div className="p-8 pt-10 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">اختر المظهر</h3>
          <p className="text-gray-500 text-xs font-medium opacity-60 mb-8 uppercase tracking-widest">Workspace Customization</p>
          
          <div className="flex flex-row justify-center gap-3">
            <ThemeCard 
              active={activeTheme === Theme.DARK} 
              themeName="داكن" 
              colorClass="bg-zinc-900 shadow-zinc-900/40"
              onClick={() => onThemeSelect(Theme.DARK)} 
            />
            <ThemeCard 
              active={activeTheme === Theme.LIGHT} 
              themeName="فاتح" 
              colorClass="bg-white shadow-gray-200"
              onClick={() => onThemeSelect(Theme.LIGHT)} 
            />
            <ThemeCard 
              active={activeTheme === Theme.MEDIUM} 
              themeName="مريح" 
              colorClass="bg-[#1a1a1a] shadow-blue-900/20 border border-white/5"
              onClick={() => onThemeSelect(Theme.MEDIUM)} 
            />
          </div>

          <div className="mt-10 pt-6 border-t border-black/5 flex justify-between items-center opacity-40">
            <span className="text-[10px] font-bold tracking-[3px] text-gray-500">PRO VERSION 2.5</span>
            <span className="text-[10px] font-mono text-[#6b46ff]">𝐊𝐈𝐌𝐎 𝐂𝐎𝐃𝐄𝐑</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ThemeCard({ active, themeName, colorClass, onClick }: { active: boolean, themeName: string, colorClass: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-3 transition-all duration-500 ${active ? 'scale-105' : 'hover:scale-[1.02] opacity-60 hover:opacity-100'}`}
    >
      <div className={`w-20 h-28 rounded-[20px] ${colorClass} ${active ? 'shadow-2xl ring-4 ring-[#6b46ff]/30 scale-100' : 'shadow-lg'} transition-all duration-500 flex flex-col items-center justify-center gap-1 overflow-hidden`}>
        <div className={`w-12 h-1.5 rounded-full ${active ? 'bg-[#6b46ff]/30' : 'bg-gray-400/20'}`} />
        <div className={`w-8 h-1.5 rounded-full ${active ? 'bg-[#6b46ff]/20' : 'bg-gray-400/10'}`} />
        <div className="absolute bottom-3 w-8 h-8 rounded-full border-[1.5px] border-white/10 flex items-center justify-center">
            {active && <div className="w-4 h-4 rounded-full bg-[#6b46ff] animate-pulse" />}
        </div>
      </div>
      <span className={`text-[12px] font-bold transition-colors duration-300 ${active ? 'text-[#6b46ff]' : 'text-gray-500'}`}>{themeName}</span>
    </button>
  );
}
