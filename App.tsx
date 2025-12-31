
import React, { useState, useEffect, useMemo } from 'react';
import { AppStep, ProjectData, ScriptLine, Actor, SetScene } from './types.ts';
import { generateScript } from './services/geminiService.ts';
import ShootingEditor from './components/ShootingEditor.tsx';
import ExportView from './components/ExportView.tsx';

interface ExtendedActor extends Actor {
  age: string;
  gender: string;
  voice: string;
  tone: string;
}

const INSPIRATIONS = [
  "在零重力拉面馆里进行的赛博朋克茶道，背景是一个正在崩坏的全息龙。",
  "一位维多利亚时代的侦探调查一宗谋杀案，唯一的目击证人是一个会穿越时空的智能烤面包机。",
  "由锈迹斑斑的工业机器人在水下歌剧院表演的末世芭蕾舞剧。",
  "古埃及神灵在霓虹闪烁的太空拉斯维加斯进行的一场豪赌。",
  "一个能够偷取人类梦境并将其作为NFT在暗网贩卖的赛博黑客。",
  "在土星环上进行的极速滑板赛，选手们必须躲避具有意识的流星雨。",
  "最后一对人类情侣在末日后的植物园里，试图教一个园艺机器人什么是‘爱’。"
];

const ACTORS_POOL: ExtendedActor[] = [
  { id: '1', name: 'Kaelen', description: '冷峻、深邃、适合科幻主角', avatarUrl: 'https://picsum.photos/seed/actor1/400/600', age: '28', gender: '男', voice: '深沉磁性', tone: '稳定' },
  { id: '2', name: 'Aria', description: '灵动、充满好奇心、情感丰富', avatarUrl: 'https://picsum.photos/seed/actor2/400/600', age: '22', gender: '女', voice: '清澈甜美', tone: '活泼' },
  { id: '3', name: 'Marcus', description: '厚重、稳健、适合反派或领袖', avatarUrl: 'https://picsum.photos/seed/actor3/400/600', age: '45', gender: '男', voice: '雄浑威严', tone: '压抑' },
  { id: '4', name: 'Elena', description: '果敢、极具压迫感、适合女强人', avatarUrl: 'https://picsum.photos/seed/actor4/400/600', age: '35', gender: '女', voice: '冷静干练', tone: '锐利' },
];

