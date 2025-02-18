const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Register new user
exports.register = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            otp
        });
        
        await newUser.save();

        // Send OTP via email or SMS (Using Twilio)
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        client.messages.create({
            body: `Your OTP for registration is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: mobile
        });

        res.status(201).json({ message: "OTP sent to your mobile number!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error in registration!" });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.otp !== parseInt(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.isVerified = true;
        user.otp = null; // Clear OTP after verification
        await user.save();

        res.status(200).json({ message: "Account verified!" });
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP" });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        if (!user.isVerified) {
            return res.status(400).json({ message: "Please verify your email or mobile" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.otp = otp;
        await user.save();

        // Send OTP via email or SMS
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        client.messages.create({
            body: `Your OTP for password reset is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.mobile
        });

        res.status(200).json({ message: "OTP sent for password reset" });
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP for password reset" });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.otp !== parseInt(otp)) return res.status(400).json({ message: "Invalid OTP" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null; // Clear OTP after password reset
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Error resetting password" });
    }
};
