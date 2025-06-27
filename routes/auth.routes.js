const express = require('express');
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
require('dotenv').config();

const { register, login, logout, updatePassword, addBulkCandidate, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-pass/:candidateId', updatePassword)
router.post('/add-bulk-candidate',addBulkCandidate)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const role = req.user.role;
    // ✅ Send token + role back to Next.js
    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${token}&role=${req.user.role}&id=${req.user._id}`
    );
  }
);




module.exports = router;
