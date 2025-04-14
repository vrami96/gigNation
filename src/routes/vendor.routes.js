const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { query, body } = require('express-validator');

// Apply auth middleware to all vendor routes
router.use(authMiddleware);

/**
 * @swagger
 * /vendors/categories:
 *   get:
 *     summary: Get all categories with pagination and filters
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
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
 *         description: Filter by favorite status
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/categories', roleMiddleware(['vendor']), vendorController.getCategories);

/**
 * @swagger
 * /vendors/profile:
 *   get:
 *     summary: Get vendor's profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, vendorController.getProfile);

/**
 * @swagger
 * /vendors/profile:
 *   put:
 *     summary: Update vendor's profile
 *     tags: [Vendor]
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
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessDescription:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               businessPhone:
 *                 type: string
 *               businessEmail:
 *                 type: string
 *               businessWebsite:
 *                 type: string
 *               businessLogo:
 *                 type: string
 *               businessBanner:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               businessType:
 *                 type: string
 *               businessRegistrationNumber:
 *                 type: string
 *               businessTaxNumber:
 *                 type: string
 *               businessLicenseNumber:
 *                 type: string
 *               businessLicenseExpiry:
 *                 type: string
 *               businessLicenseFile:
 *                 type: string
 *               businessInsuranceNumber:
 *                 type: string
 *               businessInsuranceExpiry:
 *                 type: string
 *               businessInsuranceFile:
 *                 type: string
 *               businessBankName:
 *                 type: string
 *               businessBankAccountNumber:
 *                 type: string
 *               businessBankAccountName:
 *                 type: string
 *               businessBankAccountType:
 *                 type: string
 *               businessBankAccountBranch:
 *                 type: string
 *               businessBankAccountIFSC:
 *                 type: string
 *               businessBankAccountSwift:
 *                 type: string
 *               businessBankAccountIBAN:
 *                 type: string
 *               businessBankAccountRouting:
 *                 type: string
 *               businessBankAccountCurrency:
 *                 type: string
 *               businessBankAccountCountry:
 *                 type: string
 *               businessBankAccountAddress:
 *                 type: string
 *               businessBankAccountCity:
 *                 type: string
 *               businessBankAccountState:
 *                 type: string
 *               businessBankAccountZip:
 *                 type: string
 *               businessBankAccountPhone:
 *                 type: string
 *               businessBankAccountEmail:
 *                 type: string
 *               businessBankAccountWebsite:
 *                 type: string
 *               businessBankAccountLogo:
 *                 type: string
 *               businessBankAccountBanner:
 *                 type: string
 *               businessBankAccountCategory:
 *                 type: string
 *               businessBankAccountRegistrationNumber:
 *                 type: string
 *               businessBankAccountTaxNumber:
 *                 type: string
 *               businessBankAccountLicenseNumber:
 *                 type: string
 *               businessBankAccountLicenseExpiry:
 *                 type: string
 *               businessBankAccountLicenseFile:
 *                 type: string
 *               businessBankAccountInsuranceNumber:
 *                 type: string
 *               businessBankAccountInsuranceExpiry:
 *                 type: string
 *               businessBankAccountInsuranceFile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authMiddleware, vendorController.updateProfile);

/**
 * @swagger
 * /vendors/services:
 *   get:
 *     summary: Get vendor's services with pagination and filters
 *     tags: [Vendor]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by service name or description
 *     responses:
 *       200:
 *         description: List of services
 *       500:
 *         description: Server error
 */
router.get('/services', authMiddleware, vendorController.getServices);

/**
 * @swagger
 * /vendors/orders:
 *   get:
 *     summary: Get vendor's orders with filters and pagination
 *     tags: [Vendor]
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
 *         description: Filter by order item status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by orderId or customer name
 *     responses:
 *       200:
 *         description: List of orders with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     ordersByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalAmount:
 *                             type: number
 *                     totalRevenue:
 *                       type: number
 *                 filters:
 *                   type: object
 *                   properties:
 *                     availableStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get(
    '/orders',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
        query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
            .withMessage('Invalid status'),
        query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
        query('endDate').optional().isDate().withMessage('End date must be a valid date'),
        query('sortBy').optional().isString().withMessage('Sort field must be a string'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        query('search').optional().isString().withMessage('Search term must be a string')
    ],
    authMiddleware,
    vendorController.getOrders
);

/**
 * @swagger
 * /vendors/orders/{orderId}/items/{itemId}:
 *   put:
 *     summary: Update status of a specific order item
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in_progress, completed, cancelled]
 *                 description: New status for the order item
 *               vendorNotes:
 *                 type: string
 *                 description: Optional notes from the vendor
 *     responses:
 *       200:
 *         description: Order item status updated successfully
 *       404:
 *         description: Order item not found
 *       500:
 *         description: Server error
 */
router.put('/orders/:orderId/items/:itemId', authMiddleware, vendorController.updateOrderItemStatus);

/**
 * @swagger
 * /vendors/orders/statistics:
 *   get:
 *     summary: Get statistics for vendor's order items
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Order statistics
 *       500:
 *         description: Server error
 */
router.get('/orders/statistics', authMiddleware, vendorController.getOrderStatistics);

/**
 * @swagger
 * /vendors/orders/{orderId}/items/{itemId}/media:
 *   post:
 *     summary: Add media to an order item
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL of the media file
 *               type:
 *                 type: string
 *                 enum: [image, video, document, other]
 *                 description: Type of media
 *               name:
 *                 type: string
 *                 description: Name of the media file
 *               description:
 *                 type: string
 *                 description: Optional description of the media
 *     responses:
 *       200:
 *         description: Media added successfully
 *       400:
 *         description: Invalid media type
 *       404:
 *         description: Order item not found
 *       500:
 *         description: Server error
 */
router.post(
    '/orders/:orderId/items/:itemId/media',
    [
        body('url').isURL().withMessage('Invalid URL'),
        body('type').isIn(['image', 'video', 'document', 'other']).withMessage('Invalid media type'),
        body('name').notEmpty().withMessage('Media name is required')
    ],
    authMiddleware,
    vendorController.addOrderItemMedia
);

/**
 * @swagger
 * /vendors/orders/{orderId}/items/{itemId}/media/{mediaId}:
 *   delete:
 *     summary: Remove media from an order item
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order item ID
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media removed successfully
 *       404:
 *         description: Order item or media not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/orders/:orderId/items/:itemId/media/:mediaId',
    authMiddleware,
    vendorController.removeOrderItemMedia
);

/**
 * @swagger
 * /vendors/dashboard:
 *   get:
 *     summary: Get vendor dashboard statistics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     servicesCount:
 *                       type: integer
 *                       description: Total number of services added by the vendor
 *                     totalOrdersCount:
 *                       type: integer
 *                       description: Total number of orders received
 *                     incompleteOrdersCount:
 *                       type: integer
 *                       description: Number of orders that are not completed
 *                     totalEarnings:
 *                       type: number
 *                       description: Total earnings from completed orders
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 orderStatusDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Order status
 *                       count:
 *                         type: integer
 *                         description: Number of orders with this status
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authMiddleware, vendorController.getDashboard);

module.exports = router; 