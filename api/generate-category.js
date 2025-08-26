// api/generate-category.js

// Esta función utiliza la API de Google Gemini para generar una nueva categoría de palabras.
// Se espera una solicitud POST con un cuerpo JSON: { "topic": "nombre del tema" }

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const prompt = `
        Genera una lista de 15 palabras para un juego de mesa sobre el tema "${topic}".
        Las palabras deben estar en español.
        Divide las palabras en tres niveles de dificultad: 5 fáciles, 5 medias y 5 difíciles.
        Las palabras fáciles deben ser muy comunes y directamente relacionadas con el tema.
        Las palabras medias deben ser un poco más específicas pero aún reconocibles.
        Las palabras difíciles deben ser técnicas, raras o relacionadas de forma más abstracta.
        Devuelve el resultado exclusivamente en formato JSON, sin texto adicional antes o después.
        El formato debe ser:
        {
          "easy": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
          "medium": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
          "hard": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"]
        }
    `;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Gemini API error: ${apiResponse.status} ${errorText}`);
        }

        const data = await apiResponse.json();
        const jsonText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        const categoryData = JSON.parse(jsonText);

        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate category' });
    }
}
```javascript
// api/generate-hint.js

// Esta función utiliza la API de Google Gemini para generar una pista para el impostor.
// Se espera una solicitud POST con un cuerpo JSON: { "category": "nombre de la categoría" }

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { category } = req.body;
    if (!category) {
        return res.status(400).json({ error: 'Category is required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
    
    const prompt = `
        Para un juego de adivinanzas donde un impostor no conoce la palabra secreta, necesito una pista.
        La categoría es "${category}".
        Dame una única palabra en español que sea una pista extremadamente genérica pero plausible para esta categoría.
        La pista debe ser lo suficientemente vaga como para no revelar ninguna palabra específica, pero lo suficientemente relevante para que el impostor pueda decir algo que no lo delate inmediatamente.
        No conozco la palabra secreta, solo la categoría.
        Devuelve el resultado exclusivamente en formato JSON, sin texto adicional, así: {"hint": "palabra_pista"}
    `;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Gemini API error: ${apiResponse.status} ${errorText}`);
        }

        const data = await apiResponse.json();
        const jsonText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        const hintData = JSON.parse(jsonText);

        res.status(200).json(hintData);

    } catch (error) {
        console.error('Error calling Gemini API for hint:', error);
        res.status(500).json({ error: 'Failed to generate hint' });
    }
}
