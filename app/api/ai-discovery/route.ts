
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

interface DiscoveryRequest {
  activityName: string;
  location?: string;
  preferences?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let preferredModel = "gemini-flash-latest";
    let enableGoogleSearch = true;

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true }
      });
      const prefs = (user?.preferences as any) || {};
      if (prefs.preferredModel) preferredModel = prefs.preferredModel;
      // Fix legacy/unavailable model names from DB
      if (preferredModel === "gemini-1.5-flash") preferredModel = "gemini-flash-latest";
      if (preferredModel === "gemini-1.5-pro") preferredModel = "gemini-pro-latest";
      if (preferredModel === "gemini-1.5-pro-latest") preferredModel = "gemini-pro-latest";

      if (prefs.enableGoogleSearch !== undefined) enableGoogleSearch = prefs.enableGoogleSearch;
    }

    const body: DiscoveryRequest = await request.json();
    const { activityName, location, preferences, dateRange } = body;

    // ... (rest of validation)

    if (!activityName) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const today = new Date().toDateString();

    const prompt = `
You are a helpful activity planning assistant.
Current Date: ${today}

Given a generic activity type: "${activityName}", suggest 4-5 specific, realistic options that people could actually do.

Context:
${location ? `Location: ${location}` : ''}
${preferences ? `Preferences: ${preferences}` : ''}
${dateRange ? `Date Range: ${dateRange.start} to ${dateRange.end}` : ''}

Instructions:
1. ${enableGoogleSearch ? 'Use Google Search to find REAL, verifyable options.' : 'Suggest realistic options based on general knowledge.'}
2. CRITICAL: You MUST provide a valid 'url' for EVERY option found. Use the link from the Google Search result.
3. Provide specific time, duration, and price estimates.
4. Respond with raw JSON only. Use this exact format:
{
  "options": [
    {
      "name": "Specific activity name",
      "description": "Brief description",
      "suggestedLocation": "Specific location suggestion",
      "suggestedTime": "YYYY-MM-DD at HH:MM (e.g. 2025-12-31 at 19:00)",
      "estimatedDuration": "Duration estimate",
      "reasoning": "Why this fits",
      "url": "URL to event or Google Search"
    }
  ]
}
`;

    const modelsToTry = [preferredModel];
    let aiContent = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const tools = enableGoogleSearch ? [{ googleSearch: {} } as any] : [];
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: tools
        });
        const result = await model.generateContent(prompt);
        aiContent = result.response.text();
        break;
      } catch (err: any) {
        console.error(`AI Discovery failed with ${modelName} (Tools: ${enableGoogleSearch}):`, err.message);
        lastError = err;

        // Fallback retry without tools
        if (enableGoogleSearch) {
          try {
            console.log(`Retrying ${modelName} WITHOUT tools`);
            const model = genAI.getGenerativeModel({
              model: modelName,
              tools: []
            });
            const result = await model.generateContent(prompt);
            aiContent = result.response.text();
            break;
          } catch (retryErr: any) {
            console.error(`AI Discovery fallback failed with ${modelName}:`, retryErr.message);
            lastError = retryErr;
          }
        }
      }
    }

    if (!aiContent) {
      throw lastError || new Error("All AI models failed");
    }

    // Clean and parse the JSON response
    aiContent = aiContent.replace(/```json\s*|\s*```/g, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!parsedResponse.options || !Array.isArray(parsedResponse.options)) {
      throw new Error('Invalid response format from AI');
    }

    return NextResponse.json({
      success: true,
      options: parsedResponse.options,
      activityType: activityName
    });

  } catch (error) {
    console.error('AI discovery error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota");

    return NextResponse.json(
      {
        error: isRateLimit ? 'Rate Limit Exceeded' : 'Failed to generate activity suggestions',
        details: isRateLimit
          ? 'Usage limit reached. Please switch to Gemini Flash (Latest Stable) in Settings.'
          : errorMessage
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
