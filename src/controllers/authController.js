const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password, role, organizationId, organizationName } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            let userOrganization;

            // If organizationId is provided, use existing organization
            if (organizationId) {
                userOrganization = await Organization.findById(organizationId);
                if (!userOrganization) {
                    return res.status(404).json({ message: 'Organization not found' });
                }
            }
            // If no organizationId but role is not superadmin, create new organization
            else if (role !== 'superadmin') {
                userOrganization = new Organization({
                    name: organizationName || "My Company",
                    maxUsers: 1
                });
                await userOrganization.save();
            }

            const user = new User({
                email,
                password,
                role,
                organization: userOrganization?._id // Will be undefined for superadmin
            });

            await user.save();

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.status(201).json({ user, token });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.json({ user, token });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = authController;