'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Zap, 
  Wallet, 
  Activity, 
  LogOut, 
  Menu, 
  X, 
  Key, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle,
  User,
  Terminal
} from 'lucide-react';
import ConnectWeexModal from '@/components/ConnectWeexModal';
import AuthModal from '@/components/AuthModal';
import { EngineStatus, SystemLog, EngineType } from '@/types';

// Correct target: Socket server (bot.bigviewbot.online / Port 3001)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://bot.bigviewbot.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.bigviewbot.online';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

interface UserData {
  id?: string;
  email?: string;
  username?: string;
  weexConnected?: boolean;
  freeUsdtBalance?: number;
  allocatedUsdtBalance?: number;
  [key: string]: any;
}

export default function App() {
  // Auth & UI States
  const [isConnectWeexOpen, setIsConnectWeexOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingEngines, setIsLoadingEngines] = useState(false);
  const [engines, setEngines] = useState<any[]>([]);
  const [selectedEngineForAlloc, setSelectedEngineForAlloc] = useState<EngineType | null>(null);
  const [allocInput, setAllocInput] = useState('');
  const [allocError, setAllocError] = useState('');
  const [isSubmittingAlloc, setIsSubmittingAlloc] = useState(false);

  // ⚡ 3 Separate Engine Log States
  const [engine1Logs, setEngine1Logs] = useState<any[]>([]);
  const [engine2Logs, setEngine2Logs] = useState<any[]>([]);
  const [engine3Logs, setEngine3Logs] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Balances
  const freeUsdt = user?.freeUsdtBalance ?? 0;
  const allocatedUsdt = user?.allocatedUsdtBalance ?? 0;

  // Socket Connection & Log Listener (ONLY Active When User is Logged In)
  useEffect(() => {
    socket.on('connect', () => setIsSocketConnected(true));
    socket.on('disconnect', () => setIsSocketConnected(false));

    // GUARD: Only attach engine log listeners if a user is logged in
    if (!user) {
      setEngine1Logs([]);
      setEngine2Logs([]);
      setEngine3Logs([]);
      return;
    }

    const handleEngineLog = (logPayload: any) => {
      // Route incoming log to the correct engine bucket
      if (logPayload.engine === 'ENGINE_1' || logPayload.engine === 'ARBITRAGE') {
        setEngine1Logs((prev) => [logPayload, ...prev].slice(0, 100));
      } else if (logPayload.engine === 'ENGINE_2' || logPayload.engine === 'MOMENTUM') {
        setEngine2Logs((prev) => [logPayload, ...prev].slice(0, 100));
      } else if (logPayload.engine === 'ENGINE_3' || logPayload.engine === 'REENTRANCE_GUARD') {
        setEngine3Logs((prev) => [logPayload, ...prev].slice(0, 100));
      }
    };

    socket.on('engine_log', handleEngineLog);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('engine_log', handleEngineLog);
    };
  }, [user]); // Re-run effect when user logs in or logs out

  const handleLogout = () => {
    setUser(null);
  };

  const handleAllocate = async (engineId: EngineType) => {
    const amount = parseFloat(allocInput);
    if (isNaN(amount) || amount < 10) {
      setAllocError('Minimum allocation is 10 USDT');
      return;
    }
    if (amount > freeUsdt) {
      setAllocError('Insufficient free USDT balance');
      return;
    }

    setIsSubmittingAlloc(true);
    setAllocError('');

    try {
      setSelectedEngineForAlloc(null);
      setAllocInput('');
    } catch (err: any) {
      setAllocError(err.message || 'Failed to allocate capital');
    } finally {
      setIsSubmittingAlloc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
        apiBaseUrl={API_URL}
      />

      <ConnectWeexModal
        isOpen={isConnectWeexOpen}
        onClose={() => setIsConnectWeexOpen(false)}
        onSuccess={(userData) => {
          setUser((prev) => (prev ? { ...prev, ...userData, weexConnected: true } : null));
        }}
        apiBaseUrl={API_URL}
      />

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">
                WEEX <span className="text-amber-500">AI BOT</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Multi-Engine Trading Vaults</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-400">Available:</span>
              <span className="font-semibold text-white">${freeUsdt.toFixed(2)} USDT</span>
            </div>

            <div className="flex items-center space-x-2 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-400">Active Pool:</span>
              <span className="font-semibold text-amber-500">${allocatedUsdt.toFixed(2)} USDT</span>
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">
                      {user.email || user.username || 'Trader Account'}
                    </p>
                    {user.weexConnected ? (
                      <button
                        onClick={() => setIsConnectWeexOpen(true)}
                        className="text-[11px] font-medium text-emerald-400 hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        WEEX API Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsConnectWeexOpen(true)}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <Key className="w-3 h-3" /> Connect WEEX Keys
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  <User className="w-4 h-4" /> Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ENGINE VAULTS SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Active Strategy Vaults
          </h3>
        </div>

        {/* ⚡ LIVE ENGINE TERMINALS (Renders Log Terminals for Logged-In Users) */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" /> Segregated Live Engine Sockets
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-mono text-slate-400">
                {isSocketConnected ? 'SOCKET ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {!user ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
              🔒 Log in to view live real-time execution logs for Engine 1, Engine 2, and Engine 3.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TerminalConsole title="ENGINE 1: ARBITRAGE" logs={engine1Logs} badge="text-amber-400" />
              <TerminalConsole title="ENGINE 2: MOMENTUM" logs={engine2Logs} badge="text-cyan-400" />
              <TerminalConsole title="ENGINE 3: RE-ENTRANCE GUARD" logs={engine3Logs} badge="text-purple-400" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Reusable Engine Terminal Component
function TerminalConsole({ title, logs, badge }: { title: string; logs: any[]; badge: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono h-80 flex flex-col justify-between shadow-xl">
      <div className="text-xs font-bold border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
        <span className={badge}>{title}</span>
        <span className="text-slate-500 text-[10px]">{logs.length} EVENTS</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Waiting for engine activity...</p>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id || idx} className="border-b border-slate-900/80 pb-1">
              <span className="text-slate-500">[{log.timestamp || 'LIVE'}]</span>{' '}
              <span className={`font-bold ${log.type === 'ERROR' ? 'text-rose-500' : 'text-emerald-400'}`}>
                [{log.type || 'INFO'}]
              </span>{' '}
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}