
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

// Debug logging function
function debugLog(message: string, data?: any) {
  console.log(`[AI Chat Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    debugLog("Request received", { 
      userId: user.id, 
      messageLength: message.length,
      messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    });

    if (!process.env.ABACUSAI_API_KEY) {
      debugLog("API key missing");
      return NextResponse.json({ 
        error: 'AI service not configured',
        debug: 'ABACUSAI_API_KEY environment variable is missing'
      }, { status: 500 });
    }

    // Mock venue search results for activity suggestions
    const searchResults = {
      venue: "Community Center",
      address: "123 Main St",
      city: "Downtown",
      state: "CA",
      zipCode: "90210",
      contactInfo: "info@communitycenter.com",
      venueType: "Event Space"
    };

    debugLog("Mock search results", searchResults);

    try {
      // Make request to LLM API
      const llmApiUrl = 'https://apps.abacus.ai/v1/chat/completions';
      debugLog("Making LLM API request", { 
        url: llmApiUrl,
        model: "gpt-4.1-mini"
      });

      const llmResponse = await fetch(llmApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that suggests activities and events based on user requests. 
                       Be creative and provide detailed, engaging suggestions. 
                       Focus on creating memorable experiences that bring people together.
                       If the user asks about organizing events, provide practical advice about venues, timing, and logistics.`
            },
            {
              role: "user", 
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
      });

      debugLog("LLM API response status", { 
        status: llmResponse.status,
        statusText: llmResponse.statusText,
        ok: llmResponse.ok
      });

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        debugLog("LLM API error", { 
          status: llmResponse.status, 
          errorText: errorText.substring(0, 500)
        });
        
        throw new Error(`LLM API request failed: ${llmResponse.status} ${llmResponse.statusText}`);
      }

      const aiResponse = await llmResponse.json();
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
      let suggestion: {
        customTitle: string;
        venue: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        detailedDescription: string;
        contactInfo: string;
        venueType: string;
        requirements: string;
        capacity: number;
        priceInfo: string;
      } | null = null;
      
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

      debugLog("Response prepared", { 
        hasAiMessage: !!aiMessage,
        hasSuggestion: !!suggestion,
        suggestedEventsCount: suggestedEvents.length
      });

      return NextResponse.json({
        message: aiMessage,
        suggestedEvents,
        debug: {
          processed: true,
          suggestionsFound: suggestedEvents.length,
          messageLength: aiMessage.length
        }
      });

    } catch (apiError: any) {
      debugLog("LLM API Error", { 
        error: apiError.message,
        stack: apiError.stack?.substring(0, 500)
      });
      
      return NextResponse.json({
        error: 'Failed to get AI response',
        message: `I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment.
                 
                 In the meantime, here are some general activity suggestions:
                 - Organize a potluck dinner with friends
                 - Plan a hiking or walking group meetup  
                 - Host a game night or movie screening
                 - Set up a community volunteering event
                 - Create a skill-sharing workshop`,
        suggestedEvents: [],
        debug: {
          error: apiError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 200 }); // Return 200 so UI can show the fallback message
    }

  } catch (error: any) {
    debugLog("General Error", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      debug: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

