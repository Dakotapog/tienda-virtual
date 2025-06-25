// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/auth'; // ✅ CORREGIDO: sin destructuring


// Estados posibles de autenticación
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated', 
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Acciones del reducer
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Estado inicial
const initialState = {
  user: null,
  token: null,
  status: AUTH_STATES.LOADING,
  error: null
};

// Reducer para manejar el estado de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        status: AUTH_STATES.LOADING,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        status: AUTH_STATES.AUTHENTICATED,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        status: AUTH_STATES.UNAUTHENTICATED,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        status: AUTH_STATES.ERROR,
        error: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función para establecer estado de carga
  const setLoading = () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING });
  };

  // Función para establecer error
  const setError = (error) => {
    dispatch({ 
      type: AUTH_ACTIONS.SET_ERROR, 
      payload: error 
    });
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Función de login
  const login = async (identifier, password) => {
    try {
      setLoading();
      clearError();

       // ✅ CORREGIDO: Crear el objeto credentials correctamente
      const credentials = { identifier, password };

      // ✅ CORREGIDO: Tu authService devuelve { success, user, token }
      const response = await authService.login(credentials);

      if (response.success) {
        // Guardar token en localStorage (lo hace authService internamente)
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user, // ✅ CORREGIDO: directamente response.user
            token: response.token // ✅ CORREGIDO: directamente response.token
                        
          }
        });
        
        return { success: true };
      } else {
        throw new Error(response.error || 'Error en el login');
      }
    } catch (error) {
      const errorMessage = error.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      setLoading();
      clearError();

// ✅ CORREGIDO: Tu authService devuelve { success, user, token }
      const response = await authService.register(userData);
            
      if (response.success) {
        // Después del registro exitoso, hacer login automático
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });
        
        return { success: true };
      } else {
        throw new Error(response.error || 'Error en el registro');
      }
    } catch (error) {
      const errorMessage = error.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Función de logout
  const logout = () => {
    try {
      // Limpiar localStorage
      authService.logout();
      
      // Actualizar estado
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así, limpiar el estado local
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: error.message };
    }
  };

  // Función para obtener perfil del usuario
  const getProfile = async () => {
    try {
      const response = await authService.getProfile();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: response.user // ✅ CORREGIDO: directamente response.user
        });
        return { success: true, data: response.user };
      } else {
        throw new Error(response.error || 'Error al obtener perfil');
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Función para verificar si el usuario está autenticado
  const checkAuth = async () => {
    try {
      setLoading();
      
      // Verificar si hay token en localStorage
      const currentUser = authService.getCurrentUser();
      const storedToken = authService.getToken();
      
      if (!currentUser || !storedToken) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return;
      }

      // Verificar token con el backend
      const response = await authService.verifyToken();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user, // ✅ CORREGIDO: directamente response.user
            token: storedToken
          }
        });
      } else {
        // Token inválido, limpiar datos
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Función para refrescar token
  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      
      if (response.success && response.token) {
        // Actualizar token en el estado
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user, // ✅ CORREGIDO: directamente response.user
            token: response.token // ✅ CORREGIDO: directamente response.token
          }
        });
        return { success: true };
      } else {
        // Si no se puede refrescar, hacer logout
        logout();
        return { success: false, error: 'Token expirado' };
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
      logout();
      return { success: false, error: error.message };
    }
  };

  // Efecto para verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  // Efecto para manejar expiración del token (24 horas según tu backend)
  useEffect(() => {
    if (state.token && state.status === AUTH_STATES.AUTHENTICATED) {
      // Configurar refresh automático antes de que expire (23 horas)
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 23 * 60 * 60 * 1000); // 23 horas en milisegundos

      return () => clearInterval(refreshInterval);
    }
  }, [state.token, state.status]);

  // Valores y funciones que se proporcionan al contexto
  const contextValue = {
    // Estado
    user: state.user,
    token: state.token,
    isAuthenticated: state.status === AUTH_STATES.AUTHENTICATED,
    isLoading: state.status === AUTH_STATES.LOADING,
    error: state.error,
    
    // Funciones
    login,
    register,
    logout,
    getProfile,
    checkAuth,
    refreshToken,
    clearError,
    
    // Utilidades
    isLoggedIn: () => state.status === AUTH_STATES.AUTHENTICATED,
    getUserId: () => state.user?.id || null,
    getUsername: () => state.user?.username || null,
    getUserEmail: () => state.user?.email || null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;