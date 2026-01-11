
import React, { useRef, useState, useMemo } from 'react';
import { Theme, Mode, CanvasElement, Offset } from '../types';

interface WorkspaceProps {
  theme: Theme;
  offset: Offset;
  onDrag: (dx: number, dy: number) => void;
  elements: CanvasElement[];
  mode: Mode;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDelete: (id: string) => void;
  onDragEnd: () => void;
  validateDrop: (id: string, x: number, y: number, w: number, h: number) => boolean;
  setMode: (mode: Mode) => void;
  fullHeight: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  theme,
  offset,
  onDrag,
  elements,
  mode,
  editingId,
  setEditingId,
  onElementUpdate,
  onElementDelete,
  onDragEnd,
  validateDrop,
  setMode,
  fullHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textAreaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const longPressTimer = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
    const isResizeHandle = target.classList.contains('resize-handle');
    const isEditTrigger = target.classList.contains('edit-trigger');

    if (target.closest('.edit-bubble')) return;

    if ((isResizeHandle || isEditTrigger) && elementId) {
      if (isResizeHandle) {
        setIsResizing(true);
        setDraggedElementId(elementId);
      } else {
        setEditingId(elementId);
        setMode('edit');
      }
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      e.stopPropagation();
      return;
    }

    if (elementId) {
      if (mode === 'delete') {
        onElementDelete(elementId);
        return;
      }
      setDraggedElementId(elementId);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      
      longPressTimer.current = window.setTimeout(() => {
        setEditingId(elementId);
        setMode('edit');
      }, 450);
    } else {
      setIsCanvasDragging(true);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      if (editingId) {
        setEditingId(null);
        setMode('normal');
        onDragEnd();
      }
    }
    
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;

