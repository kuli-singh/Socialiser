
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
  ExternalLink,
  Trash2
} from 'lucide-react';
import { formatDateTime, getTimeUntil, safeParseDate, getParticipantCount } from '@/lib/utils';

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
  eventUrl: string | null;
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
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null);

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
      // Start of today (00:00:00)
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const todayAndUpcoming = safeData.filter((instance: ActivityInstance) => {
        if (!instance) return false;
        const eventDate = safeParseDate(instance?.datetime);
        // Show anything from today onwards
        return eventDate && eventDate >= startOfToday;
      });
      setInstances(todayAndUpcoming ?? []);
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

  const deleteInstance = async (instanceId: string, instanceTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the event "${instanceTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingInstanceId(instanceId);

    try {
      const response = await fetch(`/api/instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      // Remove the deleted instance from local state
      setInstances(prevInstances =>
        prevInstances.filter(instance => instance.id !== instanceId)
      );

      alert('Event deleted successfully!');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeletingInstanceId(null);
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


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <CalendarCheck className="h-5 w-5 text-blue-600 mr-2" />
              <CardTitle className="text-lg">Today & Upcoming</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{instances.length}</div>
            <p className="text-gray-600 text-sm">Active and upcoming events</p>
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
            <h2 className="text-2xl font-semibold text-gray-900">Today & Upcoming Events</h2>
            <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
              Active Instances
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Link href="/events">
              <Button variant="ghost" size="sm">
                View All Events
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            {instances.length > 0 && (
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Another
                </Button>
              </Link>
            )}
          </div>
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
                <Card key={instance.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white ring-1 ring-gray-100 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
                  <CardHeader className="pb-3 px-5 pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Custom Title - Primary */}
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                          {instance.customTitle || instance.activity.name}
                        </CardTitle>

                        {/* Template Name - Secondary */}
                        <div className="flex items-center text-xs text-gray-500 font-medium mb-3">
                          <span className="uppercase tracking-wider">Template: {instance.activity.name}</span>
                          {safeParseDate(instance.datetime)! < new Date() ? (
                            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 border-none text-[10px] font-bold">
                              STARTED
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-600 border-none text-[10px] font-bold">
                              UPCOMING
                            </Badge>
                          )}
                        </div>

                        {/* Time Until */}
                        <div className="flex items-center text-sm font-semibold text-indigo-600 bg-indigo-50/50 w-fit px-2 py-1 rounded-md">
                          <Clock className="h-4 w-4 mr-1.5" />
                          {getTimeUntil(instance.datetime)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 space-y-4">
                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Date & Time */}
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3.5 w-3.5 mr-2 text-blue-500" />
                        <span className="truncate">{date}</span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center text-xs text-gray-600">
                        <Users className="h-3.5 w-3.5 mr-2 text-purple-500" />
                        <span>{getParticipantCount(instance)} joined</span>
                      </div>
                    </div>

                    {/* Rich Location */}
                    {(instance.venue || fullAddress || instance.location) && (
                      <div className="bg-gray-50/50 rounded-lg p-3 space-y-1.5 border border-gray-100/50">
                        {instance.venue && (
                          <div className="flex items-center text-sm text-gray-900 font-bold truncate">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                            <span className="truncate">{instance.venue}</span>
                          </div>
                        )}
                        {fullAddress && (
                          <div className="text-xs text-gray-500 ml-5 pl-0.5 line-clamp-1">
                            {fullAddress}
                          </div>
                        )}
                        {!instance.venue && !fullAddress && instance.location && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                            <span className="truncate">{instance.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Values & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {instance.venueType && instance.venueType !== 'undefined' && (
                          <Badge variant="outline" className="bg-white text-[10px] border-blue-100 text-blue-600 px-1.5 py-0">
                            {instance.venueType}
                          </Badge>
                        )}
                        {instance.priceInfo && instance.priceInfo !== 'undefined' && (
                          <Badge variant="outline" className="bg-white text-[10px] border-green-100 text-green-600 px-1.5 py-0">
                            {instance.priceInfo}
                          </Badge>
                        )}
                      </div>

                      {(instance?.activity?.values?.length ?? 0) > 0 && (
                        <div className="flex items-center text-xs text-red-600 font-medium whitespace-nowrap">
                          <Heart className="h-3 w-3 mr-1 fill-red-100" />
                          {instance?.activity?.values?.[0]?.value?.name}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2 border-t border-gray-100">
                      {/* Primary Actions Row */}
                      <div className="flex gap-2">
                        <Link
                          href={`/invite/${instance.id}`}
                          className="flex-[2]"
                        >
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-sm">
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            View Invite
                          </Button>
                        </Link>
                        <Link
                          href={`/schedule?edit=true&id=${instance.id}`}
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full font-semibold border-gray-200 hover:bg-gray-50">
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 hover:bg-blue-50"
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
                          <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
                          Export
                        </Button>

                        {instance.eventUrl && (
                          <a
                            href={instance.eventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button size="sm" variant="ghost" className="w-full text-[10px] h-8 font-bold uppercase tracking-wider text-gray-500 hover:text-green-600 hover:bg-green-50">
                              <ExternalLink className="h-3 w-3 mr-1.5 shrink-0" />
                              Website
                            </Button>
                          </a>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteInstance(instance.id, instance.customTitle || instance.activity.name)}
                          disabled={deletingInstanceId === instance.id}
                        >
                          {deletingInstanceId === instance.id ? (
                            <Clock className="h-3 w-3 mr-1.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1.5 shrink-0" />
                          )}
                          Delete
                        </Button>
                      </div>
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
      {
        instances.length === 0 && templates.length === 0 && (
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
        )
      }
    </div >
  );
}
