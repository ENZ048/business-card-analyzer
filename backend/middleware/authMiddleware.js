const jwt = require("jsonwebtoken");

/**
 * Protect routes with JWT authentication
 */
function protect(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user payload
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ error: "Not authorized, token invalid" });
  }
}

/**
 * Restrict routes to specific roles (optional)
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
