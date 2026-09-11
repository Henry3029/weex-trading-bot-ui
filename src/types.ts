export type EngineType = 'MAJOR_ENGINE' | 'ALT_ENGINE' | 'MEME_ENGINE';
export type EngineStatusType = 'IN_POSITION' | 'HUNTING' | 'STOPPED' | 'ERROR';

export interface EngineStatus {
  id: EngineType;
  name: string;
  focusAssets: string[];
  currentAsset: string;
  status: 'HUNTING' | 'IN_POSITION' | 'PIVOTING';
  pnlPercentage: number;
  entryPrice?: number;
  currentPrice?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  allocatedCapital: number;
}


export type LogType = 'INFO' | 'BUY' | 'SELL' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'WARNING' | 'ERROR';

export interface SystemLog {
  id: string;
  engine: EngineType;
  type: 'INFO' | 'BUY' | 'TAKE_PROFIT' | 'STOP_LOSS';
  message: string;
  timestamp: string;
}


declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: Array<any> }) => Promise<any>;
      on?: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener?: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export {}; // Ensures this file is treated as a module