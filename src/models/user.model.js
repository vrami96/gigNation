const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  // Vendor-specific fields
  vendorInfo: {
    businessName: {
      type: String,
      required: function() { return this.role === 'vendor'; }
    },
    businessAddress: {
      type: String,
      required: function() { return this.role === 'vendor'; }
    },
    businessPhone: {
      type: String,
      required: function() { return this.role === 'vendor'; }
    },
    businessDescription: String,
    businessCategory: {
      type: String,
      enum: ['restaurant', 'retail', 'service', 'other']
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  // User-specific fields
  userInfo: {
    phoneNumber: String,
    address: String,
    preferences: {
      type: Map,
      of: String
    }
  },
  // Common fields for all roles
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to generate reset token
userSchema.methods.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  return resetToken;
};

// Method to remove sensitive data from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// Update timestamps on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Method to check if user is vendor
userSchema.methods.isVendor = function() {
  return this.role === 'vendor';
};

const User = mongoose.model('User', userSchema);

module.exports = User; 