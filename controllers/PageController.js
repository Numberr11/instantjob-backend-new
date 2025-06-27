const Page = require('../models/PageModel');

// Create or Update Page
const createOrUpdatePage = async (req, res) => {
  try {
    const { title, content, slug } = req.body;
    if (!title || !content || !slug) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      // Update existing page
      existingPage.title = title;
      existingPage.content = content;
      await existingPage.save();
      return res.status(200).json(existingPage);
    } else {
      // Create new page
      const page = new Page({ title, content, slug });
      await page.save();
      return res.status(201).json(page);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Pages
const getAllPages = async (req, res) => {
  try {
    const pages = await Page.find();
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Page by Slug
const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Page
const deletePage = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOneAndDelete({ slug });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.status(200).json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrUpdatePage,
  getAllPages,
  getPageBySlug,
  deletePage,
};