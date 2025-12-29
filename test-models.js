const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function listModels() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models?key=" + process.env.GOOGLE_API_KEY);
    const data = await response.json();
    console.log("V1 Models:", JSON.stringify(data, null, 2));
    
    const responseBeta = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GOOGLE_API_KEY);
    const dataBeta = await responseBeta.json();
    console.log("V1Beta Models:", JSON.stringify(dataBeta, null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels();
