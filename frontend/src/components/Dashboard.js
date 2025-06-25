// components/Dashboard.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState('home');

  // Productos de ejemplo para la tienda de pinturas
  const productos = [
    { id: 1, nombre: 'Pintura Acrílica Roja', precio: 15.99, stock: 25, categoria: 'acrilica' },
    { id: 2, nombre: 'Pintura Óleo Azul', precio: 22.50, stock: 18, categoria: 'oleo' },
    { id: 3, nombre: 'Pintura Tempera Verde', precio: 8.75, stock: 40, categoria: 'tempera' },
    { id: 4, nombre: 'Pincel #12', precio: 5.99, stock: 30, categoria: 'herramientas' },
    { id: 5, nombre: 'Lienzo 30x40cm', precio: 12.00, stock: 20, categoria: 'lienzos' }
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>🔄 Cargando dashboard...</div>
      </div>
    );
  }

  const renderHome = () => (
    <div>
      <h2>🏠 Inicio</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <h3>📦 Total Productos</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
            {productos.length}
          </div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3>💰 Valor Inventario</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
            ${productos.reduce((sum, p) => sum + (p.precio * p.stock), 0).toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
          <h3>📊 Stock Total</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
            {productos.reduce((sum, p) => sum + p.stock, 0)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductos = () => (
    <div>
      <h2>🎨 Catálogo de Productos</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px',
        marginTop: '20px'
      }}>
        {productos.map(producto => (
          <div key={producto.id} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
              {producto.nombre}
            </h4>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Precio:</strong> ${producto.precio}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Stock:</strong> {producto.stock} unidades
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Categoría:</strong> {producto.categoria}
            </p>
            <button style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}>
              🛒 Agregar al Carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div>
      <h2>👤 Mi Perfil</h2>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginTop: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>Nombre de Usuario:</strong> {user?.username || 'No disponible'}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Email:</strong> {user?.email || 'No disponible'}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>ID de Usuario:</strong> {user?.id || 'No disponible'}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Fecha de Registro:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No disponible'}
        </div>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}>
          ✏️ Editar Perfil
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#343a40',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #495057', paddingBottom: '20px' }}>
          <h3 style={{ margin: '0', color: '#ffc107' }}>🎨 Paint Shop</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#adb5bd' }}>
            Hola, {user?.username}!
          </p>
        </div>

        <nav>
          <button
            onClick={() => setCurrentSection('home')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: currentSection === 'home' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px',
              textAlign: 'left',
              fontSize: '16px'
            }}
          >
            🏠 Inicio
          </button>
          
          <button
            onClick={() => setCurrentSection('productos')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: currentSection === 'productos' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px',
              textAlign: 'left',
              fontSize: '16px'
            }}
          >
            🎨 Productos
          </button>
          
          <button
            onClick={() => setCurrentSection('perfil')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: currentSection === 'perfil' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px',
              textAlign: 'left',
              fontSize: '16px'
            }}
          >
            👤 Mi Perfil
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #495057' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          minHeight: 'calc(100vh - 40px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {currentSection === 'home' && renderHome()}
          {currentSection === 'productos' && renderProductos()}
          {currentSection === 'perfil' && renderPerfil()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;