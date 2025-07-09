const User = require("../models/candidate.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = require("../utils/generateToken");
const Joi = require("joi");
const {
  registerValidation,
  loginValidation,
} = require("../validations/auth.validation");
const sendEmail = require("../utils/sendEmail");
const { default: mongoose } = require("mongoose");


exports.getSubAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Validate adminId
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    // Check if requester is an admin
    const admin = await User.findById(adminId).select("role");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access subadmin data",
      });
    }

    // Find all subadmins (not just one)
    const subAdmins = await User.find({ role: "s-admin" }).select(
      "-password -__v"
    ); // Exclude sensitive fields

    if (!subAdmins.length) {
      return res.status(404).json({
        success: false,
        message: "No subadmins available",
      });
    }

    res.status(200).json({
      success: true,
      count: subAdmins.length,
      data: subAdmins,
    });
  } catch (error) {
    console.error("Error fetching subadmins:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching subadmins",
    });
  }
};

exports.updateSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subadmin ID' });
    }

    // Check if subadmin exists
    const subAdmin = await User.findById(id);
    if (!subAdmin || subAdmin.role !== 's-admin') {
      return res.status(404).json({ success: false, message: 'Subadmin not found' });
    }

    // Check for duplicate email/phone if being updated
    const orConditions = [];
    if (updates.email) orConditions.push({ email: updates.email });
    if (updates.phone) orConditions.push({ phone: updates.phone });

    if (orConditions.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: id }, // Exclude current subadmin
        $or: orConditions
      });

      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: 'Email or phone already in use by another user' 
        });
      }
    }

    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password; // Remove if empty
    }

    // Perform update
    const updatedSubAdmin = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json({
      success: true,
      message: 'Subadmin updated successfully',
      data: updatedSubAdmin
    });
  } catch (err) {
    console.error('Update subadmin error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating subadmin' 
    });
  }
};


exports.deleteSubAdmin = async (req, res) => {
  try {
    const { adminId , id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid subadmin ID' 
      });
    }

    // Check if subadmin exists
    const subAdmin = await User.findOne({ 
      _id: id,
      role: 's-admin' 
    });

    if (!subAdmin) {
      return res.status(404).json({ 
        success: false,
        message: 'Subadmin not found' 
      });
    }

     if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid Admin ID' 
      });
    }
    // Verify the requesting user is a super admin
    if (!adminId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Only super admins can delete subadmins' 
      });
    }

    // Perform deletion
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Subadmin deleted successfully',
      data: {
        id: id,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting subadmin' 
    });
  }
};


