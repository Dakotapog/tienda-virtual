// components/ProductList.js - Lista de productos con filtros avanzados integrados
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Removido import innecesario: import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchAdvanced from '../components/SearchAdvanced';

const ProductList = ({ 
  initialProducts = [], 
  showFilters = true, 
  showSearch = true,
  showSorting = true,
  maxProducts = null,
  category = null,
  onProductSelect = null,
  className = '',
  viewMode: initialViewMode = 'grid'
}) => {
  // Estados principales
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!initialProducts.length);
  const [error, setError] = useState(null);
  
  // Estados para filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState({
    searchTerm: '',
    category: category || '',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    inStock: true,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // Estados para filtros básicos (compatibilidad)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  
  // Estados para metadatos
  const [categories, setCategories] = useState([]);
  const [priceRangeInfo, setPriceRangeInfo] = useState({ minPrice: 0, maxPrice: 0 });
  
  // Estados para UI
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [filterMode, setFilterMode] = useState('basic');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Función para cargar productos - optimizada con useCallback
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎨 Cargando productos...');

      const response = await apiService.getProducts();
      
      if (response.success && response.data) {
        setProducts(response.data);
        console.log('✅ Productos cargados:', response.data.length);
      } else {
        throw new Error(response.error || 'Error al cargar productos');
      }

    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias ya que no depende de props o state

  // Función para cargar metadatos - optimizada con useCallback
  const loadMetadata = useCallback(async () => {
    try {
      const [categoriesResponse, priceRangeResponse] = await Promise.all([
        apiService.getCategories().catch(() => ({ success: false })),
        apiService.getPriceRange().catch(() => ({ success: false }))
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (priceRangeResponse.success && priceRangeResponse.data) {
        setPriceRangeInfo(priceRangeResponse.data);
      }

    } catch (error) {
      console.warn('⚠️ Error cargando metadatos:', error);
    }
  }, []); // Sin dependencias ya que no depende de props o state

  // Aplicar filtros básicos - optimizado con useMemo
  const basicFilteredProducts = useMemo(() => {
    let filtered = [...products];

    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      );
    }

    if (selectedCategory && !category) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (priceRange.min && !isNaN(priceRange.min)) {
      filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(priceRange.min));
    }
    if (priceRange.max && !isNaN(priceRange.max)) {
      filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(priceRange.max));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'stock':
          return b.stock - a.stock;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    if (maxProducts && maxProducts > 0) {
      filtered = filtered.slice(0, maxProducts);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, sortBy, category, maxProducts]);

  // Aplicar filtros avanzados - optimizado con useMemo
  const advancedFilteredProducts = useMemo(() => {
    let filtered = [...products];

    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    if (advancedFilters.searchTerm.trim()) {
      const search = advancedFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      );
    }

    if (advancedFilters.category && !category) {
      filtered = filtered.filter(product => product.category === advancedFilters.category);
    }

    if (advancedFilters.priceMin && !isNaN(advancedFilters.priceMin)) {
      filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(advancedFilters.priceMin));
    }
    if (advancedFilters.priceMax && !isNaN(advancedFilters.priceMax)) {
      filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(advancedFilters.priceMax));
    }

    if (advancedFilters.stockMin && !isNaN(advancedFilters.stockMin)) {
      filtered = filtered.filter(product => product.stock >= parseInt(advancedFilters.stockMin));
    }

    if (advancedFilters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    filtered.sort((a, b) => {
      let result = 0;
      
      switch (advancedFilters.sortBy) {
        case 'price':
          result = parseFloat(a.price) - parseFloat(b.price);
          break;
        case 'stock':
          result = a.stock - b.stock;
          break;
        case 'category':
          result = a.category.localeCompare(b.category);
          break;
        case 'name':
        default:
          result = a.name.localeCompare(b.name);
          break;
      }

      return advancedFilters.sortOrder === 'desc' ? -result : result;
    });

    if (maxProducts && maxProducts > 0) {
      filtered = filtered.slice(0, maxProducts);
    }

    return filtered;
  }, [products, advancedFilters, category, maxProducts]);

  // Productos filtrados según el modo actual - optimizado con useMemo
  const filteredProducts = useMemo(() => {
    return filterMode === 'advanced' ? advancedFilteredProducts : basicFilteredProducts;
  }, [filterMode, advancedFilteredProducts, basicFilteredProducts]);

  // Productos paginados - optimizado con useMemo
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Total de páginas - optimizado con useMemo
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts.length, itemsPerPage]);

  // Manejar cambios en filtros avanzados - optimizado con useCallback
  const handleAdvancedFiltersChange = useCallback((newFilters) => {
    setAdvancedFilters(newFilters);
    setCurrentPage(1); // Reset pagination
    
    // Sincronizar con filtros básicos para mantener compatibilidad
    setSearchTerm(newFilters.searchTerm);
    setSelectedCategory(newFilters.category);
    setPriceRange({ 
      min: newFilters.priceMin, 
      max: newFilters.priceMax 
    });
    
    // Convertir sortBy avanzado a formato básico
    let basicSortBy = 'name';
    if (newFilters.sortBy === 'price') {
      basicSortBy = newFilters.sortOrder === 'desc' ? 'price-desc' : 'price-asc';
    } else if (newFilters.sortBy === 'stock') {
      basicSortBy = 'stock';
    }
    setSortBy(basicSortBy);
  }, []);

  // Cambiar modo de filtros - optimizado con useCallback
  const switchFilterMode = useCallback((mode) => {
    setFilterMode(mode);
    setCurrentPage(1); // Reset pagination
    
    if (mode === 'advanced') {
      // Sincronizar filtros básicos hacia avanzados
      setAdvancedFilters(prev => ({
        ...prev,
        searchTerm: searchTerm,
        category: selectedCategory,
        priceMin: priceRange.min,
        priceMax: priceRange.max,
        sortBy: sortBy.includes('price') ? 'price' : 
               sortBy === 'stock' ? 'stock' : 'name',
        sortOrder: sortBy === 'price-desc' ? 'desc' : 'asc'
      }));
    }
    
    setShowFiltersPanel(false);
    setShowAdvancedSearch(false);
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  // Limpiar filtros - optimizado con useCallback
  const clearFilters = useCallback(() => {
    setCurrentPage(1); // Reset pagination
    
    if (filterMode === 'advanced') {
      setAdvancedFilters({
        searchTerm: '',
        category: category || '',
        priceMin: '',
        priceMax: '',
        stockMin: '',
        inStock: true,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    } else {
      setSearchTerm('');
      if (!category) {
        setSelectedCategory('');
      }
      setPriceRange({ min: '', max: '' });
      setSortBy('name');
    }
  }, [filterMode, category]);

  // Contar filtros activos - optimizado con useCallback
  const getActiveFiltersCount = useCallback(() => {
    if (filterMode === 'advanced') {
      let count = 0;
      if (advancedFilters.searchTerm) count++;
      if (advancedFilters.category && advancedFilters.category !== category) count++;
      if (advancedFilters.priceMin || advancedFilters.priceMax) count++;
      if (advancedFilters.stockMin) count++;
      if (!advancedFilters.inStock) count++;
      if (advancedFilters.sortBy !== 'name' || advancedFilters.sortOrder !== 'asc') count++;
      return count;
    } else {
      let count = 0;
      if (searchTerm) count++;
      if (selectedCategory && selectedCategory !== category) count++;
      if (priceRange.min || priceRange.max) count++;
      if (sortBy !== 'name') count++;
      return count;
    }
  }, [filterMode, advancedFilters, searchTerm, selectedCategory, priceRange, sortBy, category]);

  // Manejar selección de producto - optimizado con useCallback
  const handleProductSelect = useCallback((product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  }, [onProductSelect]);

  // Manejar cambio de página - optimizado con useCallback
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Effect para cargar datos iniciales - con dependencias correctas
  useEffect(() => {
    if (!initialProducts.length) {
      loadProducts();
    }
    if (showFilters) {
      loadMetadata();
    }
  }, [initialProducts.length, showFilters, loadProducts, loadMetadata]);

  // Effect para resetear paginación cuando cambian los filtros básicos
  useEffect(() => {
    if (filterMode === 'basic') {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedCategory, priceRange, sortBy, filterMode]);

  // Effect para manejar cambios en la categoría prop
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
      setAdvancedFilters(prev => ({ ...prev, category }));
    }
  }, [category]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`product-list ${className}`}>
      
      {/* Barra de controles superior */}
      <div className="product-list-header">
        
        {/* Información de resultados */}
        <div className="results-info">
          {loading ? (
            <span>Cargando productos...</span>
          ) : (
            <span>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              {products.length !== filteredProducts.length && (
                <span className="filter-count"> de {products.length}</span>
              )}
              <span className="filter-mode-indicator">
                ({filterMode === 'advanced' ? 'Avanzado' : 'Básico'})
              </span>
            </span>
          )}
        </div>

        {/* Controles de vista y filtros */}
        <div className="header-controls">
          
          {/* Búsqueda rápida (solo en modo básico) */}
          {showSearch && filterMode === 'basic' && (
            <div className="quick-search">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="clear-search-btn"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Selector de modo de filtros */}
          {showFilters && (
            <div className="filter-mode-switcher">
              <button
                onClick={() => switchFilterMode('basic')}
                className={`btn ${filterMode === 'basic' ? 'btn-primary' : 'btn-outline'}`}
                title="Filtros básicos"
              >
                🔍 Básico
              </button>
              <button
                onClick={() => switchFilterMode('advanced')}
                className={`btn ${filterMode === 'advanced' ? 'btn-primary' : 'btn-outline'}`}
                title="Filtros avanzados"
              >
                🎛️ Avanzado
              </button>
            </div>
          )}

          {/* Botón de filtros básicos */}
          {showFilters && filterMode === 'basic' && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`btn ${showFiltersPanel ? 'btn-primary' : 'btn-outline'}`}
            >
              🔍 Filtros
              {activeFiltersCount > 0 && (
                <span className="filter-indicator">{activeFiltersCount}</span>
              )}
            </button>
          )}

          {/* Botón de búsqueda avanzada */}
          {showFilters && filterMode === 'advanced' && (
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`btn ${showAdvancedSearch ? 'btn-primary' : 'btn-outline'}`}
            >
              🎛️ Búsqueda Avanzada
              {activeFiltersCount > 0 && (
                <span className="filter-indicator">{activeFiltersCount}</span>
              )}
            </button>
          )}

          {/* Control de vista */}
          <div className="view-mode-switcher">
            <button
              onClick={() => setViewMode('grid')}
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              title="Vista de cuadrícula"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>

          {/* Ordenamiento básico (solo en modo básico) */}
          {showSorting && filterMode === 'basic' && (
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="sort-select"
            >
              <option value="name">Nombre A-Z</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
              <option value="stock">Stock</option>
            </select>
          )}
        </div>
      </div>

      {/* Panel de filtros básicos expandible */}
      {showFilters && showFiltersPanel && filterMode === 'basic' && (
        <div className="filters-panel">
          <div className="filters-grid">
            
            {/* Categoría (solo si no hay categoría fija) */}
            {!category && (
              <div className="filter-group">
                <label>🏷️ Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.product_count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rango de precios */}
            <div className="filter-group">
              <label>💰 Precio</label>
              <div className="price-range-inputs">
                <input
                  type="number"
                  placeholder={`Min: $${priceRangeInfo.minPrice || 0}`}
                  value={priceRange.min}
                  onChange={(e) => {
                    setPriceRange(prev => ({ ...prev, min: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder={`Max: $${priceRangeInfo.maxPrice || 999999}`}
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange(prev => ({ ...prev, max: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="price-input"
                />
              </div>
            </div>

            {/* Botón limpiar filtros */}
            <div className="filter-group">
              <button
                onClick={clearFilters}
                className="btn btn-outline clear-filters-btn"
              >
                🗑️ Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de búsqueda avanzada */}
      {showFilters && filterMode === 'advanced' && (
        <div className="advanced-search-container">
          {showAdvancedSearch ? (
            <SearchAdvanced
              onFiltersChange={handleAdvancedFiltersChange}
              initialFilters={advancedFilters}
              availableCategories={categories}
              priceRange={priceRangeInfo}
              onClose={() => setShowAdvancedSearch(false)}
              className="integrated-search"
            />
          ) : (
            <div className="advanced-search-summary">
              <div className="summary-content">
                <span className="summary-title">
                  🎛️ Filtros Avanzados Activos: {activeFiltersCount}
                </span>
                {activeFiltersCount > 0 && (
                  <div className="active-filters-preview">
                    {advancedFilters.searchTerm && (
                      <span className="filter-tag">"{advancedFilters.searchTerm}"</span>
                    )}
                    {advancedFilters.category && advancedFilters.category !== category && (
                      <span className="filter-tag">{advancedFilters.category}</span>
                    )}
                    {(advancedFilters.priceMin || advancedFilters.priceMax) && (
                      <span className="filter-tag">
                        ${advancedFilters.priceMin || '0'} - ${advancedFilters.priceMax || '∞'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="btn btn-outline btn-sm"
              >
                ⚙️ Configurar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estados de carga y error */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando productos...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <strong>❌ Error:</strong> {error}
          <button 
            onClick={loadProducts}
            className="btn btn-outline btn-sm"
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Lista de productos */}
      {!loading && !error && (
        <>
          {filteredProducts.length > 0 ? (
            <>
              <div className={`products-grid ${viewMode}`}>
                {paginatedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    onSelect={() => handleProductSelect(product)}
                    showFullDescription={viewMode === 'list'}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn btn-outline pagination-btn"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="pagination-info">
                      <span>
                        Página {currentPage} de {totalPages}
                      </span>
                      <span className="pagination-details">
                        ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length})
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn btn-outline pagination-btn"
                    >
                      Siguiente →
                    </button>
                  </div>

                  {/* Números de página */}
                  {totalPages <= 10 && (
                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`btn btn-sm pagination-number ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No se encontraron productos</h3>
              <p>
                {activeFiltersCount > 0
                  ? 'No hay productos que coincidan con los filtros aplicados.'
                  : 'No hay productos disponibles en este momento.'
                }
              </p>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
                  🗑️ Limpiar Filtros
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Estilos del componente */}
      <style jsx>{`
        .product-list {
          width: 100%;
        }

        .product-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .results-info {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }

        .filter-count {
          color: #999;
        }

        .filter-mode-indicator {
          color: #007bff;
          font-size: 12px;
          font-weight: normal;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .filter-mode-switcher {
          display: flex;
          gap: 5px;
        }

        .filter-mode-switcher .btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .quick-search {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding: 8px 35px 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          width: 200px;
          transition: border-color 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .clear-search-btn {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          font-size: 12px;
        }

        .clear-search-btn:hover {
          background: #f0f0f0;
          color: #666;
        }

        .btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
          position: relative;
        }

        .btn:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .btn-primary:hover {
          background: #0056b3;
          border-color: #0056b3;
        }

        .btn-outline {
          border-color: #007bff;
          color: #007bff;
        }

        .btn-outline:hover {
          background: #007bff;
          color: white;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .filter-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          min-width: 16px;
          height: 16px;
          display: flex;

        .filter-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }

        .view-mode-switcher {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }

        .btn-icon {
          padding: 8px 12px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
          border-right: 1px solid #ddd;
        }

        .btn-icon:last-child {
          border-right: none;
        }

        .btn-icon:hover {
          background: #f8f9fa;
        }

        .btn-icon.active {
          background: #007bff;
          color: white;
        }

        .sort-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .sort-select:focus {
          outline: none;
          border-color: #007bff;
        }

        .filters-panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .filter-select:focus {
          outline: none;
          border-color: #007bff;
        }

        .price-range-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .price-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .price-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .clear-filters-btn {
          white-space: nowrap;
        }

         /* Estilos para búsqueda avanzada integrada */
        .advanced-search-container {
          margin-bottom: 20px;
        }

        .integrated-search {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #fafafa;
        }

        .advanced-search-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .summary-content {
          flex: 1;
        }

        .summary-title {
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 8px;
        }

        .active-filters-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .filter-tag {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .alert {
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .alert-error {
          background: #ffeaea;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
        }

        .products-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
        }

        .products-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .products-grid.list {
          grid-template-columns: 1fr;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
          font-weight: 600;
        }

        .empty-state p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 25px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .product-list-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-controls {
            justify-content: space-between;
            width: 100%;
          }

          .search-input {
            width: 100%;
            min-width: 200px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .price-range-inputs {
            flex-direction: column;
            align-items: stretch;
          }

          .advanced-search-summary {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .active-filters-preview {
            justify-content: center;
          }

          .view-mode-switcher {
            order: -1;
            align-self: center;
          }
        }

        @media (max-width: 480px) {
          .filter-mode-switcher {
            width: 100%;
            justify-content: center;
          }

          .filter-mode-switcher .btn {
            flex: 1;
          }

          .header-controls {
            flex-direction: column;
            gap: 10px;
          }

          .quick-search {
            width: 100%;
          }

          .products-grid.grid {
            grid-template-columns: 1fr;
          }
        }

        /* Animaciones suaves */
        .filters-panel {
          animation: slideDown 0.3s ease-out;
        }

        .advanced-search-container {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-tag {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Estados de hover mejorados */
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .btn:active {
          transform: translateY(0);
        }

        .filter-tag:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Estilos adicionales para accesibilidad */
        .btn:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        .search-input:focus,
        .filter-select:focus,
        .price-input:focus,
        .sort-select:focus {
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        /* Estados de disabled */
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

// ¡AQUÍ ESTÁ LA EXPORTACIÓN QUE FALTABA!
export default ProductList;