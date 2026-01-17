import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaColumns } from 'react-icons/fa';
import './ColumnInfo.css';

function ColumnInfo({ activeChain }) {
  // State to track which columns are expanded
  const [expandedColumns, setExpandedColumns] = useState({});

  // Toggle column expansion
  const toggleColumn = (columnName) => {
    setExpandedColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  // Column information with custom descriptions
  const columnInfo = [
    { name: "address", description: "traders receiving address" },
    { name: "total unrealized profit", description: "all time unrealized profit in usdc" },
    { name: "7d realized profit", description: "realized profit in usdc over the past 7 days" },
    { name: "30d realized profit", description: "realized profit in usdc over the past 30 days" },
    { name: "all time profit", description: "all time profit for the trader in usdc" },
    { name: "winrate", description: "all time winrate for the trader" },
    { name: "buy txns 7d", description: "amount of buy transactions for this trader in the past 7 days" },
    { name: "sell txns 7d", description: "amount of sell transactions for this trader in the past 7 days" },
    { name: "avg profit", description: "average profit the user makes per trade in usdc" },
    { name: "balance", description: "users native token balance amount in usdc" },
    { name: "<2x count", description: "amount of 2x profit trades this wallet has landed" },
    { name: "2x-5x count", description: "amount of 2x - 5x profit trades this wallet has landed" },
    { name: ">5x count", description: "amount of trades landed amounting to 5x profit or more" },
    { name: "avg hold time", description: "average hold time per token between buys and sells in the unit of hours" },
    { name: "< 75k avg total profit pnl", description: "average pnl in percent gain/loss made on tokens that they bought under 75k marketcap" },
    { name: "< 75k avg buy amount", description: "average amount of usdc used when buying a coin under 75k marketcap" },
    { name: "< 75k avg entry", description: "average market cap entry for coins bought under 75k" },
    { name: "< 75k entries", description: "the amount of coins traded within this range based off the previous 50 txns" },
    { name: "75k - 250k avg total profit pnl", description: "average pnl in percent gain/loss made on tokens that they bought between 75k - 250k marketcap" },
    { name: "75k - 250k avg buy amount", description: "average amount of usdc used when buying a coin between 75k - 250k marketcap" },
    { name: "75k - 250k avg entry", description: "average market cap entry for coins bought between 75k - 250k" },
    { name: "75k - 250k entries", description: "the amount of coins traded within this range based off the previous 50 txns" },
    { name: "fast trades percentage", description: "percent of trades that are \"fast\", considered 60 seconds or under holding time" },
    { name: "date reviewed [m/d/y]", description: "the last date this wallets stats got updated" },
    { name: "tags", description: "what the wallet was tagged as in processing (not always accurate)" }
  ];

  return (
    <div className={`column-info-container chain-${activeChain}`}>
      <div className="info-window-header">
        <div className="header-with-icon">
          <FaColumns className="header-icon" />
        <h3>Column Information</h3>
        </div>
      </div>
      
      <div className="column-info-grid-container">
        <div className="column-info-grid">
          {columnInfo.map((column, index) => (
            <div key={index} className="column-info-card">
              <div 
                className={`column-header ${expandedColumns[column.name] ? 'expanded' : ''}`}
                onClick={() => toggleColumn(column.name)}
              >
                <span className="column-name-label">{column.name}</span>
                <span className="expand-icon">
                  {expandedColumns[column.name] ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              
              {expandedColumns[column.name] && (
                <div className="column-description-panel">
                  <p>{column.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ColumnInfo; 