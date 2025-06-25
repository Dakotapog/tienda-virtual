const express = require('express');
const { getQuery, allQuery } = require('../models/database');
const router = express.Router();

// 📦 GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Obteniendo todos los productos...');
        
        const products = await allQuery(`
            SELECT 
                id, 
                name, 
                description, 
                price, 
                category, 
                stock, 
                image_url,
                created_at
            FROM products 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            data: products,
            count: products.length,
            message: 'Productos obtenidos exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// 🔎 GET /api/products/search?q=query - Buscar productos
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Parámetro de búsqueda requerido',
                message: 'Debe proporcionar un término de búsqueda con el parámetro "q"'
            });
        }
        
        const searchTerm = `%${q.trim()}%`;
        console.log(`🔎 Buscando productos con término: "${q}"`);
        
        const products = await allQuery(`
            SELECT 
                id, 
                name, 
                description, 
                price, 
                category, 
                stock, 
                image_url,
                created_at
            FROM products 
            WHERE 
                name LIKE ? OR 
                description LIKE ? OR 
                category LIKE ?
            ORDER BY 
                CASE 
                    WHEN name LIKE ? THEN 1
                    WHEN category LIKE ? THEN 2
                    ELSE 3
                END,
                name ASC
        `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        
        res.json({
            success: true,
            data: products,
            count: products.length,
            searchTerm: q,
            message: `Se encontraron ${products.length} productos`
        });
        
    } catch (error) {
        console.error('❌ Error en búsqueda de productos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// 🏷️ GET /api/products/filter?category=&minPrice=&maxPrice= - Filtrar productos
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id
router.get('/filter', async (req, res) => {
    try {
        const { category, minPrice, maxPrice } = req.query;
        
        console.log('🏷️ Aplicando filtros:', { category, minPrice, maxPrice });
        
        // Construir query dinámicamente
        let whereConditions = [];
        let queryParams = [];
        
        if (category && category.trim() !== '') {
            whereConditions.push('category = ?');
            queryParams.push(category.trim());
        }
        
        if (minPrice && !isNaN(minPrice)) {
            whereConditions.push('price >= ?');
            queryParams.push(parseFloat(minPrice));
        }
        
        if (maxPrice && !isNaN(maxPrice)) {
            whereConditions.push('price <= ?');
            queryParams.push(parseFloat(maxPrice));
        }
        
        // Si no hay filtros, devolver todos los productos
        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = 'WHERE ' + whereConditions.join(' AND ');
        }
        
        const query = `
            SELECT 
                id, 
                name, 
                description, 
                price, 
                category, 
                stock, 
                image_url,
                created_at
            FROM products 
            ${whereClause}
            ORDER BY price ASC, name ASC
        `;
        
        const products = await allQuery(query, queryParams);
        
        res.json({
            success: true,
            data: products,
            count: products.length,
            filters: {
                category: category || null,
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null
            },
            message: `Se encontraron ${products.length} productos con los filtros aplicados`
        });
        
    } catch (error) {
        console.error('❌ Error filtrando productos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// 📊 GET /api/products/categories - Obtener todas las categorías disponibles
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id
router.get('/categories', async (req, res) => {
    try {
        console.log('📊 Obteniendo categorías disponibles...');
        
        const categories = await allQuery(`
            SELECT 
                category,
                COUNT(*) as product_count
            FROM products 
            GROUP BY category 
            ORDER BY category ASC
        `);
        
        res.json({
            success: true,
            data: categories,
            count: categories.length,
            message: 'Categorías obtenidas exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// 💰 GET /api/products/price-range - Obtener rango de precios
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id
router.get('/price-range', async (req, res) => {
    try {
        console.log('💰 Obteniendo rango de precios...');
        
        const priceRange = await getQuery(`
            SELECT 
                MIN(price) as min_price,
                MAX(price) as max_price,
                AVG(price) as avg_price,
                COUNT(*) as total_products
            FROM products
        `);
        
        res.json({
            success: true,
            data: {
                minPrice: parseFloat(priceRange.min_price),
                maxPrice: parseFloat(priceRange.max_price),
                avgPrice: parseFloat(priceRange.avg_price).toFixed(2),
                totalProducts: priceRange.total_products
            },
            message: 'Rango de precios obtenido exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo rango de precios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// 🔍 GET /api/products/:id - Obtener producto por ID
// ⚠️ IMPORTANTE: Esta ruta debe ir AL FINAL (después de todas las rutas específicas)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID de producto inválido',
                message: 'El ID debe ser un número válido'
            });
        }
        
        console.log(`🔍 Buscando producto con ID: ${id}`);
        
        const product = await getQuery(`
            SELECT 
                id, 
                name, 
                description, 
                price, 
                category, 
                stock, 
                image_url,
                created_at
            FROM products 
            WHERE id = ?
        `, [id]);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado',
                message: `No se encontró un producto con ID ${id}`
            });
        }
        
        res.json({
            success: true,
            data: product,
            message: 'Producto encontrado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

module.exports = router;