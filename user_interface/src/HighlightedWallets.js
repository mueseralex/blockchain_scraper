import React, { useState, useEffect } from 'react';
import { FaCopy, FaEdit, FaSave, FaTimes, FaTrash, FaBookmark } from 'react-icons/fa';
import './HighlightedWallets.css';

function HighlightedWallets({ highlightedWallets, activeChain, updateHighlightedWallets }) {
  // State to store wallet notes
  const [walletNotes, setWalletNotes] = useState({});
  // State to track which wallet is being edited
  const [editingWallet, setEditingWallet] = useState(null);
  // State for the current note being edited
  const [currentNote, setCurrentNote] = useState('');

  // Load saved notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('walletNotes');
    if (savedNotes) {
      setWalletNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('walletNotes', JSON.stringify(walletNotes));
  }, [walletNotes]);

  const copyToClipboard = (text) => {
    // If the wallet has a note, include it in the copied text
    const note = walletNotes[text] || '';
    const textToCopy = note ? `${text} - ${note}` : text;
    navigator.clipboard.writeText(textToCopy);
    // Could add a toast notification here
  };

  const copyAllWallets = () => {
    const walletsText = Array.from(highlightedWallets).map(wallet => {
      const note = walletNotes[wallet] || '';
      return note ? `${wallet} - ${note}` : wallet;
    }).join('\n');
    navigator.clipboard.writeText(walletsText);
    // Could add a toast notification here
  };

  const startEditing = (wallet) => {
    setEditingWallet(wallet);
    setCurrentNote(walletNotes[wallet] || '');
  };

  const saveNote = () => {
    if (editingWallet) {
      setWalletNotes(prev => ({
        ...prev,
        [editingWallet]: currentNote
      }));
      setEditingWallet(null);
    }
  };

  const cancelEditing = () => {
    setEditingWallet(null);
    setCurrentNote('');
  };

  // Add a keyDown handler to the note input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveNote();
    }
  };

  // Add a function to remove a wallet
  const removeWallet = (wallet) => {
    // Create a new Set without the wallet to remove
    const newHighlightedWallets = new Set(highlightedWallets);
    newHighlightedWallets.delete(wallet);
    
    // Update the parent component's state
    updateHighlightedWallets(newHighlightedWallets);
    
    // Also remove any notes for this wallet
    if (walletNotes[wallet]) {
      const newNotes = { ...walletNotes };
      delete newNotes[wallet];
      setWalletNotes(newNotes);
    }
  };

  return (
    <div className={`highlighted-wallets-container chain-${activeChain}`}>
      <div className="info-window-header">
        <div className="header-with-icon">
          <FaBookmark className="header-icon" />
        <h3>Highlighted Wallets ({highlightedWallets.size})</h3>
        </div>
        {highlightedWallets.size > 0 && (
          <button 
            className="copy-all-button" 
            onClick={copyAllWallets}
            title="Copy all wallets with notes"
          >
            <FaCopy /> Copy All
          </button>
        )}
      </div>
      
      <div className="wallets-list">
        {highlightedWallets.size > 0 ? (
          <ul>
            {Array.from(highlightedWallets).map((wallet, index) => (
              <li key={index} className="wallet-item">
                {editingWallet === wallet ? (
                  <div className="wallet-edit-container">
                    <span className="wallet-address">{wallet}</span>
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a note..."
                      className="wallet-note-input"
                      autoFocus
                    />
                    <div className="edit-buttons">
                      <button 
                        className="save-button" 
                        onClick={saveNote}
                        title="Save note"
                      >
                        <FaSave />
                      </button>
                      <button 
                        className="cancel-button" 
                        onClick={cancelEditing}
                        title="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wallet-display-container">
                    <div className="wallet-info">
                      <span className="wallet-address">{wallet}</span>
                      {walletNotes[wallet] && (
                        <span className="wallet-note">{walletNotes[wallet]}</span>
                      )}
                    </div>
                    <div className="wallet-actions">
                      <button 
                        className="edit-button" 
                        onClick={() => startEditing(wallet)}
                        title="Add/Edit note"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={() => removeWallet(wallet)}
                        title="Remove wallet"
                      >
                        <FaTrash />
                      </button>
                      <button 
                        className="copy-button" 
                        onClick={() => copyToClipboard(wallet)}
                        title="Copy wallet with note"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>No wallets highlighted yet. Use the highlighter tool to select wallets from the table.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HighlightedWallets; 