const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "recruiter" }, // fixed
  status: { type: String, default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Recruiter", recruiterSchema);
