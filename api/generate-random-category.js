// api/generate-random-category.js

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

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'La clave de la API de Gemini no está configurada en el servidor.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `Para un juego de mesa, inventa un tema o categoría de palabras divertido y original. Luego, genera 15 palabras en español para esa categoría, divididas en tres niveles de dificultad: 5 fáciles (comunes), 5 medias (específicas), y 5 difíciles (técnicas o raras). El JSON de salida debe tener las claves "name" (para el nombre de la categoría) y "words" (un objeto con las claves "easy", "medium", y "hard").`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json",
                }
            }),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("Gemini API Error Response:", data);
            const errorMessage = data?.error?.message || `Error de la API de Gemini: ${apiResponse.status}`;
            throw new Error(errorMessage);
        }
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
            console.error("Invalid response structure from Gemini:", JSON.stringify(data));
            throw new Error("Estructura de respuesta inválida o vacía desde la API de Gemini. Puede ser por filtros de seguridad.");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const categoryData = extractJson(rawText);

        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error en la función generate-random-category:', error.message);
        res.status(500).json({ error: 'No se pudo generar la categoría aleatoria. ' + error.message });
    }
}
