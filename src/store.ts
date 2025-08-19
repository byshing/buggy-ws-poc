import { signal, computed } from '@preact/signals-react';
import type { OrderBookState, OrderBookEntry, ProcessedOrderBookEntry, WebSocketMessage } from './types';

// Signal-based state management - separate stores for L2 and L2_25
export const orderBookL2State = signal<OrderBookState>({
  bids: new Map(),
  asks: new Map(),
  lastUpdateTime: 0,
  messagesReceived: 0,
  updatesPerSecond: 0,
  connectionStatus: 'disconnected'
});

export const orderBookL2_25State = signal<OrderBookState>({
  bids: new Map(),
  asks: new Map(),
  lastUpdateTime: 0,
  messagesReceived: 0,
  updatesPerSecond: 0,
  connectionStatus: 'disconnected'
});

// Current active store selector
export const useFullDepth = signal<boolean>(false); // true = orderBookL2, false = orderBookL2_25

// Display level count setting
export const displayLevelCount = signal<number>(25); // Default to 25 levels

// Get the currently active order book state
export const activeOrderBookState = computed(() => {
  return useFullDepth.value ? orderBookL2State.value : orderBookL2_25State.value;
});

// Computed signals for performance - using active store
export const sortedBids = computed(() => {
  const activeState = activeOrderBookState.value;
  const levelCount = displayLevelCount.value;
  const bids = Array.from(activeState.bids.values())
    .sort((a: ProcessedOrderBookEntry, b: ProcessedOrderBookEntry) => b.price - a.price)
    .slice(0, levelCount); // Use dynamic level count
  
  // Calculate running totals
  let runningTotal = 0;
  return bids.map((bid: ProcessedOrderBookEntry) => {
    runningTotal += bid.size;
    return { ...bid, total: runningTotal };
  });
});

export const sortedAsks = computed(() => {
  const activeState = activeOrderBookState.value;
  const levelCount = displayLevelCount.value;
  const asks = Array.from(activeState.asks.values())
    .sort((a: ProcessedOrderBookEntry, b: ProcessedOrderBookEntry) => a.price - b.price) // Lowest price first for asks
    .slice(0, levelCount); // Use dynamic level count
  
  // Calculate running totals
  let runningTotal = 0;
  return asks.map((ask: ProcessedOrderBookEntry) => {
    runningTotal += ask.size;
    return { ...ask, total: runningTotal };
  });
});

export const spread = computed(() => {
  const bestBid = sortedBids.value[0];
  const bestAsk = sortedAsks.value[0];
  
  if (!bestBid || !bestAsk) return 0;
  
  return bestAsk.price - bestBid.price;
});

export const midPrice = computed(() => {
  const bestBid = sortedBids.value[0];
  const bestAsk = sortedAsks.value[0];
  
  if (!bestBid || !bestAsk) return 0;
  
  return (bestBid.price + bestAsk.price) / 2;
});

// Performance tracking - separated for each store
let messageCountL2 = 0;
let messageCountL2_25 = 0;
let lastSecond = Math.floor(Date.now() / 1000);

// Helper function to get the appropriate store based on table name
function getStoreForTable(tableName: string) {
  return tableName === 'orderBookL2' ? orderBookL2State : orderBookL2_25State;
}

// Helper function to get message count for specific table
function getMessageCountForTable(tableName: string) {
  return tableName === 'orderBookL2' ? messageCountL2 : messageCountL2_25;
}

// Helper function to increment message count for specific table
function incrementMessageCountForTable(tableName: string) {
  if (tableName === 'orderBookL2') {
    messageCountL2++;
  } else {
    messageCountL2_25++;
  }
}

function updatePerformanceMetrics(tableName: string) {
  const currentSecond = Math.floor(Date.now() / 1000);
  const targetStore = getStoreForTable(tableName);
  
  if (currentSecond !== lastSecond) {
    const messageCount = getMessageCountForTable(tableName);
    targetStore.value = {
      ...targetStore.value,
      updatesPerSecond: messageCount,
      messagesReceived: targetStore.value.messagesReceived + messageCount
    };
    
    // Reset the specific counter
    if (tableName === 'orderBookL2') {
      messageCountL2 = 0;
    } else {
      messageCountL2_25 = 0;
    }
    lastSecond = currentSecond;
  } else {
    incrementMessageCountForTable(tableName);
  }
}

