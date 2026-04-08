require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const pipelines = require('./pipelines');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/api/kpi', async (req, res) => {
    try {
        const data = await pipelines.getKPISummary();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/trend', async (req, res) => {
    try {
        const data = await pipelines.getLongTermTrend();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/anomalies', async (req, res) => {
    try {
        const data = await pipelines.getAnomalies();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/heatmap', async (req, res) => {
    try {
        const data = await pipelines.getSeasonalityHeatmap();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/count', async (req, res) => {
    try {
        const count = await pipelines.getTotalCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { OpenAI } = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.get('/api/ai-insights', async (req, res) => {
    if (!openai) return res.status(500).json({ error: "OpenAI is not configured." });
    try {
        const kpis = await pipelines.getKPISummary();
        const anomalies = await pipelines.getAnomalies();

        const prompt = `
Eres la Inteligencia Artificial meteorológica de la plataforma 'Nexus Weather Analytics'.
Acabamos de procesar más de 100,000 registros históricos (12 años de la última década en México).
- KPIs Promedio de toda la data: ${JSON.stringify(kpis)}
- Anomalías o Climas Extremos más recientes: ${JSON.stringify(anomalies.slice(0, 4))}

Escribe UN SOLO PÁRRAFO formal, corto e inspirador (máximo 4 renglones) dirigido al analista final, interpretando ligeramente un factor de la historia o del clima reciente basado firmemente en los números reales anteriores. 
- Actúa como una Inteligencia Artificial corporativa, nunca digas "Hola" ni te despidas, ve directo a las métricas y deducir.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        res.json({ message: response.choices[0].message.content });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai-chat', async (req, res) => {
    if (!openai) return res.status(500).json({ error: "OpenAI is not configured." });
    try {
        const { question } = req.body;
        const kpis = await pipelines.getKPISummary();

        const prompt = `
Eres la Inteligencia Artificial meteorológica de la plataforma 'Nexus Weather Analytics'.
Cuentas con una base de datos histórica de 210,000 puntos: ${JSON.stringify(kpis)}
Responde a esta pregunta del analista de la manera más profesional, analítica, breve y directa posible (máximo 4 renglones). No saludes, usa un tono científico de nivel Dios.
Pregunta del usuario: "${question}"
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        res.json({ message: response.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { ingestData } = require('./ingest');

const startServer = async () => {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
};

startServer();
