const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init
        // Actually, getGenerativeModel doesn't list.
        // We need to use the model manager if available in SDK, or just try to list via REST if SDK doesn't expose it easily.
        // SDK 0.24.1 might allow listing?
        // Let's try to fetch via raw fetch if SDK doesn't have it.

        // Actually, the error message says "Call ListModels".
        // Does the SDK have a way? 
        // It doesn't seem to be top-level in `genAI`.

        // Let's us a simple fetch to the endpoint.
        const key = process.env.GOOGLE_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const names = data.models.map(m => m.name).filter(n => n.includes('gemini'));
            console.log("Available Gemini Models:\n", names.join('\n'));
        } else {
            console.log("No models found or error structure:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
