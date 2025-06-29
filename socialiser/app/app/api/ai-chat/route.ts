
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

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
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, location } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user's activities and values for context
    const userActivities = await prisma.activity.findMany({
      where: { userId: user.id },
      include: {
        values: {
          include: {
            value: true
          }
        }
      }
    });

    const userValues = await prisma.coreValue.findMany({
      where: { userId: user.id }
    });

    // Mock web search based on the message
    const searchResults = mockWebSearch(message, location);

    // Enhanced system prompt for rich suggestions
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

    // Call the LLM API
    try {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const aiMessage = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Please try again.';

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

      return NextResponse.json({
        message: aiMessage,
        suggestion,
        location: location || null
      });

    } catch (aiError) {
      console.error('AI API Error:', aiError);
      
      // Fallback response with basic suggestion
      const fallbackSuggestion = {
        customTitle: `${message} Activity`,
        venue: searchResults.venue,
        address: searchResults.address,
        city: searchResults.city,
        state: searchResults.state,
        zipCode: searchResults.zipCode,
        detailedDescription: `AI-suggested activity: ${message}. This sounds like a great way to connect with friends and explore new experiences together.`,
        contactInfo: searchResults.contactInfo,
        venueType: searchResults.venueType,
        requirements: 'Please check with organizer for specific requirements',
        capacity: 8,
        priceInfo: 'Contact venue for pricing details'
      };

      return NextResponse.json({
        message: `I'd be happy to help you plan "${message}"! Based on your request, I found some great options in your area. This activity could be a wonderful way to spend time with friends and create lasting memories.`,
        suggestion: fallbackSuggestion,
        location: location || null
      });
    }

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
