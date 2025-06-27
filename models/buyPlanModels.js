const mongoose = require('mongoose');

const buyPlanlanSchema = new mongoose.Schema({
  name: { type: String, required: true },                
  price: { type: Number, required: true },               // Price in currency
  validityInDays: { type: Number, required: true },      // Kitne din valid hai
  jobPostLimit: { type: Number, required: true },        // Kitne job post kar sakte hain (-1 = unlimited)
  resumeViewLimit: { type: Number, required: true },     // Kitne resumes dekh sakte hain (-1 = unlimited)
  maxJobDescriptionLength: { type: Number, required: true }, // Job description max length in chars
  maxAppliesPerJob: { type: Number, required: true },    // Max applies per job post
  applyExpiryDays: { type: Number, required: true },     // Kitne din tak apply kar sakte hain
  supportType: { type: String, required: true },         // Support type: Email, Priority, Manager
  featuredJobBoost: { type: Boolean, default: false }    // Kya featured job boost milta hai
}, { timestamps: true });

module.exports = mongoose.model('BuyPlan', buyPlanlanSchema);
