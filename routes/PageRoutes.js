const express = require('express');
const {
  createOrUpdatePage,
  getAllPages,
  getPageBySlug,
  deletePage,
} = require('../controllers/PageController');

const router = express.Router();

// CRUD Routes
router.post('/create', createOrUpdatePage); // Create or Update
router.get('/', getAllPages); // Get all pages
router.get('/get/pages/:slug', getPageBySlug); // Get page by slug
router.delete('/:slug', deletePage); // Delete page

module.exports = router;