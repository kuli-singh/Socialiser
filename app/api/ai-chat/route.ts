
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

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

// Mock web search function - in a real app, this would call a search API
function mockWebSearch(query: string, location?: string) {
  const venues = [
    'Community Center', 'Local Park', 'Downtown Library', 'Recreation Center',
    'Art Gallery', 'Coffee Shop', 'Restaurant', 'Gym', 'Studio Space',
    'Conference Room', 'Outdoor Pavilion', 'Event Hall', 'Cultural Center'
  ];
  
  const streets = [
    '123 Main St', '456 Oak Ave', '789 Elm St', '321 Pine Rd', '654 Maple Dr',
    '987 Cedar Ln', '147 Birch Way', '258 Willow St', '369 Ash Blvd'
  ];

  const cities = location ? [location] : ['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Arlington'];
  const states = ['CA', 'NY', 'TX', 'FL', 'IL'];

  const randomVenue = venues[Math.floor(Math.random() * venues.length)];
  const randomStreet = streets[Math.floor(Math.random() * streets.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randomState = states[Math.floor(Math.random() * states.length)];
  const randomZip = Math.floor(10000 + Math.random() * 90000).toString();

  return {
    venue: `${query.includes('cooking') ? 'Culinary Institute' : 
             query.includes('art') ? 'Art Studio' : 
             query.includes('fitness') ? 'Fitness Center' : 
             randomVenue}`,
    address: randomStreet,
    city: randomCity,
    state: randomState,
    zipCode: randomZip,
    contactInfo: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    venueType: query.includes('outdoor') ? 'outdoor' : 'indoor'
  };
}

export async function POST(request: NextRequest) {
  debugLog("=== AI CHAT REQUEST STARTED ===");
  
  try {
    // 1. Authentication check
    debugLog("Step 1: Checking authentication");
    const user = await getAuthenticatedUser();
    if (!user) {
      debugLog("Authentication failed - no user found");
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: 'No authenticated user found'
      }, { status: 401 });
    }
    debugLog("Authentication successful", { userId: user.id, email: user.email });

    // 2. Parse request body
    debugLog("Step 2: Parsing request body");
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      debugLog("Failed to parse request body", parseError);
      return NextResponse.json({
        error: 'Invalid request body',
        debug: 'Failed to parse JSON'
      }, { status: 400 });
    }
    
    const { message, location, conversationHistory, context } = body;
    debugLog("Request body parsed", { 
      message: message?.substring(0, 100) + (message?.length > 100 ? '...' : ''),
      hasLocation: !!location,
      historyLength: conversationHistory?.length || 0,
      hasContext: !!context
    });

    // 3. Validate required fields
    debugLog("Step 3: Validating required fields");
    if (!message) {
      debugLog("Validation failed - no message provided");
      return NextResponse.json({
        error: 'Message is required',
        debug: 'Message field is empty or missing'
      }, { status: 400 });
    }

    // 4. Get user's activities and values for context
    debugLog("Step 4: Fetching user context from database");
    let userActivities: any[] = [];
    let userValues: any[] = [];
    try {
      userActivities = await prisma.activity.findMany({
        where: { userId: user.id },
        include: {
          values: {
            include: {
              value: true
            }
          }
        }
      });

      userValues = await prisma.coreValue.findMany({
        where: { userId: user.id }
      });
      
      debugLog("Database queries successful", {
        activitiesCount: userActivities.length,
        valuesCount: userValues.length
      });
    } catch (dbError) {
      debugLog("Database query failed", dbError);
      // Continue with empty arrays if DB fails
      userActivities = [];
      userValues = [];
    }

    // 5. Mock web search based on the message
    debugLog("Step 5: Performing mock web search");
    const searchResults = mockWebSearch(message, location);
    debugLog("Mock search completed", searchResults);

    // 6. Build system prompt
    debugLog("Step 6: Building system prompt");
    const systemPrompt = `You are an AI assistant helping users plan detailed social activities. You have access to the user's existing activities and values.

User's Activities: ${userActivities.map(a => `${a.name} (${a.description || 'No description'})`).join(', ') || 'None yet'}
User's Values: ${userValues.map(v => `${v.name} (${v.description || 'No description'})`).join(', ') || 'None yet'}
${location ? `User's Location: ${location}` : ''}

When suggesting activities, provide rich, detailed responses including:
- Custom event titles (creative and specific)
- Detailed venue information
- Comprehensive descriptions
- Requirements for participants
- Pricing information if applicable
- Capacity suggestions
- Contact information
- Venue type classification

Make suggestions that align with their existing values and interests. Be creative, specific, and helpful.

Search Results Context: Found venue "${searchResults.venue}" at ${searchResults.address}, ${searchResults.city}, ${searchResults.state} ${searchResults.zipCode}`;

    debugLog("System prompt built", { promptLength: systemPrompt.length });

    // 7. Check API key availability
    debugLog("Step 7: Checking API key");
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      debugLog("CRITICAL ERROR: API key is missing");
      return NextResponse.json({
        error: 'AI service configuration error',
        debug: 'ABACUSAI_API_KEY environment variable is not set'
      }, { status: 500 });
    }
    debugLog("API key found", { 
      keyExists: true, 
      keyPrefix: apiKey.substring(0, 8) + '...',
      keyLength: apiKey.length 
    });

    // 8. Call the LLM API
    debugLog("Step 8: Calling LLM API");
    const requestBody = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    };
    
    debugLog("LLM request prepared", { 
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      temperature: requestBody.temperature,
      maxTokens: requestBody.max_tokens
    });

    try {
      debugLog("Making fetch request to LLM API");
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      debugLog("LLM API response received", { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        debugLog("LLM API error response", { 
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`LLM API error: ${response.status} - ${response.statusText}. Body: ${errorText}`);
      }

      debugLog("Parsing LLM API response");
      const aiResponse = await response.json();
      debugLog("LLM API response parsed", { 
        hasChoices: !!aiResponse.choices,
        choicesLength: aiResponse.choices?.length || 0,
        firstChoiceContent: aiResponse.choices?.[0]?.message?.content?.substring(0, 200) || null
      });

      const aiMessage = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Please try again.';
      debugLog("AI message extracted", { 
        messageLength: aiMessage.length,
        messagePreview: aiMessage.substring(0, 100) + (aiMessage.length > 100 ? '...' : '')
      });

      // Try to extract structured data for quick scheduling
      let suggestion = null;
      
      // Simple pattern matching to extract activity suggestions
      const titleMatch = aiMessage.match(/(?:title|event|activity):\s*["']([^"']+)["']/i);
      const venueMatch = aiMessage.match(/(?:venue|location|place):\s*["']([^"']+)["']/i);
      const descMatch = aiMessage.match(/(?:description|about):\s*["']([^"']+)["']/i);
      
      if (titleMatch || venueMatch) {
        suggestion = {
          customTitle: titleMatch?.[1] || `${message} Activity`,
          venue: venueMatch?.[1] || searchResults.venue,
          address: searchResults.address,
          city: searchResults.city,
          state: searchResults.state,
          zipCode: searchResults.zipCode,
          detailedDescription: descMatch?.[1] || `AI-suggested activity based on: ${message}`,
          contactInfo: searchResults.contactInfo,
          venueType: searchResults.venueType,
          requirements: 'Please check with organizer for specific requirements',
          capacity: 8,
          priceInfo: 'Contact venue for pricing details'
        };
      }

      // Convert suggestion to expected format
      const suggestedEvents = suggestion ? [{
        name: suggestion.customTitle || `${message} Activity`,
        description: suggestion.detailedDescription || `AI-suggested activity based on: ${message}`,
        venue: suggestion.venue || searchResults.venue,
        address: `${suggestion.address || searchResults.address}, ${suggestion.city || searchResults.city}, ${suggestion.state || searchResults.state} ${suggestion.zipCode || searchResults.zipCode}`,
        date: 'TBD - Contact venue to confirm availability',
        time: 'TBD - Contact venue for schedule',
        duration: '2-3 hours (estimated)',
        price: suggestion.priceInfo || 'Contact venue for pricing',
        url: '',
        reasoning: `Based on your request for "${message}", this venue offers the perfect setting for your activity.`
      }] : [];

      return NextResponse.json({
        response: {
          message: aiMessage,
          searchResults: [],
          suggestedEvents: suggestedEvents
        }
      });

    } catch (aiError) {
      debugLog("AI API call failed", {
        error: aiError instanceof Error ? aiError.message : String(aiError),
        stack: aiError instanceof Error ? aiError.stack : undefined
      });
      
      // Fallback response with basic suggestion in correct format
      debugLog("Step 9: Creating fallback response due to AI API failure");
      const fallbackEvent = {
        name: `${message} Activity`,
        description: `AI-suggested activity: ${message}. This sounds like a great way to connect with friends and explore new experiences together.`,
        venue: searchResults.venue,
        address: `${searchResults.address}, ${searchResults.city}, ${searchResults.state} ${searchResults.zipCode}`,
        date: 'TBD - Contact venue to confirm availability',
        time: 'TBD - Contact venue for schedule',
        duration: '2-3 hours (estimated)',
        price: 'Contact venue for pricing details',
        url: '',
        reasoning: `Based on your request for "${message}", this venue offers the perfect setting for your activity.`
      };

      const fallbackResponse = {
        response: {
          message: `I'd be happy to help you plan "${message}"! Based on your request, I found some great options in your area. This activity could be a wonderful way to spend time with friends and create lasting memories.`,
          searchResults: [],
          suggestedEvents: [fallbackEvent]
        }
      };

      debugLog("Fallback response created", fallbackResponse);
      debugLog("=== AI CHAT REQUEST COMPLETED (WITH FALLBACK) ===");
      
      return NextResponse.json(fallbackResponse);
    }

  } catch (error) {
    debugLog("CRITICAL ERROR in AI chat request", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    debugLog("=== AI CHAT REQUEST FAILED ===");
    
    return NextResponse.json({
      error: 'Failed to process AI chat request',
      debug: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
