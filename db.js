const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("CRITICAL: MONGO_URI environment variable is missing in Render settings. Please add it to your Environment Variables.");
        }

        await mongoose.connect(uri);
        console.log("MongoDB Time-Series Ready & Connected!");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

const weatherSchema = new mongoose.Schema({
    metadata: {
        city: String,
        country: String,
        latitude: Number,
        longitude: Number
    },
    timestamp: Date,
    temperature: Number,
    precipitation: Number,
    wind_speed: Number
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'hours'
    }
});

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = { connectDB, Weather };
