const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../models/database');
// ✅ CORRECCIÓN: Importar authenticateToken correctamente
const { authenticateToken } = require('./auth');

// Middleware para verificar autenticación en todas las rutas del carrito
router.use(authenticateToken);

// ==========================================
// OBTENER CARRITO DEL USUARIO
// ==========================================
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`🛒 Obteniendo carrito para usuario: ${userId}`);
        
        const cartItems = await allQuery(`
            SELECT 
                ci.id as cart_item_id,
                ci.quantity,
                ci.created_at as added_at,
                p.id as product_id,
                p.name,
                p.description,
                p.price,
                p.category,
                p.stock,
                p.image_url,
                (p.price * ci.quantity) as subtotal
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
            ORDER BY ci.created_at DESC
        `, [userId]);
        
        // Calcular total del carrito
        const total = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const totalItems = cartItems.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        
        console.log(`📊 Carrito: ${totalItems} productos, Total: $${total.toFixed(2)}`);
        
        res.json({
            success: true,
            data: {
                items: cartItems,
                summary: {
                    total_items: totalItems,
                    total_amount: parseFloat(total.toFixed(2))
                }
            },
            message: `Carrito obtenido exitosamente - ${totalItems} productos`
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el carrito'
        });
    }
});

// ==========================================
// AGREGAR PRODUCTO AL CARRITO
// ==========================================
router.post('/add', async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity = 1 } = req.body;
        
        console.log(`➕ Agregando al carrito - Usuario: ${userId}, Producto: ${product_id}, Cantidad: ${quantity}`);
        
        // Validaciones
        if (!product_id || product_id <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'El ID del producto es requerido y debe ser válido'
            });
        }
        
        // ✅ CORRECCIÓN: Validar que quantity sea un número válido
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Cantidad inválida',
                message: 'La cantidad debe ser un número entero positivo'
            });
        }
        
        // Verificar que el producto existe y tiene stock
        const product = await getQuery('SELECT * FROM products WHERE id = ?', [product_id]);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado',
                message: 'El producto solicitado no existe'
            });
        }
        
        if (product.stock < qty) {
            return res.status(400).json({
                success: false,
                error: 'Stock insuficiente',
                message: `Solo hay ${product.stock} unidades disponibles`
            });
        }
        
        // Verificar si el producto ya está en el carrito
        const existingItem = await getQuery(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );
        
        if (existingItem) {
            // Actualizar cantidad
            const newQuantity = existingItem.quantity + qty;
            
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: 'Stock insuficiente',
                    message: `Solo puedes agregar ${product.stock - existingItem.quantity} unidades más`
                });
            }
            
            await runQuery(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existingItem.id]
            );
            
            console.log(`✅ Cantidad actualizada: ${newQuantity} unidades de ${product.name}`);
            
            res.json({
                success: true,
                message: `Cantidad actualizada - ${newQuantity} unidades de ${product.name}`
            });
            
        } else {
            // Agregar nuevo item
            const result = await runQuery(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, qty]
            );
            
            console.log(`✅ Producto agregado al carrito - ID: ${result.lastID}`);
            
            res.status(201).json({
                success: true,
                message: `${product.name} agregado al carrito`,
                cart_item_id: result.lastID
            });
        }
        
    } catch (error) {
        console.error('❌ Error agregando al carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo agregar el producto al carrito'
        });
    }
});

// ==========================================
// ACTUALIZAR CANTIDAD DE PRODUCTO EN CARRITO
// ==========================================
router.put('/update/:cart_item_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { cart_item_id } = req.params;
        const { quantity } = req.body;
        
        console.log(`🔄 Actualizando carrito - Item: ${cart_item_id}, Nueva cantidad: ${quantity}`);
        
        // ✅ CORRECCIÓN: Validar que quantity sea un número válido
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Cantidad inválida',
                message: 'La cantidad debe ser un número entero positivo'
            });
        }
        
        // Verificar que el item existe y pertenece al usuario
        const cartItem = await getQuery(`
            SELECT ci.*, p.name, p.stock 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.id = ? AND ci.user_id = ?
        `, [cart_item_id, userId]);
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Item no encontrado',
                message: 'El producto no está en tu carrito'
            });
        }
        
        // Verificar stock
        if (qty > cartItem.stock) {
            return res.status(400).json({
                success: false,
                error: 'Stock insuficiente',
                message: `Solo hay ${cartItem.stock} unidades disponibles`
            });
        }
        
        // Actualizar cantidad
        await runQuery(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [qty, cart_item_id]
        );
        
        console.log(`✅ Cantidad actualizada: ${qty} unidades de ${cartItem.name}`);
        
        res.json({
            success: true,
            message: `Cantidad actualizada - ${qty} unidades de ${cartItem.name}`
        });
        
    } catch (error) {
        console.error('❌ Error actualizando carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo actualizar la cantidad'
        });
    }
});

