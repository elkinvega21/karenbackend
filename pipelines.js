const { Weather } = require('./db');

const getKPISummary = async () => {
    // Pipeline para extraer métricas clave
    const result = await Weather.aggregate([
        {
            $group: {
                _id: null,
                maxTemp: { $max: "$temperature" },
                minTemp: { $min: "$temperature" },
                avgTemp: { $avg: "$temperature" },
                maxPrecipitation: { $max: "$precipitation" },
                totalPrecipitation: { $sum: "$precipitation" }
            }
        }
    ]);
    return result[0];
};

const getLongTermTrend = async () => {
    // Agragar datos por mes/año para la línea de tendencia
    return await Weather.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$timestamp" },
                    month: { $month: "$timestamp" }
                },
                avgTemperature: { $avg: "$temperature" },
                totalPrecipitation: { $sum: "$precipitation" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                date: {
                    $concat: [
                        { $toString: "$_id.year" },
                        "-",
                        {
                            $cond: {
                                if: { $lt: ["$_id.month", 10] },
                                then: { $concat: ["0", { $toString: "$_id.month" }] },
                                else: { $toString: "$_id.month" }
                            }
                        }
                    ]
                },
                avgTemperature: { $round: ["$avgTemperature", 2] },
                totalPrecipitation: { $round: ["$totalPrecipitation", 2] }
            }
        }
    ]);
};

const getAnomalies = async () => {
    // Calculamos las anomalías estáticas (ejemplo: temperatura > 30 grados o precipitación fuerte)
    return await Weather.aggregate([
        {
            $match: {
                $or: [
                    { temperature: { $gt: 30 } },
                    { precipitation: { $gt: 10 } }
                ]
            }
        },
        { $sort: { timestamp: -1 } },
        { $limit: 100 }
    ]);
};

const getSeasonalityHeatmap = async () => {
    // Preparamos datos agrupados para un Heatmap
    return await Weather.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$timestamp" },
                    month: { $month: "$timestamp" }
                },
                avgTemp: { $avg: "$temperature" },
                totalRain: { $sum: "$precipitation" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
};

const getTotalCount = async () => {
    return await Weather.countDocuments();
};

module.exports = {
    getKPISummary,
    getLongTermTrend,
    getAnomalies,
    getSeasonalityHeatmap,
    getTotalCount
};