const SCENES = [
  { name: '废弃实验室', desc: 'Unity Built-in - 赛博工业风', img: 'https://picsum.photos/seed/scene1/800/450' },
  { name: '月面基地', desc: 'Unity 写实 - 环向无缝空间', img: 'https://picsum.photos/seed/scene2/800/450' },
  { name: '霓虹街区', desc: 'Unity 实时光线追踪 - 极具张力', img: 'https://picsum.photos/seed/scene3/800/450' },
];

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.CREATIVE);
  const [loading, setLoading] = useState(false);
  const [previewScene, setPreviewScene] = useState<SetScene | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [typewriterIndex, setTypewriterIndex] = useState(-1);
  const [activeCastChar, setActiveCastChar] = useState<string | null>(null);
  const [lastAnimatedIdea, setLastAnimatedIdea] = useState<string | null>(null);
  const [data, setData] = useState<ProjectData>({
    title: '未命名拍摄项目',
    genre: '科幻',
    idea: '',
    script: [],
    cast: {},
  });

  // Pick a random inspiration on mount
  useEffect(() => {
    const randomIdea = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setData(prev => ({ ...prev, idea: randomIdea }));
  }, []);

  const uniqueCharacters = useMemo(() => Array.from(new Set(data.script.map(s => s.character))), [data.script]);

  useEffect(() => {
    if (data.script.length > 0 && Object.keys(data.cast).length === 0) {
      const initialCast: Record<string, Actor> = {};
      uniqueCharacters.forEach((char, idx) => {
        initialCast[char] = ACTORS_POOL[idx % ACTORS_POOL.length];
      });
      setData(prev => ({ ...prev, cast: initialCast, scene: SCENES[0] }));
    }
  }, [data.script, uniqueCharacters]);

  useEffect(() => {
    if (step === AppStep.SCRIPT) {
      if (data.idea === lastAnimatedIdea) {
        setAgentLogs(["[AI System]: 剧本内容已同步，跳过协作演示。"]);
        setTypewriterIndex(data.script.length);
        return;
      }

      setAgentLogs([]);
      setTypewriterIndex(-1);
      const logs = [
        "[AI Writer]: 正在根据 Idea 构建叙事框架...",
        "[AI Director]: 计算角色张力与镜头位点...",
        "[AI Producer]: 已匹配最优 Unity 资产管线...",
        "[AI System]: 脚本生成完毕，开始同步输出预览。"
      ];
      let i = 0;
      const logInterval = setInterval(() => {
        if (i < logs.length) {
          setAgentLogs(prev => [...prev, logs[i]]);
          i++;
        } else {
          clearInterval(logInterval);
          setTypewriterIndex(0);
          setLastAnimatedIdea(data.idea);
        }
      }, 600);
      return () => clearInterval(logInterval);
    }
  }, [step, data.idea, lastAnimatedIdea, data.script.length]);

  useEffect(() => {
    if (typewriterIndex >= 0 && typewriterIndex < data.script.length) {
      const timer = setTimeout(() => {
        setTypewriterIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [typewriterIndex, data.script.length]);

  const handleCreateScript = async () => {
    setLoading(true);
    const result = await generateScript(data.genre, data.idea);
    const scriptWithDuration = result.script.map(line => ({ ...line, duration: 3.0 }));
    setData(prev => ({ ...prev, title: result.title, script: scriptWithDuration, cast: {} }));
    setLoading(false);
    setStep(AppStep.SCRIPT);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const changeActorForChar = (char: string, actor: Actor) => {
    setData(prev => ({
      ...prev,
      cast: { ...prev.cast, [char]: actor }
    }));
    setActiveCastChar(null);
  };

  if (step === AppStep.SHOOTING) {
    return (
      <ShootingEditor 
        project={data} 
        onUpdateProject={(updates) => setData(prev => ({ ...prev, ...updates }))}
        onBack={prevStep} 
        onExport={() => setStep(AppStep.EXPORT)} 
      />
    );
  }

  if (step === AppStep.EXPORT) {
    return <ExportView project={data} onRestart={() => setStep(AppStep.CREATIVE)} onBackToEdit={() => setStep(AppStep.SHOOTING)} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050505] text-white relative flex">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e3a8a,transparent_70%)] opacity-30" />
      </div>

      <div 
        className="flex h-full transition-transform duration-1000 cubic-bezier(0.8, 0, 0.2, 1)"
        style={{ width: '400vw', transform: `translateX(-${step * 100}vw)` }}
      >
        {/* Step 0: Creative */}
        <section className="w-[100vw] h-full flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 text-center">
            <h2 className="text-7xl font-black tracking-tighter uppercase">XMU <span className="text-blue-500">Filmmaker</span></h2>
            <div className="space-y-6 bg-zinc-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl text-left">
              <div className="flex gap-4">
                {['科幻', '悬疑', '现代'].map(g => (
                  <button 
                    key={g} 
                    onClick={() => setData(prev => ({...prev, genre: g}))}
                    className={`px-6 py-2 rounded-full text-xs font-bold border transition-all ${data.genre === g ? 'bg-blue-600 border-blue-600' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <textarea 
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-6 h-40 outline-none focus:border-blue-500 transition-all text-xl"
                placeholder="输入您的拍摄灵感..."
                value={data.idea}
                onChange={e => setData(prev => ({ ...prev, idea: e.target.value }))}
              />
              <button 
                onClick={handleCreateScript}
                disabled={!data.idea || loading}
                className="w-full py-5 bg-blue-600 rounded-2xl font-black text-xl shadow-2xl hover:bg-blue-500 transition-all active:scale-95"
              >
                {loading ? 'AI 智能体正在协作...' : '开启 AI 创作'}
              </button>
            </div>
          </div>
        </section>

        {/* Step 1: Script Review */}
        <section className="w-[100vw] h-full flex flex-col items-center justify-center p-8 bg-[#080808] relative">
          <div className="max-w-6xl w-full grid grid-cols-3 gap-12">
            <div className="col-span-2 space-y-6">
               <h2 className="text-4xl font-black tracking-tighter">SCRIPT PREVIEW</h2>
               <div className="bg-zinc-900/30 rounded-[2rem] border border-white/5 p-8 h-[60vh] overflow-y-auto scrollbar-hide space-y-8">
                 {data.script.slice(0, typewriterIndex + 1).map((line, idx) => (
                   <div key={line.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 group">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded font-black">SHOT {idx + 1}</span>
                        <span className="text-[10px] text-zinc-600 uppercase">{line.cameraAngle}</span>
                      </div>
                      <p className="text-sm font-black text-blue-400 uppercase tracking-widest">{line.character}</p>
                      <p className="text-2xl text-white font-medium leading-relaxed italic">"{line.dialogue}"</p>
                      <div className="text-[11px] text-zinc-500 mt-2 font-mono">[Action: {line.action}]</div>
                   </div>
                 ))}
               </div>
            </div>
            <div className="col-span-1 flex flex-col">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Multi-Agent Workflow</h3>
               <div className="flex-1 bg-zinc-900/50 p-6 rounded-3xl border border-white/5 font-mono text-[10px] overflow-y-auto mb-6">
                 {agentLogs.map((log, i) => (
                   <div key={i} className="text-blue-400 mb-2 animate-in fade-in slide-in-from-left-2"> {log} </div>
                 ))}
                 {typewriterIndex === data.script.length && (
                   <div className="text-green-500 mt-4 border-t border-white/10 pt-4"> >>> SUCCESS: Script Finalized. </div>
                 )}
               </div>
               {typewriterIndex === data.script.length && (
                  <button onClick={nextStep} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-lg shadow-xl animate-in fade-in slide-in-from-bottom-4">确认并继续选角</button>
               )}
            </div>
          </div>
        </section>

        {/* Step 2: Casting */}
        <section className="w-[100vw] h-full flex flex-col items-center justify-center p-8 bg-[#050505] relative">
           <div className="max-w-6xl w-full space-y-8">
              <div className="text-center space-y-2">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">AI Recommended Selection</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase">Digital Casting</h2>
                <p className="text-zinc-500">点击角色卡片更换演员。AI 已为您智能预选角色匹配。</p>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {uniqueCharacters.map(char => (
                  <div 
                    key={char} 
                    onClick={() => setActiveCastChar(char)}
                    className={`bg-zinc-900/50 p-6 rounded-[2rem] border cursor-pointer transition-all flex flex-col items-center space-y-4 shadow-xl relative group ${activeCastChar === char ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full">已锁定</div>
                    <img src={data.cast[char]?.avatarUrl} className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-xl group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">角色: {char}</p>
                      <p className="text-xl font-black">{data.cast[char]?.name}</p>
                    </div>
                    <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400">点击更换演员</div>
                  </div>
                ))}
              </div>

              {/* Actor Selection Popup */}
              <div className={`fixed inset-0 z-[80] flex items-center justify-center transition-all duration-500 ${activeCastChar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveCastChar(null)} />
                <div className={`relative max-w-5xl w-full bg-zinc-950 border border-white/10 p-10 rounded-[3rem] shadow-3xl transition-all duration-500 transform ${activeCastChar ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                   <div className="flex justify-between items-center mb-8">
                      <h4 className="text-2xl font-black">为「{activeCastChar}」选择数字演员</h4>
                      <button onClick={() => setActiveCastChar(null)} className="text-zinc-500 hover:text-white">关闭</button>
                   </div>
                   <div className="grid grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {ACTORS_POOL.map(actor => (
                      <div 
                        key={actor.id} 
                        onClick={() => changeActorForChar(activeCastChar!, actor)}
                        className="flex items-center space-x-6 p-6 bg-zinc-900/50 rounded-3xl border border-white/5 hover:border-blue-500 cursor-pointer transition-all group"
                      >
                        <div className="relative">
                          <img src={actor.avatarUrl} className="w-20 h-20 rounded-2xl object-cover shadow-xl group-hover:scale-105 transition-transform" />
                          <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                             <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between items-center">
                              <div className="text-lg font-black">{actor.name}</div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase">{actor.gender} • {actor.age}岁</div>
                           </div>
                           <p className="text-xs text-zinc-500 line-clamp-1">{actor.description}</p>
                           <div className="flex space-x-2">
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">{actor.voice}</span>
                              <span className="text-[9px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded font-bold">{actor.tone}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={nextStep} 
                  disabled={!!activeCastChar}
                  className={`px-16 py-4 rounded-full font-black text-xl shadow-2xl transition-all ${activeCastChar ? 'bg-zinc-800 text-zinc-500 scale-95 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:scale-105 active:scale-95'}`}
                >
                  确认选角，继续布景
                </button>
              </div>
           </div>
        </section>

        {/* Step 3: Scenery */}
        <section className="w-[100vw] h-full flex flex-col items-center justify-center p-8 bg-[#080808]">
           <div className="max-w-4xl w-full text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter uppercase">Unity Studio <span className="text-blue-500">AI Select</span></h2>
                <p className="text-zinc-500">AI 推荐使用「{data.scene?.name}」作为主拍摄影棚。</p>
              </div>
              <div className="relative group overflow-hidden rounded-[3rem] border-4 border-blue-500 shadow-3xl">
                <img src={data.scene?.imageUrl} className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-12 text-left">
                  <h3 className="text-4xl font-black">{data.scene?.name}</h3>
                  <p className="text-lg text-zinc-400">{data.scene?.description}</p>
                  <div className="flex mt-8 gap-4">
                    <button onClick={nextStep} className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-lg shadow-xl">进入拍摄制作</button>
                    <button onClick={() => setPreviewScene(data.scene || null)} className="px-10 py-4 bg-white/10 backdrop-blur rounded-2xl font-black text-lg border border-white/10">全景预览</button>
                  </div>
                </div>
              </div>
           </div>
        </section>
      </div>

      {/* Persistent Bottom UI */}
      <div className="fixed bottom-12 left-0 right-0 z-50 px-12 pointer-events-none flex items-center justify-between">
        <div className="pointer-events-auto flex items-center">
          {step > 0 && (
            <button 
              onClick={prevStep}
              className="flex items-center space-x-2 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-widest bg-zinc-900/40 backdrop-blur px-4 py-2 rounded-full border border-white/5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
              <span>Back</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center">
              <div className={`h-1 transition-all duration-700 rounded-full ${step >= i ? 'bg-blue-500 w-12 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10 w-6'}`} />
              <span className={`text-[8px] mt-1 font-bold tracking-widest uppercase transition-opacity ${step === i ? 'opacity-100' : 'opacity-0'}`}>
                  {i === 0 ? 'CREATIVE' : i === 1 ? 'SCRIPT' : i === 2 ? 'CASTING' : 'STUDIO'}
              </span>
            </div>
          ))}
        </div>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {previewScene && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-12">
           <button onClick={() => setPreviewScene(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white uppercase font-black text-xs tracking-widest">Close Preview</button>
           <div className="max-w-6xl w-full aspect-video rounded-3xl overflow-hidden relative border border-white/10 shadow-3xl">
              <img src={previewScene.imageUrl} className="w-full h-full object-cover scale-110" />
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