// ==========================================
// ELIMINAR PRODUCTO DEL CARRITO
// ==========================================
router.delete('/remove/:cart_item_id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { cart_item_id } = req.params;
        
        console.log(`🗑️ Eliminando del carrito - Item: ${cart_item_id}`);
        
        // Verificar que el item existe y pertenece al usuario
        const cartItem = await getQuery(`
            SELECT ci.*, p.name 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.id = ? AND ci.user_id = ?
        `, [cart_item_id, userId]);
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Item no encontrado',
                message: 'El producto no está en tu carrito'
            });
        }
        
        // Eliminar item
        await runQuery('DELETE FROM cart_items WHERE id = ?', [cart_item_id]);
        
        console.log(`✅ Producto eliminado: ${cartItem.name}`);
        
        res.json({
            success: true,
            message: `${cartItem.name} eliminado del carrito`
        });
        
    } catch (error) {
        console.error('❌ Error eliminando del carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo eliminar el producto del carrito'
        });
    }
});

// ==========================================
// VACIAR CARRITO COMPLETO
// ==========================================
router.delete('/clear', async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`🧹 Vaciando carrito completo - Usuario: ${userId}`);
        
        // Verificar si hay items en el carrito
        const itemCount = await getQuery(
            'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
            [userId]
        );
        
        if (itemCount.count === 0) {
            return res.status(404).json({
                success: false,
                error: 'Carrito vacío',
                message: 'No hay productos en tu carrito'
            });
        }
        
        // Eliminar todos los items
        const result = await runQuery('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        
        console.log(`✅ Carrito vaciado - ${result.changes} productos eliminados`);
        
        res.json({
            success: true,
            message: `Carrito vaciado - ${result.changes} productos eliminados`
        });
        
    } catch (error) {
        console.error('❌ Error vaciando carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo vaciar el carrito'
        });
    }
});

// ==========================================
// OBTENER RESUMEN DEL CARRITO
// ==========================================
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`📊 Obteniendo resumen del carrito - Usuario: ${userId}`);
        
        const summary = await getQuery(`
            SELECT 
                COUNT(*) as total_items,
                SUM(ci.quantity) as total_quantity,
                SUM(p.price * ci.quantity) as total_amount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        `, [userId]);
        
        const summaryData = {
            total_items: summary.total_items || 0,
            total_quantity: summary.total_quantity || 0,
            total_amount: parseFloat((summary.total_amount || 0).toFixed(2))
        };
        
        console.log(`📊 Resumen: ${summaryData.total_items} tipos, ${summaryData.total_quantity} unidades, $${summaryData.total_amount}`);
        
        res.json({
            success: true,
            data: summaryData,
            message: 'Resumen del carrito obtenido exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el resumen del carrito'
        });
    }
});

// ==========================================
// VALIDAR CARRITO (VERIFICAR STOCK Y PRECIOS)
// ==========================================
router.post('/validate', async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`✅ Validando carrito - Usuario: ${userId}`);
        
        const cartItems = await allQuery(`
            SELECT 
                ci.id as cart_item_id,
                ci.quantity,
                p.id as product_id,
                p.name,
                p.price,
                p.stock,
                CASE 
                    WHEN ci.quantity > p.stock THEN 'insufficient_stock'
                    ELSE 'valid'
                END as status
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        `, [userId]);
        
        const invalidItems = cartItems.filter(item => item.status !== 'valid');
        const isValid = invalidItems.length === 0;
        
        console.log(`🔍 Validación: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'} - ${invalidItems.length} problemas encontrados`);
        
        res.json({
            success: true,
            data: {
                is_valid: isValid,
                items: cartItems,
                invalid_items: invalidItems,
                total_items: cartItems.length,
                invalid_count: invalidItems.length
            },
            message: isValid ? 'Carrito válido' : `Carrito tiene ${invalidItems.length} productos con problemas`
        });
        
    } catch (error) {
        console.error('❌ Error validando carrito:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo validar el carrito'
        });
    }
});

// ✅ IMPORTANTE: Exportar el router correctamente
module.exports = router;