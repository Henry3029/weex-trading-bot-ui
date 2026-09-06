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