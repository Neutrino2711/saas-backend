const Plan = require('../models/Plan');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const defaultPlans = [
    {
        name: 'Basic',
        price: 0,
        userLimit: 1,
        features: ['14-day trial', 'Single user access', 'Basic features'],
        trialDays: 14
    },
    {
        name: 'Standard',
        price: 4999,
        userLimit: 5,
        features: ['Up to 5 users', 'Standard features', 'Priority support']
    },
    {
        name: 'Plus',
        price: 3999,
        userLimit: 10,
        features: ['10+ users', 'Advanced features', 'Premium support']
    }
];

const seedPlans = async () => {
    try {
        // Check if plans already exist
        const existingPlans = await Plan.find();
        if (existingPlans.length > 0) {
            console.log('Plans already seeded');
            return;
        }

        for (const planData of defaultPlans) {
            // Create product in Stripe
            const product = await stripe.products.create({
                name: planData.name,
                description: `${planData.name} Plan - Up to ${planData.userLimit} users`
            });

            // Create price in Stripe
            const stripePrice = await stripe.prices.create({
                product: product.id,
                unit_amount: planData.price * 100,
                currency: 'inr',
                recurring: {
                    interval: 'year'
                }
            });

            // Create plan in database
            const plan = new Plan({
                ...planData,
                stripeProductId: product.id,
                stripePriceId: stripePrice.id
            });

            await plan.save();
            console.log(`Created ${planData.name} plan`);
        }

        console.log('Plan seeding completed');
    } catch (error) {
        console.error('Error seeding plans:', error);
    }
};

module.exports = seedPlans;