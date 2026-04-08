require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const { connectDB, Weather } = require('./db');

const LAT = 19.42847;
const LON = -99.12766;

async function ingestData() {
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }

    try {
        console.log("Fetching 12 years of REAL weather data to populate Atlas DB...");
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0];

        const response = await axios.get(`https://archive-api.open-meteo.com/v1/archive`, {
            params: {
                latitude: LAT,
                longitude: LON,
                start_date: startDate,
                end_date: endDate,
                hourly: 'temperature_2m,precipitation,wind_speed_10m',
                timezone: 'auto'
            }
        });

        const data = response.data;
        const hourly = data.hourly;

        const documents = [];

        console.log(`Processing exactly ${hourly.time.length} REAL hourly records...`);

        for (let i = 0; i < hourly.time.length; i++) {
            if (hourly.temperature_2m[i] === null) continue;

            documents.push({
                timestamp: new Date(hourly.time[i]),
                metadata: { city: 'Mexico City', country: 'MX', latitude: LAT, longitude: LON },
                temperature: hourly.temperature_2m[i],
                precipitation: hourly.precipitation[i],
                wind_speed: hourly.wind_speed_10m[i]
            });
        }

        console.log(`Inserting total of ${documents.length} REAL records directly into Atlas Time Series collection...`);
        // Inserción en bloque
        await Weather.insertMany(documents, { ordered: false });
        console.log("Ingest completed successfully!");

        return true;

    } catch (error) {
        console.error("Error during ingestion:", error.message);
        throw error;
    }
}

if (require.main === module) {
    ingestData().then(() => process.exit(0)).catch(() => process.exit(1));
} else {
    module.exports = { ingestData };
}
