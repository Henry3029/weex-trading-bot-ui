import React, { useState } from 'react';
import { X, Shield, AlertCircle, Loader2, Wallet } from 'lucide-react';
import { BrowserProvider } from 'ethers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; walletAddress: string; freeUsdtBalance: number }) => void;
  apiBaseUrl?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  apiBaseUrl = 'http://localhost:3001' 
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Verify MetaMask extension exists
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install the browser extension.');
      }

      // 2. Connect to wallet using Ethers v6
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error('No Ethereum accounts found.');
      }

      const walletAddress = accounts[0];

      // 3. Step 1: Request Nonce from Backend
      const nonceRes = await fetch(`${apiBaseUrl}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) {
        throw new Error(nonceData.error || 'Failed to request authentication nonce.');
      }

      // 4. Step 2: Sign Message via MetaMask
      const signer = await provider.getSigner();
      const message = `Sign this message to authenticate with Web3 Engine App.\n\nNonce: ${nonceData.nonce}`;
      const signature = await signer.signMessage(message);

      // 5. Step 3: Verify Signature on Backend
      const verifyRes = await fetch(`${apiBaseUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Signature verification failed.');
      }

      // Store JWT token and update app state
      localStorage.setItem('auth_token', verifyData.token);
      onAuthSuccess(verifyData.user);
      onClose();

    } catch (err: any) {
      if (err.code === 4001 || err.action === 'signMessage') {
        setError('Signature request was rejected in wallet.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            Connect Web3 Vault
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate using your Ethereum wallet address
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Web3 Action Button */}
        <div className="space-y-4">
          <button
            onClick={handleMetaMaskConnect}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Awaiting Wallet Signature...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect with MetaMask</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-6">
          Cryptographically verified via Web3 Nonce Signatures & JWT.
        </p>
      </div>
    </div>
  );
}