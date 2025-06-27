const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);