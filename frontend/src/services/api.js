// services/api.js - VERSIÓN CORREGIDA
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
    
    // ✅ CORREGIDO: Buscar 'authToken' en lugar de 'token'
    if (typeof window !== 'undefined' && window.localStorage) {
      this.token = localStorage.getItem('authToken'); // 🔴 CAMBIO CRÍTICO
    }
  }

  // Configurar headers dinámicamente
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // ✅ CORREGIDO: Actualizar token en memoria y localStorage
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        localStorage.setItem('authToken', token); // 🔴 CAMBIO CRÍTICO
      } else {
        localStorage.removeItem('authToken'); // 🔴 CAMBIO CRÍTICO
      }
    }
  }

  // ✅ Método mejorado para hacer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      credentials: 'include', // Para CORS
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      console.log(`🚀 API Request: ${config.method || 'GET'} ${url}`);
      console.log(`🔑 Token presente: ${!!this.token}`);
      
      const response = await fetch(url, config);
      
      // ✅ Verificar status HTTP primero
      if (!response.ok) {
        // Manejar errores HTTP específicos
        if (response.status === 401) {
          this.setToken(null);
          throw new Error('Token requerido o inválido');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado');
        } else if (response.status === 404) {
          throw new Error('Recurso no encontrado');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor');
        }
      }

      const data = await response.json();
      console.log(`📥 API Response:`, data);

      // ✅ Manejo mejorado de la respuesta
      if (response.ok && !data.success && data.error) {
        // Si el servidor responde con éxito HTTP pero indica error en el body
        throw new Error(data.error || data.message || 'Error desconocido');
      }

      // ✅ Si es 401 desde el body de respuesta (algunos backends lo manejan así)
      if (data.error && (data.error.includes('token') || data.error.includes('Unauthorized'))) {
        this.setToken(null);
        throw new Error('Token requerido o inválido');
      }

      return data;

    } catch (error) {
      console.error(`❌ API Error: ${error.message}`);
      
      // ✅ Manejo mejorado de errores de autenticación
      if (error.message.includes('Token requerido') || 
          error.message.includes('Unauthorized') || 
          error.message.includes('token')) {
        this.setToken(null);
        // No redirigir automáticamente, dejar que el componente maneje el error
        console.warn('🔐 Token inválido, limpiado de localStorage');
      }
      
      throw error;
    }
  }

  // ✅ Método para verificar si hay token válido
  hasValidToken() {
    return !!this.token;
  }

  // ✅ Método para obtener token actual
  getToken() {
    return this.token;
  }

  // Métodos HTTP básicos
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ========== ENDPOINTS DE AUTENTICACIÓN ==========
  
  // POST /api/auth/register
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  // POST /api/auth/login (acepta email O username)
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  // GET /api/auth/profile (requiere token)
  async getProfile() {
    if (!this.token) {
      throw new Error('Token requerido para obtener perfil');
    }
    return this.get('/auth/profile');
  }

  // POST /api/auth/verify
  async verifyToken() {
    if (!this.token) {
      throw new Error('No hay token para verificar');
    }
    return this.post('/auth/verify', {});
  }

  // POST /api/auth/refresh (requiere token)
  async refreshToken() {
    if (!this.token) {
      throw new Error('Token requerido para refresh');
    }
    const response = await this.post('/auth/refresh', {});
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  // GET /api/auth/status
  async getAuthStatus() {
    return this.get('/auth/status');
  }

  // Logout (limpia token local)
  logout() {
    this.setToken(null);
    return Promise.resolve({ success: true, message: 'Sesión cerrada' });
  }

  // ========== ENDPOINTS DE PRODUCTOS ==========
  
  // GET /api/products → Lista todos
  async getProducts() {
    return this.get('/products');
  }

  // GET /api/products/:id → Detalle por ID
  async getProductById(id) {
    return this.get(`/products/${id}`);
  }

  // GET /api/products/search?q=query → Búsqueda
  async searchProducts(query) {
    return this.get(`/products/search?q=${encodeURIComponent(query)}`);
  }

  // GET /api/products/filter?category=&minPrice=&maxPrice= → Filtros
  async filterProducts(filters) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    
    return this.get(`/products/filter?${params.toString()}`);
  }

  // GET /api/products/categories → Categorías disponibles
  async getCategories() {
    return this.get('/products/categories');
  }

  // GET /api/products/price-range → Rango de precios
  async getPriceRange() {
    return this.get('/products/price-range');
  }

  // ========== ENDPOINTS DE CARRITO ==========
  
  // GET /api/cart → Obtener carrito (requiere token)
  async getCart() {
    if (!this.token) {
      throw new Error('Token requerido para obtener carrito');
    }
    return this.get('/cart');
  }

  // ✅ POST /api/cart/add → Agregar producto (MEJORADO)
  async addToCart(productData) {
    if (!this.token) {
      throw new Error('Token requerido para agregar al carrito');
    }
    
    // ✅ Validar datos del producto
    if (!productData.product_id) {
      throw new Error('ID del producto es requerido');
    }
    
    if (!productData.quantity || productData.quantity < 1) {
      throw new Error('Cantidad debe ser mayor a 0');
    }

    console.log('🛒 Enviando al carrito:', productData);
    return this.post('/cart/add', productData);
  }

  // PUT /api/cart/update/:cart_item_id → Actualizar cantidad
  async updateCartItem(cartItemId, quantity) {
    if (!this.token) {
      throw new Error('Token requerido para actualizar carrito');
    }
    return this.put(`/cart/update/${cartItemId}`, { quantity });
  }

  // DELETE /api/cart/remove/:cart_item_id → Eliminar producto
  async removeCartItem(cartItemId) {
    if (!this.token) {
      throw new Error('Token requerido para eliminar del carrito');
    }
    return this.delete(`/cart/remove/${cartItemId}`);
  }

  // DELETE /api/cart/clear → Vaciar carrito
  async clearCart() {
    if (!this.token) {
      throw new Error('Token requerido para vaciar carrito');
    }
    return this.delete('/cart/clear');
  }

  // GET /api/cart/summary → Resumen del carrito
  async getCartSummary() {
    if (!this.token) {
      throw new Error('Token requerido para obtener resumen del carrito');
    }
    return this.get('/cart/summary');
  }

  // POST /api/cart/validate → Validar carrito
  async validateCart() {
    if (!this.token) {
      throw new Error('Token requerido para validar carrito');
    }
    return this.post('/cart/validate', {});
  }

  // ========== ENDPOINTS DE SALUD ==========
  
  // GET /api/health → Estado del servidor
  async getHealth() {
    return this.get('/health');
  }

  // GET /api/db-status → Estado de base de datos
  async getDbStatus() {
    return this.get('/db-status');
  }
}

// Crear instancia singleton
const apiService = new ApiService();

// Exportar por defecto (recomendado)
export default apiService;

// También exportar métodos individuales para compatibilidad
export const getProducts = () => apiService.getProducts();
export const getProductById = (id) => apiService.getProductById(id);
export const searchProducts = (query) => apiService.searchProducts(query);
export const filterProducts = (filters) => apiService.filterProducts(filters);
export const getCategories = () => apiService.getCategories();
export const getPriceRange = () => apiService.getPriceRange();

export const login = (credentials) => apiService.login(credentials);
export const register = (userData) => apiService.register(userData);
export const getProfile = () => apiService.getProfile();
export const logout = () => apiService.logout();

export const getCart = () => apiService.getCart();
export const addToCart = (productData) => apiService.addToCart(productData);
export const updateCartItem = (cartItemId, quantity) => apiService.updateCartItem(cartItemId, quantity);
export const removeCartItem = (cartItemId) => apiService.removeCartItem(cartItemId);
export const clearCart = () => apiService.clearCart();