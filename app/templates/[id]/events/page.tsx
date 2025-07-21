
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Heart,
  CalendarCheck,
  Plus,
  Eye,
  Layers
} from 'lucide-react';

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
                <Card key={instance.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={color}>{label}</Badge>
                        </div>
                        
                        {/* Custom Title - Primary */}
                        <CardTitle className="text-lg font-semibold text-blue-900 mb-1">
                          {instance.customTitle || template.name}
                        </CardTitle>
                        
                        {/* Template Reference - Secondary */}
                        <div className="text-sm text-blue-600">
                          Template: {template.name}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <div>
                        <div className="font-medium">{date}</div>
                        <div className="text-gray-600">{time}</div>
                      </div>
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
                      <span>{instance.participations.length} participants</span>
                    </div>

                    {/* View Details Link */}
                    <div className="pt-2">
                      <Link
                        href={`/invite/${instance.id}`}
                        className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details & Manage
                      </Link>
                    </div>
                  </CardContent>
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
                <Card key={instance.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 bg-green-50 opacity-90">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="bg-green-100 text-green-800 mb-2">Completed</Badge>
                        
                        {/* Custom Title - Primary */}
                        <CardTitle className="text-lg font-semibold text-green-900 mb-1">
                          {instance.customTitle || template.name}
                        </CardTitle>
                        
                        {/* Template Reference - Secondary */}
                        <div className="text-sm text-green-600">
                          Template: {template.name}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      <div>
                        <div className="font-medium">{date}</div>
                        <div className="text-gray-500">{time}</div>
                      </div>
                    </div>

                    {/* Rich Location */}
                    {(instance.venue || fullAddress || instance.location) && (
                      <div className="space-y-1">
                        {instance.venue && (
                          <div className="flex items-center text-sm text-gray-800 font-medium">
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
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-green-600" />
                            <span>{instance.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rich Details Badges */}
                    <div className="flex flex-wrap gap-2">
                      {instance.venueType && (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700 opacity-80">
                          {instance.venueType}
                        </Badge>
                      )}
                      {instance.priceInfo && (
                        <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 opacity-80">
                          {instance.priceInfo}
                        </Badge>
                      )}
                      {instance.capacity && (
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 opacity-80">
                          Max {instance.capacity}
                        </Badge>
                      )}
                    </div>

                    {/* Participants */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{instance.participations.length} participants</span>
                    </div>

                    {/* View Details Link */}
                    <div className="pt-2">
                      <Link
                        href={`/invite/${instance.id}`}
                        className="inline-flex items-center text-gray-600 text-sm hover:text-gray-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
