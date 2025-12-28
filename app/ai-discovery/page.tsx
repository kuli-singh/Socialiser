
'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AIChatInterface } from '@/components/ai-chat-interface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Bot, Zap, MapPin, MessageCircle } from 'lucide-react';
import { Suspense } from 'react';

interface SuggestedEvent {
  name: string;
  description: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  url?: string;
  reasoning: string;
}

function AIDiscoveryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<SuggestedEvent | null>(null);

  // Get context from URL parameters
  const templateId = searchParams.get('templateId');
  const templateName = searchParams.get('templateName');

  const initialContext = templateId && templateName ? {
    templateId,
    templateName
  } : undefined;

  const handleEventSelected = (event: SuggestedEvent) => {
    setSelectedEvent(event);

    // Navigate to schedule page with pre-filled data
    const scheduleUrl = new URLSearchParams({
      aiSuggestion: 'true',
      eventName: event.name,
      venue: event.venue,
      address: event.address,
      date: event.date,
      time: event.time,
      duration: event.duration,
      price: event.price,
      description: event.description,
      ...(event.url && { url: event.url }),
      ...(templateId && { templateId }),
      ...(templateName && { templateName })
    });

    router.push(`/schedule?${scheduleUrl.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {templateName && (
            <div className="bg-blue-50 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-blue-700">
                Finding activities for: {templateName}
              </span>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full mr-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                AI Discovery
                <Sparkles className="h-6 w-6 text-yellow-500 ml-2" />
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Let's find your next amazing activity
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <MessageCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Chat Interface</h3>
              <p className="text-sm text-gray-600">
                Have a conversation with AI to discover perfect activities
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Location-Aware</h3>
              <p className="text-sm text-gray-600">
                Find real events and venues near your location
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Smart Suggestions</h3>
              <p className="text-sm text-gray-600">
                Get personalized recommendations based on your preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-lg">
        <AIChatInterface
          initialContext={initialContext}
          onEventSelected={handleEventSelected}
        />
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          Pro Tips for Better Suggestions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Be specific:</strong> Instead of "find something fun," try "find a jazz concert this weekend"
          </div>
          <div>
            <strong>Share your location:</strong> This helps find real venues and events near you
          </div>
          <div>
            <strong>Mention preferences:</strong> Budget range, group size, indoor/outdoor, etc.
          </div>
          <div>
            <strong>Ask follow-up questions:</strong> The AI can refine suggestions based on your feedback
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIDiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading AI Discovery...</p>
      </div>
    }>
      <AIDiscoveryContent />
    </Suspense>
  );
}
