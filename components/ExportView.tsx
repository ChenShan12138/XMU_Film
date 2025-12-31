
import React, { useState, useEffect } from 'react';
import { ProjectData } from '../types';

interface ExportViewProps {
  project: ProjectData;
  onRestart: () => void;
  onBackToEdit: () => void;
}

const ExportView: React.FC<ExportViewProps> = ({ project, onRestart, onBackToEdit }) => {
  const [progress, setProgress] = useState(0);
  const [isExported, setIsExported] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsExported(true);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 overflow-hidden text-white">
      {!isExported ? (
        <div className="max-w-md w-full space-y-6 text-center animate-in fade-in duration-500">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-blue-500">
              {progress}%
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">正在渲染「{project.title}」...</h2>
            <p className="text-zinc-500 text-sm">Unity Built-in 实时渲染引擎正在导出序列帧并合成音频</p>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-zinc-400 text-[10px] tabular-nums tracking-widest uppercase">Exporting {project.genre}_Final_Master.mp4</p>
        </div>
      ) : (
        <div className="max-w-6xl w-full space-y-8 animate-in zoom-in-95 duration-700">
           <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase">RENDER COMPLETED</h2>
                <p className="text-zinc-400 text-lg">《{project.title}》已成功渲染并保存。</p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={onBackToEdit}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-semibold transition-all hover:scale-105"
                >
                  返回影棚微调
                </button>
                <button 
                  onClick={onRestart}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-xl shadow-blue-500/20"
                >
                  新建拍摄项目
                </button>
              </div>
           </div>

           <div className="aspect-video w-full bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800 shadow-3xl relative group">
              <img 
                src={project.script[0]?.visualUrl || 'https://picsum.photos/1280/720'} 
                className="w-full h-full object-cover opacity-80" 
                alt="Movie Thumbnail"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-blue-500/50">
                  <svg className="w-12 h-12 text-white ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.5 3.5v13L16 10 4.5 3.5z" />
                  </svg>
                </button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black via-black/60 to-transparent">
                 <div className="flex items-center space-x-4 text-xs font-bold text-blue-400 mb-2 tracking-widest uppercase">
                    <span className="bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">{project.genre}</span>
                    <span>•</span>
                    <span className="text-white">{project.scene?.name}</span>
                    <span>•</span>
                    <span className="text-zinc-500">Unity Built-in Renderer</span>
                 </div>
                 <h1 className="text-5xl font-black text-white tracking-tight">{project.title}</h1>
              </div>
           </div>

           <div className="grid grid-cols-4 gap-6">
              <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2 tracking-widest">脚本还原度</p>
                <p className="text-3xl font-bold font-mono text-blue-500">100%</p>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2 tracking-widest">资产优化率</p>
                <p className="text-3xl font-bold font-mono text-green-500">92%</p>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2 tracking-widest">渲染规格</p>
                <p className="text-3xl font-bold font-mono text-zinc-200">4K UHD</p>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2 tracking-widest">导出用时</p>
                <p className="text-3xl font-bold font-mono text-blue-500">00:03:45</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExportView;
