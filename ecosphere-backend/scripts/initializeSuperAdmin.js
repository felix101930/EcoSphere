// backend/scripts/initializeSuperAdmin.js
const admin = require("../firebase/admin");
const fs = require("fs");
const path = require("path");

async function initializeSuperAdmin() {
  try {
    if (!admin) {
      console.error("❌ Firebase Admin not initialized");
      return;
    }

    // Path to users.json
    const usersPath = path.join(__dirname, "../../mock-data/users.json");

    // Read existing users
    let usersData;
    try {
      usersData = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    } catch (error) {
      // If file doesn't exist, create it
      usersData = { users: [], nextId: 1 };
    }

    const superAdminEmail = "superadmin@ecosphere.com";
    const superAdminPassword = "superadmin123";

    console.log("🚀 Initializing Super Admin system...");

    // 1. Check if Super Admin already exists in Firebase
    try {
      const existingUser = await admin.auth().getUserByEmail(superAdminEmail);
      console.log(
        `✅ Super Admin already exists in Firebase (UID: ${existingUser.uid})`
      );

      // Check if Super Admin exists in our database
      const dbUser = usersData.users.find((u) => u.email === superAdminEmail);
      if (dbUser) {
        console.log(
          `✅ Super Admin already exists in database (ID: ${dbUser.id})`
        );
      } else {
        // Add Super Admin to database
        const newSuperAdmin = {
          id: 1,
          firstName: "Super",
          lastName: "Admin",
          email: superAdminEmail,
          role: "SuperAdmin",
          permissions: [],
          firebaseUid: existingUser.uid,
          createdAt: new Date().toISOString(),
        };

        usersData.users.unshift(newSuperAdmin); // Add at beginning
        usersData.nextId = Math.max(usersData.nextId, 2); // Ensure nextId is at least 2

        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        console.log(`✅ Added Super Admin to database (ID: 1)`);
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // 2. Create Super Admin in Firebase
        console.log(`🆕 Creating Super Admin in Firebase...`);
        const firebaseUser = await admin.auth().createUser({
          email: superAdminEmail,
          password: superAdminPassword,
          displayName: "Super Admin",
          emailVerified: true,
          disabled: false,
        });

        console.log(
          `✅ Created Super Admin in Firebase (UID: ${firebaseUser.uid})`
        );

        // 3. Create Super Admin in our database
        const newSuperAdmin = {
          id: 1,
          firstName: "Super",
          lastName: "Admin",
          email: superAdminEmail,
          role: "SuperAdmin",
          permissions: [],
          firebaseUid: firebaseUser.uid,
          createdAt: new Date().toISOString(),
        };

        // Remove any existing user with ID 1
        usersData.users = usersData.users.filter((u) => u.id !== 1);
        usersData.users.unshift(newSuperAdmin); // Add at beginning
        usersData.nextId = Math.max(usersData.nextId, 2); // Ensure nextId is at least 2

        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        console.log(`✅ Created Super Admin in database (ID: 1)`);
      } else {
        throw error;
      }
    }

    console.log("\n🎯 Super Admin initialization complete!");
    console.log("📋 Login credentials:");
    console.log("   Email: superadmin@ecosphere.com");
    console.log("   Password: superadmin123");
    console.log("\n🔑 Permissions:");
    console.log("   - Can create Admins and Team Members");
    console.log("   - Can delete any user except themselves");
    console.log("   - Has access to all Management features");
  } catch (error) {
    console.error("❌ Error initializing Super Admin:", error.message);
    console.error("Stack:", error.stack);
  }
}

initializeSuperAdmin();
