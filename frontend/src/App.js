// App.js - Integración completa con AuthContext, CartContext, PrivateRoute y nuevas páginas
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context - TODOS los imports de contexto al inicio
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // 🔴 AGREGADO: Import del CartProvider

// Components - TODOS los imports de componentes juntos
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import { GuestOnly } from './components/PrivateRoute';

// 🔴 NUEVOS IMPORTS - Páginas y componentes de prioridad alta
import Header from './components/Header';
import Home from './Pages/Home';
import Products from './Pages/Products';

// ⚪ IMPORT CART - Prioridad baja pero ya creado
import Cart from './components/Cart';

// Estilos CSS
import './App.css';

// Estilos globales básicos
const globalStyles = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  margin: 0,
  padding: 0,
  backgroundColor: '#f5f5f5',
  minHeight: '100vh'
};

/**
 * Componente para manejar la redirección desde la ruta raíz
 * Redirige a home si está autenticado, o a login si no lo está
 */
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // 🔴 CAMBIO: Redirige a home en lugar de dashboard
  return (
    <Navigate 
      to={isAuthenticated ? "/home" : "/login"} 
      replace 
    />
  );
};

/**
 * Componente para páginas no encontradas (404)
 */
const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎨</div>
      <h1 style={{ color: '#343a40', marginBottom: '10px' }}>404 - Página no encontrada</h1>
      <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '18px' }}>
        La página que buscas no existe en nuestra tienda de pinturas.
      </p>
      <div style={{ display: 'flex', gap: '15px' }}>
        <a 
          href="/home"
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          🏠 Ir al Inicio
        </a>
        <a 
          href="/products"
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          🎨 Ver Productos
        </a>
      </div>
    </div>
  );
};

/**
 * Componente de pantalla de carga global
 */
const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e3f2fd',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      
      <h2 style={{ 
        color: '#007bff', 
        marginBottom: '10px',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        🎨 Paint Shop
      </h2>
      
      <p style={{ 
        color: '#6c757d', 
        fontSize: '16px',
        margin: 0
      }}>
        Cargando aplicación...
      </p>

      {/* Estilos CSS para la animación */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * Layout principal que incluye el Header en páginas autenticadas
 */
const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="App">
      {/* 🔴 NUEVO: Header solo se muestra si está autenticado */}
      {isAuthenticated && <Header />}
      
      {/* Contenido principal */}
      <main className={isAuthenticated ? "main-content" : ""}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <div style={globalStyles}>
      {/* 🔴 ESTRUCTURA CORREGIDA: AuthProvider y CartProvider envuelven toda la app */}
      <AuthProvider>
        <CartProvider>
          <Router>
            <MainLayout>
              {/* Definir todas las rutas de la aplicación */}
              <Routes>
                {/* Ruta raíz - Redirige según el estado de autenticación */}
                <Route 
                  path="/" 
                  element={<RootRedirect />} 
                />

                {/* Rutas públicas - Solo para usuarios NO autenticados */}
                <Route 
                  path="/login" 
                  element={
                    <GuestOnly redirectTo="/home">
                      <Login />
                    </GuestOnly>
                  } 
                />

                <Route 
                  path="/register" 
                  element={
                    <GuestOnly redirectTo="/home">
                      <Register />
                    </GuestOnly>
                  } 
                />

                {/* 🔴 NUEVAS RUTAS PÚBLICAS - Páginas principales */}
                <Route 
                  path="/home" 
                  element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  } 
                />

                <Route 
                  path="/products" 
                  element={
                    <PrivateRoute>
                      <Products />
                    </PrivateRoute>
                  } 
                />

                {/* ⚪ NUEVA RUTA - Cart (prioridad baja pero ya creado) */}
                <Route 
                  path="/cart" 
                  element={
                    <PrivateRoute>
                      <Cart />
                    </PrivateRoute>
                  } 
                />

                {/* Rutas privadas existentes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />

                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />

                {/* Ruta para manejar URLs no encontradas */}
                <Route 
                  path="*" 
                  element={<NotFound />} 
                />
              </Routes>
            </MainLayout>
          </Router>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;