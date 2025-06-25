// components/SearchBar.js - Búsqueda básica integrada en Header
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiService.getProducts();
        setAllProducts(response.data || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
        setAllProducts([]);
      }
    };
    
    loadProducts();
  }, []);

  // Búsqueda en tiempo real
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    // Debounce para evitar búsquedas excesivas
    const timeoutId = setTimeout(() => {
      const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filteredProducts.slice(0, 8)); // Máximo 8 resultados
      setShowResults(true);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allProducts]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current && 
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar selección de producto
  const handleProductSelect = (product) => {
    setSearchTerm('');
    setShowResults(false);
    navigate(`/products?highlight=${product.id}`);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Limpiar búsqueda
  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          
          {/* Icono de búsqueda */}
          <div className="search-icon">
            🔍
          </div>
          
          {/* Campo de búsqueda */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar pinturas, colores, marcas..."
            className="search-input"
            autoComplete="off"
          />
          
          {/* Botón limpiar (solo si hay texto) */}
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
          
          {/* Indicador de carga */}
          {isLoading && (
            <div className="loading-indicator">
              🔄
            </div>
          )}
        </div>
        
        {/* Botón de búsqueda (oculto, se activa con Enter) */}
        <button type="submit" style={{ display: 'none' }}>
          Buscar
        </button>
      </form>

      {/* Resultados desplegables */}
      {showResults && searchResults.length > 0 && (
        <div className="search-results" ref={resultsRef}>
          <div className="results-header">
            <span>Resultados ({searchResults.length})</span>
            {searchResults.length === 8 && (
              <span className="see-all">Ver todos →</span>
            )}
          </div>
          
          <div className="results-list">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="result-item"
                onClick={() => handleProductSelect(product)}
              >
                <div className="result-info">
                  <div className="result-name">
                    {product.name}
                  </div>
                  <div className="result-category">
                    {product.category}
                  </div>
                </div>
                <div className="result-price">
                  ${product.price}
                </div>
              </div>
            ))}
          </div>
          
          {/* Opción para ver todos los resultados */}
          <div className="results-footer">
            <button
              onClick={() => {
                setShowResults(false);
                navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
              }}
              className="view-all-button"
            >
              Ver todos los resultados →
            </button>
          </div>
        </div>
      )}

      {/* Mensaje de no resultados */}
      {showResults && searchResults.length === 0 && !isLoading && searchTerm.trim() && (
        <div className="search-results" ref={resultsRef}>
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-text">
              No se encontraron productos para "{searchTerm}"
            </div>
            <div className="no-results-suggestion">
              Intenta con otros términos de búsqueda
            </div>
          </div>
        </div>
      )}

      {/* Estilos del SearchBar */}
      <style jsx>{`
        .search-container {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .search-form {
          width: 100%;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 25px;
          padding: 0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-input-container:focus-within {
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .search-icon {
          padding: 12px 15px;
          color: #666;
          font-size: 16px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 8px;
          font-size: 14px;
          color: #333;
          outline: none;
        }

        .search-input::placeholder {
          color: #999;
        }

        .clear-button {
          background: none;
          border: none;
          color: #999;
          font-size: 16px;
          padding: 8px;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .clear-button:hover {
          background-color: rgba(0, 0, 0, 0.1);
          color: #666;
        }

        .loading-indicator {
          padding: 12px 15px;
          color: #666;
          font-size: 14px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin-top: 8px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
          font-weight: 600;
          color: #666;
        }

        .see-all {
          color: #667eea;
          cursor: pointer;
        }

        .results-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f0f0f0;
        }

        .result-item:hover {
          background-color: #f8f9fa;
        }

        .result-item:last-child {
          border-bottom: none;
        }

        .result-info {
          flex: 1;
        }

        .result-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }

        .result-category {
          font-size: 12px;
          color: #666;
        }

        .result-price {
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
        }

        .results-footer {
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }

        .view-all-button {
          width: 100%;
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          padding: 8px;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .view-all-button:hover {
          background-color: rgba(102, 126, 234, 0.1);
        }

        .no-results {
          padding: 24px 16px;
          text-align: center;
        }

        .no-results-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .no-results-text {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .no-results-suggestion {
          font-size: 12px;
          color: #666;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .search-container {
            max-width: 100%;
          }
          
          .search-input {
            font-size: 16px; /* Evita zoom en iOS */
          }
          
          .search-input::placeholder {
            font-size: 14px;
          }
          
          .results-list {
            max-height: 250px;
          }
        }

        @media (max-width: 480px) {
          .search-input::placeholder {
            content: "Buscar...";
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;