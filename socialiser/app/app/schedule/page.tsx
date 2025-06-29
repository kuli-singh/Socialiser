
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MultiStepScheduler } from '@/components/multi-step-scheduler';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ArrowLeft, Layers, Heart, ArrowRight, Bot, Sparkles, MessageCircle } from 'lucide-react';

interface ActivityTemplate {
  id: string;
  name: string;
  description: string | null;
  values: Array<{
    value: {
      name: string;
    };
  }>;
}

function ScheduleContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  
  // Check for AI suggestion parameters
  const isAISuggestion = searchParams.get('aiSuggestion') === 'true';
  const aiEventName = searchParams.get('eventName');
  const aiVenue = searchParams.get('venue');
  const aiAddress = searchParams.get('address');
  const aiDate = searchParams.get('date');
  const aiTime = searchParams.get('time');
  const aiDuration = searchParams.get('duration');
  const aiPrice = searchParams.get('price');
  const aiDescription = searchParams.get('description');
  const aiTemplateId = searchParams.get('templateId');
  const aiTemplateName = searchParams.get('templateName');
  
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [showScheduler, setShowScheduler] = useState(!!(templateId || isAISuggestion));
  const [loading, setLoading] = useState(!!(templateId || aiTemplateId));
  const [aiSuggestionData, setAiSuggestionData] = useState<any>(null);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else if (isAISuggestion) {
      // Handle AI suggestion
      if (aiTemplateId) {
        // If AI suggestion has a template, load it
        fetchTemplate(aiTemplateId);
      } else if (aiTemplateName) {
        // Create a temporary template object from AI data
        setSelectedTemplate({
          id: 'ai-generated',
          name: aiTemplateName,
          description: aiDescription || null,
          values: []
        });
        setLoading(false);
      }
      
      // Set up AI suggestion data
      setAiSuggestionData({
        eventName: aiEventName,
        venue: aiVenue,
        address: aiAddress,
        date: aiDate,
        time: aiTime,
        duration: aiDuration,
        price: aiPrice,
        description: aiDescription
      });
    }
  }, [templateId, isAISuggestion, aiTemplateId, aiTemplateName]);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/activities/${id}`);
      if (response.ok) {
        const template = await response.json();
        setSelectedTemplate(template);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!showScheduler) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
            <p className="text-gray-600 mt-1">Plan your next social activity with AI assistance</p>
          </div>
        </div>
        
        {/* AI Discovery vs Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Discovery Option */}
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="py-8 text-center">
              <div className="bg-white/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center">
                Discover with AI
                <Sparkles className="h-5 w-5 ml-2 text-yellow-300" />
              </h3>
              <p className="text-purple-100 mb-4">
                Chat with AI to find amazing local events and activities based on your preferences
              </p>
              <div className="space-y-2 mb-4 text-sm text-purple-100">
                <div className="flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Conversational interface
                </div>
                <div className="flex items-center justify-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Real event suggestions
                </div>
              </div>
              <Link href="/ai-discovery">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start AI Discovery
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Template Selection Option */}
          <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-8 text-center">
              <div className="bg-slate-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Layers className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Use Template</h3>
              <p className="text-gray-600 mb-4">
                Choose from your existing activity templates to create a new event instance
              </p>
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Reuse existing templates
                </div>
                <div className="flex items-center justify-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Value-aligned activities
                </div>
              </div>
              <Button onClick={() => setShowScheduler(true)} size="lg" className="w-full" variant="outline">
                <Layers className="h-4 w-4 mr-2" />
                Choose Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="text-center">
              <h4 className="font-medium text-blue-900 mb-1">New to Social Organizer?</h4>
              <p className="text-sm text-blue-800">
                Start with AI Discovery to explore what's available, or create your first 
                <Link href="/activities/new" className="underline mx-1 hover:text-blue-900">
                  activity template
                </Link>
                to get organized.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Template Context Header */}
      {selectedTemplate && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <Link href="/activities">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </Link>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">{selectedTemplate.name}</span>
              <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                Template
              </Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-medium">Create Event</span>
              <Badge className="bg-blue-100 text-blue-800">
                New Instance
              </Badge>
            </div>
          </div>
          
          {/* Template Info */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {selectedTemplate.description && (
                  <p className="text-sm text-gray-700 mb-2">{selectedTemplate.description}</p>
                )}
                {selectedTemplate.values.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Values:</span>
                    <div className="flex space-x-1">
                      {selectedTemplate.values.map((av, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {av.value.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Creating a specific event</p>
                <p className="text-xs text-slate-600">The template will not be modified</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Creating Event from Template</h3>
              <p className="text-sm text-blue-800">
                You're creating a specific event instance. The original template stays unchanged and can be used to create more events later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Step Scheduler */}
      <MultiStepScheduler 
        onBack={() => setShowScheduler(false)} 
        preselectedTemplate={selectedTemplate}
        aiSuggestion={aiSuggestionData}
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ScheduleContent />
    </Suspense>
  );
}
