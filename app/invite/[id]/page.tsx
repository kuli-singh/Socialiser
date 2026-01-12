
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
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Share2,
  Heart,
  Phone,
  MessageSquare,
  Mail,
  Copy,
  CheckCircle
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Friends & Personal Invites (PRIMARY) */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

          {/* Friend List (Promoted to Top) */}
          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader className="bg-purple-50/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    Invited Friends
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage guest list and send personal invites</p>
                </div>
                <Badge variant="outline" className="bg-white">
                  {instance.participations?.length || 0} Guests
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Simplified Friend List primarily for Copying Links */}
              {(instance?.participations ?? []).map((p) => {
                const matchedRSVP = instance?.publicRSVPs?.find(r =>
                  (r.friendId === p.friend.id) ||
                  (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase())
                );

                return (
                  <div key={p.friend.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">

                    {/* Friend Info */}
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border-2 border-white shadow-sm">
                          {p.friend.name.charAt(0)}
                        </div>
                        {matchedRSVP && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">{p.friend.name}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          {matchedRSVP ? (
                            <span className="text-green-600 font-medium">Confirmed</span>
                          ) : (
                            <span>Pending response</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm font-semibold"
                        onClick={() => copyInviteLink(p.inviteToken)}
                        title="Copy Personal Invite Link"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        COPY LINK
                      </Button>
                    </div>
                  </div>
                );
              })}

              {(instance.participations.length === 0) && (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No friends invited yet.</p>
                  <Button variant="link" className="text-purple-600" onClick={() => window.location.href = `/activities/${instance.activity.id}/edit`}>
                    Edit event to add friends
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details Card (Secondary) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-700">Event Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">{date}</div>
                  <div className="text-sm text-gray-600">{time}</div>
                </div>
              </div>
              {instance.venue && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <div>{instance.venue}</div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar - Public & Generic (SECONDARY) */}
        <div className="space-y-6 order-1 lg:order-2">

          {/* Public Link Banner (Demoted to Sidebar) */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500">
                Use this generic link for group chats or social media where you don't need to track specific people.
              </p>
              <div className="p-2 border border-slate-200 bg-white rounded text-xs text-slate-600 font-mono break-all">
                {eventUrl}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(eventUrl);
                    alert("Public link copied!");
                  }}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy URL
                </Button>
                <Button
                  onClick={() => window.open(eventUrl, '_blank')}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generic Copy Hub (Demoted) */}
          <CopyToClipboardHub instance={instance} eventUrl={eventUrl} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-500 uppercase">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/templates/${instance.activity.id}/events`} className="block">
                <Button className="w-full" variant="ghost" size="sm">
                  View All Events
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="ghost" size="sm">
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
