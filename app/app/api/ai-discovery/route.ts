
import { NextRequest, NextResponse } from 'next/server';

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

interface DiscoveredOption {
  name: string;
  description: string;
  suggestedLocation: string;
  suggestedTime: string;
  estimatedDuration: string;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoveryRequest = await request.json();
    const { activityName, location, preferences, dateRange } = body;

    if (!activityName) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      );
    }

    // Construct AI prompt for discovering specific activity options
    const prompt = `You are a helpful activity planning assistant. Given a generic activity type, suggest 4-5 specific, realistic options that people could actually do.

Activity Type: ${activityName}
${location ? `General Location Area: ${location}` : ''}
${preferences ? `Additional Preferences: ${preferences}` : ''}
${dateRange ? `Date Range: ${dateRange.start} to ${dateRange.end}` : ''}

Please suggest specific, actionable activity options. For each option, provide:
1. A specific name/title for the activity
2. A brief description (2-3 sentences)
3. A suggested specific location (can be general like "Local hiking trail" or "Downtown coffee shop")
4. Suggested time/timing recommendations
5. Estimated duration
6. Brief reasoning why this option fits the activity type

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.

Use this exact format:
{
  "options": [
    {
      "name": "Specific activity name",
      "description": "Brief description of what this involves",
      "suggestedLocation": "Specific location suggestion",
      "suggestedTime": "Time recommendation (e.g., 'Weekend morning', 'Evening', 'Weekday afternoon')",
      "estimatedDuration": "Duration estimate (e.g., '2-3 hours', '1 hour', 'Half day')",
      "reasoning": "Why this fits the activity type"
    }
  ]
}`;

    // Make request to AI API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    let aiContent = aiResponse.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content received from AI API');
    }

    // Clean and parse the JSON response
    aiContent = aiContent.trim();
    // Remove any markdown code blocks if present
    aiContent = aiContent.replace(/```json\s*|\s*```/g, '');
    // Remove any trailing commas
    aiContent = aiContent.replace(/,(\s*[}\]])/g, '$1');
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the response structure
    if (!parsedResponse.options || !Array.isArray(parsedResponse.options)) {
      throw new Error('Invalid response format from AI');
    }

    // Ensure all options have required fields
    const validOptions = parsedResponse.options.filter((option: any) => 
      option.name && option.description && option.suggestedLocation && 
      option.suggestedTime && option.estimatedDuration && option.reasoning
    );

    if (validOptions.length === 0) {
      throw new Error('No valid options returned from AI');
    }

    return NextResponse.json({
      success: true,
      options: validOptions,
      activityType: activityName
    });

  } catch (error) {
    console.error('AI discovery error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate activity suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
