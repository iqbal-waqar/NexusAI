import React, { useState, useRef, useEffect } from 'react';
import { AppAnalysisData } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Sparkles, FileText, MessageSquare, Send, Bot, User, Copy, Check, PieChart, AlertTriangle, Database } from 'lucide-react';
import Plot from 'react-plotly.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithCsv, ChatMessage } from '../services/api';

interface DashboardProps {
    data: AppAnalysisData;
}

interface CodeBlockProps {
    node?: unknown;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    const handleCopy = () => {
        if (!children) return;
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (inline) {
        return <code className="px-1 py-0.5 rounded text-cyan-400 font-mono text-sm" style={{background:'rgba(99,102,241,0.1)'}}>{children}</code>;
    }

    return (
        <div className="relative my-4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md group">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language || 'Code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <code className="text-sm font-mono text-slate-200 block whitespace-pre">
                    {children}
                </code>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
    const { basic_stats, narrative_summary, outliers, visualizations } = data;
    const [activeTab, setActiveTab] = useState<'analysis' | 'graphs' | 'chat'>('analysis');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! I've analyzed your CSV file. You can ask me questions about the data, like 'What is the average income?' or 'Show me the distribution of age'." }
    ]);
    const [input, setInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isChatLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsChatLoading(true);

        try {
            const response = await chatWithCsv(userMsg.content, messages);

            const botMsg: ChatMessage = {
                role: 'assistant',
                content: response.response || "I'm sorry, I couldn't process that."
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-24 animate-fade-in">

            {/* Tab Navigation */}
            <div className="flex justify-center mb-10">
                <div className="p-1.5 rounded-2xl inline-flex gap-1" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${activeTab === 'analysis'
                            ? 'text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                        style={activeTab === 'analysis' ? {background:'linear-gradient(135deg,#4f46e5,#7c3aed)',boxShadow:'0 4px 20px rgba(79,70,229,0.3)'} : {}}
                    >
                        <FileText className="w-4 h-4" />
                        Analysis
                    </button>

                    {visualizations && Object.keys(visualizations).length > 0 && (
                        <button
                            onClick={() => setActiveTab('graphs')}
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${activeTab === 'graphs'
                                ? 'text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            style={activeTab === 'graphs' ? {background:'linear-gradient(135deg,#c026d3,#a21caf)',boxShadow:'0 4px 20px rgba(192,38,211,0.3)'} : {}}
                        >
                            <PieChart className="w-4 h-4" />
                            Visuals
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${activeTab === 'chat'
                            ? 'text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                        style={activeTab === 'chat' ? {background:'linear-gradient(135deg,#c026d3,#a21caf)',boxShadow:'0 4px 20px rgba(192,38,211,0.3)'} : {}}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat with Data
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'analysis' && (
                <div className="animate-fade-in-up space-y-10">
                    {/* Narrative Analysis Section */}
                    <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="flex items-center space-x-5 mb-8 pb-8 relative z-10 border-b border-slate-100">
                            <div className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[20px] shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Executive Insight Report</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="px-3 py-1 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wide" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)'}}>AI Generated</span>
                                    <span className="text-slate-500 text-xs font-medium">Updated just now</span>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-lg prose-invert max-w-none relative z-10 leading-relaxed
                            prose-headings:font-extrabold prose-headings:tracking-tight
                            prose-h1:text-3xl prose-h1:text-white prose-h1:mb-6 prose-h1:mt-10 prose-h1:pb-4 prose-h1:border-b prose-h1:border-indigo-500/30
                            prose-h2:text-2xl prose-h2:text-white prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10
                            prose-h3:text-xl prose-h3:text-slate-200 prose-h3:mb-3 prose-h3:mt-6
                            prose-h4:text-lg prose-h4:text-slate-200 prose-h4:mb-2 prose-h4:mt-4
                            prose-p:text-slate-400 prose-p:text-base prose-p:leading-relaxed prose-p:mb-4
                            prose-strong:text-indigo-400 prose-strong:font-bold
                            prose-li:text-slate-400 prose-li:text-base prose-li:mb-2
                            prose-ul:my-4 prose-ol:my-4
                            prose-hr:border-white/10 prose-hr:my-8
                            prose-blockquote:border-l-4 prose-blockquote:border-indigo-500/50 prose-blockquote:bg-indigo-500/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg
                        ">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as React.ElementType }}>
                                {narrative_summary}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Data Quality & Outliers Section - Only for CSV */}
                    {outliers && Object.keys(outliers).length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <GlassCard hoverEffect className="overflow-auto h-full">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl" style={{background:'rgba(236,72,153,0.1)',border:'1px solid rgba(236,72,153,0.2)'}}>
                                            <AlertTriangle className="w-6 h-6 text-pink-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-xl">Outlier Detection</h4>
                                            <p className="text-sm text-slate-500 font-medium">Variables with significant deviations</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-indigo-400 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)'}}>IQR Method</span>
                                </div>
                                <div className="overflow-hidden rounded-xl" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                                    <table className="w-full text-sm text-center">
                                        <thead style={{background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                                            <tr className="text-xs text-slate-500 uppercase">
                                                <th className="px-6 py-4 font-bold text-left">Variable</th>
                                                <th className="px-6 py-4 font-bold">Range</th>
                                                <th className="px-6 py-4 font-bold">Count</th>
                                                <th className="px-6 py-4 font-bold text-right">Severity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                                            {Object.entries(outliers).map(([key, info]) => (
                                                <tr key={key} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-white text-left capitalize">{key}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                        {info.lower_bound.toFixed(0)} - {info.upper_bound.toFixed(0)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{background:'rgba(255,255,255,0.05)',color:'#a5b4fc'}}>
                                                            {info.count} <span className="text-slate-400 font-normal ml-1">({info.percentage}%)</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {info.count > 0 ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-pink-400" style={{background:'rgba(236,72,153,0.1)',border:'1px solid rgba(236,72,153,0.2)'}}>
                                                                High
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-emerald-400" style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)'}}>
                                                                Low
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>

                            {/* Data Specs Card */}
                            <GlassCard hoverEffect className="h-full">
                                <div className="flex items-center gap-4 mb-6 px-2">
                                    <div className="p-3 rounded-2xl" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
                                        <Database className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-xl">Dataset Specifications</h4>
                                        <p className="text-sm text-slate-500 font-medium">Technical summary of the ingested data</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Row Count</span>
                                        <span className="text-2xl font-extrabold text-white">{basic_stats.shape.rows.toLocaleString()}</span>
                                    </div>
                                    <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Column Count</span>
                                        <span className="text-2xl font-extrabold text-white">{basic_stats.shape.columns}</span>
                                    </div>
                                    <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Memory Usage</span>
                                        <span className="text-2xl font-extrabold text-white">{basic_stats.memory_usage} MB</span>
                                    </div>
                                    <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Duplicate Rows</span>
                                        <span className="text-2xl font-extrabold text-white">{basic_stats.duplicates}</span>
                                    </div>
                                    <div className="col-span-2 rounded-xl p-5" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Column Types</span>
                                        <div className="flex flex-wrap gap-3">
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                                                Numeric: {basic_stats.numerical_columns.length}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                                                Categorical: {basic_stats.categorical_columns.length}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                                                Date/Time: {basic_stats.datetime_columns.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'graphs' && visualizations && (
                <div className="animate-fade-in-up space-y-8">
                    {/* Correlation Heatmap - Full Width */}
                    {visualizations['correlation_heatmap'] && (
                        <div className="rounded-2xl p-6" style={{background:'rgba(16,16,30,0.7)',border:'1px solid rgba(255,255,255,0.06)'}}>
                            <h3 className="text-xl font-bold text-white mb-4 px-2">Correlation Heatmap</h3>
                            <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.04)'}}>
                                <Plot
                                    data={visualizations['correlation_heatmap'].data}
                                    layout={{
                                        ...visualizations['correlation_heatmap'].layout,
                                        autosize: true,
                                        paper_bgcolor: 'transparent',
                                        plot_bgcolor: 'rgba(16,16,30,0.5)',
                                        margin: { t: 40, r: 40, b: 80, l: 80 },
                                        font: { family: 'Inter, sans-serif', size: 12, color: '#8b8ba7' },
                                        height: 600
                                    }}
                                    useResizeHandler
                                    className="w-full"
                                    config={{ displayModeBar: false }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Other Visualizations - 2 Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(visualizations).map(([key, viz]) => {
                            // Skip correlation heatmap as it's rendered separately above
                            if (key === 'correlation_heatmap') return null;

                            return (
                                <div key={key} className="rounded-2xl p-5" style={{background:'rgba(16,16,30,0.7)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                    <h3 className="text-base font-bold text-white mb-3 px-2 capitalize">{key.replace(/_/g, ' ')}</h3>
                                    <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.04)'}}>
                                        <Plot
                                            data={viz.data}
                                            layout={{
                                                ...viz.layout,
                                                autosize: true,
                                                paper_bgcolor: 'transparent',
                                                plot_bgcolor: 'rgba(16,16,30,0.5)',
                                                margin: { t: 20, r: 20, b: 40, l: 40 },
                                                font: { family: 'Inter, sans-serif', color: '#8b8ba7' }
                                            }}
                                            useResizeHandler
                                            className="w-full h-[300px]"
                                            config={{ displayModeBar: false }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="animate-fade-in-up h-[700px] flex flex-col pt-4">
                    <div className="flex-1 rounded-2xl flex flex-col overflow-hidden relative" style={{background:'rgba(16,16,30,0.8)',border:'1px solid rgba(255,255,255,0.06)',backdropFilter:'blur(20px)'}}>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-fuchsia-500/5 via-purple-500/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                        <div className="px-6 py-4 flex items-center justify-between z-10" style={{borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(10,10,24,0.5)'}}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#c026d3,#7c3aed)',boxShadow:'0 4px 16px rgba(192,38,211,0.3)'}}>
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">AI Data Assistant</h3>
                                    <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">Powered by Llama 3.3</p>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-bold text-slate-400" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                    {basic_stats.shape.rows.toLocaleString()} Rows
                                </span>
                            </div>
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 p-10">
                                    <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Start the conversation by asking about your data.</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? '' : ''}`}
                                        style={msg.role === 'user' ? {background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.2)'} : {background:'rgba(192,38,211,0.15)',border:'1px solid rgba(192,38,211,0.2)'}}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-fuchsia-400" />}
                                    </div>
                                    <div className={`max-w-[75%] space-y-1`}>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'rounded-tr-sm text-white'
                                            : 'rounded-tl-sm text-slate-300'
                                            }`}
                                            style={msg.role === 'user' ? {background:'linear-gradient(135deg,#4f46e5,#7c3aed)'} : {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                            <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'prose-sm'} max-w-none`}>
                                                <ReactMarkdown components={{
                                                    code: CodeBlock as React.ElementType
                                                }}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.role === 'user' ? 'You' : 'Assistant'}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="flex gap-5 animate-fade-in">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(192,38,211,0.15)',border:'1px solid rgba(192,38,211,0.2)'}}>
                                        <Sparkles className="w-4 h-4 text-fuchsia-400" />
                                    </div>
                                    <div className="p-4 rounded-2xl rounded-tl-sm flex items-center gap-2" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                        <span className="text-sm font-bold text-slate-500 mr-2">Analyzing</span>
                                        <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 relative z-20" style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(10,10,24,0.5)'}}>
                            {messages.length < 3 && (
                                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
                                    <button onClick={() => setInput(`Describe the dataframe`)} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-slate-400 hover:text-indigo-400" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                        📊 Summarize Data
                                    </button>
                                    <button onClick={() => setInput(`Show me the correlation between ${basic_stats.numerical_columns.slice(0, 2).join(' and ')}`)} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-slate-400 hover:text-indigo-400" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                        📈 View Correlations
                                    </button>
                                    <button onClick={() => setInput(`Are there any outliers in ${basic_stats.numerical_columns[0]}?`)} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-slate-400 hover:text-indigo-400" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                        ⚠️ Check Outliers
                                    </button>
                                    <button onClick={() => setInput(`Predict future trends and insights based on this data`)} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-slate-400 hover:text-fuchsia-400" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                        🔮 Predict Trends
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your question here..."
                                    className="w-full pl-5 pr-16 py-4 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium outline-none"
                                    style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}
                                    disabled={isChatLoading} />
                                <div className="absolute right-2">
                                    <button type="submit" disabled={!input.trim() || isChatLoading}
                                        className="p-2.5 text-white rounded-lg disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                                        style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                            <p className="text-[10px] text-center text-slate-600 mt-2 font-semibold tracking-wide">
                                AI can make mistakes. Verify important information.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};