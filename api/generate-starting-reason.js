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

    const { playerName, category, word } = req.body;
    if (!playerName || !category || !word) {
        return res.status(400).json({ error: 'playerName, category, and word are required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not set.' });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `
        Para un juego de mesa llamado "Imposter Who?", necesito una razón creativa para que un jugador comience la ronda.
        El nombre del jugador es "${playerName}".
        La categoría de la ronda es "${category}".
        La palabra secreta es "${word}".

        Inventa una frase corta, original y divertida en español que explique por qué ${playerName} debe empezar. La razón debe estar sutilmente relacionada con la palabra secreta o la categoría.
        
        Ejemplos:
        - Si la palabra es "Titanic", la razón podría ser: "${playerName} tiene un corazón que seguirá latiendo."
        - Si la palabra es "Gato", la razón podría ser: "${playerName} siempre cae de pie."
        - Si la palabra es "Programador", la razón podría ser: "El código de ${playerName} compila a la primera."

        Responde exclusivamente con un objeto JSON con el siguiente formato, sin texto adicional:
        {"reason": "Tu frase creativa aquí"}
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
