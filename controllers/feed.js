const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const { uploadFile, getFileStream, deleteImage } = require('../services/s3FileUpload');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    let totalItems = await Post.find().countDocuments();
    const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage).populate('creator', 'name');
    res.status(200).json({ message: 'Fetched posts successfully!', posts, totalItems });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    return next(error);
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    return next(error);
  }
  const s3Result = await uploadFile(req.file);
  console.log(req.file);
  console.log(s3Result);
  //const imageUrl = req.file.path.replace('\\', '/');
  const imageUrl = req.file.filename;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title,
    content,
    creator: req.userId,
    imageUrl
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post,
      creator: { _id: user._id, name: user.email }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId).populate('creator', 'name');
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: 'Post fetched', post });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    return next(error);
  }
  const { title, content } = req.body;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }

  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    return next(error);
  }

  try {
    const postToBeUpdated = await Post.findById(postId);
    if (!postToBeUpdated) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      next(error);
    }

    if (postToBeUpdated.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      next(error);
    }

    if (imageUrl !== postToBeUpdated.imageUrl) {
      clearImage(postToBeUpdated.imageUrl);
    }
    postToBeUpdated.title = title;
    postToBeUpdated.imageUrl = imageUrl;
    postToBeUpdated.content = content;
    await postToBeUpdated.save();
    res.status(200).json({ message: 'Post updated!', post: postToBeUpdated });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const postToBeDeleted = await Post.findById(postId);
    if (!postToBeDeleted) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      next(error);
    }

    clearImage(postToBeDeleted.imageUrl);
    await deleteImage(postToBeDeleted.imageUrl);

    if (postToBeDeleted.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      next(error);
    }

    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    user.save();
    res.status(200).json({ message: 'Post deleted!' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  filePath = filePath.replace("\\", "/");
  console.log(filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.getImage = (req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
}

