/**
 * Authentication Middleware
 * 
 * Simple token-based authentication for protecting routes
 * 
 * IMPORTANT: This is a simplified auth system for development/testing
 * The "token" is actually a JSON string of the user object stored in localStorage
 * NOT suitable for production - should use proper JWT tokens with signing
 * 
 * For production, consider:
 * - Using Firebase Auth (firebaseAuthController.js)
 * - Implementing proper JWT with secret key
 * - Adding token expiration and refresh logic
 */

/**
 * Protect route middleware
 * 
 * Validates authentication token and attaches user to request
 * Token is expected to be a JSON string of user object
 * Used to protect routes that require authentication
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} req.headers - HTTP headers
 * @param {string} req.headers.authorization - Bearer token or JSON user object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @throws {401} If authorization header is missing
 * @throws {401} If token format is invalid (not valid JSON)
 * @throws {401} If any other authentication error occurs
 * 
 * @example
 * // Usage in routes:
 * router.get('/protected', protect, (req, res) => {
 *   // req.user contains parsed user object
 *   console.log(req.user.email, req.user.role);
 * });
 * 
 * // Frontend sends token:
 * fetch('/api/protected', {
 *   headers: {
 *     'Authorization': 'Bearer ' + JSON.stringify(userObject)
 *   }
 * });
 */
const protect = (req, res, next) => {
  try {
    // Log authentication attempt for debugging
    console.log('🔐 Auth middleware - checking authorization');

    // Get token from Authorization header
    // Expected format: "Bearer <token>" or just "<token>"
    const authHeader = req.headers.authorization;

    // Validate authorization header exists
    // This is the first line of defense
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Extract token from header
    // Remove 'Bearer ' prefix if present (standard format)
    // Otherwise use header value as-is (fallback for simple format)
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)  // Remove "Bearer " (7 characters)
      : authHeader;

    // Log token presence for debugging (don't log full token for security)
    console.log('🔑 Token received (first 50 chars):', token.substring(0, 50));

    // Parse user object from token
    // Token is expected to be JSON string of user object
    // This is NOT secure - just for development/testing
    try {
      // Parse JSON string to user object
      const user = JSON.parse(token);

      // Log successful authentication
      console.log('✅ User authenticated:', user.email, 'ID:', user.id);

      // Attach user to request object
      // Downstream middleware and controllers can access req.user
      req.user = user;

      // Continue to next middleware/controller
      next();
    } catch (parseError) {
      // Token is not valid JSON
      // This happens if:
      // - Token was corrupted
      // - Token was manually edited
      // - Wrong token format was sent
      console.log('❌ Token parse error:', parseError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
  } catch (error) {
    // Catch any other unexpected errors
    // This is a safety net for edge cases
    console.log('❌ Auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = { protect };
