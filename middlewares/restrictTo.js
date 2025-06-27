const jwt = require('jsonwebtoken');

const restrictTo = (...allowedRoles) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token missing' });
  }
  // Token extract karo
  const token = authHeader.split(' ')[1];
  try {
    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    // Role check karo
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
module.exports = restrictTo;