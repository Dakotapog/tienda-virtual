// components/Register.js
import React, { useState } from 'react';
import authService from '../services/auth';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  // Validar formulario antes de enviar
  const validateForm = () => {
    if (!formData.username || formData.username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validar antes de enviar
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('👤 Iniciando registro...');
      
      const response = await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.success) {
        setMessage(response.message || 'Registro exitoso');
        console.log('✅ Registro exitoso:', response.user);
        
        // Limpiar formulario
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Callback para notificar al componente padre
        if (onRegisterSuccess) {
          onRegisterSuccess(response.user);
        }
        
        // Opcional: Redireccionar al login o dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(response.error || 'Error en el registro');
      }

    } catch (error) {
      console.error('❌ Error en registro:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        👤 Crear Cuenta
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Username Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nombre de Usuario:
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Mínimo 3 caracteres"
            required
            minLength="3"
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

        {/* Confirm Password Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Confirmar Contraseña:
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repite tu contraseña"
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
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {loading ? '🔄 Creando cuenta...' : '🚀 Crear Cuenta'}
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

      {/* Link a Login */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
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
          Username: {formData.username}
          <br />
          Email: {formData.email}
          <br />
          Password Match: {formData.password === formData.confirmPassword ? '✅' : '❌'}
          <br />
          Auth Status: {authService.isLoggedIn ? (authService.isLoggedIn() ? '✅ Logged In' : '❌ Not Logged In') : 'Auth service not available'}
        </div>
      )}
    </div>
  );
};

// Exportación por defecto
export default Register;