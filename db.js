const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        // Magia: Si no pusiste clave, creamos temporalmente un engine completo de Mongo en Memoria
        if (!uri) {
            console.log("Generando Base de Datos local en memoria (Zero-Config Demo)...");
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
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
