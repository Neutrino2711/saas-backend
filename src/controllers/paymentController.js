const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

const paymentController = {
    createCheckoutSession: async (req, res) => {
        try {
            const { planId, quantity } = req.body;
            const plan = await Plan.findById(planId);

            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: plan.stripePriceId,
                    quantity: quantity
                }],
                mode: 'subscription',
                metadata: {
                    userId: req.user.email,
                    planId: planId
                },
                success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                customer_email: req.user.email
            });

            res.json({ sessionId: session.id });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    handleWebhook: async (req, res) => {
        const sig = req.headers['stripe-signature'];

        try {
            const event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;

                // Update subscription status in database
                await Subscription.create({
                    userId: session.client_reference_id,
                    stripeSubscriptionId: session.subscription,
                    status: 'active'
                });
            }

            res.json({ received: true });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = paymentController;