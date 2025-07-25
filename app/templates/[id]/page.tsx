
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { 
  ArrowLeft, 
  Layers, 
  Heart, 
  Plus, 
  Bot, 
  Sparkles, 
  Calendar,
  Users,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ActivityTemplate {
  id: string;
  name: string;
  description: string | null;
  values: Array<{
    value: {
      name: string;
    };
  }>;
  _count?: {
    instances: number;
  };
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<ActivityTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/activities/${templateId}`);
      if (!response.ok) {
        throw new Error('Template not found');
      }
      const data = await response.json();
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = () => {
    router.push(`/schedule?template=${templateId}&mode=manual`);
  };

  const handleAICreate = () => {
    router.push(`/ai-discovery?templateId=${templateId}&templateName=${encodeURIComponent(template?.name || '')}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!template) return <ErrorMessage message="Template not found" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/activities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Templates
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Layers className="h-8 w-8 text-slate-600" />
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <Badge variant="secondary" className="bg-slate-200 text-slate-800">
              Template
            </Badge>
          </div>
          <p className="text-gray-600">Choose how to create your event from this template</p>
        </div>
      </div>

      {/* Template Info */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="h-5 w-5 text-slate-600 mr-2" />
            Template Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.description && (
            <p className="text-gray-700">{template.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {(template?.values?.length ?? 0) > 0 && (
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-600">Values:</span>
                  <div className="flex space-x-1">
                    {(template?.values ?? []).map((av, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {av?.value?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {(template._count?.instances || 0) > 0 && (
              <Badge variant="outline" className="text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                {template._count?.instances} events created
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Event Options */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Event from Template</h2>
          <p className="text-gray-600">Choose your preferred method to create a specific event</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Creation Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300" 
                onClick={handleManualCreate}>
            <CardContent className="py-8 text-center">
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Event Manually</h3>
              <p className="text-gray-600 mb-4">
                Fill out the event details yourself - perfect when you know exactly what you want
              </p>
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Direct to event form
                </div>
                <div className="flex items-center justify-center">
                  <Users className="h-4 w-4 mr-2" />
                  Full control over details
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={(e) => {
                e.stopPropagation();
                handleManualCreate();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </CardContent>
          </Card>

          {/* AI Discovery Option */}
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" 
                onClick={handleAICreate}>
            <CardContent className="py-8 text-center">
              <div className="bg-white/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center">
                Discover with AI
                <Sparkles className="h-5 w-5 ml-2 text-yellow-300" />
              </h3>
              <p className="text-purple-100 mb-4">
                Let AI suggest specific options, locations, and details for your {template.name.toLowerCase()} event
              </p>
              <div className="space-y-2 mb-4 text-sm text-purple-100">
                <div className="flex items-center justify-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Smart suggestions
                </div>
                <div className="flex items-center justify-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Location-aware options
                </div>
              </div>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 w-full" onClick={(e) => {
                e.stopPropagation();
                handleAICreate();
              }}>
                <Bot className="h-4 w-4 mr-2" />
                Discover Specific Options with AI
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Actions */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Need to modify the template?</h4>
              <p className="text-sm text-gray-600">Edit the template details, values, or description</p>
            </div>
            <Link href={`/activities/${template.id}/edit`}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Previous Events */}
      {(template._count?.instances || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Previous Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You've created {template._count?.instances} event{template._count?.instances !== 1 ? 's' : ''} from this template
            </p>
            <Link href={`/templates/${template.id}/events`}>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View All Events ({template._count?.instances})
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
