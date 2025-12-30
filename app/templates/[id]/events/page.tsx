
'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Calendar, Clock, MapPin, Users, Edit, ExternalLink, Eye, Trash2, Plus, Search, Filter, SortAsc, SortDesc, Layers, CalendarCheck, Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { getTimeUntil, getEventParticipantStats } from '@/lib/utils';

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
  values: Array<{
    value: {
      name: string;
    };
  }>;
  instances: ActivityInstance[];
}

export default function TemplateEventsPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<ActivityTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplateWithEvents();
  }, [params.id]);

  const fetchTemplateWithEvents = async () => {
    try {
      const response = await fetch(`/api/activities/${params.id}?include=instances`);
      if (!response.ok) throw new Error('Activity template not found');

      const data = await response.json();
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template events');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    // Handle invalid or missing datetime
    if (!datetime) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }

    const date = new Date(datetime);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }

    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getEventStatus = (datetime: string) => {
    // Handle invalid or missing datetime
    if (!datetime) {
      return { status: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }

    const now = new Date();
    const eventDate = new Date(datetime);

    // Check if the date is valid
    if (isNaN(eventDate.getTime())) {
      return { status: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }

    if (eventDate < now) {
      return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' };
    } else {
      const diffMs = eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return { status: 'today', label: 'Today', color: 'bg-red-100 text-red-800' };
      if (diffDays === 1) return { status: 'tomorrow', label: 'Tomorrow', color: 'bg-orange-100 text-orange-800' };
      if (diffDays <= 7) return { status: 'upcoming', label: `In ${diffDays} days`, color: 'bg-blue-100 text-blue-800' };
      return { status: 'future', label: `In ${diffDays} days`, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!template) return <ErrorMessage message="Activity template not found" />;

  const upcomingEvents = template.instances.filter(instance => {
    if (!instance.datetime) return false;
    const eventDate = new Date(instance.datetime);
    return !isNaN(eventDate.getTime()) && eventDate > new Date();
  });
  const pastEvents = template.instances.filter(instance => {
    if (!instance.datetime) return false;
    const eventDate = new Date(instance.datetime);
    return !isNaN(eventDate.getTime()) && eventDate <= new Date();
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center space-x-4">
        <Link href="/activities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Activity Templates
          </Button>
        </Link>
        <div className="text-sm text-gray-500">
          <span className="flex items-center">
            <Layers className="h-4 w-4 mr-1" />
            Template → Events
          </span>
        </div>
      </div>

      {/* Template Info */}
      <Card className="border-l-4 border-l-slate-500 bg-slate-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center text-slate-900">
                <Layers className="h-6 w-6 mr-2" />
                {template.name}
                <Badge variant="secondary" className="ml-3 bg-slate-200 text-slate-800">
                  Template
                </Badge>
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {template.instances.length} events created from this template
              </p>
            </div>
            <Link href={`/schedule?template=${template.id}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Description */}
          {template.description && (
            <p className="text-gray-700">{template.description}</p>
          )}

          {/* Values */}
          {template.values.length > 0 && (
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Heart className="h-4 w-4 mr-1" />
                Associated Values
              </div>
              <div className="flex flex-wrap gap-1">
                {template.values.map((av, index) => (
                  <Badge key={index} variant="outline">
                    {av.value.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <CalendarCheck className="h-5 w-5 text-blue-600 mr-2" />
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{upcomingEvents.length}</div>
            <p className="text-gray-600 text-sm">Ready to attend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle className="text-lg">Past Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{pastEvents.length}</div>
            <p className="text-gray-600 text-sm">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <CardTitle className="text-lg">Total Participants</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {new Set(template.instances.flatMap(i => i.participations.map(p => p.friend.name))).size}
            </div>
            <p className="text-gray-600 text-sm">Unique friends involved</p>
          </CardContent>
        </Card>
      </div>

      {/* No Events Message */}
      {template.instances.length === 0 && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
          <CardContent className="text-center py-12">
            <CalendarCheck className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events created yet</h3>
            <p className="text-gray-600 mb-4">Create your first event from this template!</p>
            <Link href={`/schedule?template=${template.id}`}>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarCheck className="h-5 w-5 text-blue-600 mr-2" />
              Upcoming Events
            </h2>
            <Link href={`/schedule?template=${template.id}`}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Another
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((instance) => {
              const { date, time } = formatDateTime(instance.datetime);
              const { status, label, color } = getEventStatus(instance.datetime);
              const fullAddress = [
                instance.address,
                instance.city,
                instance.state,
                instance.zipCode
              ].filter(Boolean).join(', ');

              return (
                <Card key={instance.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white ring-1 ring-gray-100 overflow-hidden flex flex-col">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />

                  <CardHeader className="pb-2 px-5 pt-5">
                    <div className="space-y-3">
                      {/* Status & Time Row */}
                      <div className="flex items-center justify-between">
                        <Badge className={`${color} border-none text-[10px] font-bold uppercase`}>{label}</Badge>
                        <div className="flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50/50 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeUntil(instance.datetime)}
                        </div>
                      </div>

                      {/* Title */}
                      <CardTitle className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {instance.customTitle || template.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
                    {/* Date & Time Badge */}
                    <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 w-fit px-2.5 py-1.5 rounded-lg shadow-sm text-left">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-blue-500" />
                      <span>{date} at {time}</span>
                    </div>

                    {/* Rich Location */}
                    {(instance.venue || fullAddress || instance.location) && (
                      <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100/30">
                        {instance.venue && (
                          <div className="flex items-center text-sm text-gray-900 font-bold truncate">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                            <span className="truncate">{instance.venue}</span>
                          </div>
                        )}
                        {fullAddress ? (
                          <div className="text-[11px] text-gray-500 ml-5.5 pl-0.5 line-clamp-1 italic text-left">
                            {fullAddress}
                          </div>
                        ) : instance.location && (
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                            <span className="truncate">{instance.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Row: Joining vs Values */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {/* Left: Who's Joining */}
                      <div className="space-y-1 border-r border-gray-100 pr-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-left">Who's Joining</p>
                        <div className="flex items-center text-sm text-gray-900 font-bold">
                          <div className="bg-indigo-50 p-1 rounded-md mr-2">
                            <Users className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span>
                            {getEventParticipantStats(instance).invited} invited • {getEventParticipantStats(instance).confirmed} confirmed
                          </span>
                        </div>
                      </div>

                      {/* Right: Our Values */}
                      <div className="space-y-1 pl-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-right">Our Values</p>
                        <div className="flex items-center justify-end text-sm text-gray-900 font-bold">
                          <span className="truncate mr-2">
                            {template?.values?.[0]?.value?.name || 'Connection'}
                          </span>
                          <div className="bg-red-50 p-1 rounded-md">
                            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-100" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Action Buttons */}
                    <div className="pt-2">
                      <Link
                        href={`/invite/${instance.id}`}
                        className="w-full"
                      >
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details & Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>

                  {/* Template Playbook Footer - Absolute Bottom */}
                  <CardFooter className="pt-3 pb-4 px-5 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-1 rounded shadow-sm border border-slate-100">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Socialiser Playbook
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-500 bg-white px-1.5 py-0 uppercase">
                      {template.name}
                    </Badge>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            Past Events
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((instance) => {
              const { date, time } = formatDateTime(instance.datetime);
              const fullAddress = [
                instance.address,
                instance.city,
                instance.state,
                instance.zipCode
              ].filter(Boolean).join(', ');

              return (
                <Card key={instance.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white ring-1 ring-gray-100 overflow-hidden flex flex-col opacity-90">
                  <div className="h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

                  <CardHeader className="pb-2 px-5 pt-5">
                    <div className="space-y-3">
                      {/* Status Row */}
                      <div className="flex items-center justify-between">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold uppercase">Completed</Badge>
                      </div>

                      {/* Title */}
                      <CardTitle className="text-xl font-black text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {instance.customTitle || template.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
                    {/* Date & Time Badge */}
                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 w-fit px-2.5 py-1.5 rounded-lg shadow-sm text-left">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      <span>{date} at {time}</span>
                    </div>

                    {/* Rich Location */}
                    {(instance.venue || fullAddress || instance.location) && (
                      <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100/30">
                        {instance.venue && (
                          <div className="flex items-center text-sm text-gray-600 font-bold truncate">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
                            <span className="truncate">{instance.venue}</span>
                          </div>
                        )}
                        {fullAddress ? (
                          <div className="text-[11px] text-gray-500 ml-5.5 pl-0.5 line-clamp-1 italic text-left">
                            {fullAddress}
                          </div>
                        ) : instance.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
                            <span className="truncate">{instance.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Row: Joining vs Values */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {/* Left: WhoJoined */}
                      <div className="space-y-1 border-r border-gray-100 pr-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-left">Who Attended</p>
                        <div className="flex items-center text-sm text-gray-600 font-bold">
                          <div className="bg-slate-100 p-1 rounded-md mr-2">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span>
                            {getEventParticipantStats(instance).invited} invited • {getEventParticipantStats(instance).confirmed} confirmed
                          </span>
                        </div>
                      </div>

                      {/* Right: Our Values */}
                      <div className="space-y-1 pl-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-right">Our Values</p>
                        <div className="flex items-center justify-end text-sm text-gray-600 font-bold">
                          <span className="truncate mr-2">
                            {template?.values?.[0]?.value?.name || 'Connection'}
                          </span>
                          <div className="bg-slate-50 p-1 rounded-md">
                            <Heart className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* View Details Link */}
                    <div className="pt-2">
                      <Link
                        href={`/invite/${instance.id}`}
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full font-bold shadow-sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>

                  {/* Template Playbook Footer - Absolute Bottom */}
                  <CardFooter className="pt-3 pb-4 px-5 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-1 rounded shadow-sm border border-slate-100">
                        <Sparkles className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Socialiser Playbook
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-400 bg-white px-1.5 py-0 uppercase">
                      {template.name}
                    </Badge>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
