
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { decrypt } from '@/lib/encryption';

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
          venueType: { type: SchemaType.STRING, description: "Type of venue (e.g. Restaurant, Theatre, Park, Outdoor, Indoor)" },
          price: { type: SchemaType.STRING, description: "Price info" },
          reasoning: { type: SchemaType.STRING, description: "Why this was suggested" },
          url: { type: SchemaType.STRING, description: "URL to official event page or search result", nullable: true }
        },
        required: ["name", "description", "venue", "reasoning", "url", "venueType"]
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

    // Fetch User Preferences (Default Location, System Prompt)
    // We need to fetch the full user record since session user doesn't contain preferences
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true }
    });

    const userPreferences = (userRecord?.preferences as { defaultLocation?: string, socialLocation?: string, systemPrompt?: string, preferredModel?: string, enableGoogleSearch?: boolean }) || {};
    const defaultLocation = userPreferences.defaultLocation || "Unknown";
    const socialLocation = userPreferences.socialLocation || defaultLocation; // Fallback to default if not set
    const systemPrompt = userPreferences.systemPrompt || "";
    let preferredModel = userPreferences.preferredModel || "gemini-flash-latest";

    // Explicit mapping for model IDs based on settings choice
    if (preferredModel === "gemini-1.5-pro") {
      preferredModel = "gemini-1.5-pro";
    } else if (preferredModel === "gemini-1.5-flash") {
      preferredModel = "gemini-1.5-flash";
    } else if (preferredModel === "gemini-2.5-pro") {
      preferredModel = "gemini-2.5-pro";
    } else if (preferredModel === "gemini-2.0-flash") {
      preferredModel = "gemini-2.0-flash";
    } else if (preferredModel.includes("lite")) {
      preferredModel = "gemini-2.5-flash-lite";
    } else if (preferredModel === "gemini-2.5-flash") {
      preferredModel = "gemini-2.5-flash";
    } else {
      preferredModel = "gemini-1.5-flash-latest"; // Safest, highest-quota functional default
    }

    const enableGoogleSearch = userPreferences.enableGoogleSearch !== undefined ? userPreferences.enableGoogleSearch : true;

    debugLog("Context loaded", {
      activities: userActivities.length,
      values: userValues.length,
      locations: userLocations.length,
      defaultLocation,
      socialLocation,
      hasSystemPrompt: !!systemPrompt,
      preferredModel,
      enableGoogleSearch
    });

    // 4. Initialize Gemini
    let apiKey = process.env.GOOGLE_API_KEY;

    // Use User-stored key if available
    if (user.id) {
      const userWithKey = await prisma.user.findUnique({
        where: { id: user.id },
        select: { googleApiKey: true }
      });
      if (userWithKey?.googleApiKey) {
        apiKey = decrypt(userWithKey.googleApiKey);
      }
    }

    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set (system or user)");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 5. Build Prompt
    const today = new Date().toDateString();

    // Determine effective location
    // If a specific location is passed in the request body (e.g. from a temporary override), use it.
    // Otherwise, describe the dual-location context.
    const specificLocationOverride = location && location.address ? location.address : null;

    let locationContextString = "";
    if (specificLocationOverride) {
      locationContextString = `Current Override Location: ${specificLocationOverride}`;
    } else {
      locationContextString = `
        User has TWO default locations:
        1. HOME / ORIGIN: ${defaultLocation} (Use for: Hiking, Walks, Local activities, and as the ORIGIN for flights/travel).
        2. SOCIAL HUB: ${socialLocation} (Use for: Restaurants, Theatre, Cinema, Nightlife).
        `;
    }
    const coreGuardrails = `
    1. Suggest 3 - 4 diverse, REAL, CONCRETE event options matching the request happening around ${today}.
    2. ${enableGoogleSearch ? 'Use Google Search to verify if events are actually happening.' : 'Since search is disabled, provide realistic suggestions based on your knowledge base.'} Do not hallucinate.
    3. CRITICAL: You MUST provide a valid 'url' for EVERY event found. Use the link from the Google Search result.
    4. Prioritize saved locations / activities if relevant.

    8. TARGET ACTIVITY TYPE (STRICT):
       - You MUST identify the specific "Activity Type" requested by the user from their message (e.g., "Theatre", "Concert", "Dinner", "Hiking").
       - ALL suggested events must strictly match this Activity Type.
       - SAVED ACTIVITIES: You may only suggest a Saved Activity if its name or description clearly matches the requested Activity Type. Do NOT suggest a Saved "Hiking" activity if the user asked for "Theatre".

    9. GROUNDING & EXISTENCE (CRITICAL):
       - ${enableGoogleSearch ? 'You MUST use Google Search to find REAL, ACTIVE events happening on the specified dates.' : 'Since search is disabled, rely on your knowledge base but be as accurate as possible.'}
       - VERIFY EXISTENCE: Do not suggest shows or venues that have closed (e.g., verify that a show is currently running / ticketed).
       - VERIFY LOCATION: Ensure suggestions are in the correct location based on the 'Location Context' below.
       - SEARCH-FIRST: Use real-time search results as your primary source of truth, not your internal training data.

    10. LOCATION SELECTION LOGIC:
        - If the user specifies a location in the request, use that.
        - If the request implies TRAVEL (flight, holiday, getaway), treat 'HOME / ORIGIN' as the DEPARTURE point.
        - If the request implies LOCAL NATURE (hiking, walks), use 'HOME / ORIGIN'.
        - If the request implies URBAN SOCIALIZING (dinner, theatre, cinema), use 'SOCIAL HUB' unless stated otherwise.

    11. OUTPUT MUST BE STRICT VALID JSON ONLY. No markdown, no explanations outside JSON.
    12. Follow this JSON structure:
        {
          "message": "Friendly response to user...",
          "suggestedEvents": [
            {
              "name": "Event Title",
              "description": "...",
              "venue": "...",
              "address": "...",
              "date": "YYYY-MM-DD",
              "time": "HH:MM",
              "duration": "...",
              "venueType": "...",
              "price": "...",
              "reasoning": "...",
              "url": "https://..."
            }
          ]
        }
    `;

    const prompt = `
You are an advanced AI social event planner. Your goal is to help the user plan social activities.

USER CONTEXT:
- Current Date: ${today}
- Saved Activities: ${JSON.stringify(userActivities)}
- Core Values: ${JSON.stringify(userValues)}
- Saved Locations: ${JSON.stringify(userLocations)}
- Location Context: ${locationContextString}

CORE MANDATORY RULES:
${coreGuardrails}

${systemPrompt ? `USER-SPECIFIED STYLE & IDENTITY INSTRUCTIONS:
${systemPrompt}
` : ''}

USER REQUEST: "${message}"
    `;

    // Models to try (Fallback logic)
    let modelsToTry = [preferredModel];

    // Priority Fallback Chain
    // Always include gemini-1.5-flash as the ultimate safety net due to its high quota
    const robustFallback = "gemini-1.5-flash-latest";

    if (preferredModel !== robustFallback) {
      // If we are using a "Pro" model, try 1.5 Pro as a smarter fallback before Flash
      if (preferredModel.includes('pro') && preferredModel !== 'gemini-1.5-pro') {
        modelsToTry.push('gemini-1.5-pro');
      }

      // Finally, add the most reliable Flash model
      modelsToTry.push(robustFallback);
    }

    // Ensure fallback list is unique
    modelsToTry = Array.from(new Set(modelsToTry));

    let aiResponseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      // First attempt: With preference-based tools (if any)
      try {
        debugLog(`Attempting model: ${modelName} (Tools: ${enableGoogleSearch})`);

        const tools = enableGoogleSearch ? [{ googleSearch: {} } as any] : [];
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: tools,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema as any
          }
        });
        const result = await model.generateContent(prompt);
        aiResponseText = result.response.text();
        debugLog(`Success with model: ${modelName} `);
        break;
      } catch (err: any) {
        debugLog(`Failed with model ${modelName} (With Tools) - ${err.message} `);
        lastError = err;

        // Second attempt: Fallback WITHOUT tools if search was enabled
        if (enableGoogleSearch) {
          try {
            debugLog(`Retrying model: ${modelName} WITHOUT tools(Fallback)`);
            const model = genAI.getGenerativeModel({
              model: modelName,
              tools: [], // Force empty tools
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema as any
              }
            });
            const result = await model.generateContent(prompt);
            aiResponseText = result.response.text();
            debugLog(`Success with model: ${modelName} (Fallback)`);
            break;
          } catch (retryErr: any) {
            debugLog(`Failed with model ${modelName} (Fallback) - ${retryErr.message} `);
            lastError = retryErr;
          }
        }
      }
    }

    if (!aiResponseText) throw lastError || new Error("All models failed");

    debugLog("Gemini response received", { length: aiResponseText.length });

    // Clean up potential markdown formatting (```json ... ```)
    let text = aiResponseText.replace(/```json /g, '').replace(/```/g, '').trim();

    // 7. Parse and Return
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      debugLog("JSON Parse Failed. Attempting Regex Extraction...");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          debugLog("Regex Extraction Successful");
        } catch (regexError) {
          debugLog("Regex Extraction Failed", (regexError as Error).message);
          throw parseError; // Throw original error if regex also fails
        }
      } else {
        throw parseError;
      }
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = "I'm having trouble connecting to my brain right now.";

    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      userMessage = "The selected AI model is currently hitting its usage limit. Please go to Settings and switch to 'Gemini 1.5 Flash (Highly Reliable)' for the best experience.";
    } else {
      userMessage += ` Error details: ${errorMessage}`;
    }

    return NextResponse.json({
      response: {
        message: userMessage,
        searchResults: [],
        suggestedEvents: []
      }
    });
  }
}
