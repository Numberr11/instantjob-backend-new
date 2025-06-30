const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { uploadBlogImage } = require('../middlewares/multerS3');

// Routes
router.post('/create', uploadBlogImage.single('image'), blogController.createBlog);
router.get('/get-all', blogController.getAllBlogs);
router.get('/get-paginated', blogController.getPaginatedBlogs);
router.get('/categories', blogController.getCategories);
router.get('/get/:slug', blogController.getBlogBySlug);
router.put('/update/:slug', uploadBlogImage.single('image'), blogController.updateBlog);
router.delete('/delete/:slug', blogController.deleteBlog);

module.exports = router;