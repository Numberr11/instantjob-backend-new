const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Recruiter = require("../models/recruiter");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validate input
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for existing email
    const existing = await Recruiter.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create recruiter
    const recruiter = new Recruiter({ full_name, email, password: hashed });
    await recruiter.save();

    // Return the created recruiter
    res.status(201).json({
      message: "Recruiter registered",
      recruiter: {
        _id: recruiter._id,
        full_name: recruiter.full_name,
        email: recruiter.email,
        createdAt: recruiter.createdAt,
        updatedAt: recruiter.updatedAt,
        __v: recruiter.__v,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) 
      return res.status(400).json({ message: "Recruiter not found" });

    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) 
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: recruiter._id, role: recruiter.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, recruiter: { id: recruiter._id, email, role: recruiter.role } });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.get("/get-all", async (req,res) => {
  try {

    const recruiters = await Recruiter.find({status: 'active'}).select('-password -role')
    res.status(200).json({
      message: "Recruiters fetched successfully",
      recruiters
    })    
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiters.",
      error: err.message,
    });
  }
})

router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, password } = req.body;

    // Validate input
    if (!full_name && !email && !password) {
      return res.status(400).json({ message: 'At least one field (full_name, email, or password) is required' });
    }

    // Find recruiter
    const recruiter = await Recruiter.findById(id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    // Prepare updates
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (email) {
      // Check if new email is already in use by another recruiter
      const existing = await Recruiter.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      updates.email = email;
    }
    if (password) {
      // Hash new password
      updates.password = await bcrypt.hash(password, 10);
    }

    // Update recruiter
    const updatedRecruiter = await Recruiter.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, select: '-password' } // Exclude password from response
    );

    res.status(200).json({
      message: 'Recruiter updated successfully',
      recruiter: updatedRecruiter,
    });
  } catch (err) {
    console.error('Update recruiter error:', err);
    res.status(500).json({ message: 'Failed to update recruiter', error: err.message });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find and update recruiter status to inactive
    const recruiter = await Recruiter.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true }
    );
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.status(200).json({ message: 'Recruiter marked as inactive successfully' });
  } catch (err) {
    console.error('Update recruiter status error:', err);
    res.status(500).json({ message: 'Failed to update recruiter status', error: err.message });
  }
});


module.exports = router;
