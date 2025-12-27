
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually read .env to avoid dotenv dependency issues
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let apiKey = '';

for (const line of envLines) {
    if (line.startsWith('GOOGLE_API_KEY=')) {
        apiKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
        break;
    }
}

console.log("--- Gemini Connectivity Test ---");
console.log("API Key found:", apiKey ? "YES" : "NO");
if (apiKey) console.log("Key ends with:", apiKey.slice(-5));

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        const response = await result.response;
        console.log(`SUCCESS! [${modelName}] Response:`, response.text().slice(0, 50) + "...");
        return true;
    } catch (error) {
        console.error(`FAILED [${modelName}]:`);
        console.error(error.message);
        return false;
    }
}


async function listModels() {
    console.log("\nListing available models via raw API...");
    try {
        // Node 18+ has native fetch
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            console.error("ListModels Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:", data.models ? data.models.map(m => m.name).join(', ') : "NONE");
        }
    } catch (e) {
        console.error("ListModels Failed:", e.message);
    }
}

async function run() {
    await listModels();
    // Try newer model first, then standard, then older
    // await testModel("gemini-1.5-flash"); 
    // await testModel("gemini-pro");
}

run();
