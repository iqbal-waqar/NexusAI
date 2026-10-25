import React, { useState } from 'react';
import { Database, Server, Key, User, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { DbConnectionDetails } from '../types';

interface DbFormProps {
  onSubmit: (details: DbConnectionDetails) => void;
  isLoading: boolean;
  onTest?: (details: DbConnectionDetails) => void;
}

export const DbForm: React.FC<DbFormProps> = ({ onSubmit, isLoading, onTest }) => {
  const [step, setStep] = useState<'type-selection' | 'details'>('type-selection');
  const [formError, setFormError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const [details, setDetails] = useState<DbConnectionDetails>({
    db_type: 'postgresql', host: 'localhost', port: 5432, database: '', username: '', password: ''
  });

  const handleTypeSelect = (type: 'postgresql' | 'mongodb') => {
    setDetails(prev => ({ ...prev, db_type: type, port: type === 'postgresql' ? 5432 : 27017 }));
    setStep('details'); setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: name === 'port' ? parseInt(value) || 0 : value }));
    if (formError) setFormError(null);
  };

  const validate = () => {
    if (!details.database || details.database.trim() === '') return "Database name is required";
    if (details.db_type === 'postgresql') {
      if (!details.host || details.host.trim() === '') return "Host address is required";
      if (!details.port || isNaN(details.port) || details.port <= 0 || details.port > 65535) return "Port must be valid (1-65535)";
      if (!details.username || details.username.trim() === '') return "Username is required";
    } else if (details.db_type === 'mongodb') {
      if (!details.connection_uri || details.connection_uri.trim() === '') return "MongoDB URI is required";
      if (!details.connection_uri.startsWith('mongodb://') && !details.connection_uri.startsWith('mongodb+srv://')) return "URI must start with mongodb:// or mongodb+srv://";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) { setFormError(error); return; }
    onSubmit(details);
  };

  const handleTestConnection = async () => {
    const error = validate();
    if (error) { setFormError(error); return; }
    if (onTest) { setIsTesting(true); try { await onTest(details); } finally { setIsTesting(false); } }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e2f0',
  };
  const inputClass = "w-full text-sm rounded-xl p-4 transition-all outline-none font-medium placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-500";
  const iconClass = "absolute right-4 top-[38px] w-4 h-4 text-slate-600 pointer-events-none";

  if (step === 'type-selection') {
    return (
      <div className="w-full max-w-4xl mx-auto animate-fade-in">
        <h3 className="text-2xl font-bold text-white text-center mb-2">Choose Database</h3>
        <p className="text-center mb-8 font-medium" style={{ color: '#6b6b8a' }}>Select the source you want to analyze</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PostgreSQL */}
          <button onClick={() => handleTypeSelect('postgresql')}
            className="group relative rounded-2xl p-7 text-left transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Database className="w-7 h-7 text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">PostgreSQL</h4>
            <p className="text-sm font-medium mb-4" style={{ color: '#6b6b8a' }}>Relational data with SQL support</p>
            <div className="flex items-center text-sm font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Select <ArrowRight className="w-4 h-4 ml-2" />
            </div>
            {details.db_type === 'postgresql' && (
              <div className="absolute top-4 right-4 text-blue-400 animate-scale-in"><CheckCircle2 className="w-5 h-5" /></div>
            )}
          </button>
          {/* MongoDB */}
          <button onClick={() => handleTypeSelect('mongodb')}
            className="group relative rounded-2xl p-7 text-left transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Server className="w-7 h-7 text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">MongoDB</h4>
            <p className="text-sm font-medium mb-4" style={{ color: '#6b6b8a' }}>NoSQL document collections</p>
            <div className="flex items-center text-sm font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Select <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep('type-selection')} className="mr-3 p-2 rounded-lg text-slate-500 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-white">Connection Details</h3>
          <p className="text-xs font-medium flex items-center gap-2" style={{ color: '#6b6b8a' }}>
            Configuring <span className="font-bold text-indigo-400 uppercase">{details.db_type}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {details.db_type === 'postgresql' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className={labelClass}>Host Address</label>
                <input type="text" name="host" value={details.host || ''} onChange={handleChange} placeholder="localhost"
                  className={inputClass} style={{ ...inputStyle, borderColor: formError && !details.host?.trim() ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }} />
                <Server className={iconClass} />
              </div>
              <div className="relative">
                <label className={labelClass}>Port</label>
                <input type="number" name="port" value={details.port || ''} onChange={handleChange}
                  className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="relative">
              <label className={labelClass}>Database Name</label>
              <input type="text" name="database" value={details.database} onChange={handleChange} placeholder="production_db"
                className={inputClass} style={{ ...inputStyle, borderColor: formError && !details.database?.trim() ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }} />
              <Database className={iconClass} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className={labelClass}>Username</label>
                <input type="text" name="username" value={details.username || ''} onChange={handleChange}
                  className={inputClass} style={inputStyle} />
                <User className={iconClass} />
              </div>
              <div className="relative">
                <label className={labelClass}>Password</label>
                <input type="password" name="password" value={details.password || ''} onChange={handleChange}
                  className={inputClass} style={inputStyle} />
                <Key className={iconClass} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <label className={labelClass}>MongoDB Connection URI</label>
              <input type="text" name="connection_uri" value={details.connection_uri || ''} onChange={handleChange}
                placeholder="mongodb://username:password@host:port/"
                className={inputClass} style={inputStyle} />
              <Server className={iconClass} />
            </div>
            <div className="relative">
              <label className={labelClass}>Database Name</label>
              <input type="text" name="database" value={details.database} onChange={handleChange} placeholder="myapp_db"
                className={inputClass} style={inputStyle} />
              <Database className={iconClass} />
            </div>
          </>
        )}

        {formError && (
          <div className="p-3 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {formError}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {onTest && (
            <button type="button" onClick={handleTestConnection} disabled={isLoading || isTesting}
              className="flex-1 font-bold rounded-xl text-sm px-5 py-3.5 inline-flex items-center justify-center transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a5b4fc' }}>
              {isTesting ? <><div className="animate-spin h-4 w-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full mr-2" />Testing...</> : 'Test Connection'}
            </button>
          )}
          <button type="submit" disabled={isLoading || isTesting}
            className="flex-1 font-bold rounded-xl text-sm px-5 py-3.5 text-white inline-flex items-center justify-center transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 20px rgba(79,70,229,0.3)' }}>
            {isLoading ? <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2" />Connecting...</> :
              <>Connect & Analyze <ArrowRight className="w-4 h-4 ml-2" /></>}
          </button>
        </div>
      </form>
    </div>
  );
};