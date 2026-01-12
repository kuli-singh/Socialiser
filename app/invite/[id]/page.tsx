
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { CalendarIntegration } from '@/components/calendar-integration';
import { QRCodeGenerator } from '@/components/qr-code-generator';
import { CopyToClipboardHub } from '@/components/copy-to-clipboard-hub';
import { getParticipantCount, getEventParticipantStats } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Edit,
  ExternalLink,
  CheckCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Share2,
  Heart,
  Phone,
  MessageSquare,
  Mail,
  Copy
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
    inviteToken: string;
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

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/join/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Personal invite link copied!");
    });
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
                <CardTitle className="text-2xl font-black text-blue-900 mb-2">
                  {instance.customTitle || instance.activity.name}
                </CardTitle>
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
                        {instance.venueType && instance.venueType !== 'undefined' && (
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
                {instance.priceInfo && instance.priceInfo !== 'undefined' && (
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {instance.priceInfo}
                  </Badge>
                )}
              </div>

              {/* Social Row: Joining vs Values */}
              <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Who's Joining */}
                <div className="space-y-4 border-r border-gray-100 pr-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-indigo-50 p-1.5 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 text-left">Who's Joining</p>
                        <h4 className="text-lg font-bold text-gray-900 text-left">{getEventParticipantStats(instance).invited} invited • {getEventParticipantStats(instance).confirmed} confirmed</h4>

                        {/* Guest Policy Indicator */}
                        <div className="mt-1">
                          {/* Note: 'instance' type in this file doesn't seem to have allowExternalGuests yet? 
                                I need to check the interface. If missing, I'll default to checking if any external guests exist.
                                Wait, I should add allowExternalGuests to the API/Interface for consistency. 
                                But for now, let's assume it might recall if I add it.
                                Actually, checking the file content again, interface ActivityInstance in this file misses allowExternalGuests.
                                I'll add it to the interface first in a separate edit, or just cast it for now to avoid breaking changes if API doesn't send it.
                                The API /api/instances/[id] DOES return the full object.
                             */}
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${(instance as any).allowExternalGuests
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}>
                            {(instance as any).allowExternalGuests ? "EXTERNAL GUESTS ALLOWED" : "INVITE ONLY"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Host Card */}
                    {instance?.hostAttending && instance.user && (
                      <div className="flex flex-col p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900 flex items-center text-sm">
                              {instance.user.name} (You)
                              <Badge className="ml-2 bg-indigo-600 text-white border-none text-[8px] h-4 px-1 leading-none font-black uppercase">
                                Host
                              </Badge>
                            </div>
                            <div className="text-[11px] text-gray-500">{instance.user.email}</div>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800 border-none text-[9px] font-bold">
                            CONFIRMED
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Internal Friends matched with RSVPs */}
                    {(instance?.participations ?? []).map((p) => {
                      const matchedRSVP = instance?.publicRSVPs?.find(r =>
                        (r.friendId === p.friend.id) ||
                        (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase())
                      );
                      return (
                        <div key={p.friend.id} className="flex flex-col p-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs mr-3">
                                {p.friend.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{p.friend.name}</div>
                                <div className="text-[10px] text-gray-500">Invited Friend</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                                onClick={() => copyInviteLink(p.inviteToken)}
                                title="Copy Personal Invite Link"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              {matchedRSVP ? (
                                <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black uppercase">Confirmed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400 border-gray-200 text-[8px] font-black uppercase">Pending</Badge>
                              )}
                            </div>
                          </div>
                          {matchedRSVP?.message && (
                            <div className="mt-2 text-[11px] text-gray-600 bg-gray-50 p-2 rounded italic border-l-2 border-gray-200">
                              "{matchedRSVP.message}"
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* External RSVPs (people who RSVP'd but weren't in the invited friend list) */}
                    {(instance?.publicRSVPs ?? [])
                      .filter(r => !instance?.participations?.some(p =>
                        (r.friendId === p.friend.id) ||
                        (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase())
                      ))
                      .map((rsvp) => (
                        <div key={rsvp.id} className="flex flex-col p-3 rounded-lg border border-blue-50 bg-blue-50/20 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-xs mr-3">
                                {rsvp.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{rsvp.name}</div>
                                <div className="text-[10px] text-blue-600">External Guest</div>
                              </div>
                            </div>
                            <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase">Confirmed</Badge>
                          </div>
                          {rsvp.message && (
                            <div className="mt-2 text-[11px] text-gray-600 bg-white/50 p-2 rounded italic border-l-2 border-blue-200">
                              "{rsvp.message}"
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right: Our Values */}
                <div className="pl-6 space-y-4">
                  <div className="flex items-center justify-end">
                    <div className="text-right mr-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Our Values</p>
                      <h4 className="text-lg font-bold text-gray-900">Experience Vibe</h4>
                    </div>
                    <div className="bg-red-50 p-1.5 rounded-lg">
                      <Heart className="h-5 w-5 text-red-500 fill-red-50" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {(instance?.activity?.values ?? []).map((av) => (
                      <Badge key={av?.value?.id} variant="secondary" className="bg-red-50 text-red-700 border-red-100 font-bold px-3 py-1">
                        {av?.value?.name}
                      </Badge>
                    ))}
                    {(instance?.activity?.values?.length ?? 0) === 0 && (
                      <p className="text-xs text-gray-400 italic">No values specified for this template</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Template Playbook Footer */}
            <CardFooter className="pt-4 pb-4 px-8 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded shadow-sm border border-slate-100">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Socialiser Playbook
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 bg-white px-2 py-0.5 uppercase">
                {instance.activity.name}
              </Badge>
            </CardFooter>
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
