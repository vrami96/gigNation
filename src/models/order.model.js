const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    vendorNotes: {
        type: String,
        default: ''
    },
    media: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'other'],
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    totalDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Total discount cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    refundReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Create indexes for faster queries
orderSchema.index({ user: 1 });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.vendorId': 1 });

module.exports = mongoose.model('Order', orderSchema); 