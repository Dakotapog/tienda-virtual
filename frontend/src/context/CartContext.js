// frontend/src/context/CartContext.js - VERSIÓN CORREGIDA
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Reducer para manejar las acciones del carrito
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Si el producto ya existe, aumentar la cantidad
        return {
          ...state,
          items: state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        // Si es un producto nuevo, agregarlo con la cantidad especificada
        return {
          ...state,
          items: [...state.items, { ...product, quantity: quantity }]
        };
      }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || []
      };
    
    case 'SYNC_CART':
      // Para sincronizar con el servidor
      return {
        ...state,
        items: action.payload || []
      };
    
    default:
      return state;
  }
};

// Estado inicial del carrito
const initialState = {
  items: []
};

// Provider del contexto del carrito
export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialState);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log('🛒 Cargando carrito desde localStorage:', savedCart);
      dispatch({ type: 'LOAD_CART', payload: savedCart });
    } catch (error) {
      console.error('❌ Error cargando carrito desde localStorage:', error);
      dispatch({ type: 'LOAD_CART', payload: [] });
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      console.log('💾 Guardando carrito en localStorage:', cartState.items);
      localStorage.setItem('cart', JSON.stringify(cartState.items));
    } catch (error) {
      console.error('❌ Error guardando carrito en localStorage:', error);
    }
  }, [cartState.items]);

  // Funciones del carrito - CORREGIDAS
  const addToCart = (product, quantity = 1) => {
    console.log('🛒 Agregando al carrito:', { product: product.name, quantity });
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { product, quantity } 
    });
  };

  const removeFromCart = (productId) => {
    console.log('🗑️ Removiendo del carrito:', productId);
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    console.log('🔢 Actualizando cantidad:', { productId, quantity });
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    console.log('🧹 Limpiando carrito');
    dispatch({ type: 'CLEAR_CART' });
  };

  const syncCart = (serverCartItems) => {
    console.log('🔄 Sincronizando carrito con servidor:', serverCartItems);
    dispatch({ type: 'SYNC_CART', payload: serverCartItems });
  };

  // Calcular totales
  const getTotalItems = () => {
    const total = cartState.items.reduce((total, item) => total + item.quantity, 0);
    console.log('📊 Total items:', total);
    return total;
  };

  const getTotalPrice = () => {
    const total = cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('💰 Total precio:', total);
    return total;
  };

  const getCartItems = () => {
    console.log('📋 Items del carrito:', cartState.items);
    return cartState.items;
  };

  const isInCart = (productId) => {
    const exists = cartState.items.some(item => item.id === productId);
    console.log(`🔍 ¿Producto ${productId} en carrito?:`, exists);
    return exists;
  };

  const getItemQuantity = (productId) => {
    const item = cartState.items.find(item => item.id === productId);
    const quantity = item ? item.quantity : 0;
    console.log(`🔢 Cantidad del producto ${productId}:`, quantity);
    return quantity;
  };

  // Debug: Imprimir estado del carrito cuando cambie
  useEffect(() => {
    console.log('🛒 Estado del carrito actualizado:', {
      totalItems: getTotalItems(),
      totalPrice: getTotalPrice(),
      items: cartState.items
    });
  }, [cartState.items]);

  const value = {
    // Estado
    items: cartState.items,
    // Funciones
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    // Utilidades
    getTotalItems,
    getTotalPrice,
    getCartItems,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;