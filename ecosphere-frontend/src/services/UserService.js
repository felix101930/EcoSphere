// services/UserService.js - Updated version
import { auth } from "../firebase/config";

class UserService {
  // Get all users from backend
  async getAllUsers() {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("http://localhost:3001/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  // Add user (Admin function - uses new endpoint)
  async addUser(userData) {
    try {
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(
        "http://localhost:3001/api/users/admin-create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            permissions: userData.permissions || [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding user:", error);
      throw new Error(error.message || "Failed to add user");
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(
        `http://localhost:3001/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions || [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error(error.message || "Failed to update user");
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(
        `http://localhost:3001/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error(error.message || "Failed to delete user");
    }
  }
}

export default new UserService();
