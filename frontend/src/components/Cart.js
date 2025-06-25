// frontend/src/components/Cart.js
import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si el carrito está vacío
  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>Tu carrito está vacío</h2>
          <p>¡Agrega algunos productos para comenzar!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/products')}
          >
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  // Manejar cambio de cantidad
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // Simular proceso de compra
  const handleCheckout = () => {
    if (!user) {
      alert('Debes iniciar sesión para realizar la compra');
      navigate('/login');
      return;
    }

    // Simular proceso de compra
    const orderSummary = {
      items: items,
      totalItems: getTotalItems(),
      totalPrice: getTotalPrice(),
      user: user.name,
      date: new Date().toLocaleDateString()
    };

    console.log('Orden procesada:', orderSummary);
    alert(`¡Compra realizada exitosamente!\nTotal: $${getTotalPrice().toLocaleString()}\nGracias por tu compra, ${user.name}!`);
    
    // Limpiar carrito después de la compra
    clearCart();
    navigate('/products');
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Carrito de Compras</h1>
        <p>{getTotalItems()} producto{getTotalItems() !== 1 ? 's' : ''} en tu carrito</p>
      </div>

      <div className="cart-content">
        {/* Lista de productos en el carrito */}
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img 
                  src={item.image || '/placeholder-image.jpg'} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="cart-item-description">
                  {item.description ? item.description.substring(0, 100) + '...' : 'Sin descripción'}
                </p>
                <p className="cart-item-price">
                  Precio unitario: ${item.price.toLocaleString()}
                </p>
              </div>

              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                
                <div className="cart-item-total">
                  <strong>${(item.price * item.quantity).toLocaleString()}</strong>
                </div>
                
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Eliminar producto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del carrito */}
        <div className="cart-summary">
          <div className="summary-card">
            <h3>Resumen de Compra</h3>
            
            <div className="summary-line">
              <span>Productos ({getTotalItems()})</span>
              <span>${getTotalPrice().toLocaleString()}</span>
            </div>
            
            <div className="summary-line">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            
            <hr />
            
            <div className="summary-total">
              <strong>
                <span>Total</span>
                <span>${getTotalPrice().toLocaleString()}</span>
              </strong>
            </div>

            <div className="cart-actions">
              <button 
                className="btn-secondary"
                onClick={clearCart}
              >
                Vaciar Carrito
              </button>
              
              <button 
                className="btn-primary"
                onClick={handleCheckout}
              >
                Finalizar Compra
              </button>
            </div>

            <button 
              className="btn-link"
              onClick={() => navigate('/products')}
            >
              ← Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;