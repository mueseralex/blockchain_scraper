# Multi-Network Blockchain Scraper Server

A 24/7 Python-based scraper that monitors trending tokens across multiple blockchains, extracts top trader wallets, analyzes wallet performance, and exports formatted CSVs with optional GitHub auto-upload.

## Overview

This server continuously scrapes public data from `gmgn.ai` to identify trending tokens and high-performing wallets across multiple chains. It is designed to run unattended, handle rate limits automatically, and produce clean, analysis-ready datasets.

---

## What the Server Does

On a continuous loop:

1. **Collects Trending Contract Addresses**
   - Pulls trending tokens per chain
   - Avoids reprocessing previously archived contracts

2. **Extracts Top Trader Wallets**
   - Fetches up to 100 top wallets per token (ranked by profit)
   - Skips wallets already analyzed

3. **Analyzes Wallet Performance**
   - Unrealized & realized profits (7d / 30d / all-time)
   - Win rate and trade counts
   - Wallet balances (chain-specific)
   - Holding duration and trade speed
   - FDV-based entry analysis:
     - Sub 75k FDV entries
     - 75k–250k FDV entries

4. **Stores and Formats Data**
   - Saves raw data to `{chain}.csv`
   - Deduplicates wallets by most recent scan
   - Outputs clean, formatted files as `formatted_{chain}.csv`

5. **Handles Rate Limits Automatically**
   - Detects 403 / 429 / 500 errors
   - Rotates IPs using Mullvad VPN

6. **Optional GitHub Upload**
   - Commits formatted CSVs directly to a GitHub repository
   - Temporarily disconnects VPN to avoid GitHub API issues

