import React from 'react';
import { useAuth } from '../context/AuthContext';

const TestProtected = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div style={{ padding: '20px', border: '2px solid green' }}>
      <h2>🔒 Página Protegida - Test</h2>
      <p>✅ Si ves esto, PrivateRoute funciona correctamente!</p>
      <p><strong>Usuario:</strong> {user?.username || 'No disponible'}</p>
      <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
      <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</p>
      <p><strong>ID Usuario:</strong> {user?.id || 'No disponible'}</p>
    </div>
  );
};

export default TestProtected;
