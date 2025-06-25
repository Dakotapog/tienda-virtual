// components/SearchAdvanced.js - Búsqueda avanzada y filtros para productos
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const SearchAdvanced = ({
  onFiltersChange,
  initialFilters = {},
  showInModal = false,
  onClose = null,
  availableCategories = [],
  priceRange = { min: 0, max: 1000000 },
  className = ''
}) => {
  // Estados para los filtros
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    inStock: true,
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters
  });

  // Estados para metadatos
  const [categories, setCategories] = useState(availableCategories);
  const [loading, setLoading] = useState(false);
  const [priceRangeInfo, setPriceRangeInfo] = useState(priceRange);

  // Estados de UI
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    category: true,
    price: true,
    stock: false,
    sort: false
  });

  // Cargar metadatos al montar el componente
  useEffect(() => {
    if (!availableCategories.length) {
      loadCategories();
    }
    if (priceRange.min === 0 && priceRange.max === 1000000) {
      loadPriceRange();
    }
  }, []);

  // Notificar cambios de filtros al componente padre
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando categorías:', error);
    }
  };

  const loadPriceRange = async () => {
    try {
      const response = await apiService.getPriceRange();
      if (response.success && response.data) {
        setPriceRangeInfo(response.data);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando rango de precios:', error);
    }
  };

  // Actualizar un filtro específico
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      category: '',
      priceMin: '',
      priceMax: '',
      stockMin: '',
      inStock: true,
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
  };

  // Aplicar filtros predefinidos rápidos
  const applyQuickFilter = (filterType) => {
    const quickFilters = {
      'price-low': { priceMax: '50000', sortBy: 'price', sortOrder: 'asc' },
      'price-high': { priceMin: '100000', sortBy: 'price', sortOrder: 'desc' },
      'new-arrivals': { sortBy: 'name', sortOrder: 'desc' },
      'bestsellers': { sortBy: 'stock', sortOrder: 'desc' },
      'in-stock': { inStock: true, stockMin: '1' }
    };

    if (quickFilters[filterType]) {
      setFilters(prev => ({
        ...prev,
        ...quickFilters[filterType]
      }));
    }
  };

  // Alternar sección expandida
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.stockMin) count++;
    if (!filters.inStock) count++;
    if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Contenido del componente
  const SearchContent = () => (
    <div className={`search-advanced ${className}`}>
      
      {/* Encabezado */}
      <div className="search-header">
        <div className="search-title">
          <h3>🔍 Búsqueda Avanzada</h3>
          {activeFiltersCount > 0 && (
            <span className="filters-badge">{activeFiltersCount}</span>
          )}
        </div>
        
        {showInModal && onClose && (
          <button 
            onClick={onClose}
            className="close-btn"
            title="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="quick-filters">
        <h4>⚡ Filtros Rápidos</h4>
        <div className="quick-filters-grid">
          <button 
            onClick={() => applyQuickFilter('price-low')}
            className="quick-filter-btn"
          >
            💰 Económicos
          </button>
          <button 
            onClick={() => applyQuickFilter('price-high')}
            className="quick-filter-btn"
          >
            💎 Premium
          </button>
          <button 
            onClick={() => applyQuickFilter('new-arrivals')}
            className="quick-filter-btn"
          >
            🆕 Nuevos
          </button>
          <button 
            onClick={() => applyQuickFilter('bestsellers')}
            className="quick-filter-btn"
          >
            🔥 Populares
          </button>
          <button 
            onClick={() => applyQuickFilter('in-stock')}
            className="quick-filter-btn"
          >
            ✅ Disponibles
          </button>
        </div>
      </div>

      {/* Sección: Búsqueda por texto */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('search')}
        >
          <span>🔤 Búsqueda por Texto</span>
          <span className={`toggle-icon ${expandedSections.search ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.search && (
          <div className="section-content">
            <div className="form-group">
              <label>Buscar en nombre y descripción</label>
              <input
                type="text"
                placeholder="Ej: pintura blanca, brocha, rodillo..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="form-input"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => updateFilter('searchTerm', '')}
                  className="clear-input-btn"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sección: Categoría */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('category')}
        >
          <span>🏷️ Categoría</span>
          <span className={`toggle-icon ${expandedSections.category ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.category && (
          <div className="section-content">
            <div className="form-group">
              <label>Seleccionar categoría</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="form-select"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} 
                    {cat.product_count && ` (${cat.product_count})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sección: Rango de Precios */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('price')}
        >
          <span>💰 Rango de Precios</span>
          <span className={`toggle-icon ${expandedSections.price ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.price && (
          <div className="section-content">
            <div className="price-range-group">
              <div className="form-group">
                <label>Precio mínimo</label>
                <input
                  type="number"
                  placeholder={`Min: $${priceRangeInfo.minPrice || 0}`}
                  value={filters.priceMin}
                  onChange={(e) => updateFilter('priceMin', e.target.value)}
                  className="form-input price-input"
                  min="0"
                />
              </div>
              <div className="price-separator">-</div>
              <div className="form-group">
                <label>Precio máximo</label>
                <input
                  type="number"
                  placeholder={`Max: $${priceRangeInfo.maxPrice || 999999}`}
                  value={filters.priceMax}
                  onChange={(e) => updateFilter('priceMax', e.target.value)}
                  className="form-input price-input"
                  min="0"
                />
              </div>
            </div>
            
            {/* Rangos predefinidos */}
            <div className="price-presets">
              <button 
                onClick={() => {
                  updateFilter('priceMin', '0');
                  updateFilter('priceMax', '25000');
                }}
                className="preset-btn"
              >
                $0 - $25.000
              </button>
              <button 
                onClick={() => {
                  updateFilter('priceMin', '25000');
                  updateFilter('priceMax', '50000');
                }}
                className="preset-btn"
              >
                $25.000 - $50.000
              </button>
              <button 
                onClick={() => {
                  updateFilter('priceMin', '50000');
                  updateFilter('priceMax', '100000');
                }}
                className="preset-btn"
              >
                $50.000 - $100.000
              </button>
              <button 
                onClick={() => {
                  updateFilter('priceMin', '100000');
                  updateFilter('priceMax', '');
                }}
                className="preset-btn"
              >
                $100.000+
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección: Stock y Disponibilidad */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('stock')}
        >
          <span>📦 Stock y Disponibilidad</span>
          <span className={`toggle-icon ${expandedSections.stock ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.stock && (
          <div className="section-content">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="checkbox-text">Solo productos disponibles</span>
              </label>
            </div>
            
            <div className="form-group">
              <label>Stock mínimo</label>
              <input
                type="number"
                placeholder="Cantidad mínima en stock"
                value={filters.stockMin}
                onChange={(e) => updateFilter('stockMin', e.target.value)}
                className="form-input"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sección: Ordenamiento */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('sort')}
        >
          <span>🔄 Ordenamiento</span>
          <span className={`toggle-icon ${expandedSections.sort ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
        
        {expandedSections.sort && (
          <div className="section-content">
            <div className="sort-group">
              <div className="form-group">
                <label>Ordenar por</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="form-select"
                >
                  <option value="name">Nombre</option>
                  <option value="price">Precio</option>
                  <option value="stock">Stock</option>
                  <option value="category">Categoría</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Orden</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter('sortOrder', e.target.value)}
                  className="form-select"
                >
                  <option value="asc">Ascendente (A-Z, 0-9)</option>
                  <option value="desc">Descendente (Z-A, 9-0)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button
          onClick={clearAllFilters}
          className="btn btn-outline clear-btn"
          disabled={activeFiltersCount === 0}
        >
          🗑️ Limpiar Todo
        </button>
        
        {showInModal && (
          <button
            onClick={onClose}
            className="btn btn-primary apply-btn"
          >
            ✅ Aplicar Filtros
          </button>
        )}
      </div>

      {/* Resumen de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="active-filters-summary">
          <h4>📋 Filtros Activos ({activeFiltersCount})</h4>
          <div className="active-filters-list">
            {filters.searchTerm && (
              <span className="filter-tag">
                Búsqueda: "{filters.searchTerm}"
                <button onClick={() => updateFilter('searchTerm', '')}>✕</button>
              </span>
            )}
            {filters.category && (
              <span className="filter-tag">
                Categoría: {filters.category}
                <button onClick={() => updateFilter('category', '')}>✕</button>
              </span>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <span className="filter-tag">
                Precio: ${filters.priceMin || '0'} - ${filters.priceMax || '∞'}
                <button onClick={() => {
                  updateFilter('priceMin', '');
                  updateFilter('priceMax', '');
                }}>✕</button>
              </span>
            )}
            {filters.stockMin && (
              <span className="filter-tag">
                Stock mín: {filters.stockMin}
                <button onClick={() => updateFilter('stockMin', '')}>✕</button>
              </span>
            )}
            {!filters.inStock && (
              <span className="filter-tag">
                Incluir sin stock
                <button onClick={() => updateFilter('inStock', true)}>✕</button>
              </span>
            )}
            {(filters.sortBy !== 'name' || filters.sortOrder !== 'asc') && (
              <span className="filter-tag">
                Orden: {filters.sortBy} ({filters.sortOrder})
                <button onClick={() => {
                  updateFilter('sortBy', 'name');
                  updateFilter('sortOrder', 'asc');
                }}>✕</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar según el modo (modal o integrado)
  if (showInModal) {
    return (
      <div className="search-modal-overlay">
        <div className="search-modal">
          <SearchContent />
        </div>
      </div>
    );
  }

  return <SearchContent />;
};

// Estilos del componente
const styles = `
  .search-advanced {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-width: 100%;
  }

  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
  }

  .search-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-title h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
  }

  .filters-badge {
    background: #007bff;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.3s;
  }

  .close-btn:hover {
    background: #f0f0f0;
    color: #666;
  }

  .quick-filters {
    margin-bottom: 25px;
  }

  .quick-filters h4 {
    margin: 0 0 10px 0;
    color: #555;
    font-size: 14px;
  }

  .quick-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .quick-filter-btn {
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
    text-align: center;
  }

  .quick-filter-btn:hover {
    background: #f8f9fa;
    border-color: #007bff;
    transform: translateY(-1px);
  }

  .filter-section {
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    padding: 12px 15px;
    background: #f8f9fa;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    color: #333;
    transition: background 0.3s;
  }

  .section-header:hover {
    background: #e9ecef;
  }

  .toggle-icon {
    transition: transform 0.3s;
    font-size: 12px;
  }

  .toggle-icon.expanded {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 15px;
    background: white;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
    font-size: 13px;
  }

  .form-input, .form-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s;
  }

  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
  }

  .clear-input-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 4px;
    border-radius: 3px;
  }

  .clear-input-btn:hover {
    background: #f0f0f0;
    color: #666;
  }

  .price-range-group {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: end;
  }

  .price-separator {
    font-weight: bold;
    color: #666;
    padding-bottom: 8px;
  }

  .price-input {
    min-width: 0;
  }

  .price-presets {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-top: 10px;
  }

  .preset-btn {
    padding: 6px 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.3s;
  }

  .preset-btn:hover {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    margin-bottom: 0 !important;
  }

  .form-checkbox {
    width: auto !important;
    margin: 0;
  }

  .checkbox-text {
    font-size: 14px;
    color: #333;
  }

  .sort-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid;
    flex: 1;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-outline {
    background: white;
    color: #6c757d;
    border-color: #6c757d;
  }

  .btn-outline:hover:not(:disabled) {
    background: #6c757d;
    color: white;
  }

  .btn-primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
    border-color: #0056b3;
  }

  .active-filters-summary {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }

  .active-filters-summary h4 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 14px;
  }

  .active-filters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 15px;
    font-size: 12px;
  }

  .filter-tag button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
    font-size: 10px;
  }

  .filter-tag button:hover {
    background: rgba(255,255,255,0.2);
  }

  .search-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .search-modal {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    width: 100%;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .quick-filters-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .price-range-group {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .price-separator {
      text-align: center;
      padding: 0;
    }

    .price-presets {
      grid-template-columns: 1fr;
    }

    .sort-group {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }

    .active-filters-list {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .search-advanced {
      padding: 15px;
    }

    .quick-filters-grid {
      grid-template-columns: 1fr;
    }

    .search-modal {
      margin: 10px;
      max-height: calc(100vh - 20px);
    }
  }
`;

// Agregar estilos al DOM
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default SearchAdvanced;