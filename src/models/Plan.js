const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Basic', 'Standard', 'Plus'],
    },
    price: {
        type: Number,
        required: true,
    },
    userLimit: {
        type: Number,
        required: true,
    },
    trialDays: {
        type: Number,
        default: 0,
    },
    features: [{
        type: String,
    }],
    stripeProductId: {
        type: String,
        required: true,
    },
    stripePriceId: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Plan', planSchema);