exports.register = async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { full_name, email, phone, password, role, status } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with email or phone." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email,
      phone,
      password: hashedPassword,
      role,
      status: status || "Active",
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status !== "Active") {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact your administrator for assistance.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        id: user._id,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    // Basic validation
    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required" });
    }
    if (!newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find user by candidateId
    const user = await User.findById(candidateId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  // You can handle token blacklist here if needed
  res.status(200).json({ message: "Logout successful" });
};

exports.addBulkCandidate = async (req, res) => {
  try {
    const candidates = req.body.candidates;
    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const savedCandidates = [];
    const errors = [];

    for (const candidateData of candidates) {
      try {
        // Check required fields
        const requiredFields = ["full_name", "email", "phone", "password"];
        for (const field of requiredFields) {
          if (!candidateData[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Check for existing user
        const existingUser = await User.findOne({
          $or: [{ email: candidateData.email }, { phone: candidateData.phone }],
        });
        if (existingUser) {
          throw new Error("User already exists with email or phone");
        }

        // Prepare candidate data
        const candidate = {
          full_name: candidateData.full_name,
          email: candidateData.email,
          phone: candidateData.phone,
          password: await bcrypt.hash(candidateData.password, 10),
          role: "candidate", // Default role
          dob: candidateData.dob ? new Date(candidateData.dob) : undefined,
          gender: candidateData.gender || undefined,
          city: candidateData.city || undefined,
          state: candidateData.state || undefined,
          status: candidateData.status || "Active",
        };

        // Save candidate to database
        const newCandidate = new User(candidate);
        await newCandidate.save();
        savedCandidates.push(newCandidate);
      } catch (error) {
        errors.push({
          candidate: candidateData.full_name || "Unknown",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Bulk upload processed",
      saved: savedCandidates.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with that email not found." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Instant Job - Secure Password Reset",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
            }
            
            .email-content {
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              position: relative;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx=".5" cy=".5" r=".5"><stop offset="0%" stop-color="%23ffffff" stop-opacity=".1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="20%" cy="20%" r="10%" fill="url(%23a)"/><circle cx="80%" cy="80%" r="15%" fill="url(%23a)"/></svg>') center/cover;
              opacity: 0.3;
            }
            
            .lock-icon {
              width: 60px;
              height: 60px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              position: relative;
              z-index: 1;
            }
            
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              position: relative;
              z-index: 1;
            }
            
            .header p {
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              position: relative;
              z-index: 1;
            }
            
            .body {
              padding: 40px 30px;
            }
            
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 20px;
            }
            
            .message {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            
            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
              margin-bottom: 25px;
            }
            
            .reset-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
            }
            
            .alternative-link {
              background: #f7fafc;
              border: 2px dashed #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin: 25px 0;
              word-break: break-all;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #4a5568;
            }
            
            .expiry-notice {
              background: linear-gradient(135deg, #fef5e7 0%, #fef3c7 100%);
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            
            .expiry-notice p {
              margin: 0;
              color: #92400e;
              font-weight: 500;
            }
            
            .security-tips {
              background: #f0f4f8;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
            }
            
            .security-tips h3 {
              color: #2d3748;
              font-size: 16px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
            }
            
            .security-tips ul {
              color: #4a5568;
              font-size: 14px;
              padding-left: 20px;
            }
            
            .security-tips li {
              margin-bottom: 8px;
            }
            
            .footer {
              background: #2d3748;
              color: #a0aec0;
              text-align: center;
              padding: 30px;
              font-size: 14px;
            }
            
            .footer p {
              margin-bottom: 10px;
            }
            
            .footer a {
              color: #90cdf4;
              text-decoration: none;
            }
            
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
            }
            
            @media only screen and (max-width: 600px) {
              .email-container {
                padding: 20px 10px;
              }
              
              .body {
                padding: 30px 20px;
              }
              
              .header {
                padding: 30px 20px;
              }
              
              .header h1 {
                font-size: 24px;
              }
              
              .reset-button {
                display: block;
                text-align: center;
                margin: 20px 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              <div class="header">
                <div class="lock-icon">
                  🔒
                </div>
                <h1>Password Reset Request</h1>
                <p>Secure password reset for your account</p>
              </div>
              
              <div class="body">
                <div class="greeting">
                  Hi ${user.full_name},
                </div>
                
                <div class="message">
                  We received a request to reset the password for your account. If you made this request, click the button below to create a new password.
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="reset-button">
                    Reset My Password
                  </a>
                </div>
                
                <div class="expiry-notice">
                  <p>⏰ <strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="message">
                  If the button above doesn't work, you can copy and paste this link into your browser:
                </div>
                
                <div class="alternative-link">
                  ${resetLink}
                </div>
                
                <div class="security-tips">
                  <h3>🛡️ Security Tips</h3>
                  <ul>
                    <li>Never share this link with anyone</li>
                    <li>If you didn't request this reset, you can safely ignore this email</li>
                    <li>Create a strong password with at least 8 characters</li>
                    <li>Use a combination of letters, numbers, and symbols</li>
                  </ul>
                </div>
                
                <div class="divider"></div>
                
                <div class="message" style="font-size: 14px; color: #718096;">
                  If you're having trouble or didn't request this password reset, please contact our support team immediately.
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Need Help?</strong></p>
                <p>Contact us at <a href="mailto:support@yourcompany.com">support@instantjob.in</a></p>
                <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                  This email was sent to ${user.email}. If you didn't request this, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.query;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword)
    return res.status(400).json({ message: "Please fill all fields." });

  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ message: "Invalid or expired token." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    res.status(400).json({ message: "Token is invalid or has expired." });
  }
};
