# BitMEX WebSocket Order Book Demo [BUGGY]

A high-performance React application demonstrating real-time order book updates from BitMEX WebSocket API using Signal state management for optimal rendering performance.

🚀 **[Live Demo](https://byshing.github.io/buggy-ws-poc/)** - Try it now!

## Features

- **Real-time Order Book**: Live XBTUSD order book data from BitMEX WebSocket API
- **Signal State Management**: Uses Preact Signals for efficient reactive state updates
- **Performance Metrics**: Real-time performance monitoring including:
  - Messages per second
  - Total messages received
  - Mid price calculation
  - Spread tracking
  - Order book depth levels
- **Visual Updates**: Highlights updated order book levels with animations
- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 18**: Modern React with TypeScript
- **Vite**: Fast build tool and dev server
- **Preact Signals**: Ultra-fast state management
- **BitMEX WebSocket API**: Real-time market data
- **TypeScript**: Full type safety
- **CSS3**: Modern styling with animations

## Architecture

### Signal-based State Management

The application uses Preact Signals for state management, which provides:

- **Fine-grained reactivity**: Only components that actually use changed data re-render
- **Computed values**: Automatic derivation of sorted order book levels, spread, and mid-price
- **Performance optimization**: Minimal re-renders even with high-frequency updates
- **Memory efficiency**: Efficient handling of large order book datasets

### WebSocket Integration

- Connects to `wss://ws.bitmex.com/realtime`
- Subscribes to `orderBookL2:XBTUSD` for level 2 order book data
- Handles all WebSocket message types: `partial`, `insert`, `update`, `delete`
- Implements automatic reconnection with exponential backoff

### Performance Features

- **Top-of-book focus**: Displays top 25 bid/ask levels
- **Update highlighting**: Visual feedback for changed order levels
- **Running totals**: Cumulative size calculations
- **Real-time metrics**: Live performance statistics

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd poc-bitmex-ws-signal-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages (manual)

### Deployment

The application automatically deploys to GitHub Pages via GitHub Actions when pushing to the main/master branch.

For manual deployment:
```bash
npm run deploy
```

The live demo is available at: https://byshing.github.io/buggy-ws-poc/

## Project Structure

```
src/
├── components/
│   ├── OrderBook.tsx      # Order book display component
│   └── PerformanceStats.tsx # Performance metrics display
├── store.ts               # Signal-based state management
├── types.ts              # TypeScript type definitions
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Styling and animations
```

## Key Components

### Store (`store.ts`)
- Signal-based state management
- WebSocket connection handling
- Order book data processing
- Performance metric tracking
- Computed values for sorted data

### OrderBook Component
- Displays bid and ask sides
- Shows price, size, and cumulative totals
- Highlights recent updates
- Handles large datasets efficiently

### Performance Stats
- Real-time metrics display
- Updates per second tracking
- Connection status monitoring
- Market data statistics

## Performance Considerations

### Signal Benefits
1. **Selective Updates**: Only components using changed signals re-render
2. **Computed Efficiency**: Derived values update only when dependencies change
3. **Memory Optimization**: Efficient handling of Map-based order book storage
4. **Batched Updates**: Natural batching of rapid WebSocket updates

### Optimization Techniques
- Map-based storage for O(1) order book operations
- Limited display levels (top 25) for UI performance
- Debounced update highlighting
- Efficient sorting and totaling with computed signals

## WebSocket Message Flow

1. **Connection**: Establish WebSocket connection to BitMEX
2. **Subscription**: Subscribe to `orderBookL2:XBTUSD`
3. **Partial**: Receive initial order book snapshot
4. **Updates**: Process incremental updates (`insert`, `update`, `delete`)
5. **State Management**: Update Signal-based state
6. **UI Updates**: Automatic re-rendering of affected components

## Monitoring Performance

The application provides real-time performance metrics:

- **Messages/sec**: WebSocket message throughput
- **Total Messages**: Cumulative message count
- **Mid Price**: Calculated mid-market price
- **Spread**: Bid-ask spread
- **Depth**: Number of bid/ask levels

## Browser Compatibility

- Modern browsers with WebSocket support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT License - Feel free to use this code for learning and demonstration purposes.

## Disclaimer

This is a demonstration application. BitMEX WebSocket data is used for educational purposes. Always refer to official BitMEX API documentation for production use.
