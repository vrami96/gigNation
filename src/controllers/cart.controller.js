const Cart = require('../models/cart.model');
const Service = require('../models/service.model');
const { validationResult } = require('express-validator');

const cartController = {
  async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.service');
      if (!cart) {
        return res.status(200).json({
          items: [],
          totalAmount: 0
        });
      }
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving cart',
        error
      });
    }
  },

  async addToCart(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { serviceId, quantity } = req.body;
      const userId = req.user.userId;

      // Validate service exists
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Check service availability
      if (!service.availability) {
        return res.status(400).json({ message: 'Service is not available' });
      }

      // Find or create cart
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          totalAmount: 0
        });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.service.toString() === serviceId
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity = quantity;
        cart.items[existingItemIndex].price = service.price;
      } else {
        // Add new item
        cart.items.push({
          service: serviceId,
          quantity: quantity,
          price: service.price
        });
      }

      // Calculate total amount
      cart.totalAmount = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Save cart
      await cart.save();
      
      // Populate service details
      const populatedCart = await cart.populate('items.service');

      return res.status(200).json({
        message: 'Item added to cart successfully',
        cart: {
          _id: populatedCart._id,
          user: populatedCart.user,
          items: populatedCart.items.map(item => ({
            service: {
              _id: item.service._id,
              name: item.service.name,
              price: item.service.price,
              availability: item.service.availability
            },
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: populatedCart.totalAmount
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
  },

  async updateCartItem(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { _id: userId } = req.user;
      const { itemId } = req.params;
      const { quantity } = req.body;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate('items.service');
      res.status(200).json({
        message: 'Cart item updated successfully',
        cart: updatedCart
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error updating cart item',
        error
      });
    }
  },

  async removeFromCart(req, res) {
    try {
      const { _id: userId } = req.user;
      const { itemId } = req.params;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      cart.items.splice(itemIndex, 1);
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate('items.service');
      res.status(200).json({
        message: 'Item removed from cart successfully',
        cart: updatedCart
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error removing item from cart',
        error
      });
    }
  },

  async clearCart(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      cart.items = [];
      cart.totalAmount = 0;

      const updatedCart = await cart.save();

      res.status(200).json({
        message: 'Cart cleared successfully',
        cart: updatedCart
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error clearing cart',
        error
      });
    }
  }
};

module.exports = cartController; 