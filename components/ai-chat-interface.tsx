
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Bot,
  Send,
  MapPin,
  User,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Navigation
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  searchResults?: WebSearchResult[];
  suggestedEvents?: SuggestedEvent[];
}

interface WebSearchResult {
  title: string;
  description: string;
  url: string;
  venue?: string;
  address?: string;
  date?: string;
  time?: string;
  price?: string;
}

interface SuggestedEvent {
  name: string;
  description: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  venueType: string;
  price: string;
  url?: string;
  reasoning: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AIChatInterfaceProps {
  initialContext?: {
    templateId?: string;
    templateName?: string;
  };
  onEventSelected?: (event: SuggestedEvent) => void;
}

export function AIChatInterface({ initialContext, onEventSelected }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add initial greeting message
    const initialMessage: ChatMessage = {
      id: 'initial',
      role: 'assistant',
      content: initialContext?.templateName
        ? `Hi! I'm here to help you find amazing ${initialContext.templateName.toLowerCase()} activities! 🎉\n\nWhat kind of ${initialContext.templateName.toLowerCase()} experience are you looking for?`
        : `Hi! I'm your AI activity planner! ✨\n\nI can help you discover amazing local events, activities, restaurants, concerts, and more based on your interests.\n\nLet me know what you're interested in doing!`,
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  }, [initialContext]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get address (simplified)
          const address = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

          setLocation({ latitude, longitude, address });

          // Send confirmation message
          sendMessage(`I'm located at coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Please use this location to find nearby activities.`);
        },
        (error) => {
          console.error('Error getting location:', error);
          addAssistantMessage("I couldn't access your location. No worries! Just tell me what city or area you're in, and I'll help you find activities there. 📍");
        }
      );
    } else {
      addAssistantMessage("Location services aren't available. Just tell me what city or area you're in! 🌍");
    }
  };

  const addAssistantMessage = (content: string, searchResults?: WebSearchResult[], suggestedEvents?: SuggestedEvent[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      searchResults,
      suggestedEvents
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    console.log('[AI-CHAT FRONTEND] Sending message:', {
      message: text,
      location,
      historyLength: messages.length
    });

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const requestBody = {
        message: text,
        conversationHistory: messages.slice(-10), // Send last 10 messages for context
        location,
        context: initialContext
      };

      console.log('[AI-CHAT FRONTEND] Request body:', requestBody);

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[AI-CHAT FRONTEND] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[AI-CHAT FRONTEND] API error:', errorData);

        let errorMessage = "Sorry, I encountered an error. Please try again! 😅";
        if (errorData.debug) {
          errorMessage += `\n\nDebug info: ${errorData.debug}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[AI-CHAT FRONTEND] Response data:', data);

      // Validate response structure
      if (!data.response) {
        console.error('[AI-CHAT FRONTEND] Invalid response structure:', data);
        throw new Error('Invalid response format from AI service');
      }

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        addAssistantMessage(
          data.response.message || 'I received your message but had trouble generating a response.',
          data.response.searchResults || [],
          data.response.suggestedEvents || []
        );
      }, 1000);

    } catch (error) {
      console.error('[AI-CHAT FRONTEND] Chat error:', error);
      setIsTyping(false);

      let errorMessage = "Sorry, I encountered an error. Please try again! 😅";

      if (error instanceof Error) {
        // Show more specific error messages
        if (error.message.includes('API key')) {
          errorMessage = "🔑 AI service configuration issue. Please contact support.";
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = "🔒 Please log in to use the AI feature.";
        } else if (error.message.includes('500')) {
          errorMessage = "🔧 AI service is temporarily unavailable. Please try again in a moment.";
        } else if (error.message.includes('fetch')) {
          errorMessage = "🌐 Network error. Please check your connection and try again.";
        } else if (error.message.includes('Debug info:')) {
          errorMessage = error.message; // Show debug info if available
        }
      }

      addAssistantMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return '--:--';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '--:--';

      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <Bot className="h-6 w-6 mr-2" />
          <div>
            <h3 className="font-semibold">AI Activity Planner</h3>
            <p className="text-xs opacity-90">
              {location ? `📍 ${location.address}` : 'Using saved preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
              </div>

              {/* Message Content */}
              <div className="flex flex-col">
                <div className={`rounded-lg px-4 py-2 ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>

                {/* Suggested Events */}
                {message.suggestedEvents && message.suggestedEvents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                      Suggested Events
                    </p>
                    {message.suggestedEvents.map((event, index) => (
                      <EventCard
                        key={index}
                        event={event}
                        onSelect={() => onEventSelected?.(event)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center mr-2">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="ml-2 text-sm text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to find concerts, restaurants, hiking trails, or any activity..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event, onSelect }: { event: SuggestedEvent; onSelect: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-900">{event.name}</h4>
          <Button size="sm" className="ml-2">
            Select
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-3">{event.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {event.venue}
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {event.date}
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {event.time}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            {event.price}
          </div>
          {event.venueType && (
            <div className="col-span-2 flex items-center text-blue-600 font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              Type: {event.venueType}
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
          <strong>Why this works:</strong> {event.reasoning}
        </div>

        {event.url && (
          <div className="mt-2 flex items-center text-xs text-blue-600">
            <ExternalLink className="h-3 w-3 mr-1" />
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              View Details
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
