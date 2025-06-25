// components/ProductDetail.js - Vista detallada de un producto individual
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const ProductDetail = ({ 
  productId = null,
  product: initialProduct = null,
  onClose = null,
  onAddToCart = null,
  showModal = false,
  showBackButton = true,
  showRelatedProducts = true,
  className = ''
}) => {
  const { user } = useAuth();
  
  // Estados principales
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct && !!productId);
  const [error, setError] = useState(null);
  
  // Estados para interacciones
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Estados para productos relacionados
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Cargar producto si se proporciona ID
  useEffect(() => {
    if (productId && !initialProduct) {
      loadProduct();
    }
  }, [productId, initialProduct]);

  // Cargar productos relacionados cuando el producto cambie
  useEffect(() => {
    if (product && showRelatedProducts) {
      loadRelatedProducts();
    }
  }, [product, showRelatedProducts]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Cargando producto ID: ${productId}`);

      const response = await apiService.getProductById(productId);
      
      if (response.success && response.data) {
        setProduct(response.data);
        console.log('✅ Producto cargado:', response.data.name);
      } else {
        throw new Error(response.error || 'Producto no encontrado');
      }

    } catch (error) {
      console.error('❌ Error cargando producto:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!product || !product.category) return;

    try {
      setLoadingRelated(true);

      console.log(`🔗 Cargando productos relacionados de categoría: ${product.category}`);

      const response = await apiService.filterProducts({ 
        category: product.category 
      });
      
      if (response.success && response.data) {
        // Excluir el producto actual y limitar a 4 productos
        const related = response.data
          .filter(p => p.id !== product.id)
          .slice(0, 4);
        
        setRelatedProducts(related);
        console.log('✅ Productos relacionados cargados:', related.length);
      }

    } catch (error) {
      console.warn('⚠️ Error cargando productos relacionados:', error);
      // No mostrar error por productos relacionados
    } finally {
      setLoadingRelated(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Obtener clase de stock
  const getStockClass = () => {
    if (!product) return '';
    if (product.stock > 10) return 'stock-good';
    if (product.stock > 0) return 'stock-low';
    return 'stock-out';
  };

  // Obtener texto de stock
  const getStockText = () => {
    if (!product) return '';
    if (product.stock > 10) return `✅ En stock (${product.stock} disponibles)`;
    if (product.stock > 0) return `⚠️ Pocas unidades (${product.stock} restantes)`;
    return '❌ Producto agotado';
  };

  // Manejar agregar al carrito
  const handleAddToCart = async () => {
    if (!user) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    if (!product || product.stock === 0) {
      alert('Este producto no está disponible');
      return;
    }

    if (quantity > product.stock) {
      alert(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        product_id: product.id,
        quantity: quantity
      };

      let response;
      if (onAddToCart) {
        response = await onAddToCart(cartData);
      } else {
        response = await apiService.addToCart(cartData);
      }

      if (response.success) {
        // Mostrar confirmación visual
        alert(`✅ ${product.name} agregado al carrito (${quantity} unidades)`);
        console.log('✅ Producto agregado al carrito:', product.name);
      } else {
        throw new Error(response.error || 'Error al agregar al carrito');
      }

    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setAddingToCart(false);
    }
  };

  // Manejar error de imagen
  const handleImageError = () => {
    setImageError(true);
  };

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showModal && onClose) {
        onClose();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, onClose]);

  if (loading) {
    return (
      <div className={`product-detail loading ${showModal ? 'modal' : ''} ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`product-detail error ${showModal ? 'modal' : ''} ${className}`}>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Error al cargar el producto</h3>
          <p>{error}</p>
          <div className="error-actions">
            {productId && (
              <button onClick={loadProduct} className="btn btn-primary">
                🔄 Reintentar
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="btn btn-outline">
                ← Volver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`product-detail empty ${showModal ? 'modal' : ''} ${className}`}>
        <div className="empty-container">
          <div className="empty-icon">🔍</div>
          <h3>Producto no encontrado</h3>
          <p>El producto que buscas no existe o no está disponible.</p>
          {onClose && (
            <button onClick={onClose} className="btn btn-primary">
              ← Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  const containerClass = `product-detail ${showModal ? 'modal' : ''} ${className}`;

  return (
    <>
      {showModal && <div className="modal-backdrop" onClick={onClose}></div>}
      
      <div className={containerClass}>
        <div className="product-detail-content">
          
          {/* Header con botones de acción */}
          <div className="product-detail-header">
            {showBackButton && onClose && (
              <button onClick={onClose} className="btn btn-outline back-btn">
                ← Volver
              </button>
            )}
            
            <div className="header-actions">
              {user && (
                <button 
                  className="btn btn-outline btn-favorite"
                  onClick={() => {
                    // TODO: Implementar funcionalidad de favoritos
                    console.log('Agregado a favoritos:', product.name);
                  }}
                  title="Agregar a favoritos"
                >
                  💝 Favorito
                </button>
              )}
              
              <button 
                className="btn btn-outline btn-share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: product.description,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Enlace copiado al portapapeles');
                  }
                }}
                title="Compartir producto"
              >
                📤 Compartir
              </button>
              
              {showModal && (
                <button onClick={onClose} className="btn btn-outline close-btn">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="product-detail-body">
            
            {/* Galería de imágenes */}
            <div className="product-images">
              <div className="main-image">
                {!imageError && product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="image-placeholder">
                    🎨
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              
              {/* Miniaturas (para futuras múltiples imágenes) */}
              {product.images && product.images.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="product-info">
              
              {/* Categoría */}
              <div className="product-category">{product.category}</div>
              
              {/* Nombre */}
              <h1 className="product-name">{product.name}</h1>
              
              {/* Precio */}
              <div className="product-price">
                {product.original_price && product.original_price > product.price && (
                  <span className="original-price">{formatPrice(product.original_price)}</span>
                )}
                <span className="current-price">{formatPrice(product.price)}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="discount-badge">
                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className={`product-stock ${getStockClass()}`}>
                {getStockText()}
              </div>

              {/* Descripción */}
              {product.description && (
                <div className="product-description">
                  <h3>📝 Descripción</h3>
                  <div className={`description-content ${showFullDescription ? 'expanded' : ''}`}>
                    <p>{product.description}</p>
                  </div>
                  {product.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="btn-link toggle-description"
                    >
                      {showFullDescription ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              )}

              {/* Especificaciones técnicas */}
              <div className="product-specs">
                <h3>📊 Especificaciones</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">SKU:</span>
                    <span className="spec-value">{product.sku || product.id}</span>
                  </div>
                  {product.brand && (
                    <div className="spec-item">
                      <span className="spec-label">Marca:</span>
                      <span className="spec-value">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="spec-item">
                      <span className="spec-label">Modelo:</span>
                      <span className="spec-value">{product.model}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="spec-item">
                      <span className="spec-label">Peso:</span>
                      <span className="spec-value">{product.weight}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="spec-item">
                      <span className="spec-label">Dimensiones:</span>
                      <span className="spec-value">{product.dimensions}</span>
                    </div>
                  )}
                  {product.color && (
                    <div className="spec-item">
                      <span className="spec-label">Color:</span>
                      <span className="spec-value">{product.color}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="spec-item">
                      <span className="spec-label">Material:</span>
                      <span className="spec-value">{product.material}</span>
                    </div>
                  )}
                  {product.warranty && (
                    <div className="spec-item">
                      <span className="spec-label">Garantía:</span>
                      <span className="spec-value">{product.warranty}</span>
                    </div>
                  )}
                  <div className="spec-item">
                    <span className="spec-label">Agregado:</span>
                    <span className="spec-value">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString('es-CO') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de compra */}
              {product.stock > 0 && (
                <div className="purchase-section">
                  <h3>🛒 Agregar al carrito</h3>
                  
                  <div className="purchase-controls">
                    {/* Selector de cantidad */}
                    <div className="quantity-selector">
                      <label htmlFor="quantity">Cantidad:</label>
                      <div className="quantity-input-group">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="quantity-btn"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          id="quantity"
                          type="number"
                          min="1"
                          max={product.stock}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.min(Math.max(1, val), product.stock));
                          }}
                          className="quantity-input"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="quantity-btn"
                          disabled={quantity >= product.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Precio total */}
                    <div className="total-price">
                      <span className="total-label">Total:</span>
                      <span className="total-value">{formatPrice(product.price * quantity)}</span>
                    </div>
                  </div>

                  {/* Botón agregar al carrito */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !user}
                    className={`btn btn-primary btn-large add-to-cart-btn ${addingToCart ? 'loading' : ''}`}
                  >
                    {addingToCart ? (
                      <>
                        <span className="spinner"></span>
                        Agregando...
                      </>
                    ) : (
                      <>
                        🛒 Agregar al carrito
                      </>
                    )}
                  </button>

                  {!user && (
                    <p className="login-reminder">
                      💡 <strong>Inicia sesión</strong> para agregar productos al carrito
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Productos relacionados */}
          {showRelatedProducts && relatedProducts.length > 0 && (
            <div className="related-products">
              <h3>🔗 Productos relacionados</h3>
              <div className="related-grid">
                {relatedProducts.map(relatedProduct => (
                  <div key={relatedProduct.id} className="related-item">
                    <div className="related-image">
                      {relatedProduct.image_url ? (
                        <img src={relatedProduct.image_url} alt={relatedProduct.name} />
                      ) : (
                        <div className="related-placeholder">🎨</div>
                      )}
                    </div>
                    <div className="related-info">
                      <h4>{relatedProduct.name}</h4>
                      <p className="related-price">{formatPrice(relatedProduct.price)}</p>
                      <button
                        onClick={() => {
                          if (onClose) onClose();
                          // TODO: Navegar al producto relacionado
                          console.log('Ver producto relacionado:', relatedProduct.id);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Ver producto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {loadingRelated && (
                <div className="related-loading">
                  <div className="loading-spinner small"></div>
                  <span>Cargando productos relacionados...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estilos del componente */}
        <style jsx>{`
          .product-detail {
            width: 100%;
            background: white;
            border-radius: 12px;
            overflow: hidden;
          }

          .product-detail.modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90vw;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 1001;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }

          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            backdrop-filter: blur(3px);
          }

          .product-detail-content {
            padding: 0;
          }

          .product-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
          }

          .header-actions {
            display: flex;
            gap: 10px;
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
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .btn:hover {
            background: #f8f9fa;
            transform: translateY(-1px);
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
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

          .btn-outline {
            border-color: #007bff;
            color: #007bff;
          }

          .btn-outline:hover {
            background: #007bff;
            color: white;
          }

          .btn-large {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
          }

          .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
          }

          .btn-link {
            background: none;
            border: none;
            color: #007bff;
            text-decoration: underline;
            cursor: pointer;
            padding: 4px 0;
          }

          .btn-link:hover {
            color: #0056b3;
            background: none;
          }

          .product-detail-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 30px;
          }

          .product-images {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .main-image {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 12px;
            overflow: hidden;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .main-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .image-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            color: #999;
            font-size: 48px;
          }

          .image-placeholder span {
            font-size: 14px;
          }

          .image-thumbnails {
            display: flex;
            gap: 10px;
            justify-content: center;
          }

          .thumbnail {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid transparent;
            cursor: pointer;
            transition: border-color 0.3s;
          }

          .thumbnail.active {
            border-color: #007bff;
          }

          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .product-info {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .product-category {
            background: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            align-self: flex-start;
            text-transform: uppercase;
          }

          .product-name {
            font-size: 28px;
            font-weight: 700;
            color: #333;
            margin: 0;
            line-height: 1.2;
          }

          .product-price {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
          }

          .original-price {
            font-size: 18px;
            color: #999;
            text-decoration: line-through;
          }

          .current-price {
            font-size: 32px;
            font-weight: 700;
            color: #28a745;
          }

          .discount-badge {
            background: #dc3545;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }

          .product-stock {
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
          }

          .stock-good {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .stock-low {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
          }

          .stock-out {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }

          .product-description h3,
          .product-specs h3,
          .purchase-section h3 {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 0 0 10px 0;
          }

          .description-content {
            max-height: 100px;
            overflow: hidden;
            transition: max-height 0.3s;
          }

          .description-content.expanded {
            max-height: none;
          }

          .description-content p {
            color: #666;
            line-height: 1.6;
            margin: 0;
          }

          .toggle-description {
            margin-top: 5px;
          }

          .specs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .spec-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }

          .spec-label {
            font-weight: 600;
            color: #555;
          }

          .spec-value {
            color: #333;
          }

          .purchase-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }

          .purchase-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            gap: 20px;
          }

          .quantity-selector {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .quantity-selector label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .quantity-input-group {
            display: flex;
            border: 1px solid #ddd;
            border-radius: 6px;
            overflow: hidden;
          }

          .quantity-btn {
            background: white;
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.3s;
            border-right: 1px solid #ddd;
          }

          .quantity-btn:last-child {
            border-right: none;
            border-left: 1px solid #ddd;
          }

          .quantity-btn:hover:not(:disabled) {
            background: #f8f9fa;
          }

          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quantity-input {
            border: none;
            padding: 8px 12px;
            text-align: center;
            width: 60px;
            font-weight: 600;
          }

          .quantity-input:focus {
            outline: none;
          }

          .total-price {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }

          .total-label {
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }

          .total-value {
            font-size: 24px;
            font-weight: 700;
            color: #28a745;
          }

          .add-to-cart-btn {
            width: 100%;
            justify-content: center;
          }

          .add-to-cart-btn.loading {
            pointer-events: none;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .login-reminder {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 10px;
          }

          .related-products {
            padding: 30px;
            border-top: 1px solid #eee;
             background: #f8f9fa;
          }

          .related-products h3 {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin: 0 0 20px 0;
          }
            .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }

          .related-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
          }

          .related-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .related-image {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 6px;
            overflow: hidden;
            background: #f8f9fa;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .related-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .related-placeholder {
            font-size: 32px;
            color: #999;
          }

          .related-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .related-info h4 {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 0;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .related-price {
            font-size: 18px;
            font-weight: 700;
            color: #28a745;
            margin: 0;
          }

          .related-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 20px;
            color: #666;
          }

          .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-spinner.small {
            width: 16px;
            height: 16px;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .product-detail.modal {
              width: 95vw;
              max-height: 95vh;
            }

            .product-detail-header {
              padding: 15px;
              flex-direction: column;
              gap: 15px;
              align-items: stretch;
            }

            .header-actions {
              justify-content: space-between;
            }

            .product-detail-body {
              grid-template-columns: 1fr;
              gap: 30px;
              padding: 20px;
            }

            .product-name {
              font-size: 24px;
            }

            .current-price {
              font-size: 28px;
            }

            .specs-grid {
              grid-template-columns: 1fr;
            }

            .purchase-controls {
              flex-direction: column;
              align-items: stretch;
              gap: 15px;
            }

            .total-price {
              align-items: center;
            }

            .related-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
            }

            .related-products {
              padding: 20px;
            }

            .btn {
              font-size: 13px;
              padding: 6px 12px;
            }

            .btn-large {
              padding: 10px 20px;
              font-size: 15px;
            }
          }

          @media (max-width: 480px) {
            .product-detail-header {
              padding: 10px;
            }

            .product-detail-body {
              padding: 15px;
              gap: 20px;
            }

            .product-name {
              font-size: 20px;
            }

            .current-price {
              font-size: 24px;
            }

            .purchase-section {
              padding: 15px;
            }

            .related-grid {
              grid-template-columns: 1fr 1fr;
            }

            .header-actions {
              flex-wrap: wrap;
              gap: 8px;
            }

            .btn {
              font-size: 12px;
              padding: 5px 10px;
            }
          }

          /* Animaciones adicionales */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .product-detail-content {
            animation: fadeIn 0.3s ease-out;
          }

          /* Estados de hover y focus mejorados */
          .btn:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }

          .quantity-input:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }

          /* Mejoras de accesibilidad */
          .btn:focus-visible {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }

          .btn:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          /* Scroll suave para modal */
          .product-detail.modal {
            scroll-behavior: smooth;
          }

          /* Mejoras visuales adicionales */
          .product-detail {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .main-image {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s;
          }

          .main-image:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          /* Indicadores de estado mejorados */
          .btn-favorite:hover {
            transform: scale(1.05);
          }

          .btn-share:hover {
            transform: scale(1.05);
          }

          /* Transiciones suaves */
          * {
            transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
          }
        `}</style>
      </div>
    </>
  );
};

export default ProductDetail;
