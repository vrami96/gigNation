const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const { body, param, query } = require('express-validator');

// Apply auth middleware to all user routes
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, vendor, admin]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /users/categories:
 *   get:
 *     summary: Get all categories with pagination and favourite filter
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: isFavourite
 *         schema:
 *           type: boolean
 *         description: Filter by favourite status
 *     responses:
 *       200:
 *         description: List of categories
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/categories',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    query('isFavourite').optional().isBoolean().withMessage('isFavourite must be a boolean')
  ],
  userController.listCategories
);

/**
 * @swagger
 * /users/services:
 *   get:
 *     summary: Get all services with pagination and category filter
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: List of services
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/services',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    query('categoryId').optional().isMongoId().withMessage('Valid category ID is required')
  ],
  userController.listServices
);

/**
 * @swagger
 * /users/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart details
 *       401:
 *         description: Unauthorized
 */
router.get('/cart', userController.getCart);

/**
 * @swagger
 * /users/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - categoryId
 *               - quantity
 *             properties:
 *               serviceId:
 *                 type: string
 *                 description: ID of the service
 *               categoryId:
 *                 type: string
 *                 description: ID of the category
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the service
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/cart',
  [
    body('serviceId').isMongoId().withMessage('Valid service ID is required'),
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  userController.addToCart
);

/**
 * @swagger
 * /users/cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.put(
  '/cart/:itemId',
  [
    param('itemId').isMongoId().withMessage('Valid cart item ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  userController.updateCartItem
);

/**
 * @swagger
 * /users/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.delete(
  '/cart/:itemId',
  [
    param('itemId').isMongoId().withMessage('Valid cart item ID is required')
  ],
  userController.removeFromCart
);

/**
 * @swagger
 * /users/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/cart', userController.clearCart);

/**
 * @swagger
 * /users/order:
 *   get:
 *     summary: Get user's orders with pagination and filters
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/order',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
        query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
            .withMessage('Invalid status')
    ],
    userController.getOrders
);

/**
 * @swagger
 * /users/order:
 *   post:
 *     summary: Create a new order
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - serviceId
 *                     - categoryId
 *                     - quantity
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     categoryId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/order',
    [
        body('items').isArray().notEmpty().withMessage('Items array is required'),
        body('items.*.serviceId').isMongoId().withMessage('Valid service ID is required'),
        body('items.*.categoryId').isMongoId().withMessage('Valid category ID is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    userController.createOrder
);

/**
 * @swagger
 * /users/order/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/order/:id',
    [
        param('id').isMongoId().withMessage('Valid order ID is required')
    ],
    userController.getOrderById
);

/**
 * @swagger
 * /users/order/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/order/:id/cancel',
    [
        param('id').isMongoId().withMessage('Valid order ID is required')
    ],
    userController.cancelOrder
);

module.exports = router; 