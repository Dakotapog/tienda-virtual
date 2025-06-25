// components/ProductCard.js - Tarjeta individual de producto con modal integrado
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import apiService from '../services/api';
import ProductDetail from '../components/ProductDetail';

const ProductCard = ({ 
  product, 
  viewMode = 'grid', 
  onSelect = null,
  onAddToCart = null,
  showFullDescription = false,
  showActions = true,
  showStock = true,
  showCategory = true,
  className = '',
  compact = false
}) => {
  const { user } = useAuth(); // ✅ Solo necesitamos user del contexto
  const { addToCart } = useCart();
  
  // Estados para interacciones
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // ✅ CORREGIDO: Removida setShowDetails que no se usaba
  const [imageError, setImageError] = useState(false);
  
  // Estado para el modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Función para formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Función para truncar texto
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (showFullDescription || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Obtener clase de stock
  const getStockClass = () => {
    if (product.stock > 10) return 'stock-good';
    if (product.stock > 0) return 'stock-low';
    return 'stock-out';
  };

  // Obtener texto de stock
  const getStockText = () => {
    if (product.stock > 10) return `✅ En stock (${product.stock})`;
    if (product.stock > 0) return `⚠️ Pocas unidades (${product.stock})`;
    return '❌ Agotado';
  };

  // Manejar clic en la tarjeta - ABRIR MODAL
  const handleCardClick = (e) => {
    // No activar si se hizo clic en botones o inputs
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    
    // Si hay callback personalizado, usarlo
    if (onSelect) {
      onSelect(product);
    } else {
      // Por defecto, abrir modal de detalle
      setShowDetailModal(true);
    }
  };

  // Manejar agregar al carrito - ✅ CORREGIDO
  const handleAddToCart = async () => {
    // ✅ Validaciones mejoradas
    if (!user) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    // ✅ Verificar que el apiService tenga token válido
    if (!apiService.hasValidToken()) {
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      return;
    }

    if (product.stock === 0) {
      alert('Este producto no está disponible');
      return;
    }

    if (!product.id) {
      alert('Error: Producto inválido');
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        product_id: product.id,
        quantity: quantity
      };

      console.log('🛒 Agregando al carrito:', {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        hasToken: apiService.hasValidToken(),
        hasUser: !!user
      });

      let response;
      if (onAddToCart) {
        // ✅ Usar callback personalizado si se proporciona
        response = await onAddToCart(cartData);
      } else {
        // ✅ Usar API directamente (ya tiene validaciones internas)
        response = await apiService.addToCart(cartData);
      }

      // ✅ Manejo de respuesta mejorado
      if (response && (response.success || response.data)) {
        // Agregar al contexto del carrito
        addToCart(product, quantity);
        
        // Mostrar confirmación visual
        showSuccessMessage();
        
        console.log('✅ Producto agregado al carrito:', product.name);
      } else {
        // Manejar respuesta de error
        const errorMessage = response?.error || response?.message || 'Error desconocido al agregar al carrito';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      
      // ✅ Manejo de errores específicos
      let errorMessage = error.message;
      
      if (error.message.includes('Token requerido') || 
          error.message.includes('Unauthorized') || 
          error.message.includes('token')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (error.message.includes('Stock insuficiente') || 
                 error.message.includes('stock')) {
        errorMessage = 'No hay suficiente stock disponible para este producto.';
      } else if (error.message.includes('Network Error') || 
                 error.message.includes('Failed to fetch') ||
                 error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error.message.includes('ID del producto')) {
        errorMessage = 'Error en los datos del producto. Intenta recargar la página.';
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setAddingToCart(false);
    }
  };

  // ✅ Función para mostrar mensaje de éxito
  const showSuccessMessage = () => {
    const button = document.querySelector(`[data-product-id="${product.id}"] .btn-add-cart`);
    if (button) {
      const originalText = button.textContent;
      const originalBg = button.style.background;
      
      button.textContent = '✅ Agregado';
      button.style.background = '#28a745';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = originalBg;
        button.style.color = '';
      }, 2000);
    }
  };

  // Manejar agregar al carrito desde el modal - ✅ CORREGIDO
  const handleAddToCartFromModal = async (cartData) => {
    // ✅ Verificar autenticación antes de proceder
    if (!user) {
      throw new Error('Debes iniciar sesión para agregar productos al carrito');
    }

    if (!apiService.hasValidToken()) {
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    try {
      if (onAddToCart) {
        return await onAddToCart(cartData);
      } else {
        return await apiService.addToCart(cartData);
      }
    } catch (error) {
      console.error('❌ Error en handleAddToCartFromModal:', error);
      throw error; // Re-lanzar el error para que lo maneje el modal
    }
  };

  // Manejar error de imagen
  const handleImageError = () => {
    setImageError(true);
  };

  // Manejar apertura del modal desde botón "Ver detalles"
  const handleViewDetails = (e) => {
    e.stopPropagation();
    setShowDetailModal(true);
  };

  // Manejar cierre del modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
  };

  return (
    <>
      <div 
        className={`product-card ${viewMode} ${compact ? 'compact' : ''} ${className}`}
        onClick={handleCardClick}
        data-product-id={product.id}
        style={{ cursor: 'pointer' }}
      >
        
        {/* Imagen del producto */}
        <div className="product-image-container">
          {!imageError && product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="product-image"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              🎨
            </div>
          )}
          
          {/* Badge de categoría (solo en vista grid) */}
          {showCategory && viewMode === 'grid' && (
            <div className="category-badge">{product.category}</div>
          )}
          
          {/* Badge de descuento (si aplica) */}
          {product.discount && (
            <div className="discount-badge">-{product.discount}%</div>
          )}
        </div>

        {/* Información del producto */}
        <div className="product-info">
          
          {/* Categoría (en vista list o si se especifica) */}
          {showCategory && (viewMode === 'list' || compact) && (
            <div className="product-category">{product.category}</div>
          )}
          
          {/* Nombre del producto */}
          <h3 className="product-name" title={product.name}>
            {product.name}
          </h3>
          
          {/* Descripción */}
          {product.description && (
            <p className="product-description" title={product.description}>
              {truncateText(product.description, compact ? 60 : 100)}
            </p>
          )}

          {/* Detalles principales */}
          <div className="product-details">
            
            {/* Precio */}
            <div className="product-price">
              {product.original_price && product.original_price > product.price && (
                <span className="original-price">{formatPrice(product.original_price)}</span>
              )}
              <span className="current-price">{formatPrice(product.price)}</span>
            </div>

            {/* Stock */}
            {showStock && (
              <div className={`product-stock ${getStockClass()}`}>
                {getStockText()}
              </div>
            )}
          </div>

          {/* Acciones */}
          {showActions && (
            <div className="product-actions">
              
              {/* Selector de cantidad (solo si hay stock) */}
              {product.stock > 0 && !compact && (
                <div className="quantity-selector">
                  <label>Cantidad:</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="quantity-select"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botones de acción */}
              <div className="action-buttons">
                
                {/* Botón agregar al carrito - ✅ MEJORADO */}
                <button 
                  className={`btn btn-primary btn-add-cart ${addingToCart ? 'loading' : ''}`}
                  disabled={product.stock === 0 || addingToCart || !user || !apiService.hasValidToken()}
                  onClick={handleAddToCart}
                  title={
                    !user 
                      ? 'Inicia sesión para agregar al carrito' 
                      : !apiService.hasValidToken()
                        ? 'Sesión expirada, inicia sesión nuevamente'
                        : product.stock === 0 
                          ? 'Producto agotado' 
                          : 'Agregar al carrito'
                  }
                >
                  {addingToCart ? (
                    <>
                      <span className="spinner"></span>
                      Agregando...
                    </>
                  ) : (
                    <>
                      🛒 {compact ? 'Agregar' : 'Agregar al carrito'}
                    </>
                  )}
                </button>

                {/* Botón ver detalles - ABRIR MODAL */}
                {!compact && (
                  <button 
                    className="btn btn-secondary btn-details"
                    onClick={handleViewDetails}
                  >
                    👁️ Ver detalles
                  </button>
                )}
                
                {/* Botón de favoritos (si el usuario está logueado) */}
                {user && apiService.hasValidToken() && (
                  <button 
                    className="btn btn-outline btn-favorite"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implementar funcionalidad de favoritos
                      console.log('Agregado a favoritos:', product.name);
                    }}
                    title="Agregar a favoritos"
                  >
                    💝
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de ProductDetail */}
      {showDetailModal && (
        <ProductDetail
          product={product}
          showModal={true}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCartFromModal}
          showBackButton={false}
          showRelatedProducts={true}
        />
      )}
    </>
  );
};

export default ProductCard;