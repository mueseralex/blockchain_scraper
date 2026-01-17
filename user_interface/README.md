# Blockchain Data Viewer

A React-based interface for viewing and analyzing blockchain wallet performance data across multiple networks.

## Features

### Chain Selection
- Dropdown selector for switching between blockchain networks
- Supports Solana, Ethereum, Base, and BSC
- Loads data from GitHub raw URLs or local CSV files with automatic fallback

### Data Display
- High-performance table with 250 rows per page
- Sticky header and fixed first column for easy navigation
- Responsive design that works on desktop and mobile devices

### Filtering and Sorting
- Advanced filters panel with drag-and-drop repositioning
- Filter by numeric ranges (profit, trades, balance, etc.)
- Filter by wallet address or tags
- Multi-column sorting with priority order
- Date range filtering

### Column Management
- Show/hide columns dynamically
- Reorder columns via drag-and-drop
- Custom column visibility presets
- Automatic hiding of less common data fields by default

### Wallet Highlighting
- Click rows to highlight wallets of interest
- Highlighted wallets panel shows selected addresses
- Custom highlighter color picker
- Export highlighted wallet list

### Color Customization
- Set custom colors for positive/negative profit values
- Configurable row highlight color
- Color palette panel with hex color input
- Reset to default colors option

### Wallet Analytics
- View aggregated stats for highlighted wallets
- Filter presets for common analysis scenarios
- Export filtered data to CSV

### Data Export
- Copy entire dataset to clipboard
- Download filtered results as CSV
- Export operates on currently visible filtered data

### Address Hyper Links
- One-click navigation to blockchain explorers
- Support for Solscan, Etherscan, Basescan, BscScan
- GMGN.ai integration for detailed wallet analysis
- Cielo Finance integration for wallet relationships
- Copy address to clipboard option
- Middle-click to open in background tab

### Performance Optimizations
- Chunked CSV parsing for large files
- Incremental rendering for immediate feedback
- Cached full dataset for instant filtering
- Request cancellation on chain switching

## Technical Stack

- React 18 with hooks
- PapaParse for CSV processing
- React Icons for UI elements
- React Datepicker for date selection

## Configuration

Environment variables for CSV data sources:
- REACT_APP_SOLANA_CSV_URL
- REACT_APP_ETHEREUM_CSV_URL
- REACT_APP_BASE_CSV_URL
- REACT_APP_BSC_CSV_URL

The application automatically falls back to local CSV files if remote URLs fail or encounter CORS issues.

## Setup

```bash
npm install
npm start
```

The application runs on http://localhost:3000 by default.
