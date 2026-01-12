
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

    // User-specific locations (Always from the authenticated user)
    const defaultLocation = userPreferences.defaultLocation || "Unknown";
    const socialLocation = userPreferences.socialLocation || defaultLocation;




    // 4. Initialize Gemini
    let apiKey = process.env.GOOGLE_API_KEY;

    // Fetch Global Admin Settings for API Key and Model Config
    // We assume the ADMIN (first user with isAdmin=true) holds the master config.
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
      select: { googleApiKey: true, preferences: true }
    });

    // Strategy: 
    // 1. Locations come from current user (already fetched in userPreferences above).
    // 2. Prompt/Model/Search come from ADMIN user (if exists), else fall back to current user (legacy) or defaults.

    const adminPrefs = (adminUser?.preferences as any) || {};

    // OVERRIDE local preferences with Global Admin preferences for System/AI params
    const systemPrompt = adminPrefs.systemPrompt || userPreferences.systemPrompt || "";
    let preferredModel = adminPrefs.preferredModel || userPreferences.preferredModel || "gemini-1.5-flash";
    const enableGoogleSearch = adminPrefs.enableGoogleSearch !== undefined ? adminPrefs.enableGoogleSearch : (userPreferences.enableGoogleSearch !== undefined ? userPreferences.enableGoogleSearch : true);

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

    // Use Admin Key if available, else user key, else env
    if (adminUser?.googleApiKey) {
      apiKey = decrypt(adminUser.googleApiKey);
    } else if (user.id) {
      // Fallback to user key if no admin key found (legacy support)
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
    1. Suggest 3 - 4 diverse, REAL, CONCRETE, and CURRENT event options matching the request happening around ${today}.
    2. ${enableGoogleSearch ? 'SEARCH MANDATE: You match a user request for "trending", "best", "reviews", "gigs", or "what to see right now". You MUST use Google Search to find current critical acclaim, recent reviews, and active listings. Do NOT rely on generic "evergreen" tourist spots (e.g. Lion King, British Museum) unless they are specifically part of a new trend or the user asked for classics.' : 'Since search is disabled, provide realistic suggestions based on your knowledge base.'} Do not hallucinate.
    3. CRITICAL: You MUST provide a valid 'url' for EVERY event found. Use the link from the Google Search result.
    4. SAVED ITEMS PRIORITY: Prioritize saved locations / activities ONLY if they strictly match the user's intent. If the user asks for "something new" or "trending", IGNORE saved items and search externally.

    8. STRICT ACTIVITY MATCHING (ZERO TOLERANCE):
       - You MUST identify the specific "Activity Type" requested (e.g., "Theatre", "Concert", "Dinner", "Hiking").
       - ALL suggestions must be of that type.
       - If user asks for "Theatre" or "Plays", suggesting "The British Museum", "Sky Garden", or "Parks" is a CRITICAL FAILURE.
       - If user asks for "Gigs", suggesting "Musical Theatre" is a FAILURE.

    9. GROUNDING & EXISTENCE (CRITICAL):
       - ${enableGoogleSearch ? 'You MUST use Google Search to find REAL, ACTIVE events happening on the specified dates.' : 'Since search is disabled, rely on your knowledge base but be as accurate as possible.'}
       - VERIFY EXISTENCE: Do not suggest shows or venues that have closed.
       - VERIFY LOCATION: Ensure suggestions are in the correct location based on the 'Location Context' below.
       - SEARCH-FIRST: Use real-time search results as your primary source of truth.

    10. LOCATION SELECTION LOGIC:
        - If the user specifies a location in the request, use that.
        - If the request implies TRAVEL (flight, holiday, getaway), treat 'HOME / ORIGIN' as the DEPARTURE point.
        - If the request implies LOCAL NATURE (hiking, walks), use 'HOME / ORIGIN'.
        - If the request implies URBAN SOCIALIZING (dinner, theatre, cinema), use 'SOCIAL HUB' unless stated otherwise.

    11. OUTPUT MUST BE STRICT VALID JSON ONLY. No markdown.
    12. Follow this JSON structure:
        {
          "message": "Friendly response...",
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
    // Format conversation history
    let historyContext = "";
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      historyContext = "CONVERSATION HISTORY:\n" + conversationHistory.map((msg: any) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      }).join('\n') + "\n";
    }

    const prompt = `
You are an advanced AI social event planner. Your goal is to help the user plan social activities.

USER CONTEXT:
- Current Date: ${today}
- Saved Activities: ${JSON.stringify(userActivities)}
- Core Values: ${JSON.stringify(userValues)}
- Saved Locations: ${JSON.stringify(userLocations)}
- Location Context: ${locationContextString}

${historyContext}

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
    // Use specific valid version instead of alias to prevent 404s
    const robustFallback = "gemini-1.5-flash-001";

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
