const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

// Routes d'authentification
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes de récupération de mot de passe
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-reset-code', userController.verifyResetCode);
router.post('/reset-password', userController.resetPassword);

module.exports = router;