const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const DB_PATH = path.join(__dirname, '..', 'database.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error conectando a SQLite:', err.message);
    } else {
        console.log('✅ Conectado a SQLite database');
    }
});

// Función para ejecutar queries con promesas
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Función para obtener datos con promesas
const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Función para obtener múltiples datos con promesas
const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Inicializar base de datos
async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando base de datos...');
        
        // Crear tabla de usuarios
        await runQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Crear tabla de productos
        await runQuery(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category TEXT NOT NULL,
                stock INTEGER DEFAULT 0,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Crear tabla de carrito
        await runQuery(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        `);
        
        // Verificar si ya hay productos
        const productCount = await getQuery('SELECT COUNT(*) as count FROM products');
        
        if (productCount.count === 0) {
            console.log('📦 Insertando productos de ejemplo...');
            await insertSampleProducts();
        }
        
        console.log('✅ Base de datos inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    }
}

// Insertar productos de ejemplo (25 productos)
async function insertSampleProducts() {
    const products = [
        // Pinturas
        { name: 'Pintura Acrílica Blanca', description: 'Pintura acrílica de alta calidad color blanco mate', price: 15.99, category: 'Pinturas', stock: 50, image_url: 'https://via.placeholder.com/300x300/FFFFFF/000000?text=Pintura+Blanca' },
        { name: 'Pintura Acrílica Roja', description: 'Pintura acrílica brillante color rojo intenso', price: 18.50, category: 'Pinturas', stock: 35, image_url: 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Pintura+Roja' },
        { name: 'Pintura Acrílica Azul', description: 'Pintura acrílica color azul cielo, perfecta para interiores', price: 17.25, category: 'Pinturas', stock: 42, image_url: 'https://via.placeholder.com/300x300/0000FF/FFFFFF?text=Pintura+Azul' },
        { name: 'Pintura Acrílica Verde', description: 'Pintura acrílica color verde bosque, ideal para exteriores', price: 19.75, category: 'Pinturas', stock: 28, image_url: 'https://via.placeholder.com/300x300/008000/FFFFFF?text=Pintura+Verde' },
        { name: 'Pintura Acrílica Amarilla', description: 'Pintura acrílica color amarillo sol, alta cobertura', price: 16.80, category: 'Pinturas', stock: 33, image_url: 'https://via.placeholder.com/300x300/FFFF00/000000?text=Pintura+Amarilla' },
        
        // Pinceles
        { name: 'Pincel Plano N°2', description: 'Pincel de cerdas naturales, ideal para detalles finos', price: 5.50, category: 'Pinceles', stock: 75, image_url: 'https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Pincel+Plano' },
        { name: 'Pincel Redondo N°6', description: 'Pincel redondo de pelo sintético, multiuso', price: 7.25, category: 'Pinceles', stock: 60, image_url: 'https://via.placeholder.com/300x300/654321/FFFFFF?text=Pincel+Redondo' },
        { name: 'Pincel Brocha 3"', description: 'Brocha ancha para pintar superficies grandes', price: 12.00, category: 'Pinceles', stock: 25, image_url: 'https://via.placeholder.com/300x300/A0522D/FFFFFF?text=Brocha+3' },
        { name: 'Set de Pinceles', description: 'Set de 5 pinceles de diferentes tamaños', price: 25.99, category: 'Pinceles', stock: 20, image_url: 'https://via.placeholder.com/300x300/D2691E/FFFFFF?text=Set+Pinceles' },
        
        // Rodillos
        { name: 'Rodillo Antigoteo', description: 'Rodillo con sistema antigoteo para paredes', price: 8.75, category: 'Rodillos', stock: 40, image_url: 'https://via.placeholder.com/300x300/FF6347/FFFFFF?text=Rodillo+Antigoteo' },
        { name: 'Rodillo Texturizado', description: 'Rodillo para crear texturas en paredes', price: 11.50, category: 'Rodillos', stock: 22, image_url: 'https://via.placeholder.com/300x300/CD5C5C/FFFFFF?text=Rodillo+Textura' },
        { name: 'Rodillo Mini', description: 'Rodillo pequeño para rincones y espacios reducidos', price: 4.25, category: 'Rodillos', stock: 55, image_url: 'https://via.placeholder.com/300x300/DC143C/FFFFFF?text=Rodillo+Mini' },
        
        // Herramientas
        { name: 'Bandeja para Pintura', description: 'Bandeja plástica con rejilla para rodillo', price: 6.99, category: 'Herramientas', stock: 45, image_url: 'https://via.placeholder.com/300x300/2F4F4F/FFFFFF?text=Bandeja' },
        { name: 'Espátula Metálica', description: 'Espátula de acero inoxidable para raspar', price: 9.25, category: 'Herramientas', stock: 38, image_url: 'https://via.placeholder.com/300x300/708090/FFFFFF?text=Espatula' },
        { name: 'Cinta de Pintor', description: 'Cinta adhesiva especial para delimitar áreas', price: 3.50, category: 'Herramientas', stock: 80, image_url: 'https://via.placeholder.com/300x300/F0E68C/000000?text=Cinta+Pintor' },
        { name: 'Lija Grano 120', description: 'Papel de lija grano 120 para preparar superficies', price: 2.75, category: 'Herramientas', stock: 100, image_url: 'https://via.placeholder.com/300x300/DEB887/000000?text=Lija+120' },
        
        // Sprays
        { name: 'Spray Negro Mate', description: 'Pintura en spray color negro mate', price: 8.99, category: 'Sprays', stock: 30, image_url: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=Spray+Negro' },
        { name: 'Spray Plateado', description: 'Pintura en spray color plateado metalizado', price: 10.50, category: 'Sprays', stock: 25, image_url: 'https://via.placeholder.com/300x300/C0C0C0/000000?text=Spray+Plateado' },
        { name: 'Spray Transparente', description: 'Barniz en spray transparente brillante', price: 12.25, category: 'Sprays', stock: 18, image_url: 'https://via.placeholder.com/300x300/F8F8FF/000000?text=Spray+Transparente' },
        
        // Imprimantes
        { name: 'Imprimante Universal', description: 'Imprimante base agua para todo tipo de superficies', price: 22.50, category: 'Imprimantes', stock: 15, image_url: 'https://via.placeholder.com/300x300/DCDCDC/000000?text=Imprimante+Universal' },
        { name: 'Imprimante Anticorrosivo', description: 'Imprimante especial para metal, previene óxido', price: 28.75, category: 'Imprimantes', stock: 12, image_url: 'https://via.placeholder.com/300x300/B22222/FFFFFF?text=Imprimante+Anticorrosivo' },
        
        // Barnices
        { name: 'Barniz Mate', description: 'Barniz transparente acabado mate', price: 24.99, category: 'Barnices', stock: 20, image_url: 'https://via.placeholder.com/300x300/F5F5DC/000000?text=Barniz+Mate' },
        { name: 'Barniz Brillante', description: 'Barniz transparente acabado brillante', price: 26.50, category: 'Barnices', stock: 18, image_url: 'https://via.placeholder.com/300x300/FFD700/000000?text=Barniz+Brillante' },
        
        // Accesorios
        { name: 'Overol de Pintor', description: 'Overol desechable para proteger la ropa', price: 4.99, category: 'Accesorios', stock: 65, image_url: 'https://via.placeholder.com/300x300/FFFFFF/000000?text=Overol+Pintor' },
        { name: 'Guantes de Nitrilo', description: 'Guantes desechables resistentes a químicos', price: 8.25, category: 'Accesorios', stock: 90, image_url: 'https://via.placeholder.com/300x300/4169E1/FFFFFF?text=Guantes+Nitrilo' }
    ];
    
    for (const product of products) {
        await runQuery(
            'INSERT INTO products (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [product.name, product.description, product.price, product.category, product.stock, product.image_url]
        );
    }
    
    console.log(`✅ ${products.length} productos insertados correctamente`);
}

module.exports = {
    db,
    runQuery,
    getQuery,
    allQuery,
    initializeDatabase
};