# Scraper and User Interface

A comprehensive system for collecting, analyzing, and visualizing blockchain trader performance data across multiple networks. The platform consists of an automated data collection server and a web-based interface for exploring trader statistics.

## Project Structure

### server_config/
Python-based 24/7 scraper that continuously monitors trending tokens across multiple blockchains, extracts top trader wallets, analyzes performance metrics, and exports formatted CSV datasets. Includes automatic rate limiting, IP rotation via Mullvad VPN, and optional GitHub integration for data publishing.

### user_interface/
React application for viewing and analyzing blockchain wallet performance data. Features include multi-chain data loading, advanced filtering and sorting, column management, wallet highlighting, custom color themes, and export capabilities. Supports remote CSV loading from GitHub or local files with automatic fallback.

### sample_data/
Real historical datasets scraped from various blockchain networks, containing approximately 25 performance statistics per wallet address across supported chains.

## Supported Networks

### Trading Data Collection
Data is collected from all launchpads within these networks:
- Solana
- Ethereum
- Base
- Binance Smart Chain

## Trader Statistics

Each trader in the database includes the following metrics:

### Basic Information
| Metric | Description |
|--------|-------------|
| `wallet` | Trader's blockchain address |
| `balance` | Native network token balance |
| `tags` | Trader type identifiers |
| `date_reviewed` | Last data update timestamp |

### Profit Metrics
| Metric | Description |
|--------|-------------|
| `unrealized_profit` | All-time unrealized profit |
| `unrealized_pnl` | All-time unrealized PNL percentage |
| `realized_profit_7d` | Weekly realized profit |
| `realized_profit_30d` | Monthly realized profit |
| `total_profit` | All-time profit |
| `token_sold_avg_profit` | Average profit per trade |

### Performance Metrics
| Metric | Description |
|--------|-------------|
| `winrate` | All-time token trading success rate |
| `all_pnl` | All-time trading PNL percentage |
| `buy_7d` | Weekly buy transactions |
| `sell_7d` | Weekly sell transactions |
| `avg_holding_peroid` | Average trade holding duration |
| `fast_trades_percentage` | Percentage of trades held under 60 seconds |

### Trade Size Distribution
| Metric | Description |
|--------|-------------|
| `pnl_lt_2x_num` | Trades with minimum 2x gain |
| `pnl_2x_5x_num` | Trades with 2x-5x return |
| `pnl_gt_5x_num` | Trades with 5x+ return |

### Market Cap Range: Sub 75k
| Metric | Description |
|--------|-------------|
| `sub 75k avg entry` | Average entry market cap |
| `sub 75k entries` | Number of transactions |
| `sub 75k avg buy amount` | Average purchase amount |
| `sub 75k avg buy 30d` | Monthly average buys per trade |
| `sub 75k avg sell 30d` | Monthly average sells per trade |
| `sub 75k avg total profit pnl` | Average PNL percentage |

### Market Cap Range: 75k - 250k
| Metric | Description |
|--------|-------------|
| `75k - 250k avg entry` | Average entry market cap |
| `75k - 250k entries` | Number of transactions |
| `75k - 250k avg buy amount` | Average purchase amount |
| `75k - 250k avg buy 30d` | Monthly average buys per trade |
| `75k - 250k avg sell 30d` | Monthly average sells per trade |
| `75k - 250k avg total profit pnl` | Average PNL percentage |

## UI

### The UI Available (25+ useful statistics per trader)

<img src="https://media.discordapp.net/attachments/1295067928240062494/1462491449974067313/image.png?ex=696e62cd&is=696d114d&hm=73e38799dffb633596f01646f708221c2471cd7be50717e00a7ba01120828d85&=&format=webp&quality=lossless&width=1152&height=648" width="600">

<img src="https://media.discordapp.net/attachments/1295067928240062494/1462491450422988831/image.png?ex=696e62cd&is=696d114d&hm=78b713c2392d53fd1d8d5f664c40de9c103e5a0ab6439bd192418de37a06a1a5&=&format=webp&quality=lossless&width=1152&height=648" width="600">

### Most popular choice online (6 useful statistics per trader)

<img src="https://media.discordapp.net/attachments/1295067928240062494/1462491526616715374/image.png?ex=696e62df&is=696d115f&hm=b0d8adea7080a0bfe8ba49fb68dbf7465c1e7e67a0beeaa1c198cee346fd0c9a&=&format=webp&quality=lossless&width=1284&height=648" width="600">

