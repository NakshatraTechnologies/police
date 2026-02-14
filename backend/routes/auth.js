import express from "express";
import User from "../models/User.js";

const router = express.Router();
const ADMIN_SECRET_KEY = "admin_reset_code_123"; // The "Built-in Code"

// Seed Default Admin (Run once on server start conceptually, or check here)
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: "admin@example.com" });
        if (!adminExists) {
            await User.create({ email: "admin@example.com", password: "admin123" });
            console.log("Default admin created");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};
seedAdmin();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            res.json({ message: "Login success", token: "dummy-token-jwt-" + user._id, user: { email: user.email } });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, newPassword, secretKey } = req.body;

    if (secretKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: "Invalid Recovery Code" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/register", (req, res) => {
    res.json({ message: "Register success" });
});

export default router;
