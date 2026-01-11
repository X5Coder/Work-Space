
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Theme, Mode, CanvasElement, Offset } from './types';
import { Toolbar } from './components/Toolbar';
import { Workspace } from './components/Workspace';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(Theme.DARK);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [mode, setMode] = useState<Mode>('normal');
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClosingSettings, setIsClosingSettings] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const currentStyles = useRef({
    bgColor: theme === Theme.LIGHT ? "#000000" : "#ffffff",
    textColor: theme === Theme.LIGHT ? "#ffffff" : "#000000",
    borderRadius: "10"
  });

  const history = useRef<CanvasElement[][]>([]);
  const historyIndex = useRef<number>(-1);

  const saveToHistory = useCallback((newElements: CanvasElement[]) => {
    const serializedNew = JSON.parse(JSON.stringify(newElements));
    if (history.current.length > 0 && JSON.stringify(serializedNew) === JSON.stringify(history.current[historyIndex.current])) return;
    const newHistory = history.current.slice(0, historyIndex.current + 1);
    newHistory.push(serializedNew);
    if (newHistory.length > 50) newHistory.shift();
    history.current = newHistory;
    historyIndex.current = newHistory.length - 1;
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('workspaceState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.theme) setTheme(state.theme);
        if (state.offsetX !== undefined) setOffset({ x: state.offsetX, y: state.offsetY });
        if (state.elements) {
          setElements(state.elements);
          history.current = [JSON.parse(JSON.stringify(state.elements))];
          historyIndex.current = 0;
        }
      }
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    const state = { theme, offsetX: offset.x, offsetY: offset.y, elements };
    localStorage.setItem('workspaceState', JSON.stringify(state));
  }, [theme, offset, elements]);

  const isOverlapping = (x: number, y: number, w: number, h: number, excludeId: string | null) => {
    return elements.some(el => {
      if (el.id === excludeId) return false;
      return !(x + w < el.x || x > el.x + el.width || y + h < el.y || y > el.y + el.height);
    });
  };

  const getSpawnPosition = (w: number, h: number) => {
    let x = -offset.x + window.innerWidth / 2 - w / 2;
    let y = -offset.y + window.innerHeight / 2 - h / 2;
    let attempts = 0;
    while (isOverlapping(x, y, w, h, null) && attempts < 150) {
      x += 15; y += 15; attempts++;
    }
    return { x, y };
  };

  const handleAction = (action: string) => {
    if (action === "add") {
      // Minimal rectangle size
      const defaultW = 80;
      const defaultH = 34;
      const pos = getSpawnPosition(defaultW, defaultH);
      const newEl: CanvasElement = {
        id: Math.random().toString(36).substr(2, 9),
        x: pos.x,
        y: pos.y,
        text: "",
        bgColor: currentStyles.current.bgColor,
        textColor: currentStyles.current.textColor,
        borderRadius: currentStyles.current.borderRadius,
        width: defaultW,
        height: defaultH
      };
      const updated = [...elements, newEl];
      setElements(updated);
      saveToHistory(updated);
      setEditingId(newEl.id);
      setMode('edit');
    } 
    else if (action === "delete") {
      setMode(prev => prev === 'delete' ? 'normal' : 'delete');
      setEditingId(null);
    } 
    else if (action === "edit") {
      setMode(prev => prev === 'edit' ? 'normal' : 'edit');
      if (mode === 'edit') setEditingId(null);
    } 
    else if (action === "undo") {
      if (historyIndex.current > 0) {
        historyIndex.current -= 1;
        setElements(JSON.parse(JSON.stringify(history.current[historyIndex.current])));
      }
    } 
    else if (action === "redo") {
      if (historyIndex.current < history.current.length - 1) {
        historyIndex.current += 1;
        setElements(JSON.parse(JSON.stringify(history.current[historyIndex.current])));
      }
    } 
    else if (action === "first") {
      if (elements.length === 0) return;
      const nextIdx = (focusIndex + 1) % elements.length;
      setFocusIndex(nextIdx);
      const target = elements[nextIdx];
      setOffset({
        x: -target.x + window.innerWidth / 2 - target.width / 2,
        y: -target.y + window.innerHeight / 2 - target.height / 2
      });
      setMode('edit');
      setEditingId(target.id);
    } 
    else if (action === "preview") {
      setIsPreviewMode(true);
      setMode('normal');
      setEditingId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        if (updates.bgColor) currentStyles.current.bgColor = updates.bgColor;
        if (updates.textColor) currentStyles.current.textColor = updates.textColor;
        if (updates.borderRadius) currentStyles.current.borderRadius = updates.borderRadius;
        return { ...el, ...updates };
      }
      return el;
    }));
  };

  const deleteElement = (id: string) => {
    const updated = elements.filter(el => el.id !== id);
    setElements(updated);
    saveToHistory(updated);
  };

  const closeSettings = () => {
    setIsClosingSettings(true);
    setTimeout(() => {
      setIsSettingsOpen(false);
      setIsClosingSettings(false);
    }, 250);
  };

  return (
    <div className={`w-full h-screen overflow-hidden transition-colors duration-500 ${theme === Theme.LIGHT ? 'bg-white' : theme === Theme.MEDIUM ? 'bg-[#1a1a1a]' : 'bg-black'}`}>
      {isPreviewMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000]">
          <button 
            onClick={() => setIsPreviewMode(false)}
            className="px-6 py-2.5 rounded-full bg-black/80 text-white text-[11px] font-black uppercase tracking-[2px] shadow-2xl border border-white/20 backdrop-blur-md"
          >
            إلغاء المعاينة ✕
          </button>
        </div>
      )}

      <Toolbar 
        theme={theme}
        mode={mode}
        canUndo={historyIndex.current > 0}
        canRedo={historyIndex.current < history.current.length - 1}
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
        onElementDelete={deleteElement}
        onDragEnd={() => saveToHistory(elements)}
        validateDrop={(id, x, y, w, h) => !isOverlapping(x, y, w, h, id)}
        setMode={setMode}
        fullHeight={isPreviewMode}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        isClosing={isClosingSettings}
        activeTheme={theme}
        onClose={closeSettings}
        onThemeSelect={(t) => {
          setTheme(t);
          closeSettings();
        }}
      />
    </div>
  );
};

export default App;
