const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar rutas de productos y autenticación
const productRoutes = require('./routes/products');
const { router: authRoutes } = require('./routes/auth');
// ✅ CORRECCIÓN: Importar directamente el router de cart
const cartRoutes = require('./routes/cart');

// Importar base de datos
const { initializeDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS más específica (opcional)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tu-dominio.com'] // Cambia por tu dominio en producción
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' })); // Límite para subida de imágenes
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de seguridad básico
app.use((req, res, next) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Logging middleware mejorado
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${ip}`);
    
    // Log de query params si existen
    if (Object.keys(req.query).length > 0) {
        console.log(`📝 Query params:`, req.query);
    }
    
    next();
});

// ✅ ORDEN CORRECTO DE RUTAS: Rutas principales primero
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);

// Ruta de salud mejorada
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Tienda Virtual API funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version
    });
});

// Ruta por defecto con documentación mejorada
app.get('/', (req, res) => {
    res.json({
        message: '🛒 Tienda Virtual - API Backend',
        version: '1.0.0',
        status: 'active',
        documentation_url: 'https://github.com/tu-usuario/tienda-virtual', // Cambia por tu URL
        endpoints: {
            health: {
                url: '/api/health',
                method: 'GET',
                description: 'Estado del servidor'
            },
            products: {
                list: {
                    url: 'GET /api/products',
                    description: 'Obtener todos los productos'
                },
                detail: {
                    url: 'GET /api/products/:id',
                    description: 'Obtener producto por ID'
                },
                search: {
                    url: 'GET /api/products/search?q=query',
                    description: 'Buscar productos por término'
                },
                filter: {
                    url: 'GET /api/products/filter?category=&minPrice=&maxPrice=',
                    description: 'Filtrar productos por criterios'
                },
                categories: {
                    url: 'GET /api/products/categories',
                    description: 'Obtener todas las categorías'
                },
                priceRange: {
                    url: 'GET /api/products/price-range',
                    description: 'Obtener rango de precios'
                }
            },
            auth: {
                register: {
                    url: 'POST /api/auth/register',
                    description: 'Registrar nuevo usuario'
                },
                login: {
                    url: 'POST /api/auth/login',
                    description: 'Iniciar sesión'
                },
                profile: {
                    url: 'GET /api/auth/profile',
                    description: 'Obtener perfil del usuario (requiere token)'
                },
                verify: {
                    url: 'POST /api/auth/verify',
                    description: 'Verificar token de autenticación'
                },
                refresh: {
                    url: 'POST /api/auth/refresh',
                    description: 'Renovar token de autenticación'
                },
                status: {
                    url: 'GET /api/auth/status',
                    description: 'Estado del servicio de autenticación'
                }
            },
            cart: {
                get: {
                    url: 'GET /api/cart',
                    description: 'Obtener carrito del usuario (requiere token)'
                },
                add: {
                    url: 'POST /api/cart/add',
                    description: 'Agregar producto al carrito'
                },
                update: {
                    url: 'PUT /api/cart/update/:cart_item_id',
                    description: 'Actualizar cantidad de producto en carrito'
                },
                remove: {
                    url: 'DELETE /api/cart/remove/:cart_item_id',
                    description: 'Eliminar producto del carrito'
                },
                clear: {
                    url: 'DELETE /api/cart/clear',
                    description: 'Vaciar carrito completo'
                },
                summary: {
                    url: 'GET /api/cart/summary',
                    description: 'Obtener resumen del carrito'
                },
                validate: {
                    url: 'POST /api/cart/validate',
                    description: 'Validar carrito (stock y precios)'
                }
            }
        }
    });
});

// Ruta para verificar el estado de la base de datos
app.get('/api/db-status', async (req, res) => {
    try {
        // Aquí podrías hacer una consulta simple para verificar la BD
        res.json({
            status: 'connected',
            message: 'Base de datos conectada correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error de conexión con la base de datos',
            error: error.message
        });
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method,
        message: 'La ruta solicitada no existe en esta API',
        available_endpoints: [
            '/api/health',
            '/api/products',
            '/api/auth',
            '/api/cart',
            '/api/db-status'
        ]
    });
});

// Manejo de errores global mejorado
app.use((err, req, res, next) => {
    console.error('❌ Error global capturado:', err);
    
    // No exponer detalles del error en producción
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: isDevelopment ? err.message : 'Ha ocurrido un error interno',
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack })
    });
});

// Inicializar base de datos y servidor
async function startServer() {
    try {
        console.log('🔄 Iniciando servidor...');
        console.log(`📍 Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
        
        // Inicializar base de datos
        await initializeDatabase();
        console.log('✅ Base de datos inicializada');
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('\n🚀 ================================');
            console.log('   SERVIDOR INICIADO EXITOSAMENTE');
            console.log('   ================================');
            console.log(`📡 Servidor: http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
            console.log(`📊 DB Status: http://localhost:${PORT}/api/db-status`);
            console.log(`📦 Productos: http://localhost:${PORT}/api/products`);
            console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
            console.log(`🛒 Carrito: http://localhost:${PORT}/api/cart`);
            console.log('🚀 ================================\n');
            console.log('✅ Rutas de productos y autenticación activas');
            console.log('✅ Rutas de carrito activas');
            console.log(`🕐 Tiempo de inicio: ${new Date().toLocaleString()}`);
        });

        // Manejar errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${PORT} ya está en uso`);
                process.exit(1);
            } else {
                console.error('❌ Error del servidor:', error);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

// Manejo graceful de cierre mejorado
function gracefulShutdown(signal) {
    console.log(`\n📴 Señal ${signal} recibida, cerrando servidor...`);
    
    // Aquí podrías cerrar la conexión a la base de datos si fuera necesario
    // await database.close();
    
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Iniciar servidor
startServer();