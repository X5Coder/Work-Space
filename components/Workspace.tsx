
import React, { useRef, useState, useEffect } from 'react';
import { Theme, ThemeType, WorkspaceElement, AppMode } from '../types.ts';

interface WorkspaceProps {
  theme: ThemeType;
  offset: { x: number; y: number };
  onDrag: (dx: number, dy: number) => void;
  elements: WorkspaceElement[];
  mode: AppMode;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onElementUpdate: (id: string, updates: Partial<WorkspaceElement>) => void;
  onElementDelete: (id: string) => void;
  onDragEnd: () => void;
  validateDrop: (id: string, x: number, y: number, w: number, h: number) => boolean;
  setMode: (mode: AppMode) => void;
  fullHeight?: boolean;
}

export default function Workspace({ 
  theme, offset, onDrag, elements, mode, editingId, setEditingId,
  onElementUpdate, onElementDelete, onDragEnd, validateDrop, setMode, fullHeight 
}: WorkspaceProps) {
  const wsRef = useRef<HTMLDivElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  
  const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = (e.target as HTMLElement).closest('[data-element-id]');
    const isResizeHandle = (e.target as HTMLElement).classList.contains('resize-handle');
    const isEditTrigger = (e.target as HTMLElement).classList.contains('edit-trigger');
    const isBubble = (e.target as HTMLElement).closest('.edit-bubble');

    if (isBubble) return;

    if ((isResizeHandle || isEditTrigger) && target) {
      const id = target.getAttribute('data-element-id')!;
      if (isResizeHandle) {
        setIsResizing(true);
        setActiveElementId(id);
      } else {
        setEditingId(id);
        setMode('edit');
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
      e.stopPropagation();
      return;
    }

    if (target) {
      const id = target.getAttribute('data-element-id')!;
      
      if (mode === 'delete') {
        onElementDelete(id);
        return;
      }
      
      setActiveElementId(id);
      lastPos.current = { x: e.clientX, y: e.clientY };

      longPressTimer.current = window.setTimeout(() => {
        setEditingId(id);
        setMode('edit');
      }, 450);

    } else {
      setIsDraggingCanvas(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (editingId) {
        setEditingId(null);
        setMode('normal');
        onDragEnd();
      }
    }
    if (wsRef.current) wsRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    
    if (activeElementId) {
      const domEl = elementRefs.current[activeElementId];
      if (!domEl) return;

      if (isResizing) {
        const newW = domEl.offsetWidth + dx;
        const newH = domEl.offsetHeight + dy;
        
        const txtEl = textareaRefs.current[activeElementId];
        // الحجم الأدنى بناءً على محتوى النص
        const minW = txtEl ? Math.max(60, txtEl.scrollWidth + 24) : 60;
        const minH = txtEl ? Math.max(30, txtEl.scrollHeight + 16) : 30;

        domEl.style.width = `${Math.max(minW, newW)}px`;
        domEl.style.height = `${Math.max(minH, newH)}px`;
      } else if (mode === 'normal' || mode === 'edit') {
        const currentL = parseFloat(domEl.style.left);
        const currentT = parseFloat(domEl.style.top);
        domEl.style.left = `${currentL + dx}px`;
        domEl.style.top = `${currentT + dy}px`;
      }
    } else if (isDraggingCanvas) {
      onDrag(dx, dy);
    }
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (activeElementId) {
      const domEl = elementRefs.current[activeElementId];
      if (domEl) {
        const finalW = domEl.offsetWidth;
        const finalH = domEl.offsetHeight;
        const finalX = parseFloat(domEl.style.left) - offset.x;
        const finalY = parseFloat(domEl.style.top) - offset.y;

        if (!validateDrop(activeElementId, finalX, finalY, finalW, finalH)) {
          const original = elements.find(i => i.id === activeElementId);
          if (original) {
            domEl.style.left = `${original.x + offset.x}px`;
            domEl.style.top = `${original.y + offset.y}px`;
            domEl.style.width = `${original.width}px`;
            domEl.style.height = `${original.height}px`;
          }
        } else {
          onElementUpdate(activeElementId, { x: finalX, y: finalY, width: finalW, height: finalH });
        }
      }
      onDragEnd();
    }
    setIsDraggingCanvas(false);
    setActiveElementId(null);
    setIsResizing(false);
    if (wsRef.current) wsRef.current.releasePointerCapture(e.pointerId);
  };

  const gridClass = theme === Theme.LIGHT ? 'bg-grid-light' : 'bg-grid-dark';
  const bgColor = theme === Theme.LIGHT ? 'bg-white' : theme === Theme.MEDIUM ? 'bg-[#1a1a1a]' : 'bg-black';
  const permanentBorder = theme === Theme.LIGHT ? '2px solid #000000' : '2px solid #ffffff';

  return (
    <div
      ref={wsRef}
      id="workspace"
      className={`relative w-screen touch-none transition-[background-color,margin,height] duration-500 overflow-hidden ${gridClass} ${bgColor} ${fullHeight ? 'mt-0 h-screen' : 'mt-[56px] md:mt-[64px] h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]'}`}
      style={{ backgroundPosition: `${offset.x}px ${offset.y}px`, cursor: isDraggingCanvas ? 'grabbing' : 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {elements.map((el) => (
        <div
          key={el.id}
          ref={ref => elementRefs.current[el.id] = ref}
          data-element-id={el.id}
          className="absolute shadow-2xl flex items-center justify-center overflow-visible select-none"
          style={{
            left: el.x + offset.x,
            top: el.y + offset.y,
            width: el.width,
            height: el.height,
            backgroundColor: el.bgColor,
            borderRadius: el.borderRadius || '14px',
            border: editingId === el.id ? '3px solid #6b46ff' : permanentBorder,
            cursor: mode === 'normal' ? 'grab' : mode === 'delete' ? 'pointer' : 'text',
            zIndex: editingId === el.id ? 100 : 10,
            padding: '10px'
          }}
          onDoubleClick={(e) => {
            setEditingId(el.id);
            setMode('edit');
            e.stopPropagation();
          }}
        >
          {/* محتوى النص */}
          <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
             <textarea
                ref={ref => textareaRefs.current[el.id] = ref}
                className="w-full h-full bg-transparent resize-none border-none outline-none text-center leading-tight overflow-hidden pointer-events-auto"
                style={{ 
                  color: el.textColor, 
                  whiteSpace: 'pre', 
                  fontWeight: 900, 
                  fontSize: '15px',
                  fontFamily: 'inherit'
                }}
                placeholder=""
                value={el.text}
                onDoubleClick={(e) => {
                  setEditingId(el.id);
                  setMode('edit');
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  const target = e.target;
                  const neededW = target.scrollWidth + 24;
                  const neededH = target.scrollHeight + 16;
                  onElementUpdate(el.id, { 
                    text: target.value,
                    width: Math.max(el.width, neededW),
                    height: Math.max(el.height, neededH)
                  });
                }}
                disabled={editingId !== el.id}
            />
            {!el.text && (
                <span className="absolute pointer-events-none text-gray-500 opacity-50 text-[13px] font-black tracking-tight">اكتب نص هنا...</span>
            )}
          </div>

          {/* فقاقة التعديل العائمة - لون شفاف حسب المظهر */}
          {editingId === el.id && (
            <div className={`edit-bubble absolute -top-[150px] left-1/2 -translate-x-1/2 flex flex-col gap-3 p-3.5 rounded-[28px] shadow-2xl border backdrop-blur-3xl z-[200] w-[210px] animate-dialog-show ${theme === Theme.LIGHT ? 'bg-black/80 border-white/10' : 'bg-white/40 border-white/40'}`}>
              <div className="flex items-center gap-2 justify-center">
                {['#ff4d4d', '#4ade80', '#3b82f6', '#ffffff', '#000000'].map(c => (
                  <button key={c} className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-110 active:scale-90 ${el.bgColor === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`} style={{ backgroundColor: c }} onClick={() => onElementUpdate(el.id, { bgColor: c })} />
                ))}
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-black/10 bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)] shadow-sm">
                  <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" value={el.bgColor.startsWith('#') ? el.bgColor : '#ffffff'} onChange={(e) => onElementUpdate(el.id, { bgColor: e.target.value })} />
                </div>
              </div>
              
              <div className={`flex items-center gap-2 justify-center border-t pt-2.5 ${theme === Theme.LIGHT ? 'border-white/10' : 'border-black/5'}`}>
                {['#ffffff', '#000000', '#6b46ff', '#facc15', '#f87171'].map(c => (
                  <button key={c} className={`w-7 h-7 rounded-full border border-black/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${el.textColor === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`} style={{ backgroundColor: c }} onClick={() => onElementUpdate(el.id, { textColor: c })}>
                    <span className="text-[11px] font-black" style={{ color: c === '#ffffff' ? '#000' : '#fff' }}>T</span>
                  </button>
                ))}
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-black/10 bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)] shadow-sm">
                  <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" value={el.textColor.startsWith('#') ? el.textColor : '#000000'} onChange={(e) => onElementUpdate(el.id, { textColor: e.target.value })} />
                </div>
              </div>

              <div className={`flex items-center gap-1.5 justify-center border-t pt-2.5 ${theme === Theme.LIGHT ? 'border-white/10' : 'border-black/5'}`}>
                {[
                  { val: '0px', label: 'Sharp' },
                  { val: '14px', label: 'Soft' },
                  { val: '32px', label: 'Round' },
                  { val: '9999px', label: 'Oval' }
                ].map(r => (
                  <button 
                    key={r.val} 
                    className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${el.borderRadius === r.val ? 'bg-indigo-600 text-white' : (theme === Theme.LIGHT ? 'bg-white/10 text-white/50 hover:bg-white/20' : 'bg-black/10 text-gray-700 hover:bg-black/20')}`}
                    onClick={() => onElementUpdate(el.id, { borderRadius: r.val })}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className={`absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b ${theme === Theme.LIGHT ? 'bg-black/80 border-white/10' : 'bg-white/40 border-white/40'}`}></div>
            </div>
          )}

          {/* علامة تعديل صغيرة تظهر في وضع التعديل */}
          {mode === 'edit' && editingId !== el.id && (
            <div className="edit-trigger absolute -top-3 -left-3 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-white/20 cursor-pointer hover:scale-110 active:scale-90 transition-transform z-[150]">
              <svg className="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
          )}

          {/* مقبض التكبير والتصغير - أصغر وسلس */}
          {editingId === el.id && (
            <div className="resize-handle absolute -bottom-1 -right-1 w-7 h-7 cursor-se-resize bg-indigo-600 rounded-full border border-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg z-[150]">
               <svg className="w-3.5 h-3.5 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6"><path d="M15 19l-4-4 4-4"/></svg>
            </div>
          )}

          {/* علامة الحذف */}
          {mode === 'delete' && (
            <div className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full bg-red-800 text-white flex items-center justify-center shadow-2xl animate-bounce border-2 border-white pointer-events-none z-[150]">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