// WebSocket management
class BitMEXWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingSubscriptionChange = false;
  private currentDepthMode: 'L2' | 'L2_25' = 'L2_25'; // Default to L2_25

  connect() {
    try {
      // Close existing connection if it exists
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Update connection status for both stores
      orderBookL2State.value = {
        ...orderBookL2State.value,
        connectionStatus: 'connecting'
      };
      orderBookL2_25State.value = {
        ...orderBookL2_25State.value,
        connectionStatus: 'connecting'
      };

      this.ws = new WebSocket('wss://ws.bitmex.com/realtime');
      
      this.ws.onopen = () => {
        orderBookL2State.value = {
          ...orderBookL2State.value,
          connectionStatus: 'connected'
        };
        orderBookL2_25State.value = {
          ...orderBookL2_25State.value,
          connectionStatus: 'connected'
        };
        this.reconnectAttempts = 0;
        
        // Subscribe to the appropriate feed
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        orderBookL2State.value = {
          ...orderBookL2State.value,
          connectionStatus: 'disconnected'
        };
        orderBookL2_25State.value = {
          ...orderBookL2_25State.value,
          connectionStatus: 'disconnected'
        };
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('BitMEX WebSocket error:', error);
        orderBookL2State.value = {
          ...orderBookL2State.value,
          connectionStatus: 'error'
        };
        orderBookL2_25State.value = {
          ...orderBookL2_25State.value,
          connectionStatus: 'error'
        };
      };

    } catch (error) {
      console.error('Failed to connect to BitMEX WebSocket:', error);
      orderBookL2State.value = {
        ...orderBookL2State.value,
        connectionStatus: 'error'
      };
      orderBookL2_25State.value = {
        ...orderBookL2_25State.value,
        connectionStatus: 'error'
      };
    }
  }

  private subscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const table = `orderBook${this.currentDepthMode}`;
      const subscribeMessage = {
        op: 'subscribe',
        args: [`${table}:XBTUSD`]
      };
      
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  // Method to change subscription when toggle changes
  changeSubscription(depthMode: 'L2' | 'L2_25') {
    if (this.currentDepthMode === depthMode) {
      return; // Already subscribed to the requested mode
    }

    const oldDepthMode = this.currentDepthMode;
    this.currentDepthMode = depthMode;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Set pending flag to ignore messages during transition
      this.pendingSubscriptionChange = true;

      // Only clear the target store we're switching to
      const targetStore = getStoreForTable(`orderBook${depthMode}`);
      targetStore.value = {
        bids: new Map(),
        asks: new Map(),
        lastUpdateTime: 0,
        messagesReceived: 0,
        updatesPerSecond: 0,
        connectionStatus: targetStore.value.connectionStatus
      };

      // Reset message count for the target store
      if (depthMode === 'L2') {
        messageCountL2 = 0;
      } else {
        messageCountL2_25 = 0;
      }

      // Unsubscribe from the previous feed
      const unsubscribeMessage = {
        op: 'unsubscribe',
        args: [`orderBook${oldDepthMode}:XBTUSD`]
      };
      
      this.ws.send(JSON.stringify(unsubscribeMessage));

      // Subscribe to the new feed after a short delay and clear pending flag
      setTimeout(() => {
        this.subscribe();
        this.pendingSubscriptionChange = false;
      }, 100);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle both orderBookL2 and orderBookL2_25 tables
    if ((message.table === 'orderBookL2' || message.table === 'orderBookL2_25') && message.data) {
      // Only process if we're not in the middle of changing subscriptions
      if (!this.pendingSubscriptionChange) {
        // Additional check: only process messages for the currently subscribed feed
        const expectedTable = `orderBook${this.currentDepthMode}`;
        if (message.table === expectedTable) {
          this.updateOrderBook(message.action!, message.data, message.table);
          
          // Update the appropriate store with last update time
          const targetStore = getStoreForTable(message.table);
          targetStore.value = {
            ...targetStore.value,
            lastUpdateTime: Date.now()
          };
          
          // Update performance metrics for this specific table
          updatePerformanceMetrics(message.table);
        }
      }
    }
  }

  private updateOrderBook(action: string, data: OrderBookEntry[], tableName: string) {
    const targetStore = getStoreForTable(tableName);
    const currentState = targetStore.value;
    let newBids = new Map(currentState.bids);
    let newAsks = new Map(currentState.asks);

    // For partial snapshots, clear the maps first
    if (action === 'partial') {
      newBids = new Map();
      newAsks = new Map();
    }

    let bidUpdates = 0;
    let askUpdates = 0;
    let deletedBids = 0;
    let deletedAsks = 0;

    data.forEach(entry => {
      const processedEntry: ProcessedOrderBookEntry = {
        id: entry.id,
        price: entry.price,
        size: entry.size,
        total: 0,
        isUpdated: true // Always mark new/updated entries as updated
      };

      const targetMap = entry.side === 'Buy' ? newBids : newAsks;
      
      switch (action) {
        case 'partial':
          // Initial snapshot - data is already cleared above
          targetMap.set(entry.id, processedEntry);
          if (entry.side === 'Buy') {
            bidUpdates++;
          } else {
            askUpdates++;
          }
          break;
        
        case 'insert':
          targetMap.set(entry.id, processedEntry);
          if (entry.side === 'Buy') {
            bidUpdates++;
          } else {
            askUpdates++;
          }
          break;
        
        case 'update':
          if (targetMap.has(entry.id)) {
            // BitMEX sometimes sends size=0 updates instead of delete messages
            if (entry.size === 0) {
              targetMap.delete(entry.id);
              if (entry.side === 'Buy') {
                deletedBids++;
              } else {
                deletedAsks++;
              }
            } else {
              targetMap.set(entry.id, processedEntry);
              if (entry.side === 'Buy') {
                bidUpdates++;
              } else {
                askUpdates++;
              }
            }
          }
          break;
        
        case 'delete':
          // BitMEX sends the ID of the level to delete
          const existsBefore = targetMap.has(entry.id);
          if (existsBefore) {
            targetMap.delete(entry.id);
            if (entry.side === 'Buy') {
              deletedBids++;
            } else {
              deletedAsks++;
            }
          } else {
            // Log when we try to delete something that doesn't exist - keep as warning for debugging purposes
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Trying to delete non-existent ${entry.side} level with ID ${entry.id}, price: ${entry.price}`);
            }
          }
          break;
      }
    });

    // Clear isUpdated flag for all existing entries that weren't just updated
    if (action !== 'partial') {
      // Mark all existing entries as not updated
      newBids.forEach((entry, id) => {
        if (!data.some(d => d.id === id && d.side === 'Buy')) {
          newBids.set(id, { ...entry, isUpdated: false });
        }
      });
      newAsks.forEach((entry, id) => {
        if (!data.some(d => d.id === id && d.side === 'Sell')) {
          newAsks.set(id, { ...entry, isUpdated: false });
        }
      });
    }

    // Log when L2_25 exceeds expected limits - keep for debugging in development
    if (tableName === 'orderBookL2_25' && (newBids.size > 25 || newAsks.size > 25) && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${tableName} exceeded 25 levels! Bids: ${newBids.size}, Asks: ${newAsks.size}`);
    }

    // Update the appropriate signal - this will trigger re-renders
    targetStore.value = {
      ...currentState,
      bids: newBids,
      asks: newAsks,
      lastUpdateTime: Date.now()
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Ensure we don't have multiple reconnection timers running
      setTimeout(() => {
        // Only reconnect if we're still disconnected and don't have an active connection
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
          this.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      orderBookL2State.value = {
        ...orderBookL2State.value,
        connectionStatus: 'error'
      };
      orderBookL2_25State.value = {
        ...orderBookL2_25State.value,
        connectionStatus: 'error'
      };
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const bitMEXWebSocket = new BitMEXWebSocket();
