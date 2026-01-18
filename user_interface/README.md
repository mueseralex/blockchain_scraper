# User Interface

A React-based interface for viewing and analyzing blockchain wallet performance data across multiple networks.

## UI

### The UI Available (25+ useful statistics per trader)

![Blockchain Analytics UI - Full Statistics View](https://media.discordapp.net/attachments/1295067928240062494/1462491449974067313/image.png?ex=696e62cd&is=696d114d&hm=73e38799dffb633596f01646f708221c2471cd7be50717e00a7ba01120828d85&=&format=webp&quality=lossless&width=1152&height=648)

![Blockchain Analytics UI - Detailed Data Table](https://media.discordapp.net/attachments/1295067928240062494/1462491450422988831/image.png?ex=696e62cd&is=696d114d&hm=78b713c2392d53fd1d8d5f664c40de9c103e5a0ab6439bd192418de37a06a1a5&=&format=webp&quality=lossless&width=1152&height=648)

### Most popular choice online (6 useful statistics per trader)

![Popular Analytics Platform Comparison](https://media.discordapp.net/attachments/1295067928240062494/1462491526616715374/image.png?ex=696e62df&is=696d115f&hm=b0d8adea7080a0bfe8ba49fb68dbf7465c1e7e67a0beeaa1c198cee346fd0c9a&=&format=webp&quality=lossless&width=1284&height=648)

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

## Setup
