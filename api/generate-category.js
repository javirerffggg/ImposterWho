// api/generate-category.js

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

    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'El tema (topic) es requerido' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'La clave de la API de Gemini no está configurada en el servidor.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `Genera una lista de 15 palabras para un juego de mesa sobre el tema "${topic}". Las palabras deben estar en español. Divide las palabras en tres niveles de dificultad: 5 fáciles, 5 medias y 5 difíciles. Las palabras fáciles deben ser muy comunes y directamente relacionadas con el tema. Las palabras medias deben ser un poco más específicas pero aún reconocibles. Las palabras difíciles deben ser técnicas, raras o relacionadas de forma más abstracta. Devuelve el resultado exclusivamente en formato JSON, sin texto adicional antes o después. El formato debe ser: {"easy": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"], "medium": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"], "hard": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"]}`;

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
        const categoryData = extractJson(rawText);

        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error en la función generate-category:', error.message);
        res.status(500).json({ error: 'No se pudo generar la categoría. ' + error.message });
    }
}
```javascript
