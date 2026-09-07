"use client"
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Activity, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  ChevronRight, 
  Menu, 
  X,
  Lock,
  Layers
} from 'lucide-react';
import { EngineStatus, SystemLog, EngineType } from '@/types';

export const INITIAL_ENGINES: EngineStatus[] = [
  {
    id: 'MAJOR_ENGINE',
    name: 'Major Assets Engine',
    focusAssets: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
    currentAsset: 'BTC/USDT',
    status: 'IN_POSITION',
    pnlPercentage: 1.45,
    entryPrice: 64200.00,
    currentPrice: 65130.50,
    takeProfitPrice: 65484.00,
    stopLossPrice: 63558.00,
    allocatedCapital: 500
  },
  {
    id: 'ALT_ENGINE',
    name: 'Altcoin Engine',
    focusAssets: ['DOGE/USDT', 'XRP/USDT', 'AVAX/USDT', 'ZEC/USDT'],
    currentAsset: 'DOGE/USDT',
    status: 'HUNTING',
    pnlPercentage: 0.00,
    currentPrice: 0.1245,
    allocatedCapital: 250
  },
  {
    id: 'MEME_ENGINE',
    name: 'Meme/High-Vol Engine',
    focusAssets: ['BTW/USDT'],
    currentAsset: 'BTW/USDT',
    status: 'IN_POSITION',
    pnlPercentage: -0.42,
    entryPrice: 0.0850,
    currentPrice: 0.0846,
    takeProfitPrice: 0.0867,
    stopLossPrice: 0.0841,
    allocatedCapital: 0
  }
];

const MOCK_LOGS = [ 
 { id: '1', engine: 'MAJOR_ENGINE', type: 'TAKE_PROFIT', message: 'Step-Up Lock adjusted SL to entry price (+1.00% secured).', timestamp: '10:42 AM' },
  { id: '2', engine: 'ALT_ENGINE', type: 'INFO', message: '3-Hour Pivot window elapsed. Switched active monitoring focus to DOGE/USDT.', timestamp: '10:30 AM' },
  { id: '3', engine: 'MEME_ENGINE', type: 'BUY', message: 'EMA Crossover buy order executed for BTW/USDT at $0.0850.', timestamp: '10:15 AM' },
  { id: '4', engine: 'MAJOR_ENGINE', type: 'STOP_LOSS', message: 'Hard Stop Loss triggered on previous trade (-1.00%). Pivot executed.', timestamp: '08:20 AM' },
] as SystemLog[];


