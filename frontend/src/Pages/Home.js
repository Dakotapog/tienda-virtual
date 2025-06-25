// pages/Home.js - Página principal con productos destacados
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import ProductList from '../components/ProductList'; // Componente integrado desde components

const Home = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    categories: 0,
    avgPrice: 0
  });
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Cargar productos destacados al montar el componente
  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏠 Cargando productos destacados...');

      // Obtener todos los productos
      const response = await apiService.getProducts();
      
      if (response.success && response.data) {
        // Guardar todos los productos para el componente ProductList
        setAllProducts(response.data);
        
        // Tomar los primeros 6 productos como destacados
        const featured = response.data.slice(0, 6);
        setFeaturedProducts(featured);

        // Calcular estadísticas
        const totalProducts = response.data.length;
        const categories = [...new Set(response.data.map(p => p.category))].length;
        const avgPrice = response.data.reduce((sum, p) => sum + parseFloat(p.price), 0) / totalProducts;

        setStats({
          totalProducts,
          categories,
          avgPrice: avgPrice.toFixed(2)
        });

        console.log('✅ Productos destacados cargados:', featured.length);
      } else {
        throw new Error(response.error || 'Error al cargar productos');
      }

    } catch (error) {
      console.error('❌ Error cargando productos destacados:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para truncar texto
  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Función para formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Manejar selección de producto desde ProductList
  const handleProductSelect = (product) => {
    // TODO: Implementar navegación al detalle del producto o agregar al carrito
    console.log('Producto seleccionado:', product);
    alert(`Producto "${product.name}" seleccionado`);
  };

  // Alternar vista de todos los productos
  const toggleAllProducts = () => {
    setShowAllProducts(!showAllProducts);
  };

  return (
    <div className="home-page">
      <div className="container">
        
        {/* Sección de Bienvenida */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              ¡Bienvenido a Paint Shop, {user?.username || user?.email?.split('@')[0] || 'Usuario'}! 🎨
            </h1>
            <p className="hero-subtitle">
              Descubre nuestra amplia colección de pinturas profesionales y materiales de arte. 
              Todo lo que necesitas para dar vida a tu creatividad.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large">
                🎨 Ver Todos los Productos
              </Link>
              <Link to="/dashboard" className="btn btn-outline btn-large">
                📊 Mi Dashboard
              </Link>
              <button 
                onClick={toggleAllProducts}
                className="btn btn-secondary btn-large"
              >
                {showAllProducts ? '🏠 Ver Destacados' : '🔍 Explorar Todos'}
              </button>
            </div>
          </div>
        </section>

        {/* Estadísticas */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-number">{stats.totalProducts}</div>
              <div className="stat-label">Productos Disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏷️</div>
              <div className="stat-number">{stats.categories}</div>
              <div className="stat-label">Categorías</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-number">${stats.avgPrice}</div>
              <div className="stat-label">Precio Promedio</div>
            </div>
          </div>
        </section>

        {/* Condicional: Productos Destacados o Lista Completa */}
        {showAllProducts ? (
          /* Vista de todos los productos con ProductList integrado */
          <section className="all-products-section">
            <div className="section-header">
              <h2 className="section-title">🎨 Todos los Productos</h2>
              <p className="section-subtitle">
                Explora nuestro catálogo completo con filtros avanzados
              </p>
            </div>

            {/* Componente ProductList integrado */}
            <ProductList 
              initialProducts={allProducts}
              showFilters={true}
              showSearch={true}
              showSorting={true}
              onProductSelect={handleProductSelect}
              className="home-product-list"
              viewMode="grid"
            />

            {/* Botón para volver a destacados */}
            <div className="back-to-featured">
              <button 
                onClick={toggleAllProducts}
                className="btn btn-outline btn-large"
              >
                🏠 Volver a Productos Destacados
              </button>
            </div>
          </section>
        ) : (
          /* Vista de productos destacados (original) */
          <section className="featured-section">
            <div className="section-header">
              <h2 className="section-title">🌟 Productos Destacados</h2>
              <p className="section-subtitle">
                Los mejores productos seleccionados especialmente para ti
              </p>
            </div>

            {/* Estados de carga */}
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando productos destacados...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <strong>❌ Error:</strong> {error}
                <button 
                  onClick={loadFeaturedProducts}
                  className="btn btn-outline"
                  style={{ marginLeft: '10px' }}
                >
                  🔄 Reintentar
                </button>
              </div>
            )}

            {/* Grid de productos destacados */}
            {!loading && !error && (
              <>
                {featuredProducts.length > 0 ? (
                  <div className="products-grid">
                    {featuredProducts.map(product => (
                      <div key={product.id} className="product-card">
                        
                        {/* Imagen del producto */}
                        <div className="product-image-container">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="product-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="product-image-placeholder"
                            style={{ 
                              display: product.image_url ? 'none' : 'flex' 
                            }}
                          >
                            🎨
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="product-info">
                          <h3 className="product-name">{product.name}</h3>
                          
                          <p className="product-description">
                            {truncateText(product.description)}
                          </p>

                          <div className="product-meta">
                            <div className="product-price">
                              {formatPrice(product.price)}
                            </div>
                            <div className="product-category">
                              {product.category}
                            </div>
                          </div>

                          <div className="product-stock">
                            {product.stock > 10 ? (
                              <span className="stock-good">✅ En stock ({product.stock})</span>
                            ) : product.stock > 0 ? (
                              <span className="stock-low">⚠️ Pocas unidades ({product.stock})</span>
                            ) : (
                              <span className="stock-out">❌ Agotado</span>
                            )}
                          </div>

                          <div className="product-actions">
                            <button 
                              className="btn btn-add-cart"
                              disabled={product.stock === 0}
                              onClick={() => {
                                // TODO: Integrar con CartContext cuando se implemente
                                alert(`Producto "${product.name}" agregado al carrito`);
                              }}
                            >
                              {product.stock > 0 ? '🛒 Agregar al Carrito' : '❌ Sin Stock'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No hay productos disponibles</h3>
                    <p>Actualmente no tenemos productos para mostrar.</p>
                    <button 
                      onClick={loadFeaturedProducts}
                      className="btn btn-primary"
                    >
                      🔄 Recargar
                    </button>
                  </div>
                )}

                {/* Enlace a ver más productos */}
                {featuredProducts.length > 0 && (
                  <div className="view-more-section">
                    <Link to="/products" className="btn btn-outline btn-large">
                      👀 Ver Todos los Productos ({stats.totalProducts})
                    </Link>
                    <button 
                      onClick={toggleAllProducts}
                      className="btn btn-primary btn-large"
                    >
                      🔍 Explorar Aquí Mismo
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* Estilos específicos de la página Home */}
      <style jsx>{`
        .home-page {
          min-height: 100vh;
          padding: 40px 0;
        }

        .hero-section {
          text-align: center;
          padding: 60px 0;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 20px;
          margin-bottom: 50px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 700;
          color: #333;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #666;
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 15px 30px;
          font-size: 18px;
          font-weight: 600;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: 1px solid #6c757d;
        }

        .btn-secondary:hover {
          background: #545b62;
          border-color: #545b62;
        }

        .stats-section {
          margin-bottom: 50px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          margin-bottom: 50px;
        }

        .stat-card {
          background: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .stat-number {
          font-size: 36px;
          font-weight: 700;
          color: #2196f3;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }

        .featured-section, .all-products-section {
          margin-bottom: 50px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-title {
          font-size: 36px;
          font-weight: 300;
          color: #333;
          margin-bottom: 15px;
        }

        .section-subtitle {
          font-size: 18px;
          color: #666;
          max-width: 500px;
          margin: 0 auto;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 24px;
          color: #333;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
        }

        .view-more-section {
          text-align: center;
          margin-top: 50px;
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .back-to-featured {
          text-align: center;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }

        /* Estilos específicos para ProductList integrado */
        .home-product-list {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .product-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: #bbb;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s;
        }

        .product-card:hover {
          transform: translateY(-5px);
        }

        .product-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-name {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .product-description {
          font-size: 14px;
          color: #666;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #888;
        }

        .product-stock {
          font-size: 14px;
          margin-top: 10px;
        }

        .stock-good {
          color: green;
        }

        .stock-low {
          color: orange;
        }

        .stock-out {
          color: red;
        }

        .product-actions {
          margin-top: auto;
        }

        .btn-add-cart {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-add-cart:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 30px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 50px 0;
        }

        .loading-spinner {
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Estilos base para botones */
        .btn {
          padding: 10px 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          color: #333;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-primary {
          background: #2196f3;
          color: white;
          border-color: #2196f3;
        }

        .btn-primary:hover {
          background: #1976d2;
          border-color: #1976d2;
        }

        .btn-outline {
          border-color: #2196f3;
          color: #2196f3;
        }

        .btn-outline:hover {
          background: #2196f3;
          color: white;
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

        /* Responsive design */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn-large {
            width: 100%;
            max-width: 300px;
          }

          .view-more-section {
            flex-direction: column;
            align-items: center;
          }

          .view-more-section .btn {
            width: 100%;
            max-width: 300px;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .section-title {
            font-size: 28px;
          }

          .section-subtitle {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .home-product-list {
            padding: 20px;
          }
        }

        /* Animaciones */
        .featured-section,
        .all-products-section {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-card {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Estados de focus para accesibilidad */
        .btn:focus {
          outline: 2px solid #2196f3;
          outline-offset: 2px;
        }

        /* Mejoras en la transición entre vistas */
        .section-transition {
          transition: all 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Home;