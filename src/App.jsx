import { useState, useEffect, useMemo } from 'react';

const DEFAULT_APPS = [
  {
    id: 'gmail',
    label: 'Gmail',
    url: 'https://mail.google.com',
    emoji: '📧',
    color: '#EA4335',
  },
  {
    id: 'notion',
    label: 'Notion',
    url: 'https://www.notion.so',
    emoji: '📋',
    color: '#ffffff',
  },
];

const AppIcon = ({ app }) => {
  const [imgError, setImgError] = useState(false);
  
  const iconUrl = useMemo(() => {
    try {
      // Hardcode google.com for gmail to ensure we get the official 'G' logo
      let domain = new URL(app.url).hostname;
      if (app.id === 'gmail') domain = 'google.com';
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  }, [app.url]);

  if (!iconUrl || imgError) {
    return (
      <span className={app.id.startsWith('custom_') ? 'font-semibold text-lg text-white' : ''}>
        {app.emoji}
      </span>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={app.label}
      className="w-[22px] h-[22px] object-contain"
      onError={() => setImgError(true)}
    />
  );
};

export default function App() {
  const [customApps, setCustomApps] = useState([]);
  const [activeId, setActiveId] = useState(DEFAULT_APPS[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Load from store on mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (window.electronAPI?.store) {
        try {
          // Load custom apps
          const savedApps = await window.electronAPI.store.get('customApps');
          if (savedApps && Array.isArray(savedApps)) {
            setCustomApps(savedApps);
          }
          
          // Load pinned state
          const savedPinState = await window.electronAPI.store.get('isPinned');
          if (typeof savedPinState === 'boolean') {
            setIsPinned(savedPinState);
          }

          // Load last active app
          const savedActiveId = await window.electronAPI.store.get('lastActiveId');
          if (savedActiveId && typeof savedActiveId === 'string') {
            setActiveId(savedActiveId);
          }
        } catch (err) {
          console.error("Failed to load data:", err);
        }
      }
    };
    loadSavedData();
  }, []);

  const allApps = [...DEFAULT_APPS, ...customApps];
  const activeApp = allApps.find((a) => a.id === activeId) || DEFAULT_APPS[0];

  const handleAddApp = async (e) => {
    e.preventDefault();
    if (!newAppName.trim() || !newAppUrl.trim()) return;

    let finalUrl = newAppUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const newApp = {
      id: `custom_${Date.now()}`,
      label: newAppName.trim(),
      url: finalUrl,
      emoji: newAppName.trim().charAt(0).toUpperCase(),
      color: '#a78bfa',
    };

    const updatedApps = [...customApps, newApp];
    setCustomApps(updatedApps);
    setActiveId(newApp.id);
    setShowAddForm(false);
    setNewAppName('');
    setNewAppUrl('');

    if (window.electronAPI?.store) {
      await window.electronAPI.store.set('customApps', updatedApps);
      await window.electronAPI.store.set('lastActiveId', newApp.id);
    }
  };

  const handleRemoveApp = async (e, idToRemove) => {
    e.stopPropagation(); // prevent clicking the app button itself

    const updatedApps = customApps.filter(a => a.id !== idToRemove);
    setCustomApps(updatedApps);

    // If deleting the active app, fallback to gmail (first default app)
    if (activeId === idToRemove) {
      const fallbackId = DEFAULT_APPS[0].id;
      setActiveId(fallbackId);
      if (window.electronAPI?.store) {
        window.electronAPI.store.set('lastActiveId', fallbackId);
      }
    }

    if (window.electronAPI?.store) {
      await window.electronAPI.store.set('customApps', updatedApps);
      if (window.electronAPI.store.clearSession) {
        await window.electronAPI.store.clearSession(idToRemove);
      }
    }
  };

  const togglePin = async () => {
    const newState = !isPinned;
    setIsPinned(newState);
    if (window.electronAPI?.store) {
      await window.electronAPI.store.set('isPinned', newState);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111113] text-white">

      {/* ── Left: Pinned Apps Rail ── */}
      <aside className="drag-region flex flex-col items-center w-16 shrink-0 bg-[#0c0c0e] border-r border-white/5 pt-3 pb-4 gap-2 z-20">
        
        {/* Top area: Drag handle, Pin toggle */}
        <div className="flex flex-col items-center gap-2 mb-2 w-full">
          <div className="w-5 h-0.5 rounded-full bg-white/10" />
          
          <button
            onClick={togglePin}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar to always show"}
            className={`no-drag w-6 h-6 flex items-center justify-center rounded transition-all
              ${isPinned 
                ? 'text-violet-400 bg-violet-400/10' 
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
          >
            {/* Minimal pushpin SVG */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
               <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 1 0 2.828 2.828l14.504-12.19zM3.9 16l-2 5l5-2" />
               <line x1="16" y1="3" x2="21" y2="8" />
               <line x1="8" y1="21" x2="13" y2="16" />
            </svg>
          </button>
        </div>

        {allApps.map((app) => {
          const isActive = app.id === activeId;
          const isCustom = app.id.startsWith('custom_');

          return (
            <div key={app.id} className="relative group">
              <button
                onClick={() => {
                  setActiveId(app.id);
                  setShowAddForm(false);
                  if (window.electronAPI?.store) {
                    window.electronAPI.store.set('lastActiveId', app.id);
                  }
                }}
                title={app.label}
                className={`no-drag relative flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-all duration-150
                  ${isActive && !showAddForm
                    ? 'bg-white/10 shadow-inner'
                    : 'hover:bg-white/5 opacity-50 hover:opacity-90'
                  }`}
              >
                <AppIcon app={app} />
                
                {isActive && !showAddForm && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ backgroundColor: app.color }}
                  />
                )}
              </button>

              {/* Remove Button (visible on hover) */}
              {isCustom && (
                <button
                  onClick={(e) => handleRemoveApp(e, app.id)}
                  title="Remove app"
                  className="no-drag absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-red-500 hover:bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm z-30"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <div className="w-8 border-b border-white/10 my-2" />

        {/* Add Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className={`no-drag flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-150
            ${showAddForm
              ? 'bg-violet-500 text-white shadow-[0_0_12px_#8b5cf6]'
              : 'text-white/30 hover:text-white/80 hover:bg-white/5 border border-dashed border-white/20 hover:border-white/50'
            }`}
        >
          +
        </button>

        <div className="flex-1" />

        <span className="no-drag text-[9px] font-medium tracking-widest uppercase text-white/20 rotate-180 [writing-mode:vertical-rl]">
          {showAddForm ? 'Add App' : activeApp.label}
        </span>
      </aside>

      {/* ── Right: Main Content ── */}
      <div className="flex-1 relative overflow-hidden no-drag bg-[#111113]">
        
        {allApps.map((app) => (
          <webview
            key={app.id}
            partition={`persist:${app.id}`}
            src={app.url}
            className="absolute inset-0 z-0 bg-white"
            style={{
              width: '100%',
              height: '100%',
              display: (activeId === app.id && !showAddForm) ? 'flex' : 'none',
            }}
          />
        ))}

        {showAddForm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111113]/90 p-8">
            <form onSubmit={handleAddApp} className="w-full max-w-sm bg-[#1c1c1f] border border-white/10 rounded-xl p-6 shadow-2xl">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <span className="text-violet-400">✧</span> Add Pinned App
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">App Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. ChatGPT"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">URL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. chatgpt.com"
                    value={newAppUrl}
                    onChange={(e) => setNewAppUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-md text-sm font-medium transition-all"
                >
                  Add App
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
