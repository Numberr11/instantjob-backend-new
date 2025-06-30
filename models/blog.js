const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
  },
  categories: [{
    type: String,
    required: true
  }],
  author: {
    type: String,
    required: true
  },
  publishDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  readTime: {
    type: String,
    required: true
  },
  description: [{
    heading: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  }],
}, {timestamps: true});

module.exports = mongoose.model('Blog', blogSchema);