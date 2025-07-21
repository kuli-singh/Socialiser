
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Heart, 
  Calendar, 
  Eye,
  BarChart3,
  ArrowRight,
  Bot,
  Sparkles
} from 'lucide-react';
import { safeParseDate } from '@/lib/utils';

interface ActivityTemplate {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  values: Array<{
    value: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    instances: number;
  };
}

export default function ActivityTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activity templates');
      
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity template? This will also delete all associated events.')) return;

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete activity template');
      
      setTemplates(templates.filter(template => template.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete activity template');
    }
  };

  const createEventFromTemplate = (templateId: string) => {
    router.push(`/schedule?template=${templateId}`);
  };

  const discoverWithAI = (template: ActivityTemplate) => {
    const searchParams = new URLSearchParams({
      templateId: template.id,
      templateName: template.name
    });
    router.push(`/ai-discovery?${searchParams.toString()}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center">
            <Layers className="h-8 w-8 text-slate-600 mr-3" />
            Activity Templates
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Reusable blueprints for creating specific events with AI assistance</p>
        </div>
        <Link href="/activities/new">
          <Button size="lg" className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Help Text */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <Layers className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">How Templates Work</h3>
              <p className="text-sm text-gray-600">
                Templates are reusable activity types (like "Hiking" or "Concert"). Create specific events from templates using AI to find locations, times, and details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-slate-600 mr-2" />
            <CardTitle>Template Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-600">{templates.length}</div>
              <p className="text-gray-600 text-sm">Total Templates</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {templates.reduce((sum, t) => sum + (t._count?.instances || 0), 0)}
              </div>
              <p className="text-gray-600 text-sm">Events Created</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.values.length > 0).length}
              </div>
              <p className="text-gray-600 text-sm">With Values</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(templates.flatMap(t => t.values.map(v => v.value.id))).size}
              </div>
              <p className="text-gray-600 text-sm">Unique Values</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
          <CardContent className="text-center py-12">
            <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity templates yet</h3>
            <p className="text-gray-600 mb-4">Create your first template to start organizing events! Templates are reusable activity types like "Hiking", "Movie Night", or "Dinner".</p>
            <Link href="/activities/new">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <CardTitle className="text-lg text-slate-900">{template.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 text-xs">
                        Template
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Created {(() => {
                        const date = safeParseDate(template.createdAt);
                        return date ? date.toLocaleDateString() : 'Date unknown';
                      })()}</span>
                      {(template._count?.instances || 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {template._count?.instances} events
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Link href={`/activities/${template.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Description */}
                {template.description && (
                  <p className="text-sm text-gray-700">{template.description}</p>
                )}

                {/* Values */}
                {template.values.length > 0 ? (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Heart className="h-4 w-4 mr-1" />
                      Associated Values
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.values.slice(0, 3).map((av) => (
                        <Badge key={av.value.id} variant="outline" className="text-xs">
                          {av.value.name}
                        </Badge>
                      ))}
                      {template.values.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.values.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No values assigned</p>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {/* AI Discovery Button - Primary */}
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => discoverWithAI(template)}
                  >
                    <Bot className="h-4 w-4 mr-1" />
                    Schedule with AI
                    <Sparkles className="h-3 w-3 ml-1" />
                  </Button>

                  {/* Traditional Template Button - Secondary */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => createEventFromTemplate(template.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Use Template Directly
                  </Button>
                  
                  <div className="flex space-x-2">
                    {(template._count?.instances || 0) > 0 && (
                      <Link href={`/templates/${template.id}/events`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View Events ({template._count?.instances})
                        </Button>
                      </Link>
                    )}
                    <Link href={`/activities/${template.id}/edit`} className={template._count?.instances ? 'flex-1' : 'w-full'}>
                      <Button variant="ghost" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Template
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Call to Action */}
      {templates.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Ready to create an event?</h3>
            </div>
            <p className="text-gray-600 mb-4">Choose any template above and let AI help you discover specific options!</p>
            <Link href="/schedule">
              <Button size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Browse Templates & Create Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
