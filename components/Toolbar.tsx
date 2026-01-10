
import React from 'react';
import { Theme, ThemeType, AppMode } from '../types.ts';

interface ToolbarProps {
  theme: ThemeType;
  mode: AppMode;
  onSettingsClick: () => void;
  onAction: (type: string) => void;
  isHidden?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  elementsCount: number;
}

export default function Toolbar({ 
  theme, mode, onSettingsClick, onAction, isHidden, canUndo, canRedo, elementsCount 
}: ToolbarProps) {
  const isDayMode = theme === Theme.LIGHT;
  
  const toolbarBg = isDayMode 
    ? "bg-[#000000]/95 border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
    : "bg-[#f5f5f7]/95 border-b border-black/5 shadow-[0_4px_15px_rgba(0,0,0,0.05)]";

  const textColor = isDayMode ? "text-white" : "text-black";
  
  const btnBase = (isActive: boolean, activeColor: string) => `
    relative flex items-center justify-center 
    w-[36px] h-[36px] md:w-[40px] md:h-[40px] 
    rounded-[12px] transition-all duration-300 
    ${isActive ? `${activeColor} text-white shadow-lg scale-105` : 'active:scale-95'}
    overflow-visible
  `;
  
  const groupBg = isDayMode ? "bg-white/5" : "bg-black/5";
  const hoverStyle = isDayMode ? "hover:bg-white/10" : "hover:bg-black/5";
  const iconSize = "w-[22px] h-[22px] md:w-[24px] md:h-[24px]";

  return (
    <div 
      id="toolbar" 
      className={`
        fixed top-0 left-0 right-0 z-[1000]
        h-[56px] md:h-[64px] px-3 md:px-6
        flex items-center justify-between
        backdrop-blur-3xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${toolbarBg} ${textColor}
        ${isHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
      `}
    >
      <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar">
        <div className={`flex items-center gap-0.5 p-1 rounded-[16px] ${groupBg}`}>
          <button className={`${btnBase(false, '')} ${hoverStyle}`} onClick={() => onAction('add')} title="إضافة">
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
          </button>
          <button 
            className={`${btnBase(mode === 'delete', 'bg-[#8b0000]')} ${mode !== 'delete' ? hoverStyle : ''}`} 
            onClick={() => onAction('delete')} 
            title="حذف"
          >
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
          </button>
          <button 
            className={`${btnBase(mode === 'edit', 'bg-[#800000]')} ${mode !== 'edit' ? hoverStyle : ''}`} 
            onClick={() => onAction('edit')} 
            title="تعديل"
          >
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
          </button>
        </div>

        <div className={`flex items-center gap-0.5 p-1 rounded-[16px] ${groupBg}`}>
          <button className={`${btnBase(false, '')} ${hoverStyle}`} onClick={() => onAction('first')} title="البوصلة">
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M12,2L15.09,8.26L22,9.27L17,14.14L18.18,21.02L12,17.77L5.82,21.02L7,14.14L2,9.27L8.91,8.26L12,2Z"/></svg>
            {elementsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                {elementsCount}
              </span>
            )}
          </button>
          <button className={`${btnBase(false, '')} ${hoverStyle}`} onClick={() => onAction('preview')} title="معاينة">
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
          </button>
        </div>

        <div className={`flex items-center gap-0.5 p-1 rounded-[16px] ${groupBg}`}>
          <button 
            className={`${btnBase(false, '')} ${canUndo ? hoverStyle : 'opacity-20 cursor-not-allowed'}`} 
            onClick={() => canUndo && onAction('undo')} 
            disabled={!canUndo}
            title="تراجع"
          >
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"/></svg>
          </button>
          <button 
            className={`${btnBase(false, '')} ${canRedo ? hoverStyle : 'opacity-20 cursor-not-allowed'}`} 
            onClick={() => canRedo && onAction('redo')} 
            disabled={!canRedo}
            title="تقديم"
          >
            <svg className={iconSize} viewBox="0 0 24 24"><path fill="currentColor" d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-none">
        <div className={`p-1 rounded-[16px] ${groupBg}`}>
          <button onClick={onSettingsClick} className={`${btnBase(false, '')} ${hoverStyle} group`} aria-label="Settings">
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="17" x2="20" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
