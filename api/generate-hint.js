// api/generate-hint.js

// Helper function to robustly extract JSON from a string
function extractJson(text) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error("No se encontró un objeto JSON válido en la respuesta de la IA.");
    }
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Malformed JSON string:", jsonString);
        throw new Error(`Fallo al procesar la respuesta de la IA.`);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { category } = req.body;
    if (!category) {
        return res.status(400).json({ error: 'La categoría es requerida' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'La clave de la API de Gemini no está configurada en el servidor.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
    
    const prompt = `Para un juego de adivinanzas donde un impostor no conoce la palabra secreta, necesito una pista. La categoría es "${category}". Dame una única palabra en español que sea una pista extremadamente genérica pero plausible para esta categoría. La pista debe ser lo suficientemente vaga como para no revelar ninguna palabra específica, pero lo suficientemente relevante para que el impostor pueda decir algo que no lo delate inmediatamente. No conozco la palabra secreta, solo la categoría. Devuelve el resultado exclusivamente en formato JSON, sin texto adicional, así: {"hint": "palabra_pista"}`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Gemini API Error Response:", errorText);
            throw new Error(`Error de la API de Gemini: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            console.error("Invalid response structure from Gemini:", JSON.stringify(data));
            throw new Error("Estructura de respuesta inválida desde la API de Gemini.");
        }
        
        const rawText = data.candidates[0].content.parts[0].text;
        const hintData = extractJson(rawText);

        res.status(200).json(hintData);

    } catch (error) {
        console.error('Error en la función generate-hint:', error.message);
        res.status(500).json({ error: 'No se pudo generar la pista. ' + error.message });
    }
}
```javascript
