// api/generate-starting-reason.js

// Esta función genera una razón creativa y divertida para que un jugador comience la ronda.
// Se espera una solicitud POST con: { "playerName": "...", "category": "...", "word": "..." }

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

    const { playerName } = req.body; // Word and category are ignored now
    if (!playerName) {
        return res.status(400).json({ error: 'playerName is required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not set.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `
        Para un juego de mesa en España, necesito una frase graciosa para decidir quién empieza.
        El nombre del jugador es "${playerName}".

        Inventa una frase corta en español, de una sola línea, que sea divertida, que rime con el nombre "${playerName}" y que haga referencia a la cultura popular, dichos, comida o humor de España.
        La frase NO debe tener ninguna relación con la palabra secreta o la categoría del juego. Debe ser totalmente aleatoria y centrada en el humor.

        Ejemplos de inspiración:
        - Para "Ana": "Empieza Ana, porque tiene más salero que una sevillana."
        - Para "Javier": "Empieza Javier, que tiene más hambre que el perro de un ciego y se va a comer un pincho de tortilla."
        - Para "Lucía": "Empieza Lucía, porque hoy está que lo tira, como los precios del Día sin IVA."
        - Para "Mateo": "Empieza Mateo, que se conoce todos los bares de tapeo."

        Responde exclusivamente con un objeto JSON con el siguiente formato, sin texto adicional:
        {"reason": "Tu frase creativa y graciosa aquí"}
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
        const reasonData = extractJson(rawText);

        res.status(200).json(reasonData);

    } catch (error) {
        console.error('Error in generate-starting-reason function:', error.message);
        res.status(500).json({ error: 'Failed to generate starting reason. ' + error.message });
    }
}
