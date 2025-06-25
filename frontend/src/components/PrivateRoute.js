// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para proteger rutas que requieren autenticación
 * 
 * Funcionalidad:
 * - Verifica si el usuario está autenticado usando AuthContext
 * - Si está autenticado: muestra el componente/página solicitada
 * - Si NO está autenticado: redirige a /login
 * - Guarda la ruta original para redirigir después del login
 * - Muestra loading mientras verifica autenticación
 */

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Verificando autenticación...</p>
        </div>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            flex-direction: column;
          }
          
          .loading-spinner {
            text-align: center;
          }
          
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-spinner p {
            color: #666;
            font-size: 16px;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Si NO está autenticado, redirigir a login
  if (!isAuthenticated) {
    // Guardar la ruta actual para redirigir después del login exitoso
    // Esto se pasa como 'state' a la página de login
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname,
          message: 'Debes iniciar sesión para acceder a esta página'
        }} 
        replace 
      />
    );
  }

  // Si está autenticado, mostrar el contenido protegido
  return (
    <div className="private-route-container">
      {/* Opcional: Mostrar información del usuario autenticado */}
      <div className="auth-info" style={{ display: 'none' }}>
        Usuario autenticado: {user?.username} ({user?.email})
      </div>
      
      {/* Renderizar el componente/página protegida */}
      {children}
    </div>
  );
};

/**
 * Hook personalizado para verificar permisos específicos
 * Útil para proteger secciones específicas dentro de una página
 */
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // En lugar de Navigate, podrías usar navigate programáticamente
      console.warn('Acceso denegado: usuario no autenticado');
    }
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated,
    isLoading,
    user,
    canAccess: isAuthenticated && !isLoading
  };
};

/**
 * Componente de protección más específico para roles (futuro)
 * Por ahora solo verifica autenticación, pero se puede extender
 */
export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  fallback = null,
  loadingComponent = null 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Componente de loading personalizado
  if (isLoading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return (
      <div className="protected-route-loading">
        <p>Cargando...</p>
      </div>
    );
  }

  // Si requiere autenticación y NO está autenticado
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Si todo está bien, mostrar contenido
  return children;
};

/**
 * HOC (Higher Order Component) para proteger componentes
 * Alternativa al uso de PrivateRoute en las rutas
 */
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Verificando autenticación...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Componente para mostrar contenido solo a usuarios autenticados
 * Útil para mostrar/ocultar elementos en la UI
 */
export const AuthOnly = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // No mostrar nada mientras carga
  }
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  return children;
};

/**
 * Componente para mostrar contenido solo a usuarios NO autenticados
 * Útil para páginas de login/register
 */
export const GuestOnly = ({ children, redirectTo = '/profile' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="guest-loading">
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

export default PrivateRoute;