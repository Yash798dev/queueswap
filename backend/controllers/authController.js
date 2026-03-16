const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        console.log('Register request body:', req.body);
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`[DEBUG] Registration failed: Email ${email} already exists in DB.`);
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken
        });

        await newUser.save();

        // Send email
        await emailService.sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verify = async (req, res) => {
    try {
        const { token } = req.params;
        const frontendUrl = 'https://queueswap-app.onrender.com';

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.redirect(`${frontendUrl}/login?verified=false&error=invalid_token`);
        }

        user.isVerified = true;
        user.verificationToken = undefined; // Clear token
        await user.save();

        // Redirect to frontend login page with success indicator
        res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        console.error('Verification error:', error);
        res.redirect('https://queueswap-app.onrender.com/login?verified=false&error=server_error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
