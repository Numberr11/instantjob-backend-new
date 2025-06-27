const mongoose = require('mongoose');

  const employerSchema = new mongoose.Schema({
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'employer',
      enum: ['employer'],
    },
    companyName: {
      type: String,
      required: true,
    },
    companyLogo: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    contactNumber: {
      type: String,
      default: '',
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '1-10',
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
    }
  },{timestamps: true});

  module.exports = mongoose.model("Employer", employerSchema);
