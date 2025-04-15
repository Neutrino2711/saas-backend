const Plan = require('../models/Plan');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const planController = {
    // Get all plans
    getPlans: async (req, res) => {
        try {
            const plans = await Plan.find().sort({ price: 1 });
            res.json(plans);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get plan by ID
    getPlanById: async (req, res) => {
        try {
            const plan = await Plan.findById(req.params.id);
            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get plan by name
    getPlanByName: async (req, res) => {

        try {
            console.log(req.params.name);
            const plan = await Plan.findOne({ name: req.params.name });
            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update plan (superadmin only)
    updatePlan: async (req, res) => {
        try {
            const { price, features } = req.body;
            const plan = await Plan.findById(req.params.id);

            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }

            // Update Stripe price if price changed
            if (price && price !== plan.price) {
                const newStripePrice = await stripe.prices.create({
                    product: plan.stripeProductId,
                    unit_amount: price * 100,
                    currency: 'inr',
                    recurring: {
                        interval: 'year'
                    }
                });
                plan.stripePriceId = newStripePrice.id;
                plan.price = price;
            }

            if (features) {
                plan.features = features;
            }

            const updatedPlan = await plan.save();
            res.json(updatedPlan);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete plan (superadmin only)
    deletePlan: async (req, res) => {
        try {
            const plan = await Plan.findById(req.params.id);

            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }

            // Archive the product in Stripe
            await stripe.products.update(plan.stripeProductId, { active: false });

            await plan.deleteOne();
            res.json({ message: 'Plan deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = planController;