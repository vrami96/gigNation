const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Service image is required']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot be more than 100%']
  },
  duration: {
    type: Number,
    required: [true, 'Service duration is required'],
    min: [1, 'Duration must be at least 1 hour']
  },
  availability: {
    type: [String],
    required: [true, 'Service availability is required'],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one day must be selected'
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Service category is required']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service vendor is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema); 