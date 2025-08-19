import React from 'react';
import { sortedBids, sortedAsks } from '../store';
import { useSignals } from '@preact/signals-react/runtime';
import type { ProcessedOrderBookEntry } from '../types';

interface OrderBookSideProps {
  side: 'bids' | 'asks';
  data: ProcessedOrderBookEntry[];
  title: string;
}

const OrderBookSide: React.FC<OrderBookSideProps> = ({ side, data, title }) => {
  return (
    <div className="orderbook-side">
      <div className={`side-header ${side}`}>
        {title}
      </div>
      <div className="orderbook-headers">
        <div>Price</div>
        <div>Size</div>
        <div>Total</div>
      </div>
      <div className="orderbook-list">
        {data.map((entry: ProcessedOrderBookEntry) => (
          <div
            key={entry.id}
            className={`order-row ${entry.isUpdated ? 'updated' : ''}`}
          >
            <div className={`order-price ${side === 'bids' ? 'bid' : 'ask'}`}>
              {entry.price.toFixed(1)}
            </div>
            <div className="order-size">
              {entry.size.toLocaleString()}
            </div>
            <div className="order-total">
              {entry.total.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OrderBook: React.FC = () => {
  // Enable automatic signal tracking for this component
  useSignals();
  
  // Now we can access signal values directly and React will automatically re-render
  const bidsData = sortedBids.value;
  const asksData = sortedAsks.value;

  return (
    <div className="orderbook-container">
      <OrderBookSide
        side="bids"
        data={bidsData}
        title="Bids (Buy Orders)"
      />
      <OrderBookSide
        side="asks"
        data={asksData}
        title="Asks (Sell Orders)"
      />
    </div>
  );
};
