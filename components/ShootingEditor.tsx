
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectData, ScriptLine } from '../types.ts';
import { generateImage } from '../services/geminiService.ts';

interface ShootingEditorProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onBack: () => void;
  onExport: () => void;
}

const ShootingEditor: React.FC<ShootingEditorProps> = ({ project, onUpdateProject, onBack, onExport }) => {
  const [lines, setLines] = useState<ScriptLine[]>(project.script);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(320); // Default width in pixels
  const [isDragging, setIsDragging] = useState(false);
  const isResizing = useRef(false);

  useEffect(() => {
    if (lines.length > 0 && !lines[currentIndex].visualUrl) {
      handleRefreshVisual(currentIndex);
    }
  }, [currentIndex]);

  const handleRefreshVisual = async (index: number) => {
    const line = lines[index];
    setIsGenerating(prev => ({ ...prev, [line.id]: true }));
    const visual = await generateImage(`Unity Built-in Renderer scene, ${project.scene?.name}, character ${line.character} performing ${line.action}, ${line.cameraAngle} camera angle, cinematic lighting`);
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = { ...newLines[index], visualUrl: visual };
      return newLines;
    });
    setIsGenerating(prev => ({ ...prev, [line.id]: false }));
  };

  const currentLine = lines[currentIndex] || lines[0];

  const totalDuration = useMemo(() => {
    return lines.reduce((acc, l) => acc + (l.duration || 3.0), 0);
  }, [lines]);

  const currentProgress = useMemo(() => {
    return lines.slice(0, currentIndex).reduce((acc, l) => acc + (l.duration || 3.0), 0);
  }, [lines, currentIndex]);

  // Handle Resizing
  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.classList.add('resizing');
  };

  const stopResizing = () => {
    isResizing.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.classList.remove('resizing');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    const maxWidth = window.innerWidth / 3;
    const minWidth = 320;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setDrawerWidth(newWidth);
    }
  };

  return (
    <div className={`h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden text-zinc-300 ${isDragging ? 'resizing' : ''}`}>
      {/* Top Header */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-md relative z-30">
        <div className="flex items-center space-x-4 flex-1">
          <button onClick={onBack} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center space-x-1 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            <span>Back</span>
          </button>
        </div>

        {/* Project Title (Center & Editable) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <input 
                type="text" 
                className="bg-transparent border-none outline-none text-center font-black text-sm text-white focus:text-blue-500 transition-colors w-96 uppercase tracking-widest placeholder:text-zinc-700"
                value={project.title}
                onChange={(e) => onUpdateProject({ title: e.target.value })}
                placeholder="在此编辑项目名称"
            />
        </div>

        <div className="flex items-center justify-end flex-1">
           <button 
             onClick={() => setIsDrawerOpen(!isDrawerOpen)} 
             className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-all text-white"
             title={isDrawerOpen ? "收起面板" : "展开面板"}
           >
             <svg className={`w-4 h-4 transition-transform duration-500 ${isDrawerOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
             </svg>
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Viewport */}
        <div 
          className="flex-1 transition-all duration-500 bg-black flex flex-col relative" 
          style={{ marginRight: isDrawerOpen ? `${drawerWidth}px` : '0px' }}
        >
          <div className="flex-1 relative">
            {currentLine?.visualUrl ? (
              <img src={currentLine.visualUrl} alt="Shot View" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isGenerating[currentLine?.id] && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                 <p className="text-blue-500 font-black animate-pulse text-xs tracking-widest uppercase">Syncing Unity Frame...</p>
              </div>
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur p-6 rounded-2xl border border-white/10 text-center max-w-[70%]">
               <p className="text-[10px] font-black text-blue-500 uppercase mb-1">{currentLine?.character}</p>
               <p className="text-xl font-medium text-white italic">"{currentLine?.dialogue}"</p>
            </div>
          </div>
        </div>

        {/* Control Drawer */}
        <div 
          className={`absolute top-0 right-0 h-full bg-zinc-950 border-l border-white/5 transition-transform duration-500 ease-in-out z-20 overflow-visible ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: `${drawerWidth}px` }}
        >
          {/* Resize Handle */}
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-30 flex items-center justify-center group"
          >
             <div className="w-px h-12 bg-white/10 group-hover:bg-white/30" />
          </div>

          <div className="h-full p-5 overflow-y-auto scrollbar-hide">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Shot Parameters</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Script Line / 台词</label>
                    <textarea 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[11px] h-36 outline-none focus:border-blue-500 transition-all leading-relaxed text-zinc-300"
                      value={currentLine?.dialogue}
                      onChange={e => {
                        const n = [...lines];
                        n[currentIndex].dialogue = e.target.value;
                        setLines(n);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Angle</label>
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-[10px] outline-none text-zinc-300"
                        value={currentLine?.cameraAngle}
                        onChange={e => {
                          const n = [...lines];
                          n[currentIndex].cameraAngle = e.target.value as any;
                          setLines(n);
                          handleRefreshVisual(currentIndex);
                        }}
                      >
                        <option>Wide</option>
                        <option>Medium</option>
                        <option>Close-up</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Duration (s)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-[10px] outline-none text-zinc-300" 
                        value={currentLine?.duration || 3.0}
                        onChange={e => {
                          const n = [...lines];
                          n[currentIndex].duration = parseFloat(e.target.value);
                          setLines(n);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Action Command</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-[10px] outline-none text-zinc-300" 
                      value={currentLine?.action}
                      onChange={e => {
                        const n = [...lines];
                        n[currentIndex].action = e.target.value;
                        setLines(n);
                      }}
                      onBlur={() => handleRefreshVisual(currentIndex)}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                <h4 className="text-[9px] font-black text-blue-500 uppercase mb-2">Unity Script Bridge</h4>
                <p className="text-[10px] text-zinc-400 leading-normal italic">调整参数后 Unity 场景将自动重新渲染预览画面。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Bottom Container */}
      <div className="h-48 bg-zinc-950 border-t border-white/5 flex flex-col">
        {/* Time Progress Overlay Left */}
        <div className="h-8 flex items-center px-6 border-b border-white/5 bg-zinc-900/30">
          <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">
            {currentProgress.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </div>
          <div className="flex-1 text-center">
             <span className="text-[7px] font-black text-zinc-700 uppercase tracking-[0.5em] ml-[-60px]">Production Timeline Hub</span>
          </div>
        </div>

        <div className="flex-1 flex p-4 overflow-x-auto space-x-4 scrollbar-hide items-center">
          {lines.map((line, idx) => (
            <div 
              key={line.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-52 h-full rounded-2xl border transition-all cursor-pointer flex flex-col overflow-hidden relative ${currentIndex === idx ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`}
            >
              <div className="h-28 bg-black overflow-hidden relative">
                {line.visualUrl ? (
                  <img src={line.visualUrl} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" /></div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[8px] font-black">SHOT {idx + 1}</div>
                <div className="absolute bottom-2 right-2 bg-blue-600/80 px-2 py-0.5 rounded text-[8px] font-mono font-bold">{line.duration || 3.0}</div>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-center">
                 <p className="text-[9px] text-zinc-400 uppercase font-black truncate">{line.character}</p>
                 <p className="text-[10px] text-zinc-200 line-clamp-1 italic font-medium">"{line.dialogue}"</p>
              </div>
              {currentIndex === idx && <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none" />}
            </div>
          ))}

          {/* Export special clip */}
          <div 
            onClick={onExport}
            className="flex-shrink-0 w-52 h-full rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 group"
          >
             <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
             </div>
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">渲染导出成片</span>
             <span className="text-[8px] text-blue-500/60 font-mono">FINISH MASTER</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShootingEditor;
