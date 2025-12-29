
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { CalendarIntegration } from '@/components/calendar-integration';
import { QRCodeGenerator } from '@/components/qr-code-generator';
import { CopyToClipboardHub } from '@/components/copy-to-clipboard-hub';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Heart,
  CheckCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Share2,
  ExternalLink,
  Phone,
  MessageSquare,
  Mail
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
  hostAttending: boolean;
  user?: {
    name: string;
    email: string;
  };
  activity: {
    id: string;
    name: string;
    description: string | null;
    values: Array<{
      value: {
        id: string;
        name: string;
      };
    }>;
  };
  participations: Array<{
    friend: {
      id: string;
      name: string;
      email: string | null;
    };
  }>;
  publicRSVPs: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string | null;
    friendId: string | null;
    createdAt: string;
  }>;
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const [instance, setInstance] = useState<ActivityInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${params.id}`
    : '';

  useEffect(() => {
    fetchInstance();
  }, [params.id]);

  const fetchInstance = async () => {
    try {
      const response = await fetch(`/api/instances/${params.id}`);
      if (!response.ok) throw new Error('Activity instance not found');

      const data = await response.json();
      setInstance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity instance');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    if (!datetime) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }

    try {
      const date = new Date(datetime);
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
    } catch {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!instance) return <ErrorMessage message="Activity instance not found" />;

  const { date, time } = formatDateTime(instance.datetime);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/activities" className="hover:text-gray-700">
            Activity Templates
          </Link>
          <ArrowRight className="h-3 w-3" />
          <Link href={`/templates/${instance.activity.id}/events`} className="hover:text-gray-700">
            {instance.activity.name}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span>Share & Invite</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Share2 className="h-8 w-8 text-blue-600 mr-3" />
          Share Your Event
        </h1>
        <p className="text-gray-600 mt-1">Modern, platform-agnostic invite system that works everywhere</p>
      </div>

      {/* Public Event Link Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Public Event Page Created!</h3>
                <p className="text-blue-700 text-sm">Anyone can view details and RSVP without an account</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => window.open(eventUrl, '_blank')}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Connection */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Created from template:</p>
                <Link
                  href={`/templates/${instance.activity.id}/events`}
                  className="font-medium text-slate-900 hover:text-slate-700 flex items-center"
                >
                  {instance.activity.name}
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 text-xs">
                    Template
                  </Badge>
                </Link>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/templates/${instance.activity.id}/events`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </Link>
              <Link href={`/schedule?template=${instance.activity.id}`}>
                <Button size="sm">
                  Create Another Event
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Summary Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div>
                <CardTitle className="text-xl font-bold text-blue-900 mb-2">
                  {instance.customTitle || instance.activity.name}
                </CardTitle>

                <div className="flex items-center text-sm text-blue-600 mb-2">
                  <span>Template: {instance.activity.name}</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    Event
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">{date}</div>
                  <div className="text-sm text-gray-600">{time}</div>
                </div>
              </div>

              {/* Rich Location */}
              {(instance.venue || instance.address || instance.location) && (
                <div className="space-y-2">
                  {instance.venue && (
                    <div className="flex items-center text-gray-900">
                      <MapPin className="h-4 w-4 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium">{instance.venue}</div>
                        {instance.venueType && (
                          <Badge variant="outline" className="text-xs mt-1 border-green-300 text-green-700">
                            {instance.venueType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {(instance.address || instance.city || instance.state) && (
                    <div className="flex items-start text-gray-700 ml-7">
                      <div className="text-sm">
                        {instance.address && <div>{instance.address}</div>}
                        {(instance.city || instance.state || instance.zipCode) && (
                          <div>
                            {[instance.city, instance.state, instance.zipCode].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!instance.venue && !instance.address && instance.location && (
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-3 text-green-600" />
                      <span>{instance.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Capacity & Pricing */}
              <div className="flex flex-wrap gap-3">
                {instance.capacity && (
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="text-sm">Max {instance.capacity} people</span>
                  </div>
                )}
                {instance.priceInfo && (
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {instance.priceInfo}
                  </Badge>
                )}
              </div>

              {/* Detailed Guest List */}
              <div className="pt-4 border-t border-gray-200">
                <div className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    Guest List ({(
                      (instance?.participations?.length ?? 0) +
                      (instance?.publicRSVPs?.filter(r => !instance.participations.some(p => p.friend.email === r.email) && !r.friendId).length ?? 0) +
                      (instance?.hostAttending ? 1 : 0)
                    )})
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Host Card */}
                  {instance?.hostAttending && instance.user && (
                    <div className="flex flex-col p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            {instance.user.name} (You)
                            <Badge variant="outline" className="ml-2 text-xs border-indigo-300 text-indigo-700 bg-white">
                              Host
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{instance.user.email}</div>
                        </div>
                        <div>
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. Internal Friends (Matched with RSVPs) */}
                  {(instance?.participations ?? []).map((p) => {
                    const matchedRSVP = instance?.publicRSVPs?.find(r =>
                      (r.friendId === p.friend.id) ||
                      (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase())
                    );

                    const displayName = matchedRSVP ? matchedRSVP.name : p.friend.name;
                    const internalName = p.friend.name;
                    const showInternalName = matchedRSVP && matchedRSVP.name !== p.friend.name;

                    return (
                      <div key={p.friend.id} className={`flex flex-col p-3 rounded-lg border ${matchedRSVP ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              {displayName}
                              {showInternalName && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  ({internalName})
                                </span>
                              )}
                              <Badge variant="outline" className="ml-2 text-xs border-purple-200 text-purple-700 bg-purple-50">
                                Friend
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">{p.friend.email || 'No email'}</div>
                          </div>
                          <div>
                            {matchedRSVP ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirmed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-300">
                                Invited
                              </Badge>
                            )}
                          </div>
                        </div>
                        {matchedRSVP && (matchedRSVP.message || matchedRSVP.phone) && (
                          <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                            {matchedRSVP.phone && (
                              <div className="flex items-center mb-1">
                                <Phone className="h-3 w-3 mr-2" />
                                {matchedRSVP.phone}
                              </div>
                            )}
                            {matchedRSVP.message && (
                              <div className="flex items-start">
                                <MessageSquare className="h-3 w-3 mr-2 mt-0.5" />
                                <span className="italic">"{matchedRSVP.message}"</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 2. External RSVPs (Unmatched) */}
                  {(instance?.publicRSVPs ?? [])
                    .filter(r => !instance?.participations?.some(p =>
                      (p.friend.email && r.email && p.friend.email.toLowerCase() === r.email.toLowerCase()) ||
                      (p.friend.name.toLowerCase() === r.name.toLowerCase())
                    ))
                    .map((rsvp) => (
                      <div key={rsvp.id} className="flex flex-col p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              {rsvp.name}
                              <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-700 bg-white">
                                Guest
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {rsvp.email && <div className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {rsvp.email}</div>}
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed (RSVP)
                          </Badge>
                        </div>
                        {(rsvp.phone || rsvp.message) && (
                          <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border border-blue-100">
                            {rsvp.phone && (
                              <div className="flex items-center mb-1">
                                <Phone className="h-3 w-3 mr-2" />
                                {rsvp.phone}
                              </div>
                            )}
                            {rsvp.message && (
                              <div className="flex items-start">
                                <MessageSquare className="h-3 w-3 mr-2 mt-0.5" />
                                <span className="italic">"{rsvp.message}"</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                  {(instance?.participations?.length === 0 && instance?.publicRSVPs?.length === 0) && (
                    <div className="text-center py-4 text-gray-500 italic text-sm">
                      No guests have been invited or RSVP'd yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Rich Description */}
              {(instance.detailedDescription || instance.activity.description) && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="font-medium text-gray-900 mb-1">About This Event</div>
                  <p className="text-sm text-gray-700">
                    {instance.detailedDescription || instance.activity.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {instance.requirements && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="font-medium text-amber-900 mb-1">What to Bring/Know</div>
                  <p className="text-sm text-amber-800">{instance.requirements}</p>
                </div>
              )}

              {/* Values */}
              {(instance?.activity?.values?.length ?? 0) > 0 && (
                <div className="flex items-start text-gray-700">
                  <Heart className="h-4 w-4 mr-3 mt-1 text-red-600" />
                  <div>
                    <div className="font-medium">Core Values (from template)</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(instance?.activity?.values ?? []).map((av) => (
                        <Badge key={av?.value?.id} variant="outline">
                          {av?.value?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modern Invite Hub */}
          <CopyToClipboardHub instance={instance} eventUrl={eventUrl} />
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Calendar Integration */}
          <CalendarIntegration
            instanceId={instance.id}
            activityName={instance.customTitle || instance.activity.name}
          />

          {/* QR Code */}
          <QRCodeGenerator
            url={eventUrl}
            eventTitle={instance.customTitle || instance.activity.name}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/schedule?template=${instance.activity.id}`} className="block">
                <Button className="w-full" variant="outline">
                  Create Another Event from Template
                </Button>
              </Link>
              <Link href={`/templates/${instance.activity.id}/events`} className="block">
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Template Events
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  Return to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
