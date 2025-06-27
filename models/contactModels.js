const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    
  },
  mobileNo: {
    type: String,
    required: [true, 'Mobile number is required'],
  },
  queryType: {
    type: String,
    required: [true, 'Query type is required'],
    enum: {
      values: ['general', 'job', 'support', 'other'],
      message: 'Invalid query type',
    },
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    
  },
}, {timestamps: true});

module.exports = mongoose.model('Contact', contactSchema);