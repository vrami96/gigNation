const Category = require('../models/category.model');
const { validationResult } = require('express-validator');

const categoryController = {
  /**
   * Create a new category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  async createCategory(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const { name, description, image } = req.body;

      // Check if category already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      const category = new Category({
        name,
        description,
        image,
        status: 'active'
      });

      const savedCategory = await category.save();

      res.status(201).json({
        message: 'Category created successfully',
        category: savedCategory
      });
    } catch (error) {
      console.error('Error in create category:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ 
        message: 'Error creating category', 
        error: error 
      });
    }
  },

  /**
   * Get all categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  async getCategories(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = status ? { status } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const queryChain = Category.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const [categories, total] = await Promise.all([
        queryChain.exec(),
        Category.countDocuments(query)
      ]);

      res.status(200).json({
        categories,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        totalCategories: total
      });
    } catch (error) {
      console.error('Error in get all categories:', error);
      res.status(500).json({ 
        message: 'Error retrieving categories', 
        error: error 
      });
    }
  },

  /**
   * Get category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error('Error in get category by id:', error);
      res.status(500).json({ 
        message: 'Error retrieving category', 
        error: error 
      });
    }
  },

  /**
   * Update category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  async updateCategory(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const { name, description, image, status } = req.body;
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Update fields if provided
      if (name) category.name = name;
      if (description) category.description = description;
      if (image) category.image = image;
      if (status) category.status = status;

      const updatedCategory = await category.save();

      res.status(200).json({
        message: 'Category updated successfully',
        category: updatedCategory
      });
    } catch (error) {
      console.error('Error in update category:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ 
        message: 'Error updating category', 
        error: error 
      });
    }
  },

  /**
   * Delete category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response object
   */
  async deleteCategory(req, res) {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json({
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error in delete category:', error);
      res.status(500).json({ 
        message: 'Error deleting category', 
        error: error 
      });
    }
  }
};

module.exports = categoryController; 