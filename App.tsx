
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Theme, WorkspaceState, ThemeType, WorkspaceElement, AppMode } from './types.ts';
import Toolbar from './components/Toolbar.tsx';
import Workspace from './components/Workspace.tsx';
import SettingsDialog from './components/SettingsDialog.tsx';

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeType>(Theme.DARK);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<WorkspaceElement[]>([]);
  const [mode, setMode] = useState<AppMode>('normal');
  const [compassIndex, setCompassIndex] = useState(-1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // تتبع آخر مظهر تم استخدامه بدقة
  const lastStyle = useRef<{bgColor: string, textColor: string, borderRadius: string}>({
    bgColor: theme === Theme.LIGHT ? '#000000' : '#ffffff',
    textColor: theme === Theme.LIGHT ? '#ffffff' : '#000000',
    borderRadius: '14px'
  });

  const history = useRef<WorkspaceElement[][]>([]);
  const historyStep = useRef(-1);

  const saveHistory = useCallback((newElements: WorkspaceElement[]) => {
    const currentElements = JSON.parse(JSON.stringify(newElements));
    if (history.current.length > 0 && JSON.stringify(currentElements) === JSON.stringify(history.current[historyStep.current])) return;

    const currentHistory = history.current.slice(0, historyStep.current + 1);
    currentHistory.push(currentElements);
    if (currentHistory.length > 50) currentHistory.shift();
    history.current = currentHistory;
    historyStep.current = currentHistory.length - 1;
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('workspaceState');
      if (saved) {
        const state: WorkspaceState = JSON.parse(saved);
        if (state.theme) setTheme(state.theme);
        if (state.offsetX !== undefined) setOffset({ x: state.offsetX, y: state.offsetY });
        if (state.elements) {
          setElements(state.elements);
          history.current = [JSON.parse(JSON.stringify(state.elements))];
          historyStep.current = 0;
        }
      }
    } catch (e) { console.warn('Failed to load state', e); }
  }, []);

  useEffect(() => {
    const state = { theme, offsetX: offset.x, offsetY: offset.y, elements };
    localStorage.setItem('workspaceState', JSON.stringify(state));
  }, [theme, offset, elements]);

  const isColliding = (x: number, y: number, w: number, h: number, excludeId?: string) => {
    return elements.some(el => {
      if (el.id === excludeId) return false;
      return !(x + w < el.x || x > el.x + el.width || y + h < el.y || y > el.y + el.height);
    });
  };

  const findEmptyPosition = (width: number, height: number) => {
    let startX = -offset.x + (window.innerWidth / 2) - (width / 2);
    let startY = -offset.y + (window.innerHeight / 2) - (height / 2);
    let attempts = 0;
    while (isColliding(startX, startY, width, height) && attempts < 150) {
      startX += 30;
      startY += 30;
      attempts++;
    }
    return { x: startX, y: startY };
  };

  const handleAction = (type: string) => {
    if (type === 'add') {
      const pos = findEmptyPosition(100, 45); // أصغر حجم مبدئي
      const newEl: WorkspaceElement = {
        id: Math.random().toString(36).substr(2, 9),
        x: pos.x,
        y: pos.y,
        text: '',
        bgColor: lastStyle.current.bgColor,
        textColor: lastStyle.current.textColor,
        borderRadius: lastStyle.current.borderRadius,
        width: 100,
        height: 45
      };
      const updated = [...elements, newEl];
      setElements(updated);
      saveHistory(updated);
      setEditingId(newEl.id);
      setMode('edit');
    } else if (type === 'delete') {
      setMode(prev => prev === 'delete' ? 'normal' : 'delete');
      setEditingId(null);
    } else if (type === 'edit') {
      setMode(prev => prev === 'edit' ? 'normal' : 'edit');
      if (mode === 'edit') setEditingId(null);
    } else if (type === 'undo') {
      if (historyStep.current > 0) {
        historyStep.current -= 1;
        setElements(JSON.parse(JSON.stringify(history.current[historyStep.current])));
      }
    } else if (type === 'redo') {
      if (historyStep.current < history.current.length - 1) {
        historyStep.current += 1;
        setElements(JSON.parse(JSON.stringify(history.current[historyStep.current])));
      }
    } else if (type === 'first') {
      if (elements.length === 0) return;
      const nextIdx = (compassIndex + 1) % elements.length;
      setCompassIndex(nextIdx);
      const target = elements[nextIdx];
      setOffset({
        x: -target.x + (window.innerWidth / 2) - (target.width / 2),
        y: -target.y + (window.innerHeight / 2) - (target.height / 2)
      });
      setMode('edit');
      setEditingId(target.id);
    } else if (type === 'preview') {
      setIsPreviewMode(true);
      setMode('normal');
      setEditingId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<WorkspaceElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        // تحديث آخر مظهر تم استخدامه
        if (updates.bgColor) lastStyle.current.bgColor = updates.bgColor;
        if (updates.textColor) lastStyle.current.textColor = updates.textColor;
        if (updates.borderRadius) lastStyle.current.borderRadius = updates.borderRadius;
        return { ...el, ...updates };
      }
      return el;
    }));
  };

  return (
    <div className={`w-full h-screen overflow-hidden transition-colors duration-500 ${theme === Theme.LIGHT ? 'bg-white' : theme === Theme.MEDIUM ? 'bg-[#1a1a1a]' : 'bg-black'}`}>
      {isPreviewMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center gap-2">
          <button 
            onClick={() => setIsPreviewMode(false)}
            className="px-8 py-3 rounded-full bg-black/80 text-white text-[12px] font-black uppercase tracking-[3px] shadow-2xl border border-white/20 hover:bg-red-700 active:scale-95 transition-all backdrop-blur-md"
          >
            إلغاء المعاينة ✕
          </button>
        </div>
      )}

      <Toolbar 
        theme={theme} 
        mode={mode}
        canUndo={historyStep.current > 0}
        canRedo={historyStep.current < history.current.length - 1}
        elementsCount={elements.length}
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onAction={handleAction} 
        isHidden={isPreviewMode} 
      />
      
      <Workspace 
        theme={theme} 
        offset={offset} 
        onDrag={(dx, dy) => setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))}
        elements={elements}
        mode={mode}
        editingId={editingId}
        setEditingId={setEditingId}
        onElementUpdate={updateElement}
        onElementDelete={(id) => {
          const updated = elements.filter(el => el.id !== id);
          setElements(updated);
          saveHistory(updated);
        }}
        onDragEnd={() => saveHistory(elements)}
        validateDrop={(id, x, y, w, h) => !isColliding(x, y, w, h, id)}
        setMode={setMode}
        fullHeight={isPreviewMode}
      />

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        isClosing={isClosing}
        activeTheme={theme} 
        onClose={() => {
          setIsClosing(true);
          setTimeout(() => { setIsSettingsOpen(false); setIsClosing(false); }, 300);
        }} 
        onThemeSelect={(t) => { setTheme(t); setIsClosing(true); setTimeout(() => { setIsSettingsOpen(false); setIsClosing(false); }, 200); }}
      />
    </div>
  );
};

export default App;