    if (draggedElementId) {
      const el = elementRefs.current[draggedElementId];
      if (!el) return;
      if (isResizing) {
        const newWidth = el.offsetWidth + dx;
        const newHeight = el.offsetHeight + dy;
        const textArea = textAreaRefs.current[draggedElementId];
        const minW = textArea ? Math.max(40, textArea.scrollWidth + 8) : 40;
        const minH = textArea ? Math.max(24, textArea.scrollHeight + 4) : 24;
        el.style.width = `${Math.max(minW, newWidth)}px`;
        el.style.height = `${Math.max(minH, newHeight)}px`;
      } else if (mode === 'normal' || mode === 'edit') {
        const currentLeft = parseFloat(el.style.left);
        const currentTop = parseFloat(el.style.top);
        el.style.left = `${currentLeft + dx}px`;
        el.style.top = `${currentTop + dy}px`;
      }
    } else if (isCanvasDragging) onDrag(dx, dy);
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (draggedElementId) {
      const el = elementRefs.current[draggedElementId];
      if (el) {
        const finalW = el.offsetWidth;
        const finalH = el.offsetHeight;
        const finalX = parseFloat(el.style.left) - offset.x;
        const finalY = parseFloat(el.style.top) - offset.y;
        if (validateDrop(draggedElementId, finalX, finalY, finalW, finalH)) {
          onElementUpdate(draggedElementId, { x: finalX, y: finalY, width: finalW, height: finalH });
        } else {
          const original = elements.find(item => item.id === draggedElementId);
          if (original) {
            el.style.left = `${original.x + offset.x}px`;
            el.style.top = `${original.y + offset.y}px`;
            el.style.width = `${original.width}px`;
            el.style.height = `${original.height}px`;
          }
        }
      }
      onDragEnd();
    }
    setIsCanvasDragging(false); setDraggedElementId(null); setIsResizing(false);
    if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);
  };

  const getRadiusStyles = (radiusVal: string, w: number, h: number) => {
    const val = parseInt(radiusVal) || 0;
    const maxPossible = Math.min(w, h) / 2;
    return `${(val / 100) * maxPossible}px`;
  };

  const gridClass = theme === Theme.LIGHT ? "bg-grid-light" : "bg-grid-dark";
  const bgClass = theme === Theme.LIGHT ? "bg-white" : theme === Theme.MEDIUM ? "bg-[#1a1a1a]" : "bg-black";
  const elementBorder = theme === Theme.LIGHT ? "2.5px solid #000000" : "2.5px solid #ffffff";

  return (
    <div 
      ref={containerRef}
      id="workspace"
      className={`relative w-screen touch-none transition-[background-color,margin,height] duration-500 overflow-hidden ${gridClass} ${bgClass} ${fullHeight ? "mt-0 h-screen" : "mt-[56px] md:mt-[64px] h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]"}`}
      style={{ backgroundPosition: `${offset.x}px ${offset.y}px`, cursor: isCanvasDragging ? 'grabbing' : 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {elements.map((el) => {
        const isEditing = editingId === el.id;
        return (
          <div 
            key={el.id}
            ref={ref => elementRefs.current[el.id] = ref}
            data-element-id={el.id}
            className={`absolute shadow-2xl flex items-center justify-center overflow-visible transition-[border-color,background-color] duration-200`}
            style={{
              left: el.x + offset.x,
              top: el.y + offset.y,
              width: el.width,
              height: el.height,
              backgroundColor: el.bgColor,
              borderRadius: getRadiusStyles(el.borderRadius, el.width, el.height),
              border: isEditing ? "3.5px solid #6b46ff" : elementBorder,
              cursor: mode === 'normal' ? 'grab' : mode === 'delete' ? 'pointer' : 'text',
              zIndex: isEditing ? 100 : 10,
              padding: '2px'
            }}
          >
            <div className={`relative w-full h-full flex items-center justify-center ${isEditing ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              <textarea
                ref={ref => textAreaRefs.current[el.id] = ref}
                className={`w-full h-full bg-transparent resize-none border-none outline-none text-center leading-tight overflow-hidden ${isEditing ? 'allow-select' : 'cursor-default'}`}
                style={{ color: el.textColor, whiteSpace: 'pre', fontWeight: 800, fontSize: '13px', fontFamily: 'inherit' }}
                value={el.text}
                onDoubleClick={(e) => { setEditingId(el.id); setMode('edit'); e.stopPropagation(); }}
                onChange={(e) => {
                  const target = e.target;
                  const newWidth = target.scrollWidth + 8;
                  const newHeight = target.scrollHeight + 4;
                  onElementUpdate(el.id, { text: target.value, width: Math.max(el.width, newWidth), height: Math.max(el.height, newHeight) });
                }}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div 
                className={`
                  edit-bubble absolute left-1/2 -translate-x-1/2
                  flex flex-col gap-3 p-4 rounded-[28px] shadow-[0_15px_50px_rgba(0,0,0,0.35)] border backdrop-blur-3xl z-[200]
                  w-[200px] animate-bubble-in
                  ${theme === Theme.LIGHT ? 'bg-black/95 border-white/20' : 'bg-white/95 border-black/10'}
                `}
                style={{ 
                  bottom: 'calc(100% + 10px)',
                  transform: 'translateX(-50%)' // Fallback for browsers
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider text-center ${theme === Theme.LIGHT ? 'text-white/40' : 'text-black/40'}`}>الخلفية</span>
                  <div className="flex items-center gap-2 justify-center">
                    {['#ff4d4d', '#4ade80', '#3b82f6', '#ffffff', '#000000'].map(color => (
                      <button key={color} className={`w-6 h-6 rounded-full border border-black/5 transition-all hover:scale-110 ${el.bgColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : ''}`} style={{ backgroundColor: color }} onClick={() => onElementUpdate(el.id, { bgColor: color })} />
                    ))}
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/5 bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)]"><input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" value={el.bgColor.startsWith('#') ? el.bgColor : '#ffffff'} onChange={(e) => onElementUpdate(el.id, { bgColor: e.target.value })} /></div>
                  </div>
                </div>

                <div className={`flex flex-col gap-1.5 border-t pt-3 ${theme === Theme.LIGHT ? 'border-white/10' : 'border-black/5'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-wider text-center ${theme === Theme.LIGHT ? 'text-white/40' : 'text-black/40'}`}>النص</span>
                  <div className="flex items-center gap-2 justify-center">
                    {['#ffffff', '#000000', '#6b46ff', '#facc15', '#f87171'].map(color => (
                      <button key={color} className={`w-6 h-6 rounded-full border border-black/5 flex items-center justify-center transition-all hover:scale-110 ${el.textColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : ''}`} style={{ backgroundColor: color }} onClick={() => onElementUpdate(el.id, { textColor: color })}><span className="text-[10px] font-black" style={{ color: color === '#ffffff' ? '#000' : '#fff' }}>T</span></button>
                    ))}
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/5 bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)]"><input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" value={el.textColor.startsWith('#') ? el.textColor : '#000000'} onChange={(e) => onElementUpdate(el.id, { textColor: e.target.value })} /></div>
                  </div>
                </div>

                <div className={`flex flex-col gap-1.5 border-t pt-3 ${theme === Theme.LIGHT ? 'border-white/10' : 'border-black/5'}`}>
                  <div className="flex justify-between items-center px-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${theme === Theme.LIGHT ? 'text-white/40' : 'text-black/40'}`}>تدوير الحواف</span>
                    <span className={`text-[9px] font-bold ${theme === Theme.LIGHT ? 'text-white' : 'text-black'}`}>{el.borderRadius}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={el.borderRadius} onChange={(e) => onElementUpdate(el.id, { borderRadius: e.target.value })} className="w-full cursor-pointer h-1" />
                </div>

                {/* Triangle Pointer - Tightly anchored */}
                <div className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r border-b ${theme === Theme.LIGHT ? 'bg-black/95 border-white/20' : 'bg-white/95 border-black/10'}`} />
              </div>
            )}

            {mode === 'edit' && !isEditing && (
              <div className="edit-trigger absolute -top-3 -left-3 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-white/20 cursor-pointer hover:scale-110 transition-transform z-[150]">
                <svg className="w-3 h-3 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              </div>
            )}

            {isEditing && (
              <div className="resize-handle absolute -bottom-1 -right-1 w-6 h-6 cursor-se-resize bg-indigo-600 rounded-full border border-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg z-[150]">
                <svg className="w-3 h-3 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6"><path d="M15 19l-4-4 4-4" /></svg>
              </div>
            )}

            {mode === 'delete' && (
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center shadow-2xl animate-bounce border-2 border-white pointer-events-none z-[150]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
