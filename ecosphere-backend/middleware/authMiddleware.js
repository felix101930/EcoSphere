// Simple authentication middleware
// Note: This project uses simple token-based auth without JWT
// The token is just the user object stored in localStorage

const protect = (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - checking authorization');
    
    // Get token from header (it's actually a JSON string of user object)
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Extract token (remove 'Bearer ' prefix if present)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    console.log('🔑 Token received (first 50 chars):', token.substring(0, 50));
    
    // Parse user from token
    try {
      const user = JSON.parse(token);
      console.log('✅ User authenticated:', user.email, 'ID:', user.id);
      req.user = user;
      next();
    } catch (parseError) {
      console.log('❌ Token parse error:', parseError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = { protect };
