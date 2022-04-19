const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { email, name, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await new User({
      email,
      password: hashedPassword,
      name
    });

    await user.save();
    res.status(201).json({ message: 'User created!', userId: user._id });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('A user with this email could not be found');
      error.message = 'A user with this email could not be found';
      error.statusCode = 401;
      throw error;
    }

    if (!bcrypt.compare(password, user.password)) {
      const error = new Error('Invalid email or password');
      error.message = 'Invalid email or password';
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({
      email: user.email,
      userId: user._id.toString()
    }, 'supersecretkey', { expiresIn: '1h' });
    res.status(200).json({ token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
    return err;
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.userId);
    res.status(200).json({ status: currentUser.status });

  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const { status } = req.body;
  try {
    const currentUser = await User.findById(req.userId);
    currentUser.status = status;
    await currentUser.save();
    res.status(200).json({ message: 'Status successfully updated!' });

  } catch (err) {
    next(err);
  }
};