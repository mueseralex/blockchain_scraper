/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Papa from "papaparse";
import "./App.css";
import {
  FaSearchPlus,
  FaSearchMinus,
  FaSyncAlt,
  FaDownload,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCircle,
  FaEye,
  FaEyeSlash,
  FaCaretUp,
  FaCaretDown,
  FaFilter,
  FaPalette,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import HighlightedWallets from './HighlightedWallets';
import ColumnInfo from './ColumnInfo';
import WalletAnalytics from './WalletAnalytics';
import AdvancedFilters from './AdvancedFilters';

// Main App Component - Simplified without authentication
function App() {
  const [activeChain, setActiveChain] = useState('solana');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Function to handle chain switching
  const handleChainSwitch = (chain) => {
    setActiveChain(chain);
    setDropdownOpen(false); // Close dropdown after selection
  };

  // Chain options configuration
  const chainOptions = [
    { id: 'solana', label: 'Solana' },
    { id: 'ethereum', label: 'Ethereum' },
    { id: 'base', label: 'Base' },
    { id: 'bsc', label: 'BSC' }
  ];

  return (
    <div 
      className={`premium-app dark-mode chain-${activeChain}`}
      data-current-page="database"
    >
      <div className="main-content">
        <DatabasePage 
          key={`database-${activeChain}`} 
          activeChain={activeChain}
          chainOptions={chainOptions}
          onChainSwitch={handleChainSwitch}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
      </div>
    </div>
  );
}

function DatabasePage({ activeChain, chainOptions, onChainSwitch, dropdownOpen, setDropdownOpen }) {
  const getCsvUrl = () => {
    // Map the activeChain to environment variable URLs
    const urlMap = {
      'solana': process.env.REACT_APP_SOLANA_CSV_URL,
      'ethereum': process.env.REACT_APP_ETHEREUM_CSV_URL,
      'base': process.env.REACT_APP_BASE_CSV_URL,
      'bsc': process.env.REACT_APP_BSC_CSV_URL,
      'tron': process.env.REACT_APP_TRON_CSV_URL
    };
    
    // Get URL from environment
    const envUrl = urlMap[activeChain];
    
    // Use local data folder as fallback
    const chainFileMap = {
      'solana': 'sol',
      'ethereum': 'eth',
      'base': 'base',
      'bsc': 'bsc',
      'tron': 'tron'
    };
    const fallbackUrl = `/data/${chainFileMap[activeChain]}.csv`;
    
    // If GitHub URL exists, wrap it with CORS proxy
    let url;
    if (envUrl && envUrl.includes('githubusercontent.com')) {
      // Use CORS proxy for GitHub URLs
      url = `https://corsproxy.io/?${encodeURIComponent(envUrl)}`;
      console.log(`🔧 DatabasePage: CSV URL for ${activeChain}:`);
      console.log(`   Original GitHub URL: ${envUrl}`);
      console.log(`   CORS Proxy URL: ${url}`);
      console.log(`   Fallback URL: ${fallbackUrl}`);
    } else {
      url = envUrl || fallbackUrl;
      console.log(`🔧 DatabasePage: CSV URL for ${activeChain}:`);
      console.log(`   Environment URL: ${envUrl || 'NOT SET'}`);
      console.log(`   Fallback URL: ${fallbackUrl}`);
      console.log(`   Using: ${url}`);
    }
    
    return { url, fallbackUrl };
  };

  // State to track highlighted wallets (shared between components)
  const [highlightedWallets, setHighlightedWallets] = useState(new Set());

  // Function to update highlighted wallets
  const updateHighlightedWallets = (wallets) => {
    setHighlightedWallets(wallets);
  };

  // State to track reset function from Database component
  const [resetTable, setResetTable] = useState(null);

  // Memoize the callback function to prevent unnecessary re-renders
  const handleResetTableRef = useCallback((resetFn) => {
    setResetTable(() => resetFn);
  }, []);

  const { url: csvUrl, fallbackUrl } = getCsvUrl();
  
  return (
    <div className="database-container">
      <Database 
        csvUrl={csvUrl}
        fallbackUrl={fallbackUrl}
        activeChain={activeChain} 
        key={activeChain} 
        highlightedWallets={highlightedWallets}
        updateHighlightedWallets={updateHighlightedWallets}
        onResetTableRef={handleResetTableRef}
        chainOptions={chainOptions}
        onChainSwitch={onChainSwitch}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
      />
      
      <div className="info-windows-container">
        <ColumnInfo activeChain={activeChain} />
        <HighlightedWallets 
          highlightedWallets={highlightedWallets} 
          activeChain={activeChain}
          updateHighlightedWallets={updateHighlightedWallets}
        />
        <WalletAnalytics 
          highlightedWallets={highlightedWallets}
          activeChain={activeChain}
          onResetFilters={resetTable}
          getCurrentFilters={() => window.currentFilters || {}}
        />
      </div>
    </div>
  );
}

function Database({ csvUrl, fallbackUrl, activeChain, highlightedWallets, updateHighlightedWallets, onResetTableRef, chainOptions, onChainSwitch, dropdownOpen, setDropdownOpen }) {
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [copySuccess, setCopySuccess] = useState("");
  const [filters, setFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 250;
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  const currentRequestRef = useRef(null);
  const currentChainRef = useRef(activeChain);
  const [columnSortConfig, setColumnSortConfig] = useState({});
  const [linkType, setLinkType] = useState('explorer');
  const [showInfo, setShowInfo] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 50, y: 50 });
  const modalRef = useRef(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFiltersPosition, setAdvancedFiltersPosition] = useState({ x: 100, y: 100 });
  const [advancedFiltersSize, setAdvancedFiltersSize] = useState({ width: 400, height: 600 });
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [colorPalettePosition, setColorPalettePosition] = useState({ x: 150, y: 150 });
  const [highlighterColor, setHighlighterColor] = useState('#99617e');
  const [positiveColor, setPositiveColor] = useState('#000000');
  const [negativeColor, setNegativeColor] = useState('#000000');
  const [isDraggingColorPalette, setIsDraggingColorPalette] = useState(false);
  const [colorPaletteDragStart, setColorPaletteDragStart] = useState({ x: 0, y: 0 });
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [rawCsvData, setRawCsvData] = useState('');
  
  const profitColumns = [
    '7d realized profit',
    '30d realized profit',
    'all time profit',
    'avg profit',
    '< 150k avg total profit pnl',
    '150k - 1m avg total profit pnl',
    'total unrealized profit'
  ];

  const originalHeadersRef = useRef([]);
  
  // Extract the data fetching logic
  const fetchData = useCallback(() => {
    if (currentRequestRef.current) {
      console.log("Canceling previous request for chain:", currentChainRef.current);
      currentRequestRef.current.abort();
    }
    
    currentChainRef.current = activeChain;
    const controller = new AbortController();
    currentRequestRef.current = controller;
    
    setTableData([]);
    console.log("Starting to fetch CSV data for chain:", activeChain);
    
    // Check if URL already has query parameters (like GitHub token)
    const hasQueryParams = csvUrl.includes('?');
    const cacheBustUrl = hasQueryParams 
      ? `${csvUrl}&t=${Date.now()}&chain=${activeChain}` 
      : `${csvUrl}?t=${Date.now()}&chain=${activeChain}`;
    
    console.log(`📡 Fetching from: ${cacheBustUrl}`);
    
    fetch(cacheBustUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: controller.signal
    })
      .then(response => {
        console.log(`Got response from server. Status: ${response.status}, URL: ${cacheBustUrl}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        console.log(`Received data length: ${data.length} bytes`);
        if (!data || data.length === 0) {
          throw new Error('Received empty data from server');
        }
        if (controller.signal.aborted || currentChainRef.current !== activeChain) {
          console.log("Request was cancelled or chain changed, ignoring response for:", activeChain);
          return;
        }
        
        setRawCsvData(data);
        
        console.log(`🔍 FRONTEND: Received CSV data for ${activeChain}, size: ${(data.length / (1024 * 1024)).toFixed(2)}MB`);
        
        const CHUNK_SIZE = 250;
        const DISPLAY_ROWS = 500;
        
        const parseInChunks = (csvText) => {
          const firstLineEnd = csvText.indexOf('\n');
          const headerLine = csvText.substring(0, firstLineEnd);
          
          const headerResult = Papa.parse(headerLine, { header: false });
          if (!headerResult.data[0] || headerResult.data[0].length === 0) {
            console.error("Failed to parse CSV headers");
            return;
          }
          
          const headersList = headerResult.data[0];
          console.log(`🔍 FRONTEND: Successfully parsed headers for ${activeChain}:`, headersList.length, "columns");
          
          originalHeadersRef.current = [...headersList];
          setHeaders(headersList);
          
          const initialHiddenState = {};
          headersList.forEach(header => {
            initialHiddenState[header] = [
              'total unrealized pnl [%]',
              'tags',
              '< 150k fdv avg entry price',
              '< 150k entries [txns]',
              '< 150k avg buy 30d [txns per token]',
              '< 150k avg sell 30d [txns per token]',
              '150k - 1m fdv avg entry price',
              '150k - 1m entries [txns]',
              '150k - 1m avg buy 30d [txns per token]',
              '150k - 1m avg sell 30d [txns per token]'
            ].includes(header);
          });
          
          if (Object.keys(hiddenColumns).length === 0) {
            setHiddenColumns(initialHiddenState);
          }
          
          let rows = [];
          let rowCount = 0;
          let hasSetInitialData = false;
          
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            fastMode: true,
            
            step: function(result) {
              if (result.data && Object.keys(result.data).length > 0) {
                rows.push(result.data);
                rowCount++;
                
                if (rowCount === 100 && !hasSetInitialData) {
                  console.log("Showing first 100 rows for immediate feedback");
                  setTableData(rows.slice(0));
                  hasSetInitialData = true;
                }
                
                if (rowCount % CHUNK_SIZE === 0) {
                  if (rowCount <= DISPLAY_ROWS) {
                    console.log(`Processed ${rowCount} rows...`);
                    setTableData(rows.slice(0));
                  }
                }
              }
            },
            
            complete: function(results) {
              console.log(`CSV parsing complete: Loaded ${rows.length} rows`);
              
              if (rows.length > DISPLAY_ROWS) {
                console.log(`🔍 FRONTEND: Setting table data for ${activeChain} (${rows.slice(0, DISPLAY_ROWS).length} rows displayed, ${rows.length} total)`);
                setTableData(rows.slice(0, DISPLAY_ROWS));
                window.fullDataset = rows;
              } else {
                console.log(`🔍 FRONTEND: Setting table data for ${activeChain} (${rows.length} rows)`);
                setTableData(rows);
              }
            },
            
            error: function(error) {
              console.error("Error parsing CSV:", error);
            }
          });
        };
        
        console.log("Starting CSV parsing...");
        parseInChunks(data);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log("Request was cancelled for chain:", activeChain);
          return;
        }
        console.error("❌ Error fetching from primary URL for chain:", activeChain);
        console.error("Error details:", error.message);
        
        // Try fallback URL if primary fails
        if (fallbackUrl && csvUrl !== fallbackUrl) {
          console.log(`🔄 Trying fallback URL: ${fallbackUrl}`);
          
          fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            signal: controller.signal
          })
            .then(response => {
              console.log(`Got response from fallback. Status: ${response.status}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.text();
            })
            .then(data => {
              console.log(`✅ Successfully loaded from fallback! Data length: ${data.length} bytes`);
              if (!data || data.length === 0) {
                throw new Error('Received empty data from fallback');
              }
              
              if (controller.signal.aborted || currentChainRef.current !== activeChain) {
                console.log("Request was cancelled, ignoring fallback response");
                return;
              }
              
              setRawCsvData(data);
              
              const CHUNK_SIZE = 250;
              const DISPLAY_ROWS = 500;
              
              const parseInChunks = (csvText) => {
                const firstLineEnd = csvText.indexOf('\n');
                const headerLine = csvText.substring(0, firstLineEnd);
                
                const headerResult = Papa.parse(headerLine, { header: false });
                if (!headerResult.data[0] || headerResult.data[0].length === 0) {
                  console.error("Failed to parse CSV headers");
                  return;
                }
                
                const headersList = headerResult.data[0];
                console.log(`🔍 FRONTEND: Successfully parsed headers for ${activeChain}:`, headersList.length, "columns");
                
                originalHeadersRef.current = [...headersList];
                setHeaders(headersList);
                
                const initialHiddenState = {};
                headersList.forEach(header => {
                  initialHiddenState[header] = [
                    'total unrealized pnl [%]',
                    'tags',
                    '< 150k fdv avg entry price',
                    '< 150k entries [txns]',
                    '< 150k avg buy 30d [txns per token]',
                    '< 150k avg sell 30d [txns per token]',
                    '150k - 1m fdv avg entry price',
                    '150k - 1m entries [txns]',
                    '150k - 1m avg buy 30d [txns per token]',
                    '150k - 1m avg sell 30d [txns per token]'
                  ].includes(header);
                });
                
                if (Object.keys(hiddenColumns).length === 0) {
                  setHiddenColumns(initialHiddenState);
                }
                
                let rows = [];
                let rowCount = 0;
                let hasSetInitialData = false;
                
                Papa.parse(csvText, {
                  header: true,
                  dynamicTyping: true,
                  skipEmptyLines: true,
                  fastMode: true,
                  
                  step: function(result) {
                    if (result.data && Object.keys(result.data).length > 0) {
                      rows.push(result.data);
                      rowCount++;
                      
                      if (rowCount === 100 && !hasSetInitialData) {
                        console.log("Showing first 100 rows for immediate feedback");
                        setTableData(rows.slice(0));
                        hasSetInitialData = true;
                      }
                      
                      if (rowCount % CHUNK_SIZE === 0) {
                        if (rowCount <= DISPLAY_ROWS) {
                          console.log(`Processed ${rowCount} rows...`);
                          setTableData(rows.slice(0));
                        }
                      }
                    }
                  },
                  
                  complete: function(results) {
                    console.log(`CSV parsing complete: Loaded ${rows.length} rows`);
                    
                    if (rows.length > DISPLAY_ROWS) {
                      console.log(`🔍 FRONTEND: Setting table data for ${activeChain} (${rows.slice(0, DISPLAY_ROWS).length} rows displayed, ${rows.length} total)`);
                      setTableData(rows.slice(0, DISPLAY_ROWS));
                      window.fullDataset = rows;
                    } else {
                      console.log(`🔍 FRONTEND: Setting table data for ${activeChain} (${rows.length} rows)`);
                      setTableData(rows);
                    }
                  },
                  
                  error: function(error) {
                    console.error("Error parsing CSV:", error);
                  }
                });
              };
              
              console.log("Starting CSV parsing from fallback...");
              parseInChunks(data);
            })
            .catch(fallbackError => {
              console.error("❌ Error fetching from fallback URL:", fallbackError);
              
              // Show error in the table
              setTableData([]);
              setHeaders(['Error']);
              
              const errorRow = {
                'Error': `Failed to load data from both primary and fallback sources. Check console for details.`
              };
              setTableData([errorRow]);
            });
        } else {
          // No fallback available
          setTableData([]);
          setHeaders(['Error']);
          
          const errorRow = {
            'Error': `Failed to load data: ${error.message}. Check console for details.`
          };
          setTableData([errorRow]);
        }
      });
  }, [csvUrl, fallbackUrl, hiddenColumns, activeChain]);

  // Reset state when chain changes
  useEffect(() => {
    console.log('Chain changed to:', activeChain, 'Resetting component state');
    
    if (activeChain === 'solana') {
      console.log('Switching to Solana - clearing localStorage and forcing fresh state');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('filter') || key.includes('column') || key.includes('sort')) {
          console.log('Clearing localStorage item:', key);
          localStorage.removeItem(key);
        }
      });
    }
    
    setTableData([]);
    setHeaders([]);
    setFilters({});
    setCurrentPage(1);
    setSortConfig({ key: null, direction: 'asc' });
    setColumnSortConfig({});
    setHiddenColumns({});
  }, [activeChain]);

  // Cleanup: cancel requests on unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        console.log("Component unmounting, cancelling current request");
        currentRequestRef.current.abort();
      }
    };
  }, []);

  // Use the fetchData function in the useEffect
  useEffect(() => {
    console.log('Database useEffect triggered for fetchData');
    fetchData();
  }, [fetchData]);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('advancedFiltersPosition');
    const savedSize = localStorage.getItem('advancedFiltersSize');
    if (savedPosition) setAdvancedFiltersPosition(JSON.parse(savedPosition));
    if (savedSize) setAdvancedFiltersSize(JSON.parse(savedSize));
    
    const savedHighlighterColor = localStorage.getItem('highlighterColor');
    const savedPositiveColor = localStorage.getItem('positiveColor');
    const savedNegativeColor = localStorage.getItem('negativeColor');
    
    if (savedHighlighterColor) {
      setHighlighterColor(savedHighlighterColor);
      document.documentElement.style.setProperty('--custom-highlighter-color', savedHighlighterColor);
    }
    
    if (savedPositiveColor) {
      setPositiveColor(savedPositiveColor);
      document.documentElement.style.setProperty('--custom-positive-color', savedPositiveColor);
    }
    
    if (savedNegativeColor) {
      setNegativeColor(savedNegativeColor);
      document.documentElement.style.setProperty('--custom-negative-color', savedNegativeColor);
    }
  }, []);

  // Keep global reference to current filters
  useEffect(() => {
    window.currentFilters = filters;
  }, [filters]);

  // Listen for preset application events
  useEffect(() => {
    const handleApplyPresetFilters = (event) => {
      const { filters: presetFilters } = event.detail;
      console.log('App.js: Received preset filters to apply:', presetFilters);
      setFilters(presetFilters);
    };

    window.addEventListener('applyPresetFilters', handleApplyPresetFilters);
    
    return () => {
      window.removeEventListener('applyPresetFilters', handleApplyPresetFilters);
    };
  }, []);

  // Function to get the scanner name
  const getScannerName = () => {
    switch(activeChain) {
      case 'solana': return 'Solscan';
      case 'ethereum': return 'Etherscan';
      case 'base': return 'Basescan';
      case 'tron': return 'Tronscan';
      case 'bsc': return 'BscScan';
      default: return 'Explorer';
    }
  };

  // Function to get the appropriate URL
  const getHyperlink = (address) => {
    switch(linkType) {
      case 'explorer':
        switch(activeChain) {
          case 'solana': return `https://solscan.io/account/${address}`;
          case 'ethereum': return `https://etherscan.io/address/${address}`;
          case 'base': return `https://basescan.org/address/${address}`;
          case 'tron': return `https://tronscan.org/#/address/${address}`;
          case 'bsc': return `https://bscscan.com/address/${address}`;
          default: return `https://solscan.io/account/${address}`;
        }
      case 'gmgn':
        const gmgnChain = activeChain === 'solana' ? 'sol' : 
                       activeChain === 'ethereum' ? 'eth' : 
                       activeChain === 'base' ? 'base' : 
                       activeChain === 'tron' ? 'tron' : 
                       activeChain === 'bsc' ? 'bsc' : 'sol';
        return `https://gmgn.ai/${gmgnChain}/address/${address}`;
      case 'cielo':
        return `https://app.cielo.finance/profile/${address}/related`;
      case 'copy':
        return null;
      default:
        return `https://solscan.io/account/${address}`;
    }
  };

  // Handle cell click for wallet addresses
  const handleCellClick = (value, columnName) => {
    if (columnName === 'address' || columnName === 'wallet address') {
      if (linkType === 'copy') {
        navigator.clipboard.writeText(value);
        setCopySuccess('Address copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      } else {
        const url = getHyperlink(value);
        if (url) {
          window.open(url, '_blank');
        }
      }
    }
  };

  // Parse date function
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    dateStr = dateStr.trim();
    
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(part => part.padStart(2, '0'));
      return new Date(`${year}-${month}-${day}`);
    }
    
    const parts = dateStr.split(/[-\/\.]/);
    if (parts.length !== 3) {
      console.log(`Invalid date format: ${dateStr}`);
      return null;
    }
    
    let month, day, year;
    
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [month, day, year] = parts;
    }
    
    if (isNaN(parseInt(month)) || isNaN(parseInt(day)) || isNaN(parseInt(year))) {
      console.log(`Invalid date parts: month=${month}, day=${day}, year=${year}`);
      return null;
    }
    
    if (year.length < 4) {
      year = year.padStart(4, '20');
    }
    
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      console.log(`Invalid month: ${month}`);
      return null;
    }
    
    if (parseInt(day) < 1 || parseInt(day) > 31) {
      console.log(`Invalid day: ${day}`);
      return null;
    }
    
    const date = new Date(`${year}-${month}-${day}`);
    
    if (isNaN(date.getTime())) {
      console.log(`Invalid date created: ${year}-${month}-${day}`);
      return null;
    }
    
    return date;
  };

  // Normalize column headers
  const normalizeHeaderName = (headerName) => {
    if (!headerName) return headerName;
    return headerName.replace(/sub 75k/gi, '< 75k');
  };

  // Parse numeric value
  const parseNumericValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      return parseFloat(value.replace(/,/g, ''));
    }
    
    return null;
  };

  // Handle advanced sort change
  const handleAdvancedSortChange = (columnId, direction) => {
    setColumnSortConfig(prev => {
      const newConfig = {...prev};
      
      if (direction === null) {
        delete newConfig[columnId];
      } else {
        newConfig[columnId] = direction;
      }
      
      return newConfig;
    });
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    const dataToFilter = window.fullDataset || tableData;
    
    if (!dataToFilter.length) return [];
    
    console.log(`Applying filters to ${dataToFilter.length} rows...`);
    
    let result = dataToFilter.filter(row => {
      for (const [column, filter] of Object.entries(filters)) {
        if (!filter.enabled) continue;
        const cellValue = row[column];
        if (cellValue === undefined || cellValue === null) {
          return false;
        }
        
        if (column === 'address' || column === 'wallet address') {
          if (filter.keyword && filter.keyword.trim() !== '') {
            const addresses = filter.keyword
              .split(/[\s,\n]+/)
              .map(a => a.trim().toLowerCase())
              .filter(Boolean);
            const cellAddress = String(cellValue).toLowerCase();
            if (!addresses.includes(cellAddress)) {
              return false;
            }
          }
          continue;
        }
        
        if (column === 'tags') {
          if (filter.keyword && filter.keyword.trim() !== '') {
            const keywords = filter.keyword
              .split(/[\s,\n]+/)
              .map(k => k.trim().toLowerCase())
              .filter(Boolean);
            const cellTags = String(cellValue).toLowerCase();
            if (!keywords.some(keyword => cellTags.includes(keyword))) {
              return false;
            }
          }
          continue;
        }
        
        if (column === 'date reviewed [m/d/y]') {
          const rowDate = parseDate(cellValue);
          const minDate = filter.min ? parseDate(filter.min) : null;
          const maxDate = filter.max ? parseDate(filter.max) : null;
          if (!rowDate) return false;
          if (minDate && rowDate < minDate) return false;
          if (maxDate && rowDate > maxDate) return false;
          continue;
        }
        
        const numericCellValue = parseNumericValue(cellValue);
        if (numericCellValue === null) {
          continue;
        }
        if (filter.min !== '') {
          const minValue = parseNumericValue(filter.min);
          if (minValue !== null && numericCellValue < minValue) {
            return false;
          }
        }
        if (filter.max !== '') {
          const maxValue = parseNumericValue(filter.max);
          if (maxValue !== null && numericCellValue > maxValue) {
            return false;
          }
        }
      }
      return true;
    });
    
    console.log(`Filtered down to ${result.length} rows`);
    
    if (Object.keys(columnSortConfig).length > 0) {
      result = [...result].sort((a, b) => {
        for (const [column, direction] of Object.entries(columnSortConfig)) {
          const aValue = parseNumericValue(a[column]);
          const bValue = parseNumericValue(b[column]);
          
          if (aValue !== null && bValue !== null) {
            if (aValue !== bValue) {
              return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
          } else {
            const aString = String(a[column] || '').toLowerCase();
            const bString = String(b[column] || '').toLowerCase();
            
            if (aString !== bString) {
              const comparison = aString.localeCompare(bString);
              return direction === 'asc' ? comparison : -comparison;
            }
          }
        }
        
        return 0;
      });
    }
    
    return result;
  }, [tableData, filters, columnSortConfig]);

  const filteredData = useMemo(() => applyFilters(), [tableData, filters, applyFilters]);

  // Handle Filter Change
  const handleFilterChange = (column, type, value) => {
    setFilters(prev => {
      const currentFilter = prev[column] || { min: "", max: "", enabled: false };
      
      if (type === 'min') {
        return {
          ...prev,
          [column]: { ...currentFilter, min: value }
        };
      }
      if (type === 'max') {
        return {
          ...prev,
          [column]: { ...currentFilter, max: value }
        };
      }
      if (type === 'enabled') {
        return {
          ...prev,
          [column]: { ...currentFilter, enabled: value }
        };
      }
      if (type === 'keyword') {
        return {
          ...prev,
          [column]: { ...currentFilter, keyword: value }
        };
      }
      return prev;
    });
  };

  // Clear Filter
  const clearFilter = (column) => {
    setFilters(prev => {
      const { [column]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Toggle Filter Dropdown
  const toggleFilterDropdown = (header) => {
    setActiveFilter(activeFilter === header ? null : header);
  };

  // Toggle Column Visibility
  const toggleColumnVisibility = (header) => {
    setHiddenColumns((prev) => ({
      ...prev,
      [header]: !prev[header],
    }));
  };

  // Copy CSV Text
  const copyCSVText = () => {
    const csvContent = Papa.unparse(filteredData);
    navigator.clipboard.writeText(csvContent)
      .then(() => {
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text:", err);
        setCopySuccess("Failed to copy");
      });
  };

  // Download CSV
  const downloadCSV = () => {
    const csvContent = Papa.unparse(filteredData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "filtered_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const [pageInput, setPageInput] = useState(currentPage);

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  const handlePageInput = (e) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageSubmit = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInput);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      } else {
        setPageInput(currentPage);
      }
    }
  };

  // Shorten address
  const shortenAddress = (address) => {
    if (!address) return '';
    
    if (activeChain === 'solana') {
      return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    } else if (activeChain === 'ethereum' || activeChain === 'base' || activeChain === 'bsc') {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    } else {
      return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    }
  };

  // Render address cell
  const renderAddressCell = (address) => {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          handleCellClick(address, 'address');
        }}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            const url = getHyperlink(address);
            if (url) {
              const newTab = window.open();
              newTab.opener = null;
              newTab.location = url;
              newTab.blur();
              window.focus();
            }
          }
        }}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{ 
          color: '#ffffff',
          cursor: 'pointer' 
        }}
        title={address}
        className="address-link"
      >
        {shortenAddress(address)}
      </span>
    );
  };

  const handleSort = (column) => {
    let direction = 'asc';
    if (sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: column, direction });
  };

  // Reset table
  const resetTable = () => {
    console.log("Resetting table...");
    console.time("resetTable");
    
    requestAnimationFrame(() => {
      if (originalHeadersRef.current.length > 0) {
        console.log("Restoring original column order...");
        setHeaders([...originalHeadersRef.current]);
      }
      
      setFilters({});
      setActiveFilter(null);
      setSortConfig({ key: null, direction: 'asc' });
      setColumnSortConfig({});
      setCurrentPage(1);
      
      const resetHiddenState = {};
      (originalHeadersRef.current.length > 0 ? originalHeadersRef.current : headers).forEach(header => {
        resetHiddenState[header] = false;
      });
      setHiddenColumns(resetHiddenState);
      
      if (window.fullDataset) {
        console.log("Using cached data for display...");
        setTableData(prevData => [...prevData]);
      }
      
      console.timeEnd("resetTable");
    });
  };

  useEffect(() => {
    if (onResetTableRef) {
      onResetTableRef(resetTable);
    }
  }, [onResetTableRef]);

  const handleRowClick = (row) => {
    if (isHighlighterActive) {
      const address = row.address;
      const newHighlightedWallets = new Set(highlightedWallets);
      
      if (newHighlightedWallets.has(address)) {
        newHighlightedWallets.delete(address);
      } else {
        newHighlightedWallets.add(address);
      }
      
      updateHighlightedWallets(newHighlightedWallets);
    }
  };

  // Format number with commas
  const formatNumberWithCommas = (value) => {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) {
      return value;
    }
    
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  };

  // Check if profit column
  const isProfitColumn = (columnName) => {
    if (!columnName) return false;
    
    if (columnName === 'all time profit') {
      console.log('EXACT MATCH: all time profit column detected!');
      return true;
    }
    
    const lowerColumnName = columnName.toLowerCase();
    
    if (profitColumns.some(col => lowerColumnName === col.toLowerCase())) {
      return true;
    }
    
    if (lowerColumnName.includes('all time profit') || 
        lowerColumnName === 'all time profit' ||
        (lowerColumnName.includes('all time') && lowerColumnName.includes('profit')) ||
        lowerColumnName.includes('realized profit') ||
        lowerColumnName.includes('unrealized profit') ||
        (lowerColumnName.includes('profit') && !lowerColumnName.includes('profit pnl'))) {
      return true;
    }
    
    return false;
  };

  // Format cell value
  const formatCellValue = (value, columnName) => {
    if (columnName === 'all time profit') {
      try {
        let numValue;
        if (typeof value === 'string') {
          const cleanedValue = value.replace(/[^\d.-]/g, '');
          numValue = parseFloat(cleanedValue);
        } else {
          numValue = parseFloat(value);
        }
        
        if (!isNaN(numValue)) {
          const formattedValue = formatNumberWithCommas(numValue);
          
          if (numValue > 0) {
            return <span className="profit-value-positive">{formattedValue}</span>;
          } else if (numValue < 0) {
            return <span className="profit-value-negative">{formattedValue}</span>;
          }
          return formattedValue;
        }
      } catch (e) {
        console.error('Error parsing all time profit value:', e);
      }
    }
    
    if (columnName === "wallet address" || columnName === "address") {
      return value;
    }
    
    if (columnName === "date" || columnName.includes("date") || columnName.includes("time")) {
      return value;
    }
    
    if (isProfitColumn(columnName)) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const formattedValue = formatNumberWithCommas(value);
        
        if (numValue > 0) {
          return <span className="profit-value-positive">{formattedValue}</span>;
        } else if (numValue < 0) {
          return <span className="profit-value-negative">{formattedValue}</span>;
        }
        return formattedValue;
      }
    }
    
    if (typeof value === 'number' || !isNaN(parseFloat(value))) {
      return formatNumberWithCommas(value);
    }
    
    return value;
  };

  const handleAdvancedFiltersPositionChange = (newPosition) => {
    setAdvancedFiltersPosition(newPosition);
    localStorage.setItem('advancedFiltersPosition', JSON.stringify(newPosition));
  };

  const handleAdvancedFiltersSizeChange = (newSize) => {
    setAdvancedFiltersSize(newSize);
    localStorage.setItem('advancedFiltersSize', JSON.stringify(newSize));
  };

  const handleColumnVisibilityChange = (columnId, isVisible) => {
    setHiddenColumns(prev => ({
      ...prev,
      [columnId]: !isVisible
    }));
  };

  const handleColorPalettePositionChange = (newPosition) => {
    setColorPalettePosition(newPosition);
    localStorage.setItem('colorPalettePosition', JSON.stringify(newPosition));
  };

  const handleHighlighterColorChange = (color) => {
    setHighlighterColor(color);
    localStorage.setItem('highlighterColor', color);
    document.documentElement.style.setProperty('--custom-highlighter-color', color);
  };

  const handlePositiveColorChange = (color) => {
    setPositiveColor(color);
    localStorage.setItem('positiveColor', color);
    document.documentElement.style.setProperty('--custom-positive-color', color);
  };

  const handleNegativeColorChange = (color) => {
    setNegativeColor(color);
    localStorage.setItem('negativeColor', color);
    document.documentElement.style.setProperty('--custom-negative-color', color);
  };

  const handleColorPaletteMouseDown = (e) => {
    if (e.target.closest('.color-palette-header') && !e.target.closest('button')) {
      setIsDraggingColorPalette(true);
      setColorPaletteDragStart({
        x: e.clientX - colorPalettePosition.x,
        y: e.clientY - colorPalettePosition.y
      });
    }
  };

  const handleColorPaletteMouseMove = (e) => {
    if (isDraggingColorPalette) {
      setColorPalettePosition({
        x: e.clientX - colorPaletteDragStart.x,
        y: e.clientY - colorPaletteDragStart.y
      });
    }
  };

  const handleColorPaletteMouseUp = () => {
    setIsDraggingColorPalette(false);
  };

  const resetColorsToDefault = () => {
    const defaultHighlighter = '#99617e';
    const defaultPositive = '#000000';
    const defaultNegative = '#000000';
    
    setHighlighterColor(defaultHighlighter);
    setPositiveColor(defaultPositive);
    setNegativeColor(defaultNegative);
    
    localStorage.setItem('highlighterColor', defaultHighlighter);
    localStorage.setItem('positiveColor', defaultPositive);
    localStorage.setItem('negativeColor', defaultNegative);
    
    document.documentElement.style.setProperty('--custom-highlighter-color', defaultHighlighter);
    document.documentElement.style.setProperty('--custom-positive-color', defaultPositive);
    document.documentElement.style.setProperty('--custom-negative-color', defaultNegative);
  };

  useEffect(() => {
    if (isDraggingColorPalette) {
      document.addEventListener('mousemove', handleColorPaletteMouseMove);
      document.addEventListener('mouseup', handleColorPaletteMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleColorPaletteMouseMove);
        document.removeEventListener('mouseup', handleColorPaletteMouseUp);
      };
    }
  }, [isDraggingColorPalette]);

  useEffect(() => {
    if (!isDraggingColorPalette) {
      localStorage.setItem('colorPalettePosition', JSON.stringify(colorPalettePosition));
    }
  }, [isDraggingColorPalette, colorPalettePosition]);

  const handleCopyCSV = async () => {
    try {
      await navigator.clipboard.writeText(rawCsvData);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
    } catch (err) {
      console.error('Failed to copy CSV data:', err);
    }
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([rawCsvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeChain}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLinkTypeChange = (newType) => {
    console.log('Changing link type to:', newType);
    setLinkType(newType);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.chain-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <div className="database-container">
      {/* Chain Selector Dropdown */}
      <div className="chain-selector-container">
        <div className="chain-dropdown">
          <button 
            className="chain-dropdown-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="chain-dropdown-label">
              {chainOptions.find(opt => opt.id === activeChain)?.label || 'Select Chain'}
            </span>
            {dropdownOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
          
          {dropdownOpen && (
            <div className="chain-dropdown-menu">
              {chainOptions.map(option => (
                <div
                  key={option.id}
                  className={`chain-dropdown-item ${activeChain === option.id ? 'active' : ''}`}
                  onClick={() => onChainSwitch(option.id)}
                >
                  {option.label}
                  {activeChain === option.id && <FaCircle size={8} className="active-indicator" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="controls-container">
        <div className="left-controls">
          <button 
            onClick={handleCopyCSV}
            className="icon-button"
            title="Copy CSV Data"
          >
            <FaCopy />
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="icon-button"
            title="Download CSV File"
          >
            <FaDownload />
          </button>
          <button 
            onClick={resetTable}
            className="icon-button"
            title="Reset Table Contents"
          >
            <FaSyncAlt />
          </button>
          <button 
            onClick={() => setIsHighlighterActive(!isHighlighterActive)} 
            className={`highlighter-button ${isHighlighterActive ? 'active' : ''}`}
            title="Toggle Highlighter"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            className={`control-button filters-button ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Advanced Filters"
          >
            <FaFilter />
          </button>
          <button
            className={`control-button palette-button ${showColorPalette ? 'active' : ''}`}
            onClick={() => setShowColorPalette(!showColorPalette)}
            title="Color Palette"
          >
            <FaPalette />
          </button>
        </div>
        
        <div className="hyperlink-controls">
          <button 
            onClick={() => handleLinkTypeChange('explorer')} 
            className={linkType === 'explorer' ? 'active' : ''}
          >
            {getScannerName()}
          </button>
          <button 
            onClick={() => handleLinkTypeChange('gmgn')} 
            className={linkType === 'gmgn' ? 'active' : ''}
          >
            GMGN
          </button>
          <button 
            onClick={() => handleLinkTypeChange('cielo')} 
            className={linkType === 'cielo' ? 'active' : ''}
          >
            Cielo
          </button>
          <button 
            onClick={() => handleLinkTypeChange('copy')} 
            className={linkType === 'copy' ? 'active' : ''}
          >
            Copy
          </button>
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ⟨
          </button>
          <div className="page-input-container">
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInput}
              onKeyDown={handlePageSubmit}
              onBlur={() => setPageInput(currentPage)}
              className="page-input"
            />
            <span>/ {totalPages}</span>
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            ⟩
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {headers.map((header, index) => {
                  if (hiddenColumns[header]) return null;
                  const isFirstColumn = header === 'address';
                  const isDateReviewed = header === "date reviewed [m/d/y]";
                  
                  return (
                    <th 
                      key={index} 
                      className={`header-cell ${isFirstColumn ? 'fixed-column' : ''}`}
                    >
                      <div className="header-content">
                        <span className="header-text">{normalizeHeaderName(header)}</span>
                        {!isFirstColumn && !isDateReviewed && (
                          <div className="sort-controls">
                            <button
                              className={`sort-button ${sortConfig.key === header ? 'active' : ''}`}
                              onClick={() => handleSort(header)}
                            >
                              <FaCaretUp 
                                className={`sort-icon ${sortConfig.key === header && sortConfig.direction === 'asc' ? 'active' : ''}`}
                              />
                              <FaCaretDown 
                                className={`sort-icon ${sortConfig.key === header && sortConfig.direction === 'desc' ? 'active' : ''}`}
                              />
                            </button>
                          </div>
                        )}
                        <div className="header-filter">
                          {header !== 'address' && header !== 'date reviewed [m/d/y]' && (
                            <button
                              className={`filter-toggle ${filters[header]?.enabled ? 'active' : ''}`}
                              onClick={() => toggleFilterDropdown(header)}
                            >
                              <FaCircle />
                            </button>
                          )}
                          {activeFilter === header && (
                            <div className="filter-dropdown">
                              <div className="filter-header">
                                <button
                                  className={`toggle-dot ${filters[header]?.enabled ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterChange(header, "enabled", !filters[header]?.enabled);
                                  }}
                                >
                                  <FaCircle />
                                </button>
                                <span>Enable Filter</span>
                              </div>
                              {header === "address" || header === "tags" ? (
                                <div className="filter-inputs">
                                  <input
                                    type="text"
                                    placeholder="Enter keyword"
                                    value={filters[header]?.keyword || ""}
                                    onChange={(e) => handleFilterChange(header, "keyword", e.target.value)}
                                    className="filter-input"
                                  />
                                </div>
                              ) : header === "date reviewed [m/d/y]" ? (
                                <div className="filter-inputs">
                                  <input
                                    type="text"
                                    placeholder="Start date (MM-DD-YYYY)"
                                    value={filters[header]?.min || ""}
                                    onChange={(e) => handleFilterChange(header, "min", e.target.value)}
                                    className="filter-input"
                                  />
                                  <input
                                    type="text"
                                    placeholder="End date (MM-DD-YYYY)"
                                    value={filters[header]?.max || ""}
                                    onChange={(e) => handleFilterChange(header, "max", e.target.value)}
                                    className="filter-input"
                                  />
                                </div>
                              ) : (
                                <div className="filter-inputs">
                                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters[header]?.min}
                                    onChange={(e) => handleFilterChange(header, "min", e.target.value)}
                                    className="filter-input"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters[header]?.max}
                                    onChange={(e) => handleFilterChange(header, "max", e.target.value)}
                                    className="filter-input"
                                  />
                                </div>
                              )}
                              <button
                                className="clear-filter"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearFilter(header);
                                }}
                              >
                                <FaTimes /> Clear Filter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr 
                    key={index}
                    onClick={() => handleRowClick(row)}
                    className={highlightedWallets.has(row.address) ? 'highlighted-text' : ''}
                  >
                    {headers.map((header, colIndex) => {
                      if (hiddenColumns[header]) return null;
                      const isFirstColumn = header === 'address';
                      const cellStyle = {};
                      const value = row[header];
                      
                      return (
                        <td 
                          key={colIndex}
                          style={{...cellStyle, textAlign: header === 'date reviewed [m/d/y]' ? 'center' : 'center'}}
                          className={`${isFirstColumn ? 'fixed-column' : ''} ${header === 'date reviewed [m/d/y]' ? 'date-column' : ''}`}
                          data-column={header}
                          data-all-time-profit={header === 'all time profit' ? 'true' : undefined}
                        >
                          {isFirstColumn ? renderAddressCell(value) : 
                            header === 'all time profit' ? (
                              (() => {
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue)) {
                                  const formattedValue = formatNumberWithCommas(value);
                                  if (numValue > 0) {
                                    return <span className="profit-value-positive all-time-profit" style={{color: positiveColor}}>{formattedValue}</span>;
                                  } else if (numValue < 0) {
                                    return <span className="profit-value-negative all-time-profit" style={{color: negativeColor}}>{formattedValue}</span>;
                                  }
                                  return formattedValue;
                                }
                                return formatCellValue(value, header);
                              })()
                            ) : formatCellValue(value, header)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="loading-container">
                    <div className="logo-spinner">
                      <img src={`${process.env.PUBLIC_URL}/whitelogo.svg`} alt="Loading" />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        columns={headers && headers.length > 0 ? headers.map(header => ({
          id: header || '',
          label: header || '',
          isVisible: !hiddenColumns[header]
        })) : []}
        onColumnOrderChange={(newColumns) => {
          const newHeaders = newColumns.map(col => col.id);
          setHeaders(newHeaders);
          setTableData([...tableData]);
        }}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onFilterChange={(columnId, filterType, value) => {
          handleFilterChange(columnId, filterType, value);
        }}
        onSortChange={handleAdvancedSortChange}
        currentSortConfig={columnSortConfig}
        currentFilters={filters}
        position={advancedFiltersPosition}
        onPositionChange={handleAdvancedFiltersPositionChange}
        size={advancedFiltersSize}
        onSizeChange={handleAdvancedFiltersSizeChange}
        onReset={resetTable}
      />

      {/* Color Palette Panel */}
      {showColorPalette && (
        <div 
          className="color-palette-panel"
          style={{
            transform: `translate3d(${colorPalettePosition.x}px, ${colorPalettePosition.y}px, 0)`,
            opacity: isDraggingColorPalette ? 0.7 : 1
          }}
          onMouseDown={handleColorPaletteMouseDown}
        >
          <div className="color-palette-header">
            <button
              onClick={resetColorsToDefault}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                background: '#99617e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(153, 97, 126, 0.8)'}
              onMouseLeave={(e) => e.target.style.background = '#99617e'}
            >
              Reset
            </button>
            <button
              onClick={() => setShowColorPalette(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#999999',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '5px'
              }}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="color-option">
            <label>Highlighter Color</label>
            <div className="color-inputs">
              <input
                type="text"
                value={highlighterColor}
                onChange={(e) => handleHighlighterColorChange(e.target.value)}
                className="color-text-input"
              />
              <div 
                className="color-preview"
                style={{ backgroundColor: highlighterColor }}
              ></div>
            </div>
          </div>
          
          <div className="color-option">
            <label>Positive Number Color</label>
            <div className="color-inputs">
              <input
                type="text"
                value={positiveColor}
                onChange={(e) => handlePositiveColorChange(e.target.value)}
                className="color-text-input"
              />
              <div 
                className="color-preview"
                style={{ backgroundColor: positiveColor }}
              ></div>
            </div>
          </div>
          
          <div className="color-option">
            <label>Negative Number Color</label>
            <div className="color-inputs">
              <input
                type="text"
                value={negativeColor}
                onChange={(e) => handleNegativeColorChange(e.target.value)}
                className="color-text-input"
              />
              <div 
                className="color-preview"
                style={{ backgroundColor: negativeColor }}
              ></div>
            </div>
          </div>
          
          <a 
            href="https://www.google.com/search?q=color+picker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="color-picker-link"
          >
            Open Google Color Picker
          </a>
        </div>
      )}
      
      {/* Copy Success Notification */}
      {showCopyNotification && (
        <div className="copy-notification">
          CSV data copied successfully!
        </div>
      )}
    </div>
  );
}

export default App;
