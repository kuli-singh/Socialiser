
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Sparkles, 
  Heart, 
  Plus, 
  Layers,
  CalendarCheck,
  Eye,
  Edit,
  ArrowRight,
  Bot,
  Zap,
  MessageCircle,
  UserPlus,
  Target
} from 'lucide-react';
import { formatDateTime, getTimeUntil, safeParseDate } from '@/lib/utils';

interface ActivityInstance {
  id: string;
  datetime: string;
  location: string | null;
  // Rich instance fields
  customTitle: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  detailedDescription: string | null;
  requirements: string | null;
  contactInfo: string | null;
  venueType: string | null;
  priceInfo: string | null;
  capacity: number | null;
  activity: {
    id: string;
    name: string;
    description: string | null;
    values: Array<{
      value: {
        name: string;
      };
    }>;
  };
  participations: Array<{
    friend: {
      name: string;
    };
  }>;
}

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<ActivityInstance[]>([]);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchUpcomingInstances(), fetchTemplates()]);
    }
  }, [status]);

  const fetchUpcomingInstances = async () => {
    try {
      const response = await fetch('/api/instances');
      if (!response.ok) throw new Error('Failed to fetch scheduled events');
      
      const data = await response.json();
      // Ensure data is an array and filter for upcoming instances only with safe date parsing
      const safeData = Array.isArray(data) ? data : [];
      const now = new Date();
      const upcoming = safeData.filter((instance: ActivityInstance) => {
        if (!instance) return false;
        const eventDate = safeParseDate(instance?.datetime);
        return eventDate && eventDate > now;
      });
      setInstances(upcoming ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInstances([]); // Ensure instances is always an array even on error
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Failed to fetch activity templates');
      
      const data = await response.json();
      // Ensure data is an array and safely slice it
      const safeData = Array.isArray(data) ? data : [];
      setTemplates((safeData ?? []).slice(0, 6)); // Show first 6 templates on dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTemplates([]); // Ensure templates is always an array even on error
    } finally {
      setLoading(false);
    }
  };



  // Show loading while checking authentication or fetching data
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-8 w-8 text-yellow-500 mr-3" />
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Transform templates into memorable experiences</p>
        </div>
        <Link href="/schedule">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* AI Discovery Banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-xl">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center">
                  AI-Powered Discovery
                  <Sparkles className="h-6 w-6 ml-2 text-yellow-300" />
                </h2>
                <p className="text-purple-100 text-lg">
                  Chat with AI to discover amazing local activities and events
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Link href="/ai-discovery">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg min-w-[160px]"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat with AI
                </Button>
              </Link>
              <div className="hidden sm:block text-white/80 text-sm max-w-xs">
                <div className="flex items-center mb-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Real-time event search
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location-aware suggestions
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <CalendarCheck className="h-5 w-5 text-blue-600 mr-2" />
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{instances.length}</div>
            <p className="text-gray-600 text-sm">Scheduled events ready to go</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-slate-500">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Layers className="h-5 w-5 text-slate-600 mr-2" />
              <CardTitle className="text-lg">Activity Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">{templates.length}</div>
            <p className="text-gray-600 text-sm">Templates ready for events</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle className="text-lg">People Involved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {new Set(instances?.flatMap?.(i => i?.participations?.map?.(p => p?.friend?.name).filter(Boolean) ?? []) ?? []).size}
            </div>
            <p className="text-gray-600 text-sm">Friends participating</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarCheck className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Upcoming Events</h2>
            <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
              Scheduled Instances
            </Badge>
          </div>
          {instances.length > 0 && (
            <Link href="/schedule">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Another
              </Button>
            </Link>
          )}
        </div>
        
        {instances.length === 0 ? (
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
            <CardContent className="text-center py-12">
              <CalendarCheck className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-600 mb-4">Create your first event from one of your activity templates</p>
              <Link href="/schedule">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance) => {
              const { date, time } = formatDateTime(instance.datetime);
              const fullAddress = [
                instance.address,
                instance.city,
                instance.state,
                instance.zipCode
              ].filter(Boolean).join(', ');
              
              return (
                <Card key={instance.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Custom Title - Primary */}
                        <CardTitle className="text-lg font-semibold text-blue-900 mb-1">
                          {instance.customTitle || instance.activity.name}
                        </CardTitle>
                        
                        {/* Template Name - Secondary */}
                        <div className="flex items-center text-sm text-blue-600 mb-2">
                          <span>Template: {instance.activity.name}</span>
                          <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800 text-xs">
                            Event
                          </Badge>
                        </div>
                        
                        {/* Time Until */}
                        <div className="flex items-center text-sm text-blue-700">
                          <Clock className="h-4 w-4 mr-1" />
                          {getTimeUntil(instance.datetime)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{date} at {time}</span>
                    </div>

                    {/* Rich Location */}
                    {(instance.venue || fullAddress || instance.location) && (
                      <div className="space-y-1">
                        {instance.venue && (
                          <div className="flex items-center text-sm text-gray-900 font-medium">
                            <MapPin className="h-4 w-4 mr-2 text-green-600" />
                            <span>{instance.venue}</span>
                          </div>
                        )}
                        {fullAddress && (
                          <div className="text-sm text-gray-600 ml-6">
                            {fullAddress}
                          </div>
                        )}
                        {!instance.venue && !fullAddress && instance.location && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-green-600" />
                            <span>{instance.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rich Details Badges */}
                    <div className="flex flex-wrap gap-2">
                      {instance.venueType && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                          {instance.venueType}
                        </Badge>
                      )}
                      {instance.priceInfo && (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                          {instance.priceInfo}
                        </Badge>
                      )}
                      {instance.capacity && (
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                          Max {instance.capacity}
                        </Badge>
                      )}
                    </div>

                    {/* Participants */}
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <span>{instance?.participations?.length ?? 0} participants</span>
                    </div>

                    {/* Values */}
                    {(instance?.activity?.values?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {instance?.activity?.values?.slice?.(0, 2)?.map?.((av, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            {av?.value?.name}
                          </Badge>
                        )) ?? []}
                        {(instance?.activity?.values?.length ?? 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(instance?.activity?.values?.length ?? 0) - 2} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Calendar Export Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/calendar/${instance.id}`);
                            if (!response.ok) throw new Error('Failed to generate calendar file');
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${(instance.customTitle || instance.activity.name).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}.ics`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            alert('Failed to download calendar file');
                          }
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Link
                        href={`/invite/${instance.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          <Users className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Layers className="h-6 w-6 text-slate-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">My Activity Templates</h2>
            <Badge variant="secondary" className="ml-3 bg-slate-100 text-slate-800">
              Reusable Blueprints
            </Badge>
          </div>
          <div className="flex space-x-2">
            {templates.length > 0 && (
              <Link href="/activities">
                <Button variant="outline" size="sm">
                  View All Templates
                </Button>
              </Link>
            )}
            <Link href="/activities/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </Link>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
            <CardContent className="text-center py-12">
              <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity templates yet</h3>
              <p className="text-gray-600 mb-4">Create your first template to start organizing events</p>
              <Link href="/activities/new">
                <Button size="lg" className="bg-slate-600 hover:bg-slate-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500 bg-slate-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center text-slate-900">
                        {template.name}
                        <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 text-xs">
                          Template
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {template._count?.instances || 0} events created
                      </p>
                    </div>
                    <Link href={`/activities/${template.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-gray-700 line-clamp-2">{template.description}</p>
                  )}

                  {/* Values */}
                  {(template?.values?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template?.values?.slice?.(0, 3)?.map?.((av) => (
                        <Badge key={av?.value?.id} variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          {av?.value?.name}
                        </Badge>
                      )) ?? []}
                      {(template?.values?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template?.values?.length ?? 0) - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/templates/${template.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </Link>
                    <Link href={`/templates/${template.id}/events`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions for First Time Users */}
      {instances.length === 0 && templates.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="text-center py-8">
            <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Social Organizer!</h3>
            <p className="text-gray-600 mb-6">Get started by creating activity templates, then use them to schedule specific events with your friends.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/activities/new">
                <Button variant="outline" className="w-full h-auto py-4">
                  <div className="text-center">
                    <Layers className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Create Templates</div>
                    <div className="text-xs text-gray-600">Define activity types</div>
                  </div>
                </Button>
              </Link>
              <Link href="/friends/new">
                <Button variant="outline" className="w-full h-auto py-4">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Add Friends</div>
                    <div className="text-xs text-gray-600">Build your network</div>
                  </div>
                </Button>
              </Link>
              <Link href="/values/new">
                <Button variant="outline" className="w-full h-auto py-4">
                  <div className="text-center">
                    <Heart className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Define Values</div>
                    <div className="text-xs text-gray-600">What matters to you</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
