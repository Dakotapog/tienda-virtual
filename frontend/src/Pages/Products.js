// pages/Products.js - Catálogo completo integrado con ProductList centralizado
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductList from '../components/ProductList';
import apiService from '../services/api';

const Products = () => {
  const { user } = useAuth();
  
  // Estados para datos globales de la página
  const [globalStats, setGlobalStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para configuración del ProductList
  const [productListKey, setProductListKey] = useState(0); // Para forzar re-render
  const [showWelcome, setShowWelcome] = useState(true);

  // Cargar estadísticas globales al montar el componente
  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Cargando estadísticas globales del catálogo...');

      // Cargar estadísticas en paralelo
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);

      let stats = {
        totalProducts: 0,
        totalCategories: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };

      // Procesar productos
      if (productsResponse.success && productsResponse.data) {
        const products = productsResponse.data;
        stats.totalProducts = products.length;
        stats.lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
        stats.outOfStockCount = products.filter(p => p.stock === 0).length;
        console.log('✅ Productos procesados:', stats.totalProducts);
      }

      // Procesar categorías
      if (categoriesResponse.success && categoriesResponse.data) {
        stats.totalCategories = categoriesResponse.data.length;
        console.log('✅ Categorías procesadas:', stats.totalCategories);
      }

      setGlobalStats(stats);
      console.log('📊 Estadísticas globales cargadas:', stats);

    } catch (error) {
      console.error('❌ Error cargando estadísticas globales:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar actualización/recarga del ProductList
  const handleRefreshProducts = () => {
    setProductListKey(prev => prev + 1);
    loadGlobalStats();
  };

  // Manejar selección de producto (para futuras integraciones)
  const handleProductSelect = (product) => {
    console.log('🎨 Producto seleccionado:', product);
    // TODO: Implementar navegación a detalles del producto
    // o mostrar modal de detalles
  };

  return (
    <div className="products-page">
      <div className="container">
        
        {/* Header principal de la página */}
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">🎨 Catálogo de Productos</h1>
            <p className="page-subtitle">
              Explora nuestra colección completa de pinturas y materiales de arte
            </p>
          </div>
          
          {/* Acciones globales */}
          <div className="page-actions">
            <button
              onClick={() => setShowWelcome(!showWelcome)}
              className={`btn ${showWelcome ? 'btn-primary' : 'btn-outline'}`}
              title={showWelcome ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
            >
              📊 {showWelcome ? 'Ocultar' : 'Mostrar'} Stats
            </button>
            
            <button
              onClick={handleRefreshProducts}
              className="btn btn-outline"
              disabled={loading}
              title="Actualizar catálogo"
            >
              {loading ? '🔄' : '↻'} Actualizar
            </button>
          </div>
        </div>

        {/* Panel de bienvenida y estadísticas */}
        {showWelcome && (
          <div className="welcome-panel">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>¡Bienvenido al catálogo! 🎭</h2>
                <p>
                  Descubre una amplia variedad de productos de arte y pintura. 
                  Utiliza los filtros avanzados para encontrar exactamente lo que necesitas.
                </p>
              </div>
              
              {/* Estadísticas globales */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{globalStats.totalProducts}</div>
                  <div className="stat-label">🎨 Productos</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{globalStats.totalCategories}</div>
                  <div className="stat-label">🏷️ Categorías</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{globalStats.lowStockCount}</div>
                  <div className="stat-label">⚠️ Stock Bajo</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-number">{globalStats.outOfStockCount}</div>
                  <div className="stat-label">❌ Agotados</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowWelcome(false)}
              className="welcome-close-btn"
              title="Cerrar panel de bienvenida"
            >
              ✕
            </button>
          </div>
        )}

        {/* Estado de error global */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <strong>❌ Error al cargar estadísticas:</strong>
              <span>{error}</span>
            </div>
            <button 
              onClick={loadGlobalStats}
              className="btn btn-outline btn-sm"
            >
              🔄 Reintentar
            </button>
          </div>
        )}

        {/* Componente ProductList integrado */}
        <div className="product-list-container">
          <ProductList
            key={productListKey}
            showFilters={true}
            showSearch={true}
            showSorting={true}
            maxProducts={null}
            category={null}
            onProductSelect={handleProductSelect}
            className="main-product-list"
            viewMode="grid"
          />
        </div>

        {/* Información adicional o tips */}
        <div className="page-footer">
          <div className="tips-section">
            <h3>💡 Consejos para buscar productos</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">🔍</div>
                <div className="tip-content">
                  <h4>Búsqueda Avanzada</h4>
                  <p>Utiliza los filtros avanzados para búsquedas más precisas por precio, stock y categoría.</p>
                </div>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">🏷️</div>
                <div className="tip-content">
                  <h4>Filtrar por Categoría</h4>
                  <p>Navega por categorías específicas para encontrar productos relacionados más fácilmente.</p>
                </div>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">💰</div>
                <div className="tip-content">
                  <h4>Rango de Precios</h4>
                  <p>Establece un rango de precios para ajustar tu búsqueda a tu presupuesto.</p>
                </div>
              </div>
              
              <div className="tip-card">
                <div className="tip-icon">📊</div>
                <div className="tip-content">
                  <h4>Ordenar Resultados</h4>
                  <p>Ordena por nombre, precio o disponibilidad para encontrar lo que buscas más rápido.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos específicos de la página Products */}
      <style jsx>{`
        .products-page {
          min-height: 100vh;
          padding: 20px 0 40px 0;
          background: #f8f9fa;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .page-title-section {
          flex: 1;
        }

        .page-title {
          font-size: 42px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .page-subtitle {
          font-size: 18px;
          color: #7f8c8d;
          margin: 0;
          font-weight: 400;
        }

        .page-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn {
          padding: 10px 20px;
          border: 2px solid transparent;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-color: #2980b9;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2980b9, #1f618d);
        }

        .btn-outline {
          border-color: #3498db;
          color: #3498db;
        }

        .btn-outline:hover {
          background: #3498db;
          color: white;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
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

        .welcome-panel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          color: white;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .welcome-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-text {
          margin-bottom: 25px;
        }

        .welcome-text h2 {
          font-size: 28px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .welcome-text p {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.6;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.2);
        }

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #fff;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .welcome-close-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          z-index: 2;
        }

        .welcome-close-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .alert {
          background: #ffeaea;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        }

        .alert-error {
          background: linear-gradient(135deg, #ffebee, #ffeaea);
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .product-list-container {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 40px;
        }

        /* Estilos para el ProductList integrado */
        .main-product-list {
          /* Hereda estilos del ProductList */
        }

        .page-footer {
          margin-top: 50px;
        }

        .tips-section {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .tips-section h3 {
          color: #2c3e50;
          margin-bottom: 25px;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .tip-card {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }

        .tip-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border-color: #3498db;
        }

        .tip-icon {
          font-size: 24px;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .tip-content h4 {
          color: #2c3e50;
          margin-bottom: 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .tip-content p {
          color: #7f8c8d;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .page-actions {
            justify-content: center;
            margin-top: 15px;
          }

          .page-title {
            font-size: 32px;
          }

          .page-subtitle {
            font-size: 16px;
          }

          .welcome-panel {
            padding: 20px;
          }

          .welcome-text h2 {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .stat-number {
            font-size: 28px;
          }

          .product-list-container {
            padding: 15px;
          }

          .tips-grid {
            grid-template-columns: 1fr;
          }

          .tip-card {
            padding: 15px;
          }

          .container {
            padding: 0 15px;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 28px;
          }

          .btn {
            padding: 8px 16px;
            font-size: 13px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 15px;
          }

          .tip-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }

          .alert {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
        }

        /* Animaciones */
        .welcome-panel {
          animation: slideInDown 0.6s ease-out;
        }

        .stat-card {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        .tip-card {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .tip-card:nth-child(1) { animation-delay: 0.1s; }
        .tip-card:nth-child(2) { animation-delay: 0.2s; }
        .tip-card:nth-child(3) { animation-delay: 0.3s; }
        .tip-card:nth-child(4) { animation-delay: 0.4s; }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Efectos de hover mejorados */
        .btn {
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        /* Estados de focus para accesibilidad */
        .btn:focus,
        .welcome-close-btn:focus {
          outline: 2px solid #3498db;
          outline-offset: 2px;
        }

        /* Mejoras visuales adicionales */
        .product-list-container {
          position: relative;
          overflow: hidden;
        }

        .product-list-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #3498db, transparent);
        }

        /* Indicadores de carga mejorados */
        .btn:disabled {
          position: relative;
        }

        .btn:disabled::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          margin: auto;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Products;