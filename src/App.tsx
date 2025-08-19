import React, { useEffect } from 'react';
import { activeOrderBookState, bitMEXWebSocket } from './store';
import { useSignals } from '@preact/signals-react/runtime';
import { OrderBook } from './components/OrderBook';
import { PerformanceStats } from './components/PerformanceStats';
import './index.css';

const ConnectionStatus: React.FC = () => {
  // Enable automatic signal tracking for this component
  useSignals();
  
  // Now we can access signal values directly and React will automatically re-render
  const state = activeOrderBookState.value;
  const status = state.connectionStatus;
  
  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="connection-status">
      <div className={`status-indicator ${status}`}></div>
      <span>{getStatusText()}</span>
    </div>
  );
};

const App: React.FC = () => {
  // Enable automatic signal tracking for this component
  useSignals();
  
  useEffect(() => {
    // Connect to BitMEX WebSocket when component mounts
    bitMEXWebSocket.connect();

    // Cleanup on unmount
    return () => {
      bitMEXWebSocket.disconnect();
    };
  }, []);

  // Add a debug section to show current state using signals
  const state = activeOrderBookState.value;

  return (
    <div className="app">
      <header className="header">
        <h1>BitMEX Order Book Demo</h1>
        <div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#888' }}>
            XBTUSD • Signal State Management
          </div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
            Debug: Bids: {state.bids.size}, Asks: {state.asks.size}, Messages: {state.messagesReceived}
          </div>
          <ConnectionStatus />
        </div>
      </header>
      
      <PerformanceStats />
      
      <OrderBook />
    </div>
  );
};

export default App;
