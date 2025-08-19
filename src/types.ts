// Types for BitMEX WebSocket API
export interface OrderBookEntry {
  symbol: string;
  id: number;
  side: 'Buy' | 'Sell';
  size: number;
  price: number;
}

export interface OrderBookL2Data {
  table: string;
  action: 'partial' | 'insert' | 'update' | 'delete';
  data: OrderBookEntry[];
}

export interface WebSocketMessage {
  table?: string;
  action?: string;
  data?: OrderBookEntry[];
  subscribe?: string;
  unsubscribe?: string;
  success?: boolean;
  request?: any;
}

export interface ProcessedOrderBookEntry {
  id: number;
  price: number;
  size: number;
  total: number;
  isUpdated?: boolean;
}

export interface OrderBookState {
  bids: Map<number, ProcessedOrderBookEntry>;
  asks: Map<number, ProcessedOrderBookEntry>;
  lastUpdateTime: number;
  messagesReceived: number;
  updatesPerSecond: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}
