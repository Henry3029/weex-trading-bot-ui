"use client"
import React, { useState, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Activity, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Menu, 
  X,
  Lock,
  Layers,
  AlertCircle
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { io } from 'socket.io-client';
import { EngineStatus, SystemLog, EngineType } from '@/types';

// Dynamic base URL targeting backend port 3001
const API_BASE_URL = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:3001` 
  : 'http://localhost:3001';

const socket = io(API_BASE_URL); 

export default function App() {
  // 1. All State Definitions (Starts Unloaded / Empty)
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [user, setUser] = useState<{ id: string; email: string; freeUsdtBalance: number } | null>(null);
  
  const [isLoadingEngines, setIsLoadingEngines] = useState<boolean>(true);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedEngineForAlloc, setSelectedEngineForAlloc] = useState<EngineType | null>(null);
  const [allocInput, setAllocInput] = useState<string>('');
  const [allocError, setAllocError] = useState<string>('');
  const [isSubmittingAlloc, setIsSubmittingAlloc] = useState<boolean>(false);

  // 2. Computed Wallet Balances
  const freeUsdt = user ? user.freeUsdtBalance : 0.00;
  const allocatedUsdt = engines.reduce((acc, curr) => acc + (curr.allocatedCapital || 0), 0);

  // 3. Fetch Initial Data from Backend (No Hardcoded Initial Values)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingEngines(true);
      const token = localStorage.getItem('auth_token');

      try {
        // Fetch User Data if JWT Token exists
        if (token) {
          const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData.user);
          } else {
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        }

        // Fetch Real Engine Status and Allocations from Backend
        const engineRes = await fetch(`${API_BASE_URL}/engine/status`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (engineRes.ok) {
          const engineData = await engineRes.json();
          setEngines(engineData.engines || []);
          if (engineData.logs) setLogs(engineData.logs);
        }
      } catch (error) {
        console.error('Failed to sync engine data with backend:', error);
      } finally {
        setIsLoadingEngines(false);
      }
    };

    fetchInitialData();
  }, []);

  // 4. Handlers
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const handleAllocate = async (engineId: EngineType) => {
    setAllocError('');
    const amount = parseFloat(allocInput);

    if (isNaN(amount) || amount < 10) {
      setAllocError('Minimum allocation amount is $10 USDT.');
      return;
    }

    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (amount > user.freeUsdtBalance) {
      setAllocError('Insufficient free USDT balance.');
      return;
    }

    try {
      setIsSubmittingAlloc(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/engine/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          engineName: engineId,
          amountUsdt: amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to allocate capital');
      }

      // Update Local Engine State
      setEngines(prev => prev.map(e => e.id === engineId ? { ...e, allocatedCapital: (e.allocatedCapital || 0) + amount } : e));
      
      // Update Local User Free Balance State
      setUser(prev => prev ? { ...prev, freeUsdtBalance: data.freeBalance } : null);

      setSelectedEngineForAlloc(null);
      setAllocInput('');
    } catch (err: any) {
      setAllocError(err.message);
    } finally {
      setIsSubmittingAlloc(false);
    }
  };

  // 5. WebSocket Real-Time Subscriptions
  useEffect(() => {
    socket.on('engine_state_update', (data) => {
      setEngines((prevEngines) =>
        prevEngines.map((engine) => {
          if (engine.id === data.engineId) {
            return {
              ...engine,
              currentAsset: data.currentAsset ?? engine.currentAsset,
              currentPrice: data.currentPrice ?? engine.currentPrice,
              pnlPercentage: data.pnlPercentage ?? engine.pnlPercentage,
              status: data.status ?? engine.status,
              entryPrice: data.entryPrice ?? engine.entryPrice,
              takeProfitPrice: data.takeProfitPrice ?? engine.takeProfitPrice,
              stopLossPrice: data.stopLossPrice ?? engine.stopLossPrice
            };
          }
          return engine;
        })
      );
    });

    socket.on('engine_log', (newLog: SystemLog) => {
      setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 19)]);
    });

    return () => {
      socket.off('engine_state_update');
      socket.off('engine_log');
    };
  }, []);

  // 6. UI Render
  return (
    <div className="min-h-screen bg-midnight text-slate-100 font-sans pb-12">
      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
      />

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

          {/* Desktop Wallet Stats & User Auth */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <Wallet className="w-4 h-4 text-gold-500" />
              <span className="text-xs text-slate-400">Available:</span>
              <span className="font-semibold text-white">${freeUsdt.toFixed(2)} USDT</span>
            </div>

            <div className="flex items-center space-x-2 bg-gold-500/10 px-4 py-2 rounded-lg border border-gold-500/30">
              <Activity className="w-4 h-4 text-gold-500" />
              <span className="text-xs text-gold-400">Active Pool:</span>
              <span className="font-semibold text-gold-500">${allocatedUsdt.toFixed(2)} USDT</span>
            </div>

            {/* Profile / Login Toggle */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{user.email}</p>
                  <p className="text-[11px] text-gold-500">${user.freeUsdtBalance.toFixed(2)} USDT</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
              >
                <User className="w-4 h-4" /> Sign In / Register
              </button>
            )}
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
              <span className="font-semibold text-white">${freeUsdt.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-gold-400">Active Capital:</span>
              <span className="font-semibold text-gold-500">${allocatedUsdt.toFixed(2)} USDT</span>
            </div>
            <div className="pt-2">
              {user ? (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-400 flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gold-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  <User className="w-4 h-4" /> Sign In / Register
                </button>
              )}
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

        {isLoadingEngines ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading live engine state from backend...</p>
          </div>
        ) : engines.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-sm">
            No active strategy engines currently online.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {engines.map((engine) => {
              const isInPosition = engine.status === 'IN_POSITION';
              const pnl = engine.pnlPercentage || 0;
              const isProfit = pnl >= 0;

              return (
                <div 
                  key={engine.id} 
                  className="bg-cardDark border border-slate-800 hover:border-gold-500/40 transition-all rounded-xl p-5 flex flex-col justify-between relative shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-lg text-white">{engine.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Asset Focus: {engine.focusAssets ? engine.focusAssets.join(', ') : 'N/A'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        isInPosition 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {engine.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Current Symbol:</span>
                        <span className="font-bold text-white">{engine.currentAsset || 'N/A'}</span>
                      </div>

                      {isInPosition ? (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Live PnL:</span>
                            <span className={`font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              {pnl > 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                            <div>
                              <span className="text-slate-500 block">Target TP (+2%):</span>
                              <span className="text-emerald-400 font-medium">${engine.takeProfitPrice ? engine.takeProfitPrice.toFixed(4) : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Hard SL (-1%):</span>
                              <span className="text-rose-400 font-medium">${engine.stopLossPrice ? engine.stopLossPrice.toFixed(4) : 'N/A'}</span>
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

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                      <span>Your Engine Allocation:</span>
                      <span className="font-semibold text-gold-500">${(engine.allocatedCapital || 0).toFixed(2)} USDT</span>
                    </div>

                    {selectedEngineForAlloc === engine.id ? (
                      <div className="space-y-2">
                        {allocError && (
                          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{allocError}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="10"
                            placeholder="Amount USDT"
                            value={allocInput}
                            onChange={(e) => setAllocInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500 font-mono"
                          />
                          <button
                            disabled={isSubmittingAlloc}
                            onClick={() => handleAllocate(engine.id as EngineType)}
                            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center"
                          >
                            {isSubmittingAlloc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedEngineForAlloc(null);
                            setAllocError('');
                          }}
                          className="text-[10px] text-slate-400 hover:underline block text-center w-full"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedEngineForAlloc(engine.id as EngineType);
                          setAllocError('');
                        }}
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
        )}
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
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No active engine logs recorded yet.</p>
            ) : (
              logs.map((log) => (
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
                      {log.engine ? log.engine.split('_')[0] : 'SYS'}
                    </span>
                    <p className="text-slate-300 leading-relaxed">{log.message}</p>
                  </div>
                  <span className="text-slate-500 whitespace-nowrap text-[11px]">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}