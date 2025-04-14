const Service = require('../models/service.model');
const Category = require('../models/category.model');
const { validationResult } = require('express-validator');

const serviceController = {
  create: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, image, category, price, discount, duration, availability } = req.body;

      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const serviceData = {
        name,
        description,
        image,
        price,
        discount: discount || 0,
        duration,
        availability,
        category,
        vendor: req.user.id
      };

      const service = new Service(serviceData);
      const savedService = await service.save();

      res.status(201).json({
        message: 'Service created successfully',
        service: savedService
      });
    } catch (error) {
      console.error('Error in create:', error);
      res.status(500).json({ message: 'Error creating service' });
    }
  },

  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, category } = req.query;
      const query = { vendor: req.user.id };

      if (category) {
        query.category = category;
      }

      const services = await Service.find(query)
        .populate('category', 'name description image')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const count = await Service.countDocuments(query);

      res.status(200).json({
        services,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalServices: count
      });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ message: 'Error fetching services' });
    }
  },

  getById: async (req, res) => {
    try {
      const service = await Service.findOne({
        _id: req.params.id,
        vendor: req.user.id
      }).populate('category', 'name description image');

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      res.status(200).json(service);
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ message: 'Error fetching service' });
    }
  },

  update: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, image, category, price, discount, duration, availability } = req.body;
      const service = await Service.findOne({
        _id: req.params.id,
        vendor: req.user.id
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(404).json({ message: 'Category not found' });
        }
        service.category = category;
      }

      if (name) service.name = name;
      if (description) service.description = description;
      if (image) service.image = image;
      if (price !== undefined) service.price = price;
      if (discount !== undefined) service.discount = discount;
      if (duration !== undefined) service.duration = duration;
      if (availability) service.availability = availability;

      await service.save();
      res.status(200).json({ message: 'Service updated successfully', service });
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({ message: 'Error updating service' });
    }
  },

  remove: async (req, res) => {
    try {
      const service = await Service.findOneAndDelete({
        _id: req.params.id,
        vendor: req.user.id
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error in remove:', error);
      res.status(500).json({ message: 'Error deleting service' });
    }
  },

  getByCategory: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Get services for the category and vendor
      const query = {
        category: categoryId,
        vendor: req.user.id
      };

      const services = await Service.find(query)
        .populate('category', 'name description image')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const count = await Service.countDocuments(query);

      res.status(200).json({
        services,
        category,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalServices: count
      });
    } catch (error) {
      console.error('Error in getByCategory:', error);
      res.status(500).json({ message: 'Error fetching services by category' });
    }
  }
};

module.exports = serviceController; 