// components/Header.js - Navegación principal con autenticación, búsqueda y carrito
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // 🆕 Importar useCart
import SearchBar from '../components/SearchBar'; // Importar SearchBar

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart(); // 🆕 Obtener función del carrito
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 🆕 Obtener total de items en el carrito
  const cartItemsCount = getTotalItems();

  // Función para manejar logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para verificar si una ruta está activa
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Si no está autenticado, no mostrar header
  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="header">
      <div className="header-content">
        
        {/* Lado izquierdo - Logo y navegación */}
        <div className="header-left">
          
          {/* Logo */}
          <Link to="/home" className="logo">
            🎨 Paint Shop
          </Link>

          {/* Navegación principal */}
          <nav className="header-nav">
            <Link 
              to="/home" 
              className={isActiveRoute('/home') ? 'active' : ''}
              style={{
                backgroundColor: isActiveRoute('/home') 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent'
              }}
            >
              🏠 Inicio
            </Link>
            
            <Link 
              to="/products" 
              className={isActiveRoute('/products') ? 'active' : ''}
              style={{
                backgroundColor: isActiveRoute('/products') 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent'
              }}
            >
              🎨 Productos
            </Link>
            
            <Link 
              to="/dashboard" 
              className={isActiveRoute('/dashboard') ? 'active' : ''}
              style={{
                backgroundColor: isActiveRoute('/dashboard') 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent'
              }}
            >
              📊 Dashboard
            </Link>
          </nav>
        </div>

        {/* Centro - Barra de búsqueda */}
        <div className="header-center">
          <SearchBar />
        </div>

        {/* Lado derecho - Usuario, carrito y acciones */}
        <div className="header-right">
          
          {/* 🆕 Carrito con contador */}
          <Link to="/cart" className="cart-link">
            <div className="cart-icon">
              🛒
              {cartItemsCount > 0 && (
                <span className="cart-badge">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </div>
            <span className="cart-text">Carrito</span>
          </Link>
          
          {/* Información del usuario */}
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                👤
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.username || user.email?.split('@')[0] || 'Usuario'}
                </div>
                <div className="user-email" style={{ 
                  fontSize: '12px', 
                  opacity: 0.8 
                }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '🔄' : '🚪'} 
            {isLoading ? 'Saliendo...' : 'Salir'}
          </button>
        </div>
      </div>

      {/* Estilos adicionales específicos del header */}
      <style jsx>{`
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          max-width: 1400px;
          margin: 0 auto;
          gap: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 30px;
          flex-shrink: 0;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          max-width: 500px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-shrink: 0;
        }

        .logo {
          font-size: 24px;
          font-weight: bold;
          text-decoration: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: opacity 0.3s;
        }

        .logo:hover {
          opacity: 0.9;
        }

        .header-nav {
          display: flex;
          gap: 15px;
        }

        .header-nav a {
          color: white;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.3s;
          font-weight: 500;
        }

        .header-nav a:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }

        /* 🆕 Estilos del carrito */
        .cart-link {
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background-color 0.3s;
          background-color: rgba(255,255,255,0.1);
        }

        .cart-link:hover {
          background-color: rgba(255,255,255,0.2);
        }

        .cart-icon {
          position: relative;
          font-size: 20px;
          line-height: 1;
        }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ff4757;
          color: white;
          font-size: 10px;
          font-weight: bold;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          line-height: 1;
        }

        .cart-text {
          font-size: 14px;
          font-weight: 500;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background-color: rgba(255,255,255,0.1);
          border-radius: 8px;
        }

        .user-avatar {
          font-size: 24px;
          background-color: rgba(255,255,255,0.2);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-details {
          text-align: left;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.2;
        }

        .user-email {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.2;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .btn-secondary {
          background-color: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: rgba(255,255,255,0.1);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .header-center {
            max-width: 300px;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }
          
          .header-left {
            width: 100%;
            justify-content: space-between;
          }
          
          .header-center {
            width: 100%;
            max-width: none;
          }
          
          .header-nav {
            gap: 10px;
          }
          
          .user-info {
            text-align: center;
          }

          .cart-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .header-left {
            flex-direction: column;
            gap: 15px;
          }
          
          .logo {
            font-size: 20px;
          }
          
          .header-nav a {
            padding: 6px 12px;
            font-size: 13px;
          }
          
          .user-name {
            font-size: 13px;
          }
          
          .user-email {
            font-size: 11px;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;