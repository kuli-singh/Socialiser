
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export const dynamic = "force-dynamic";

// Enhanced logging function for debugging
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AI-CHAT DEBUG ${timestamp}] ${message}`);
  if (data) {
    console.log(`[AI-CHAT DEBUG ${timestamp}] Data:`, JSON.stringify(data, null, 2));
  }
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

// Define the schema for the AI response
const responseSchema = {
  description: "Response from the AI social planner",
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "Conversational response to the user",
      nullable: false,
    },
    suggestedEvents: {
      type: SchemaType.ARRAY,
      description: "List of suggested events based on user constraints",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Event title" },
          description: { type: SchemaType.STRING, description: "Detailed description" },
          venue: { type: SchemaType.STRING, description: "Venue name" },
          address: { type: SchemaType.STRING, description: "Venue address" },
          date: { type: SchemaType.STRING, description: "Suggested date" },
          time: { type: SchemaType.STRING, description: "Suggested time" },
          duration: { type: SchemaType.STRING, description: "Estimated duration" },
          price: { type: SchemaType.STRING, description: "Price info" },
          reasoning: { type: SchemaType.STRING, description: "Why this was suggested" }
        },
        required: ["name", "description", "venue", "reasoning"]
      }
    }
  },
  required: ["message", "suggestedEvents"]
};

export async function POST(request: NextRequest) {
  debugLog("=== AI CHAT REQUEST STARTED (GEMINI) ===");

  try {
    // 1. Authentication check
    const user = await getAuthenticatedUser();
    if (!user) {
      debugLog("Authentication failed - no user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { message, location, conversationHistory } = body;

    // 3. Get user's context (Activities, Values, Locations)
    debugLog("Fetching user context");

    // Fetch Activities
    const userActivities = await prisma.activity.findMany({
      where: { userId: user.id },
      select: { name: true, description: true }
    });

    // Fetch Values
    const userValues = await prisma.coreValue.findMany({
      where: { userId: user.id },
      select: { name: true, description: true }
    });

    // Fetch Locations (NEW)
    const userLocations = await prisma.location.findMany({
      where: { userId: user.id },
      select: { name: true, type: true, address: true, description: true }
    });

    debugLog("Context loaded", {
      activities: userActivities.length,
      values: userValues.length,
      locations: userLocations.length
    });

    // 4. Initialize Gemini
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 5. Build Prompt
    const today = new Date().toDateString();
    const prompt = `
You are an advanced AI social event planner. Your goal is to help the user plan social activities.

User Context:
- Current Date: ${today}
- Activities: ${JSON.stringify(userActivities)}
- Core Values: ${JSON.stringify(userValues)}
- Saved Locations: ${JSON.stringify(userLocations)}
- Current Location Context: ${location || "Unknown"}

User Request: "${message}"

Instructions:
1. Suggest an event matching the request.
2. Prioritize saved locations/activities if relevant.
3. OUTPUT MUST BE STRICT VALID JSON ONLY. No markdown, no explanations outside JSON.
4. Follow this JSON structure:
{
  "message": "Friendly response to user...",
  "suggestedEvents": [
    {
      "name": "Event Title",
      "description": "...",
      "venue": "...",
      "address": "...",
      "date": "...",
      "time": "...",
      "duration": "...",
      "price": "...",
      "reasoning": "..."
    }
  ]
}
    `;
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest", "gemini-flash-latest"];
    let aiResponseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        debugLog(`Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        aiResponseText = result.response.text();
        debugLog(`Success with model: ${modelName}`);
        break;
      } catch (err: any) {
        debugLog(`Failed with model ${modelName} - ${err.message}`);
        lastError = err;
      }
    }

    if (!aiResponseText) throw lastError || new Error("All models failed");

    debugLog("Gemini response received", { length: aiResponseText.length });

    // Clean up potential markdown formatting (```json ... ```)
    let text = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // 7. Parse and Return
    const parsed = JSON.parse(text);

    // Ensure structure matches what frontend expects
    const responseData = {
      response: {
        message: parsed.message,
        searchResults: [], // Gemini handles the "search" via its internal knowledge for now
        suggestedEvents: parsed.suggestedEvents || []
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    debugLog("CRITICAL ERROR", error);

    // Fallback if AI fails
    return NextResponse.json({
      response: {
        message: "I'm having trouble connecting to my brain right now, but I'm here to help!",
        searchResults: [],
        suggestedEvents: []
      }
    });
  }
}
