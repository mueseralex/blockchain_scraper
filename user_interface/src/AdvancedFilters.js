import React, { useState, useRef, useEffect } from 'react';
import { FaGripVertical, FaEye, FaEyeSlash, FaFilter, FaChevronDown, FaChevronUp, FaTimes, FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import './AdvancedFilters.css';

// Add function to detect if the device is mobile
const isMobileDevice = () => {
  return window.innerWidth <= 768 || 
    navigator.maxTouchPoints > 0 || 
    navigator.msMaxTouchPoints > 0 || 
    /Mobi|Android/i.test(navigator.userAgent);
};

const AdvancedFilters = ({ 
  isOpen, 
  onClose, 
  columns = [], 
  onFilterChange,
  currentFilters = {},
  onColumnVisibilityChange,
  onColumnOrderChange,
  onSortChange,
  currentSortConfig = {},
  onReset,
  position = { x: 100, y: 100 },
  size = { width: 400, height: 600 }
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [localPosition, setLocalPosition] = useState(position);
  const [localSize, setLocalSize] = useState(size);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // --- Drag and drop for reordering columns ---
  const [localColumns, setLocalColumns] = useState(columns);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  // Add effect to check for mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleDragStart = (index, e) => {
    if (e && e.type === 'touchstart') {
      e.preventDefault();
    }
    setDraggedIndex(index);
    
    const filterItems = document.querySelectorAll('.filter-item');
    if (filterItems[index]) {
      filterItems[index].classList.add('dragging');
    }
  };

  const handleDragEnter = (index, e) => {
    if (e && e.type === 'touchmove') {
      e.preventDefault();
    }
    setDragOverIndex(index);
  };

  const handleDragEnd = (e) => {
    try {
      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
        const updated = [...localColumns];
        const [removed] = updated.splice(draggedIndex, 1);
        updated.splice(dragOverIndex, 0, removed);
        setLocalColumns(updated);
        if (onColumnOrderChange) {
          onColumnOrderChange(updated);
        }
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
    
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => item.classList.remove('dragging'));
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Disable scrolling on the panel during drag
    const panel = document.querySelector('.advanced-filters-content');
    if (panel) {
      panel.style.overflow = 'hidden';
      panel.classList.add('dragging');
    }
    
    // Add dragging class to panel for styling
    const advPanel = document.querySelector('.advanced-filters-panel');
    if (advPanel) {
      advPanel.classList.add('dragging');
    }
    
    // Prevent body scrolling during drag operation
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    // Mark the current item being dragged
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => item.classList.remove('dragging'));
    if (filterItems[index]) {
      filterItems[index].classList.add('dragging');
      
      // Store the original position for reference
      filterItems[index].setAttribute('data-original-y', filterItems[index].getBoundingClientRect().top);
    }
    
    setDraggedIndex(index);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null) return;
    
    const touch = e.touches[0];
    const touchY = touch.clientY;
    
    // Determine which item we're hovering over
    const filterItems = Array.from(document.querySelectorAll('.filter-item'));
    
    // Loop through items to find one we're hovering over
    for (let i = 0; i < filterItems.length; i++) {
      if (i === draggedIndex) continue;
      
      const rect = filterItems[i].getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        // Found the item we're hovering over
        setDragOverIndex(i);
        
        // Visual indication of drop target
        filterItems.forEach((item, idx) => {
          if (idx === i) {
            item.classList.add('drag-over');
          } else {
            item.classList.remove('drag-over');
          }
        });
        
        break;
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Re-enable scrolling
    const panel = document.querySelector('.advanced-filters-content');
    if (panel) {
      panel.style.overflow = 'auto';
      panel.classList.remove('dragging');
    }
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // Remove dragging class from panel
    const advPanel = document.querySelector('.advanced-filters-panel');
    if (advPanel) {
      advPanel.classList.remove('dragging');
    }
    
    // Complete the drag operation
    try {
      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
        const updated = [...localColumns];
        const [removed] = updated.splice(draggedIndex, 1);
        updated.splice(dragOverIndex, 0, removed);
        setLocalColumns(updated);
        if (onColumnOrderChange) {
          onColumnOrderChange(updated);
        }
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
    
    // Clear all drag indicators
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
      item.classList.remove('dragging');
      item.classList.remove('drag-over');
    });
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Panel touch handling (for dragging the whole panel)
  const handlePanelTouchStart = (e) => {
    // Only start dragging if not touching a button
    if (e.target.closest('.advanced-filters-header') && !e.target.closest('button')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setTouchStartPos({
        x: touch.clientX - localPosition.x,
        y: touch.clientY - localPosition.y
      });
      
      // Prevent body scrolling during panel drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
  };

  const handlePanelTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      setLocalPosition({
        x: touch.clientX - touchStartPos.x,
        y: touch.clientY - touchStartPos.y
      });
      e.preventDefault();
    }
  };

  const handlePanelTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  // Add touch event listeners for panel dragging
  useEffect(() => {
    if (isDragging || isResizing) {
      if (isMobile) {
        document.addEventListener('touchmove', handlePanelTouchMove, { passive: false });
        document.addEventListener('touchend', handlePanelTouchEnd);
        return () => {
          document.removeEventListener('touchmove', handlePanelTouchMove);
          document.removeEventListener('touchend', handlePanelTouchEnd);
        };
      } else {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }
  }, [isDragging, isResizing, isMobile]);

  if (!isOpen) return null;

  // Helper to determine if a column is a date
  const isDateColumn = (columnId) => {
    if (!columnId) return false;
    const columnIdLower = columnId.toLowerCase();
    return (
      columnIdLower.includes('date') ||
      columnIdLower.includes('time') && !columnIdLower.includes('all time')
    );
  };

  // Helper to determine if a column is address
  const isAddressColumn = (columnId) => {
    if (!columnId) return false;
    return (
      columnId.toLowerCase().includes('address')
    );
  };

  // Function to normalize column names for display
  const normalizeColumnName = (columnName) => {
    if (!columnName) return columnName;
    
    // Convert "sub 75k" to "< 75k" for display
    return columnName.replace(/sub 75k/gi, '< 75k');
  };

  // Function to get the original column name from normalized name
  const getOriginalColumnName = (normalizedName) => {
    if (!normalizedName) return normalizedName;
    
    // Convert "< 75k" back to "sub 75k" to match CSV data
    return normalizedName.replace(/< 75k/gi, 'sub 75k');
  };

  // Troubleshoot and fix the profit columns issue
  const isForcedNumericColumn = (columnId) => {
    if (!columnId) return false;
    
    // Force these specific columns to be numeric regardless of other detection
    const columnLower = columnId.toLowerCase();
    const forcedColumns = [
      'all time profit',
      'avg hold time'
    ];
    
    // Direct check for exact matches first
    for (const forced of forcedColumns) {
      if (columnLower === forced) {
        console.log(`Forced numeric column detected: "${columnId}"`);
        return true;
      }
    }
    
    // Then check for includes
    for (const forced of forcedColumns) {
      if (columnLower.includes(forced)) {
        console.log(`Partial match forced numeric column: "${columnId}"`);
        return true;
      }
    }
    
    return false;
  };

  // Helper to determine if a column should use keyword search (like address and tags)
  const isKeywordColumn = (columnId) => {
    if (!columnId) return false;
    
    const keywordColumns = ['address', 'tags'];
    const lowerColumnId = columnId.toLowerCase();
    
    return keywordColumns.some(col => lowerColumnId.includes(col));
  };

  // Helper to determine if a column is numeric (including winrate)
  const isNumericColumn = (columnId) => {
    if (!columnId) return false;
    
    // First check forced numeric columns - this should catch problematic columns
    if (isForcedNumericColumn(columnId)) {
      return true;
    }

    const numericColumns = [
      'total unrealized profit',
      '7d realized profit',
      '30d realized profit',
      'all time profit',
      'win rate',
      'winrate',
      'buy txns 7d',
      'sell txns 7d',
      'avg profit',
      'balance',
      '<2x count',
      '2x-5x count',
      '>5x count',
      'avg hold time',
      '< 75k avg total profit pnl',
      '< 75k avg buy amount',
      '< 75k avg entry',
      '< 75k entries',
      '75k - 250k avg total profit pnl',
      '75k - 250k avg buy amount',
      '75k - 250k avg entry',
      '75k - 250k entries',
      'fast trades percentage',
      'fast trades',
      // Also include the original CSV column names with "sub"
      'sub 75k avg total profit pnl',
      'sub 75k avg buy amount',
      'sub 75k avg entry',
      'sub 75k entries'
    ];
    
    // Print detailed debug info for problematic columns
    if (columnId.toLowerCase().includes('all time profit') || 
        columnId.toLowerCase().includes('avg hold time')) {
      console.log(`Numeric column check for "${columnId}":`, {
        columnId,
        exactColumnId: JSON.stringify(columnId),
        columnIdLower: columnId.toLowerCase(),
        isForced: isForcedNumericColumn(columnId),
        hasAllTime: columnId.toLowerCase().includes('all time'),
        hasProfit: columnId.toLowerCase().includes('profit'),
        hasAvgHold: columnId.toLowerCase().includes('avg hold'),
        charCodes: Array.from(columnId).map(c => c.charCodeAt(0))
      });
    }
    
    // First try exact match (case-insensitive)
    const lowerColumnId = columnId.toLowerCase();
    if (numericColumns.includes(lowerColumnId)) {
      return true;
    }
    
    // Then try partial match (common profit/numeric indicators)
    if (lowerColumnId.includes('profit') || 
        lowerColumnId.includes('balance') || 
        lowerColumnId.includes('pnl') ||
        (lowerColumnId.includes('hold') && lowerColumnId.includes('time')) ||
        lowerColumnId.includes('count') ||
        lowerColumnId.includes('amount') ||
        lowerColumnId.includes('rate') ||
        lowerColumnId.includes('txns') ||
        lowerColumnId.includes('win')) {
      return true;
    }
    
    // Then try detailed partial matching
    return numericColumns.some(col => lowerColumnId.includes(col.toLowerCase()));
  };

  // Helper to determine if column should have sort button
  const shouldHaveSortButton = (columnId) => {
    // First check forced numeric columns - fast path for problematic columns
    if (isForcedNumericColumn(columnId)) {
      console.log(`Direct sort button for forced column: "${columnId}"`);
      return true;
    }
    
    // Ensure these specific columns have sort buttons
    const numericColumns = [
      'total unrealized profit',
      '7d realized profit',
      '30d realized profit',
      'all time profit',
      'win rate',
      'winrate',
      'avg hold time',
      'buy txns 7d',
      'sell txns 7d',
      'avg profit',
      'balance',
      '<2x count',
      '2x-5x count',
      '>5x count',
      '< 150k avg total profit pnl',
      '< 150k avg buy amount',
      '150k - 1m avg total profit pnl',
      '150k - 1m avg buy amount'
    ];
    
    // Debug log to see what's happening with specific columns
    if (columnId && (columnId.toLowerCase().includes('all time profit') || 
        columnId.toLowerCase().includes('avg hold time'))) {
      console.log(`Sort button check for '${columnId}':`, {
        isAddressColumn: isAddressColumn(columnId),
        isDateColumn: isDateColumn(columnId),
        isNumeric: isNumericColumn(columnId),
        isForced: isForcedNumericColumn(columnId),
        exactMatch: numericColumns.includes(columnId.toLowerCase()),
        partialMatch: numericColumns.some(col => columnId.toLowerCase().includes(col.toLowerCase())),
        columnIdLower: columnId.toLowerCase(),
        exactColumnId: JSON.stringify(columnId),
        charCodes: Array.from(columnId).map(c => c.charCodeAt(0))
      });
    }
    
    // Columns that should not have sort buttons
    if (isDateColumn(columnId) || isAddressColumn(columnId)) {
      return false;
    }
    
    // Check if it's a numeric column (our broader definition)
    if (isNumericColumn(columnId)) {
      return true;
    }
    
    // Final fallback to catch any stragglers
    const lowerColumnId = columnId ? columnId.toLowerCase() : '';
    if (lowerColumnId.includes('profit') || lowerColumnId.includes('hold time')) {
      console.log(`Fallback catch for sort button: "${columnId}"`);
      return true;
    }
    
    return false;
  };

  const handleFilterChange = (columnId, type, value) => {
    try {
      if (onFilterChange) {
        onFilterChange(columnId, type, value);
      }
    } catch (error) {
      console.error(`Error in handleFilterChange for column ${columnId}:`, error);
    }
  };

  const handleColumnVisibility = (columnId, isVisible) => {
    try {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(columnId, isVisible);
      }
    } catch (error) {
      console.error(`Error in handleColumnVisibility for column ${columnId}:`, error);
    }
  };

  const handleMouseDown = (e) => {
    // Only start dragging if not clicking on a button
    if (e.target.closest('.advanced-filters-header') && !e.target.closest('button')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - localPosition.x,
        y: e.clientY - localPosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setLocalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    if (isResizing && panelRef.current) {
      const newWidth = e.clientX - panelRef.current.offsetLeft;
      const newHeight = e.clientY - panelRef.current.offsetTop;
      setLocalSize({
        width: Math.max(350, Math.min(800, newWidth)),
        height: Math.max(400, Math.min(900, newHeight))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const toggleSection = (columnId) => {
    setExpandedSections(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const resetFiltersAndColumns = () => {
    console.log("Reset button clicked - resetting filters and column order");
    
    // Reset column order to default
    if (onColumnOrderChange) {
      // Create deep copy of original columns to reset column order
      const originalColumns = columns.map(col => ({...col}));
      
      // Force immediate state update in component
      setLocalColumns(originalColumns);
      
      // Notify parent component about column order change
      onColumnOrderChange(originalColumns);
    }
    
    // Clear all filters
    if (onFilterChange) {
      columns.forEach(column => {
        // First disable the filter
        handleFilterChange(column.id, 'enabled', false);
        
        // Then clear all filter values based on column type
        if (isNumericColumn(column.id)) {
          handleFilterChange(column.id, 'min', '');
          handleFilterChange(column.id, 'max', '');
        } else if (isDateColumn(column.id)) {
          handleFilterChange(column.id, 'min', '');
          handleFilterChange(column.id, 'max', '');
        } else {
          handleFilterChange(column.id, 'keyword', '');
        }
      });
    }
    
    // Force UI refresh by resetting expanded sections
    setExpandedSections({});
  };
  
  const clearAllFilters = () => {
    console.log("Clear Filters button clicked - clearing all filters only");
    
    // Clear all filter values but don't reset column order
    columns.forEach(column => {
      if (isNumericColumn(column.id)) {
        handleFilterChange(column.id, 'min', '');
        handleFilterChange(column.id, 'max', '');
      } else if (isDateColumn(column.id)) {
        handleFilterChange(column.id, 'min', '');
        handleFilterChange(column.id, 'max', '');
      } else {
        handleFilterChange(column.id, 'keyword', '');
      }
      // Explicitly disable the filter
      handleFilterChange(column.id, 'enabled', false);
    });
  };

  // Add new function to handle sort toggle
  const handleSortToggle = (columnId) => {
    if (!columnId || !onSortChange) return;
    
    try {
      // Get current sort direction for this column
      const currentDirection = currentSortConfig[columnId];
      
      // Toggle between: none -> asc -> desc -> none
      let newDirection;
      if (!currentDirection) {
        newDirection = 'asc';
      } else if (currentDirection === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = null; // Remove sorting
      }
      
      // Call the parent handler with the new sort config
      onSortChange(columnId, newDirection);
    } catch (error) {
      console.error("Error in handleSortToggle:", error);
    }
  };

  return (
    <div 
      ref={panelRef}
      className="advanced-filters-panel"
      style={{
        left: `${localPosition.x}px`,
        top: `${localPosition.y}px`,
        width: !isMobile ? `${localSize.width}px` : undefined,
        height: !isMobile ? `${localSize.height}px` : undefined,
        opacity: isDragging ? 0.7 : 1,
        transition: isDragging ? 'none' : 'opacity 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handlePanelTouchStart}
    >
      <div className="advanced-filters-header">
        <div className="header-buttons">
          <button 
            onClick={() => {
              if (onReset) onReset();
            }}
            className="reset-button"
          >
            Reset
          </button>
          <button onClick={clearAllFilters}>
            Clear Filters
          </button>
        </div>
        <div className="header-controls">
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FaTimes style={{ 
              color: '#999999', 
              fill: '#999999', 
              display: 'block', 
              fontSize: '14px',
              opacity: 1
            }} />
          </button>
        </div>
      </div>

      <div className="advanced-filters-content">
        {localColumns.map((column, index) => {
          const filter = currentFilters[column.id] || {};
          const isNumeric = isNumericColumn(column.id);
          const isDate = isDateColumn(column.id);
          const isAddress = isAddressColumn(column.id);
          const isExpanded = expandedSections[column.id];
          const isBeingDragged = index === draggedIndex;
          const isDragOver = index === dragOverIndex && draggedIndex !== null && draggedIndex !== dragOverIndex;
          const sortDirection = currentSortConfig[column.id];
          const showSortButton = shouldHaveSortButton(column.id);
          
          // Lock address column - it should always be first and non-draggable
          const isAddressLocked = column.id.toLowerCase().includes('address');

          return (
            <div
              key={column.id}
              className={`filter-item${isBeingDragged ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}${isAddressLocked ? ' locked' : ''}`}
              draggable={!isMobile && !isAddressLocked}
              onDragStart={() => !isAddressLocked && handleDragStart(index)}
              onDragEnter={() => !isAddressLocked && handleDragEnter(index)}
              onDragEnd={!isAddressLocked ? handleDragEnd : undefined}
              onDragOver={!isAddressLocked ? (e => e.preventDefault()) : undefined}
              data-index={index}
            >
              <div className="filter-header" onClick={() => toggleSection(column.id)}>
                <div className="filter-header-left">
                  {!isAddressLocked && (
                  <span 
                    className="drag-handle" 
                    style={{ cursor: 'grab' }} 
                    onMouseDown={e => {
                      e.stopPropagation();
                      if (!isMobile) {
                        const item = e.target.closest('.filter-item');
                        if (item) item.draggable = true;
                      }
                    }}
                    onTouchStart={e => {
                      e.stopPropagation();
                      handleTouchStart(index, e);
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <FaGripVertical />
                  </span>
                  )}
                  <span>{normalizeColumnName(column.label)}</span>
                  {showSortButton && (
                    <button 
                      className={`sort-toggle-button ${sortDirection ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSortToggle(column.id);
                      }}
                      title={sortDirection === 'asc' ? 'Ascending' : sortDirection === 'desc' ? 'Descending' : 'Not sorted'}
                    >
                      {sortDirection === 'asc' ? 
                        <FaSortAmountUp size={12} /> : 
                        sortDirection === 'desc' ? 
                        <FaSortAmountDown size={12} /> : 
                        <div className="sort-inactive">
                          <FaSortAmountUp size={10} style={{ opacity: 0.4 }} />
                        </div>
                      }
                    </button>
                  )}
                </div>
                <div className="filter-header-right">
                  <div className="column-controls">
                    <button 
                      className={`column-control-button ${filter.enabled ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange(column.id, 'enabled', !filter.enabled);
                      }}
                    >
                      <FaFilter />
                    </button>
                    <button 
                      className="column-control-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColumnVisibility(column.id, !column.isVisible);
                      }}
                    >
                      {column.isVisible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
              <div className={`filter-content ${isExpanded ? 'expanded' : ''}`}>
                {isNumeric ? (
                  <div className="filter-inputs">
                    <input
                      type="number"
                      value={filter.min || ''}
                      onChange={(e) => handleFilterChange(column.id, 'min', e.target.value)}
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={filter.max || ''}
                      onChange={(e) => handleFilterChange(column.id, 'max', e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                ) : isKeywordColumn(column.id) ? (
                  <div className="filter-inputs">
                    <input
                      type="text"
                      value={filter.keyword || ''}
                      onChange={(e) => handleFilterChange(column.id, 'keyword', e.target.value)}
                      placeholder={column.id.toLowerCase().includes('address') ? 'Enter address to filter...' : 'Search tags...'}
                    />
                  </div>
                ) : isDate ? (
                  <div className="filter-inputs">
                    <input
                      type="text"
                      value={filter.min || ''}
                      onChange={(e) => handleFilterChange(column.id, 'min', e.target.value)}
                      placeholder="Start date (MM-DD-YYYY)"
                      className="date-input"
                    />
                    <input
                      type="text"
                      value={filter.max || ''}
                      onChange={(e) => handleFilterChange(column.id, 'max', e.target.value)}
                      placeholder="End date (MM-DD-YYYY)"
                      className="date-input"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={filter.keyword || ''}
                    onChange={(e) => handleFilterChange(column.id, 'keyword', e.target.value)}
                    placeholder={`Search ${column.label}...`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdvancedFilters; 