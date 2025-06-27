const Contact = require('../models/contactModels');

exports.createContact = async (req, res) => {
  try {
    const { fullName, email, mobileNo, queryType, description } = req.body;

    // Create new contact entry
    const newContact = new Contact({
      fullName,
      email,
      mobileNo,
      queryType,
      description,
    });

    // Save to database
    await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: newContact,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit query',
      error: error.message,
    });
  }
};