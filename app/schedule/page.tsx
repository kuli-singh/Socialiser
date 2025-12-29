
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
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
  const aiUrl = searchParams.get('url');

  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [showScheduler, setShowScheduler] = useState(true);
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
        description: aiDescription,
        url: aiUrl
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
    // Determine if we should show the scheduler immediately (default behavior now)
    setShowScheduler(true);
    return null; // Will re-render with scheduler
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
                {(selectedTemplate?.values?.length ?? 0) > 0 && (
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Values:</span>
                    <div className="flex space-x-1">
                      {(selectedTemplate?.values ?? []).map((av, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {av?.value?.name}
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

      {/* Multi-Step Scheduler */}
      <MultiStepScheduler
        onBack={() => router.push('/')}
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
