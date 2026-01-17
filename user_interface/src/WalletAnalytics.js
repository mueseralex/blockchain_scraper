import React, { useEffect, useState, useRef } from 'react';
import { FaClock, FaFilter, FaSave, FaTrash, FaEdit, FaPlay, FaSlidersH, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './WalletAnalytics.css';

function WalletAnalytics({ activeChain, onResetFilters, getCurrentFilters }) {
  const [presets, setPresets] = useState([]);
  const [expandedPreset, setExpandedPreset] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [editingPreset, setEditingPreset] = useState(null);
  const [deletingPreset, setDeletingPreset] = useState(null);
  const [editingFilters, setEditingFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load presets from localStorage on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = () => {
    setLoading(true);
    setError('');
    try {
      const savedPresets = localStorage.getItem('filterPresets');
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      } else {
        setPresets([]);
      }
    } catch (err) {
      console.error('Error loading presets:', err);
      setError('Failed to load presets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save presets to localStorage
  const savePresetsToStorage = (newPresets) => {
    localStorage.setItem('filterPresets', JSON.stringify(newPresets));
  };

  // Extract only the enabled and modified filters, excluding address and date columns
  const extractCurrentFilters = () => {
    const extractedFilters = {};
    const currentFilters = getCurrentFilters ? getCurrentFilters() : {};
    
    for (const [columnId, filter] of Object.entries(currentFilters)) {
      // Skip address and date columns
      if (columnId.toLowerCase().includes('address') || 
          columnId.toLowerCase().includes('date')) {
        continue;
      }
      
      // Only include filters that have actual values set
      const hasValues = (filter.min && filter.min !== '') || 
                       (filter.max && filter.max !== '');
      
      if (hasValues) {
        extractedFilters[columnId] = {
          min: filter.min || '',
          max: filter.max || '',
          enabled: filter.enabled || false
        };
      }
    }
    
    return extractedFilters;
  };

  const savePreset = () => {
    if (!modalInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const filtersToSave = extractCurrentFilters();
      const newPreset = {
        _id: Date.now().toString(), // Generate unique ID
        name: modalInput,
        filters: filtersToSave,
        createdAt: new Date().toISOString()
      };
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setShowSaveModal(false);
      setModalInput('');
    } catch (err) {
      console.error('Error saving preset:', err);
      setError('Failed to save preset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = () => {
    if (!deletingPreset) return;
    setLoading(true);
    setError('');
    try {
      const updatedPresets = presets.filter(p => p._id !== deletingPreset);
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setShowDeleteModal(false);
      setDeletingPreset(null);
    } catch (err) {
      console.error('Error deleting preset:', err);
      setError('Failed to delete preset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renamePreset = () => {
    if (!modalInput.trim() || !editingPreset) return;
    setLoading(true);
    setError('');
    try {
      const updatedPresets = presets.map(p => 
        p._id === editingPreset ? { ...p, name: modalInput } : p
      );
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setShowRenameModal(false);
      setModalInput('');
      setEditingPreset(null);
    } catch (err) {
      console.error('Error renaming preset:', err);
      setError('Failed to rename preset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    try {
      setExpandedPreset(expandedPreset === id ? null : id);
    } catch (err) {
      console.error('Error toggling preset expansion:', err);
      setError('Failed to expand preset');
    }
  };

  const applyPreset = async (preset) => {
    if (!preset || !preset.filters) return;
    
    try {
      console.log('Applying preset:', preset.name, 'with filters:', preset.filters);
      
      // Check if the preset actually has any filters
      const hasActualFilters = Object.keys(preset.filters).length > 0;
      
      // First reset all current filters
      if (onResetFilters) {
        await onResetFilters();
      }
      
      // Only apply filters if there are actual filters to apply
      if (hasActualFilters) {
        // Small delay to ensure reset is complete
        setTimeout(() => {
          // Apply the preset filters by dispatching events to the filter system
          const filtersToApply = preset.filters;
          
          // Send custom event to notify the filter system to apply these filters
          window.dispatchEvent(new CustomEvent('applyPresetFilters', {
            detail: { filters: filtersToApply }
          }));
          
          console.log('Preset filters applied successfully');
        }, 200);
      } else {
        console.log('Preset has no filters, only reset was applied');
      }
      
    } catch (err) {
      console.error('Error applying preset:', err);
      setError('Failed to apply preset: ' + err.message);
    }
  };

  const openSaveModal = () => {
    setModalInput('');
    setShowSaveModal(true);
  };

  const openRenameModal = (id, currentName) => {
    setModalInput(currentName);
    setEditingPreset(id);
    setShowRenameModal(true);
  };

  const openDeleteModal = (id) => {
    setDeletingPreset(id);
    setShowDeleteModal(true);
  };

  const startEditPreset = (preset) => {
    setEditingPreset(preset);
    setEditingFilters({ ...preset.filters });
    setShowEditModal(true);
  };

  const saveEditedPreset = () => {
    if (!editingPreset) return;
    setLoading(true);
    setError('');
    try {
      const updatedPresets = presets.map(p => 
        p._id === editingPreset._id 
          ? { ...p, name: editingPreset.name, filters: editingFilters }
          : p
      );
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      closeModals();
    } catch (err) {
      console.error('Error updating preset:', err);
      setError('Failed to update preset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEditingFilter = (columnId, field, value) => {
    setEditingFilters(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        [field]: value
      }
    }));
  };

  const closeModals = () => {
    setShowSaveModal(false);
    setShowRenameModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setModalInput('');
    setEditingPreset(null);
    setDeletingPreset(null);
    setEditingFilters({});
    setError('');
  };

  return (
    <div className={`wallet-analytics-container chain-${activeChain}`}>
      <div className="info-window-header">
        <div className="header-with-icon">
          <FaFilter className="header-icon" />
          <h3>Filter Presets</h3>
        </div>
        <button onClick={openSaveModal} disabled={loading}>
          <FaSave /> Save Current
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          Loading...
        </div>
      )}

      <div className="presets-list">
        {presets.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No presets saved yet. Save your current filters to get started!</p>
          </div>
        ) : (
          presets.map(preset => (
            <div key={preset._id} className="preset-item">
              <div 
                className="preset-main-box"
              >
                <div className="preset-header">
                  <span className="preset-name">{preset.name}</span>
                  <div className="preset-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => applyPreset(preset)} title="Apply Preset" className="apply-btn">
                      <FaPlay />
                    </button>
                    <button onClick={() => openRenameModal(preset._id, preset.name)} title="Rename">
                      <FaEdit />
                    </button>
                    <button onClick={() => startEditPreset(preset)} title="Edit Values">
                      <FaSlidersH />
                    </button>
                    <button onClick={() => openDeleteModal(preset._id)} title="Delete" className="delete-btn">
                      <FaTrash />
                    </button>
                    <div className="expand-indicator" onClick={(e) => { e.stopPropagation(); toggleExpand(preset._id); }}>
                      {expandedPreset === preset._id ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedPreset === preset._id && (
                <div className="preset-details">
                  <div className="preset-details-header">
                    <strong>Saved Filters:</strong>
                  </div>
                  <div className="filter-summary">
                    {!preset.filters || Object.keys(preset.filters).length === 0 ? (
                      <span className="no-filters">No filters saved</span>
                    ) : (
                      Object.entries(preset.filters).map(([column, filter]) => (
                        <div key={column} className="filter-entry">
                          <span className="filter-column">{column}:</span>
                          <span className="filter-values">
                            {filter && filter.min && `Min: ${filter.min}`}
                            {filter && filter.min && filter.max && ', '}
                            {filter && filter.max && `Max: ${filter.max}`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="preset-meta">
                    <small>Created: {preset.createdAt ? new Date(preset.createdAt).toLocaleDateString() : 'Unknown'}</small>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Save Filter Preset</h4>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Enter preset name..."
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={closeModals}>Cancel</button>
              <button onClick={savePreset} disabled={!modalInput.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Rename Preset</h4>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Enter new name..."
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && renamePreset()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={closeModals}>Cancel</button>
              <button onClick={renamePreset} disabled={!modalInput.trim()}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Delete Preset</h4>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this preset? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeModals}>Cancel</button>
              <button onClick={deletePreset} className="delete-button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Preset Values Modal */}
      {showEditModal && editingPreset && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Edit Preset: {editingPreset.name}</h4>
              <button className="modal-close" onClick={closeModals}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-filters-container">
                {Object.keys(editingFilters).length === 0 ? (
                  <p>No filters to edit in this preset.</p>
                ) : (
                  Object.entries(editingFilters).map(([columnId, filter]) => (
                    <div key={columnId} className="edit-filter-row">
                      <div className="filter-column-name">{columnId}</div>
                      <div className="filter-inputs">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filter.min || ''}
                          onChange={(e) => updateEditingFilter(columnId, 'min', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Max"
                          value={filter.max || ''}
                          onChange={(e) => updateEditingFilter(columnId, 'max', e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModals}>Cancel</button>
              <button onClick={saveEditedPreset} disabled={loading}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletAnalytics;
