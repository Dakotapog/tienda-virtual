// components/Login.js
import React, { useState } from 'react';
import authService from '../services/auth';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('🔐 Iniciando login...');
      
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        setMessage(response.message || 'Login exitoso');
        console.log('✅ Login exitoso:', response.user);
        
        // Callback para notificar al componente padre
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
        
        // Opcional: Redireccionar
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setError(response.error || 'Error en el login');
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🔐 Iniciar Sesión
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Email Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Password Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Contraseña:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            required
            minLength="6"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {loading ? '🔄 Iniciando sesión...' : '🚀 Iniciar Sesión'}
        </button>

      </form>

      {/* Mensajes de error/éxito */}
      {error && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          ✅ {message}
        </div>
      )}

      {/* Link a Register */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>¿No tienes cuenta? <a href="/register">Regístrate aquí</a></p>
      </div>

      {/* Información de debug (solo en desarrollo) */}
      {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Debug Info:</strong>
          <br />
          Email: {formData.email}
          <br />
          Auth Status: {authService.isLoggedIn ? (authService.isLoggedIn() ? '✅ Logged In' : '❌ Not Logged In') : 'Auth service not available'}
          <br />
          Current User: {authService.getCurrentUser ? (authService.getCurrentUser()?.username || 'None') : 'Auth service not available'}
        </div>
      )}
    </div>
  );
};

// Exportación por defecto
export default Login;