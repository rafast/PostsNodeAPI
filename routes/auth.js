const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.put('/signup', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom(async (value, { req }) => {
      return await User.findOne({ email: value });
    }).normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 5 }),
  body('name')
    .trim()
    .not()
    .isEmpty()
], authController.signup);

router.post('/login', authController.login);

router.get('/currentUserStatus', isAuth, authController.getStatus);
router.post('/updateUserStatus', isAuth, authController.updateStatus);

module.exports = router;