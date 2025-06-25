// services/auth.js
class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.tokenKey = 'auth_token';
    this.userKey = 'auth_user';
  }

  // ==========================================
  // UTILIDADES PARA TOKENS Y ALMACENAMIENTO
  // ==========================================
  
  getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.warn('localStorage no disponible, usando memoria');
      return this._memoryToken || null;
    }
  }

  setToken(token) {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.warn('localStorage no disponible, usando memoria');
      this._memoryToken = token;
    }
  }

  removeToken() {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch (error) {
      console.warn('localStorage no disponible, limpiando memoria');
      this._memoryToken = null;
      this._memoryUser = null;
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('localStorage no disponible, usando memoria');
      return this._memoryUser || null;
    }
  }

  setCurrentUser(user) {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.warn('localStorage no disponible, usando memoria');
      this._memoryUser = user;
    }
  }

  // ==========================================
  // VERIFICAR ESTADO DE AUTENTICACIÓN
  // ==========================================
  
  isLoggedIn() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // ==========================================
  // HEADERS CON AUTENTICACIÓN
  // ==========================================
  
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ==========================================
  // MANEJO DE RESPUESTAS HTTP
  // ==========================================
  
  async handleResponse(response) {
    let data;
    
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Respuesta del servidor inválida');
    }

    if (!response.ok) {
      // El backend devuelve errores con success: false
      throw new Error(data.message || data.error || `HTTP Error: ${response.status}`);
    }

    return data;
  }

  // ==========================================
  // REGISTRO DE USUARIO
  // ==========================================
  
  async register(userData) {
    try {
      console.log('🔄 AuthService: Iniciando registro...');
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data) {
        // El backend devuelve: { success: true, data: { user, token } }
        this.setToken(data.data.token);
        this.setCurrentUser(data.data.user);
        
        console.log('✅ AuthService: Registro exitoso');
        
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message || 'Registro exitoso'
        };
      }

      return {
        success: false,
        error: data.message || 'Error en el registro'
      };

    } catch (error) {
      console.error('❌ AuthService: Error en registro:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  // ==========================================
  // LOGIN DE USUARIO
  // ==========================================
  
  async login(credentials) {
    try {
      console.log('🔄 AuthService: Iniciando login...');
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials)
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data) {
        // El backend devuelve: { success: true, data: { user, token } }
        this.setToken(data.data.token);
        this.setCurrentUser(data.data.user);
        
        console.log('✅ AuthService: Login exitoso');
        
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message || 'Login exitoso'
        };
      }

      return {
        success: false,
        error: data.message || 'Error en el login'
      };

    } catch (error) {
      console.error('❌ AuthService: Error en login:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  
  logout() {
    console.log('🔄 AuthService: Cerrando sesión...');
    this.removeToken();
    console.log('✅ AuthService: Sesión cerrada');
    
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  }

  // ==========================================
  // OBTENER PERFIL
  // ==========================================
  
  async getProfile() {
    try {
      console.log('🔄 AuthService: Obteniendo perfil...');
      
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data) {
        // Actualizar usuario local
        this.setCurrentUser(data.data.user);
        
        console.log('✅ AuthService: Perfil obtenido');
        
        return {
          success: true,
          user: data.data.user,
          message: data.message || 'Perfil obtenido exitosamente'
        };
      }

      return {
        success: false,
        error: data.message || 'Error obteniendo perfil'
      };

    } catch (error) {
      console.error('❌ AuthService: Error obteniendo perfil:', error);
      
      // Si el token es inválido, limpiar sesión
      if (error.message.includes('Token') || error.message.includes('401') || error.message.includes('403')) {
        this.logout();
      }
      
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  // ==========================================
  // VERIFICAR TOKEN
  // ==========================================
  
  async verifyToken() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No hay token disponible'
        };
      }

      console.log('🔄 AuthService: Verificando token...');
      
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data) {
        // Actualizar usuario local
        this.setCurrentUser(data.data.user);
        
        console.log('✅ AuthService: Token válido');
        
        return {
          success: true,
          user: data.data.user,
          message: data.message || 'Token válido'
        };
      }

      return {
        success: false,
        error: data.message || 'Token inválido'
      };

    } catch (error) {
      console.error('❌ AuthService: Error verificando token:', error);
      
      // Si el token es inválido, limpiar sesión
      this.logout();
      
      return {
        success: false,
        error: error.message || 'Token inválido'
      };
    }
  }

  // ==========================================
  // RENOVAR TOKEN
  // ==========================================
  
  async refreshToken() {
    try {
      console.log('🔄 AuthService: Renovando token...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data) {
        this.setToken(data.data.token);
        this.setCurrentUser(data.data.user);
        
        console.log('✅ AuthService: Token renovado');
        
        return {
          success: true,
          token: data.data.token,
          user: data.data.user,
          message: data.message || 'Token renovado exitosamente'
        };
      }

      return {
        success: false,
        error: data.message || 'Error renovando token'
      };

    } catch (error) {
      console.error('❌ AuthService: Error renovando token:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  // ==========================================
  // VERIFICAR ESTADO DEL SERVICIO
  // ==========================================
  
  async checkServiceStatus() {
    try {
      const response = await fetch(`${this.baseURL}/auth/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await this.handleResponse(response);
      
      return {
        success: true,
        status: data.data || data,
        message: 'Servicio disponible'
      };

    } catch (error) {
      console.error('❌ AuthService: Servicio no disponible:', error);
      return {
        success: false,
        error: 'Servicio de autenticación no disponible'
      };
    }
  }
}

// Crear y exportar instancia única (Singleton)
const authService = new AuthService();

export default authService;