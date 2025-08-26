// api/generate-random-category.js

// Esta función le pide a Gemini que invente una categoría completamente nueva y aleatoria.
// Se espera una solicitud POST sin cuerpo.

// Helper function to extract JSON from a string
function extractJson(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in the API response.");
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not set.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `
        Para un juego de mesa llamado "Imposter Who?", inventa un tema o categoría de palabras divertido y original.
        Luego, genera una lista de 15 palabras en español para esa categoría, divididas en tres niveles de dificultad: 5 fáciles, 5 medias y 5 difíciles.
        
        - Las palabras fáciles deben ser muy comunes y directamente relacionadas con el tema.
        - Las palabras medias deben ser un poco más específicas pero aún reconocibles.
        - Las palabras difíciles deben ser técnicas, raras o relacionadas de forma más abstracta.

        Devuelve el resultado exclusivamente en formato JSON, sin texto adicional antes o después.
        El formato debe ser:
        {
          "name": "Nombre de la Categoría Inventada",
          "words": {
            "easy": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
            "medium": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
            "hard": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"]
          }
        }
    `;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Gemini API Error Response:", errorText);
            throw new Error(`Gemini API error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error("Invalid response structure from Gemini API.");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const categoryData = extractJson(rawText);

        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error in generate-random-category function:', error.message);
        res.status(500).json({ error: 'Failed to generate random category. ' + error.message });
    }
}
