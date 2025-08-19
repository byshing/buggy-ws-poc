import React from 'react';
import { activeOrderBookState, spread, midPrice, useFullDepth, bitMEXWebSocket } from '../store';
import { useSignals } from '@preact/signals-react/runtime';

export const PerformanceStats: React.FC = () => {
  // Enable automatic signal tracking for this component
  useSignals();
  
  // Now we can access signal values directly and React will automatically re-render
  const state = activeOrderBookState.value;
  const currentSpread = spread.value;
  const currentMidPrice = midPrice.value;
  const fullDepth = useFullDepth.value;

  const handleToggleDepth = () => {
    const newMode = fullDepth ? 'L2_25' : 'L2';
    useFullDepth.value = !useFullDepth.value;
    bitMEXWebSocket.changeSubscription(newMode);
  };

  return (
    <div className="performance-stats">
      <div className="stat-item">
        <div className="stat-label">Messages/sec</div>
        <div className="stat-value">{state.updatesPerSecond}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Total Messages</div>
        <div className="stat-value">{state.messagesReceived.toLocaleString()}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Mid Price</div>
        <div className="stat-value">${currentMidPrice.toFixed(1)}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Spread</div>
        <div className="stat-value">${currentSpread.toFixed(1)}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Bid Levels</div>
        <div className="stat-value">{state.bids.size}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Ask Levels</div>
        <div className="stat-value">{state.asks.size}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Depth Mode</div>
        <div className="stat-value">
          <button 
            onClick={handleToggleDepth}
            className={`depth-toggle ${!fullDepth ? 'limited' : ''}`}
          >
            {fullDepth ? 'Full (L2)' : 'Top 25 (L2_25)'}
          </button>
        </div>
      </div>
    </div>
  );
};
