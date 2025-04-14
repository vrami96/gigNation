const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    totalDiscount: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Total discount cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Total amount cannot be negative']
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Update lastUpdated timestamp before saving
cartSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Cart', cartSchema); 