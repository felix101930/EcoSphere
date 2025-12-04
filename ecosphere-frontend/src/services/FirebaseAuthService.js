// src/services/FirebaseAuthService.js
class FirebaseAuthService {
  static async loginWithEmailPassword(email, password) {
    // This is now handled by Firebase directly in AuthContext
    // Keeping this as a placeholder for other Firebase operations
    throw new Error("Use AuthContext login method instead");
  }

  static async signupWithEmailPassword(email, password, userData) {
    // This is now handled by Firebase directly in AuthContext
    throw new Error("Use AuthContext signup method instead");
  }

  static async resetPassword(email) {
    // This is now handled by Firebase directly in AuthContext
    throw new Error("Use AuthContext resetPassword method instead");
  }
}

export default FirebaseAuthService;
