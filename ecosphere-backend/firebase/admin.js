// ecosphere-backend/firebase/admin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin
let firebaseAdmin;

try {
  // Check if we're in production (Vercel) or development
  if (process.env.NODE_ENV === "production") {
    // For Vercel production
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    // For local development with .env file
    console.log("🔧 Initializing Firebase Admin with .env credentials...");
    console.log(
      "Project ID:",
      process.env.FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing"
    );
    console.log(
      "Client Email:",
      process.env.FIREBASE_CLIENT_EMAIL ? "✓ Set" : "✗ Missing"
    );

    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PRIVATE_KEY
    ) {
      console.error("❌ Missing Firebase credentials in .env file");
      console.error(
        "Create .env file with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
      firebaseAdmin = null;
    } else {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error.message);
  console.error("Check your .env file and Firebase credentials");
  firebaseAdmin = null;
}

module.exports = firebaseAdmin;