const socket = io('http://localhost:3000'); 
export default function App() {
  const [engines, setEngines] = useState<EngineStatus[]>(INITIAL_ENGINES);
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [userWallet] = useState({ freeUsdt: 1250.00, allocatedUsdt: 750.00 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedEngineForAlloc, setSelectedEngineForAlloc] = useState<EngineType | null>(null);
  const [allocInput, setAllocInput] = useState<string>('');

  const handleAllocate = (engineId: EngineType) => {
    const amount = parseFloat(allocInput);
    if (isNaN(amount) || amount < 10) return;

    setEngines(prev => prev.map(e => e.id === engineId ? { ...e, allocatedCapital: e.allocatedCapital + amount } : e));
    setSelectedEngineForAlloc(null);
    setAllocInput('');
    
  };
  
  useEffect(() => {
    // 1. Listen for Live Engine Price & PnL updates
    socket.on('engine_state_update', (data) => {
      setEngines((prevEngines) =>
        prevEngines.map((engine) => {
          if (engine.id === data.engineId) {
            return {
              ...engine,
              currentAsset: data.currentAsset ?? engine.currentAsset,
              currentPrice: data.currentPrice ?? engine.currentPrice,
              pnlPercentage: data.pnlPercentage ?? engine.pnlPercentage,
              status: data.status ?? engine.status
            };
          }
          return engine;
        })
      );
    });

    // 2. Listen for Real-Time Execution Logs
    socket.on('engine_log', (newLog: SystemLog) => {
      setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 19)]); // Keep top 20 logs
    });

    // Cleanup listener on unmount
    return () => {
      socket.off('engine_state_update');
      socket.off('engine_log');
    };
  }, []);

  return (
    <div className="min-h-screen bg-midnight text-slate-100 font-sans pb-12">
      {/* HEADER / NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">WEEX <span className="text-gold-500">AI BOT</span></h1>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Multi-Engine Trading Vaults</p>
            </div>
          </div>

          {/* Desktop Balance Info */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <Wallet className="w-4 h-4 text-gold-500" />
              <span className="text-xs text-slate-400">Available:</span>
              <span className="font-semibold text-white">${userWallet.freeUsdt.toFixed(2)} USDT</span>
            </div>
            <div className="flex items-center space-x-2 bg-gold-500/10 px-4 py-2 rounded-lg border border-gold-500/30">
              <Activity className="w-4 h-4 text-gold-500" />
              <span className="text-xs text-gold-400">Active Pool:</span>
              <span className="font-semibold text-gold-500">${userWallet.allocatedUsdt.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Free Balance:</span>
              <span className="font-semibold text-white">${userWallet.freeUsdt.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gold-400">Active Capital:</span>
              <span className="font-semibold text-gold-500">${userWallet.allocatedUsdt.toFixed(2)} USDT</span>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-gold-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-500 border border-gold-500/30 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> High-Tech Risk Management Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Institutional Automation. <br className="hidden sm:inline" />
              <span className="text-gold-500">Zero Manual Trades Required.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Select an engine vault to join. Our dual-step EMA crossover mechanism continuously hunts high-probability momentum entries while strictly protecting capital with an automated 1.00% Hard Stop.
            </p>
          </div>
        </div>
      </section>

      {/* LIVE ENGINE VAULTS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold-500" /> Active Strategy Engines
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live API Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {engines.map((engine) => {
            const isInPosition = engine.status === 'IN_POSITION';
            const isProfit = engine.pnlPercentage >= 0;

            return (
              <div 
                key={engine.id} 
                className="bg-cardDark border border-slate-800 hover:border-gold-500/40 transition-all rounded-xl p-5 flex flex-col justify-between relative shadow-lg"
              >
                <div>
                  {/* Engine Top Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-lg text-white">{engine.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Asset Focus: {engine.focusAssets.join(', ')}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      isInPosition 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {engine.status}
                    </span>
                  </div>

                  {/* Engine Live Metrics */}
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Current Symbol:</span>
                      <span className="font-bold text-white">{engine.currentAsset}</span>
                    </div>

                    {isInPosition ? (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Live PnL:</span>
                          <span className={`font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {engine.pnlPercentage > 0 ? `+${engine.pnlPercentage}` : engine.pnlPercentage}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                          <div>
                            <span className="text-slate-500 block">Target TP (+2%):</span>
                            <span className="text-emerald-400 font-medium">${engine.takeProfitPrice?.toFixed(4)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Hard SL (-1%):</span>
                            <span className="text-rose-400 font-medium">${engine.stopLossPrice?.toFixed(4)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-500" />
                        Scanning market order books for entry signal...
                      </div>
                    )}
                  </div>
                </div>

                {/* Capital Allocation Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span>Your Engine Allocation:</span>
                    <span className="font-semibold text-gold-500">${engine.allocatedCapital.toFixed(2)} USDT</span>
                  </div>

                  {selectedEngineForAlloc === engine.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount USDT"
                          value={allocInput}
                          onChange={(e) => setAllocInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
                        />
                        <button
                          onClick={() => handleAllocate(engine.id)}
                          className="bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                      <button 
                        onClick={() => setSelectedEngineForAlloc(null)}
                        className="text-[10px] text-slate-400 hover:underline block text-center w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedEngineForAlloc(engine.id)}
                      className="w-full bg-slate-800 hover:bg-gold-500 hover:text-slate-950 border border-slate-700 hover:border-gold-500 text-slate-200 font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> Allocate Trading Capital
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* REAL-TIME SYSTEM LOGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-cardDark border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-500" /> Live AI Engine Decisions
            </h3>
            <span className="text-xs text-slate-500">Auto-updating websocket feed</span>
          </div>

          <div className="mt-4 space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs gap-4"
              >
                <div className="flex items-start gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase mt-0.5 ${
                    log.type === 'TAKE_PROFIT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    log.type === 'STOP_LOSS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    log.type === 'BUY' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.engine.split('_')[0]}
                  </span>
                  <p className="text-slate-300 leading-relaxed">{log.message}</p>
                </div>
                <span className="text-slate-500 whitespace-nowrap text-[11px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}