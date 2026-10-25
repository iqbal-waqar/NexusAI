import React, { useState } from 'react';
import {
  Bot, LayoutDashboard, Settings, History, Sparkles, Search, Bell, Menu,
  ChevronLeft, User, LogOut, UploadCloud, Database, ArrowRight,
  PanelLeftClose, PanelLeftOpen, Zap, Shield, Brain, Cpu, Globe
} from 'lucide-react';
import { ViewState, AppAnalysisData, DbConnectionDetails } from './types';
import { analyzeCsv, analyzeDatabase } from './services/api';
import { FileUploader } from './components/FileUploader';
import { DbForm } from './components/DbForm';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [mode, setMode] = useState<'csv' | 'db' | null>(null);
  const [data, setData] = useState<AppAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLog, setHistoryLog] = useState<import('./types').HistoryLogItem[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'new' | 'history'>('new');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const addToHistory = (type: 'upload' | 'db_connect', name: string) => {
    const newItem: import('./types').HistoryLogItem = {
      id: Date.now().toString(), type,
      preview: type === 'upload' ? `Uploaded ${name}` : `Connected to ${name}`,
      timestamp: new Date()
    };
    setHistoryLog(prev => [newItem, ...prev]);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true); setError(null);
    try {
      const result = await analyzeCsv(file);
      setData(result); addToHistory('upload', file.name); setView('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze CSV.");
    } finally { setIsLoading(false); }
  };

  const handleDbConnect = async (details: DbConnectionDetails) => {
    setIsLoading(true); setError(null);
    try {
      const result = await analyzeDatabase(details);
      setData(result); addToHistory('db_connect', details.database_name || "Database"); setView('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect.");
    } finally { setIsLoading(false); }
  };

  const reset = () => { setView('landing'); setMode(null); setData(null); setError(null); };

  const sidebarLinks = [
    { id: 'new' as const, icon: LayoutDashboard, label: 'New Analysis', onClick: () => { reset(); setActiveSidebarTab('new'); } },
    { id: 'history' as const, icon: History, label: 'History', onClick: () => setActiveSidebarTab('history') },
  ];

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#060614' }}>
      {/* Ambient Orbs */}
      <div className="orb orb-indigo" style={{ width: 600, height: 600, top: '-15%', left: '-10%' }} />
      <div className="orb orb-violet" style={{ width: 500, height: 500, top: '40%', right: '-12%' }} />
      <div className="orb orb-fuchsia" style={{ width: 400, height: 400, bottom: '-15%', left: '25%' }} />
      <div className="orb orb-cyan" style={{ width: 300, height: 300, top: '10%', right: '20%' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 grid-overlay pointer-events-none" />

      {/* Background image */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ backgroundImage: 'url(/nexus-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(180deg, rgba(6,6,20,0.8) 0%, rgba(6,6,20,0.3) 40%, rgba(6,6,20,0.9) 100%)' }} />

      {/* Decorative rings */}
      <div className="ring-decoration" style={{ width: 300, height: 300, top: '60%', left: '10%' }} />
      <div className="ring-decoration" style={{ width: 200, height: 200, top: '20%', right: '15%', animationDuration: '20s', animationDirection: 'reverse' }} />

      {/* ===== SIDEBAR ===== */}
      <aside className={`${isSidebarExpanded ? 'w-[260px]' : 'w-[80px]'} hidden md:flex flex-col h-full z-30 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative`}
        style={{ background: 'rgba(8,8,20,0.92)', borderRight: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>

        {/* Logo */}
        <div className={`h-20 flex items-center ${isSidebarExpanded ? 'px-6' : 'justify-center'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 animate-glow-pulse relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)' }}>
              <Bot className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/10 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white">NexusAI</span>
                <span style={{ fontSize: '8px', letterSpacing: '0.2em' }} className="font-bold uppercase gradient-text-subtle">Analytics Platform</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {sidebarLinks.map(link => (
            <button key={link.id} onClick={link.onClick}
              className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300
                ${activeSidebarTab === link.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              style={activeSidebarTab === link.id ? { background: 'rgba(99,102,241,0.1)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0.05)' } : {}}>
              <link.icon className={`w-5 h-5 shrink-0 transition-colors ${activeSidebarTab === link.id ? 'text-indigo-400' : ''}`} />
              {isSidebarExpanded && <span className="font-semibold text-sm">{link.label}</span>}
            </button>
          ))}

          {/* History items */}
          {isSidebarExpanded && activeSidebarTab === 'history' && (
            <div className="mt-4 px-1 space-y-2 animate-fade-in">
              <p style={{ fontSize: '9px', letterSpacing: '0.15em' }} className="font-bold uppercase text-slate-600 mb-2 px-1">Recent</p>
              {historyLog.length === 0 ? (
                <p className="text-xs text-slate-600 italic px-1">No activity yet</p>
              ) : historyLog.map(item => (
                <div key={item.id} className="p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'upload' ? <UploadCloud className="w-3 h-3 text-indigo-400" /> : <Database className="w-3 h-3 text-fuchsia-400" />}
                    <span style={{ fontSize: '8px' }} className="font-bold uppercase text-slate-600">{item.type === 'upload' ? 'File' : 'DB'}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-400 truncate">{item.preview}</p>
                </div>
              ))}
            </div>
          )}

          <button className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-slate-300 transition-all duration-300">
            <Settings className="w-5 h-5 shrink-0" />
            {isSidebarExpanded && <span className="font-semibold text-sm">Settings</span>}
          </button>
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {isSidebarExpanded && (
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3730a3, #5b21b6, #7e22ce)', boxShadow: '0 8px 32px rgba(79,70,229,0.25)' }}>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full blur-xl" />
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs text-white">AI Engine Active</span>
              </div>
              <p className="text-[10px] text-indigo-200/60 relative z-10">
                {isLoading ? "Processing your data..." : "Standing by for analysis"}
              </p>
              {isLoading && (
                <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden relative">
                  <div className="h-full bg-white/70 rounded-full absolute" style={{ width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              )}
            </div>
          )}
          <div className={`flex items-center gap-3 p-2 rounded-xl ${isSidebarExpanded ? '' : 'justify-center'}`}
            style={isSidebarExpanded ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' } : {}}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.15)' }}>
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            {isSidebarExpanded && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">Demo User</p>
                  <p style={{ fontSize: '8px', letterSpacing: '0.15em' }} className="font-bold uppercase text-slate-600">Pro Plan</p>
                </div>
                <button className="text-slate-600 hover:text-red-400 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-10 rounded-full p-1.5 z-50 transition-all hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {isSidebarExpanded ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-72 shadow-2xl transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ background: 'rgba(8,8,20,0.97)', backdropFilter: 'blur(24px)' }}>
          <div className="h-16 flex items-center justify-between px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white">NexusAI</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 rounded-lg hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 lg:px-8 z-20 shrink-0"
          style={{ background: 'rgba(6,6,20,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-white md:hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-white">
                {view === 'landing' ? 'Dashboard' : 'Analytics'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest"
                style={{ background: view === 'landing' ? 'rgba(99,102,241,0.1)' : 'rgba(217,70,239,0.1)', border: `1px solid ${view === 'landing' ? 'rgba(99,102,241,0.15)' : 'rgba(217,70,239,0.15)'}`, color: view === 'landing' ? '#a5b4fc' : '#e879f9' }}>
                {view === 'landing' ? 'Overview' : 'Report'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Online</span>
            </div>
            <div className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 text-xs rounded-lg w-44 outline-none text-slate-300 placeholder:text-slate-600 transition-all focus:w-56 focus:ring-1 focus:ring-indigo-500/30"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
            </div>
            <button className="relative p-2 rounded-lg text-slate-500 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full max-w-[1400px] mx-auto px-6 py-8 lg:px-10">

            {view === 'landing' && (
              <div className="flex flex-col items-center animate-fade-in-up">

                {/* Hero */}
                <div className="text-center max-w-3xl space-y-7 mb-20 mt-8 relative">
                  {/* Floating badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold animate-float"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: '#a5b4fc', animationDelay: '0.5s' }}>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI-Powered Data Intelligence Platform
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                    <span className="text-white">Transform data</span><br />
                    <span className="text-white">into </span>
                    <span className="gradient-text">intelligence.</span>
                  </h1>

                  <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium" style={{ color: '#6b6b8a' }}>
                    Upload CSV files or connect databases. NexusAI analyzes, visualizes, and generates executive insights — all in seconds.
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center justify-center gap-8 pt-2">
                    {[
                      { value: '10x', label: 'Faster Analysis' },
                      { value: '99%', label: 'Accuracy' },
                      { value: 'AI', label: 'Powered' },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xl font-black gradient-text-subtle">{s.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cards or Form */}
                {!mode ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl mb-16">
                      {/* Upload Card */}
                      <button onClick={() => setMode('csv')} className="card-dark group p-8 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} />
                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <UploadCloud className="w-6 h-6 text-indigo-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">Upload CSV</h3>
                          <p className="text-sm font-medium mb-5" style={{ color: '#55556e' }}>Drag & drop for instant AI analysis</p>
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                            Start Analysis <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>

                      {/* Database Card */}
                      <button onClick={() => setMode('db')} className="card-dark group p-8 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.15), transparent 70%)' }} />
                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                            style={{ background: 'rgba(217,70,239,0.08)', border: '1px solid rgba(217,70,239,0.15)' }}>
                            <Database className="w-6 h-6 text-fuchsia-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">Connect Database</h3>
                          <p className="text-sm font-medium mb-5" style={{ color: '#55556e' }}>PostgreSQL & MongoDB support</p>
                          <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                            Connect Now <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl mb-12">
                      {[
                        { icon: Zap, label: 'Real-time Analysis', desc: 'Instant insights on upload', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.1)' },
                        { icon: Brain, label: 'AI Intelligence', desc: 'LLM-powered narratives', color: '#818cf8', bg: 'rgba(129,140,248,0.06)', border: 'rgba(129,140,248,0.1)' },
                        { icon: Shield, label: 'Secure & Private', desc: 'Your data stays local', color: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.1)' },
                      ].map((f, i) => (
                        <div key={i} className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
                          style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                          <f.icon className="w-5 h-5 mx-auto mb-3" style={{ color: f.color }} />
                          <div className="text-xs font-bold text-white mb-1">{f.label}</div>
                          <div className="text-[10px] font-medium" style={{ color: '#55556e' }}>{f.desc}</div>
                        </div>
                      ))}
                    </div>

                    {/* Powered by strip */}
                    <div className="flex items-center gap-4 text-slate-600">
                      <span className="text-[9px] font-bold uppercase tracking-widest">Powered by</span>
                      <div className="h-px w-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="flex items-center gap-3">
                        {[{ icon: Cpu, name: 'Groq' }, { icon: Brain, name: 'LangChain' }, { icon: Globe, name: 'Plotly' }].map((t, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <t.icon className="w-3 h-3" /> {t.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-3xl animate-scale-in mb-16">
                    <button onClick={() => setMode(null)}
                      className="mb-6 text-sm flex items-center font-bold transition-colors group" style={{ color: '#55556e' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all group-hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                      <span className="group-hover:text-slate-300">Back to options</span>
                    </button>

                    <div className="card-dark p-8 md:p-10 relative overflow-hidden" style={{ borderRadius: 28 }}>
                      <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)' }} />
                      {mode === 'csv' ? (
                        <FileUploader onFileSelected={handleFileUpload} isLoading={isLoading} />
                      ) : (
                        <DbForm onSubmit={handleDbConnect} isLoading={isLoading} />
                      )}
                      {error && (
                        <div className="mt-6 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-fade-in"
                          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                          ⚠ {error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === 'dashboard' && data && (
              <div className="pb-10 animate-fade-in-up">
                <Dashboard data={data} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
