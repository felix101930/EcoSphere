// User Routes - API endpoints
const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

// User CRUD routes
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

// Authentication routes
router.post('/auth/login', UserController.login);

module.exports = router;
