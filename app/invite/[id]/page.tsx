
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
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

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
  allowExternalGuests: boolean; // Added field
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

  // State for message dialog
  const [selectedGuestForMessage, setSelectedGuestForMessage] = useState<{ name: string, token: string | null } | null>(null);
  const [messageCopied, setMessageCopied] = useState<string | null>(null);

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

  const generateMessage = (format: 'whatsapp' | 'sms' | 'email' | 'generic', guestName: string, token: string | null) => {
    if (!instance) return '';
    const { date, time } = formatDateTime(instance.datetime);
    const location = instance.venue ? `${instance.venue}, ${instance.address || ''}` : (instance.location || 'Location TBD');
    const title = instance.customTitle || instance.activity.name;
    const link = token ? `${window.location.origin}/invite/join/${token}` : eventUrl;

    let message = '';

    // Fix generic greeting for external invites
    const displayName = guestName === 'Invite External Guest' ? 'friend' : guestName;

    switch (format) {
      case 'whatsapp':
        message = `Hey ${displayName}! 👋\n\nI'm hosting: *${title}*\n📅 ${date} @ ${time}\n📍 ${location}\n\nHope you can make it! confirm here:\n${link}`;
        break;
      case 'sms':
        message = `Hey ${displayName}! Join me for ${title} on ${date}. RSVP: ${link}`;
        break;
      case 'email':
        message = `Subject: Invite: ${title}\n\nHi ${displayName},\n\nI'd love for you to join me!\n\nWhat: ${title}\nWhen: ${date} at ${time}\nWhere: ${location}\n\nRSVP here:\n${link}\n\nHope to see you there!`;
        break;
      case 'generic':
        message = `${title}\n${date} @ ${time}\n${link}`;
        break;
    }
    return message;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!instance) return <ErrorMessage message="Activity instance not found" />;

  const { date, time } = formatDateTime(instance.datetime);

  // Calculate detailed stats
  // Calculate detailed stats including Host
  const totalParticipants = (instance.participations?.length || 0) +
    (instance.publicRSVPs?.filter(r => !instance.participations?.some(p => p.friend.id === r.friendId)).length || 0) +
    (instance.hostAttending ? 1 : 0);

  const capacityDisplay = instance.capacity ? `${totalParticipants} Participants / Capacity: ${instance.capacity}` : `${totalParticipants} Participants`;
  const isFull = instance.capacity ? totalParticipants >= instance.capacity : false;

  const hostCard = (instance.hostAttending && instance.user) ? {
    id: 'host',
    name: `${instance.user.name} (Host)`,
    type: 'host',
    email: instance.user.email,
    token: null,
    rsvp: true // implicitly confirmed
  } : null;

  const friendsList = (instance.participations ?? []).map(p => ({
    id: p.friend.id,
    name: p.friend.name,
    type: 'friend',
    email: p.friend.email,
    token: p.inviteToken,
    rsvp: instance.publicRSVPs?.find(r => (r.friendId === p.friend.id) || (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase()))
  }));

  const externalGuests = (instance.publicRSVPs ?? [])
    .filter(r => !instance.participations?.some(p => (r.friendId === p.friend.id) || (r.email && p.friend.email && r.email.toLowerCase() === p.friend.email.toLowerCase())))
    .map(r => ({
      id: r.id,
      name: r.name,
      type: 'external',
      email: r.email,
      phone: r.phone,
      token: null,
      rsvp: r
    }));

  // "Invite External Guest" placeholder card
  const inviteExternalCard = {
    id: 'invite-external',
    name: 'Invite External Guest',
    type: 'invite-action',
    email: null,
    token: null,
    rsvp: null
  };

  const allGuests = [
    ...(hostCard ? [hostCard] : []),
    ...friendsList,
    ...externalGuests,
    inviteExternalCard
  ];

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

      {/* Header & Host Calendar Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Share2 className="h-8 w-8 text-blue-600 mr-3" />
            Share Your Event
          </h1>
          <p className="text-gray-600 mt-1">Manage invites and track RSVPs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch(`/api/calendar/google/${instance.id}`);
                if (!response.ok) throw new Error('Failed');
                const data = await response.json();
                window.open(data.url, '_blank');
              } catch (e) {
                alert('Failed to open calendar');
              }
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Friends & Personal Invites (PRIMARY) */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

          {/* Guest List (Unified) */}
          <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader className="bg-purple-50/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    Guest List
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage invites and responses</p>
                </div>
                <div className="flex items-center gap-2">
                  {instance.allowExternalGuests ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      External Guests Allowed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-200">
                      Invite Only
                    </Badge>
                  )}
                  <Badge variant={isFull ? "destructive" : "outline"} className="bg-white">
                    {capacityDisplay}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">

              {allGuests.map((guest: any) => (
                <div
                  key={guest.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group ${(!guest.rsvp && guest.type !== 'host' && guest.type !== 'external') || guest.type === 'invite-action' ? 'cursor-pointer' : ''} ${guest.type === 'invite-action' ? 'border-dashed border-2 border-slate-300 bg-slate-50 cursor-pointer' : ''}`}
                  onClick={() => {
                    // Disable click for confirmed guests (internal or external) or host
                    if (guest.rsvp || guest.type === 'host' || (guest.type === 'external' && !guest.rsvp)) return;

                    if (guest.type === 'invite-action') {
                      if (!isFull) window.open(eventUrl, '_blank');
                      else alert("Event is at capacity!");
                    } else if (guest.token) {
                      window.open(`${window.location.origin}/invite/join/${guest.token}`, '_blank');
                    } else if (guest.type !== 'external') {
                      // Only open public link for non-external guests (shouldn't happen given logic above, but safe fallback)
                      window.open(eventUrl, '_blank');
                    }
                  }}
                >

                  {/* Guest Info */}
                  <div className="flex items-center mb-3 sm:mb-0">
                    <div className="relative">
                      {guest.type === 'invite-action' ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-slate-300 bg-white text-slate-400">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm ${guest.type === 'friend' ? 'bg-slate-100 text-slate-500' : guest.type === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-500'}`}>
                          {guest.type === 'host' ? <Users className="h-5 w-5" /> : guest.name.charAt(0)}
                        </div>
                      )}

                      {(guest.rsvp || guest.type === 'host') && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-bold ${guest.type === 'invite-action' ? 'text-slate-600' : 'text-gray-900'}`}>{guest.name}</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          {guest.type === 'external' && <Badge variant="secondary" className="text-[10px] px-1 h-4">External</Badge>}
                          {guest.type === 'invite-action' && <span>Generic public link</span>}
                          {guest.rsvp ? (
                            <span className="text-green-600 font-medium">Confirmed</span>
                          ) : (
                            guest.type !== 'invite-action' && <span>Pending response</span>
                          )}
                        </div>
                        {/* Display contact info for external guests */}
                        {guest.type === 'external' && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            {guest.email && <div>{guest.email}</div>}
                            {guest.phone && <div>{guest.phone}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    {/* Message Button (Opens Dialog) */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-gray-700 border-gray-200 hover:bg-gray-50"
                          onClick={() => setSelectedGuestForMessage({ name: guest.name, token: guest.token })}
                          disabled={guest.type === 'invite-action' && isFull}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Message {guest.name}</DialogTitle>
                          <DialogDescription>
                            Choose a format to copy and send. {guest.token ? "Evaluating personal link..." : "Using public link."}
                          </DialogDescription>
                        </DialogHeader>
                        {/* Message Generation Tabs */}
                        <Tabs defaultValue="whatsapp" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                            <TabsTrigger value="sms">SMS</TabsTrigger>
                            <TabsTrigger value="email">Email</TabsTrigger>
                            <TabsTrigger value="generic">Link</TabsTrigger>
                          </TabsList>
                          {['whatsapp', 'sms', 'email', 'generic'].map((format) => (
                            <TabsContent key={format} value={format} className="mt-4 space-y-4">
                              <Textarea
                                readOnly
                                value={generateMessage(format as any, guest.name, guest.token)}
                                className="min-h-[150px] font-mono text-sm bg-slate-50"
                              />
                              <Button
                                className="w-full"
                                onClick={() => {
                                  navigator.clipboard.writeText(generateMessage(format as any, guest.name, guest.token));
                                  setMessageCopied(format);
                                  setTimeout(() => setMessageCopied(null), 2000);
                                }}
                              >
                                {messageCopied === format ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {messageCopied === format ? "Copied!" : "Copy to Clipboard"}
                              </Button>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </DialogContent>
                    </Dialog>

                    {/* Direct Copy Link (Only for Friends with Tokens) */}
                    {guest.token && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 font-semibold"
                        onClick={() => copyInviteLink(guest.token!)}
                        title="Copy Personal Link"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        LINK
                      </Button>
                    )}

                    {/* Unconfirm Button (Only for Confirmed Guests, excluding Host) */}
                    {guest.rsvp && guest.type !== 'host' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50"
                        title="Unconfirm Guest (Revert to Pending)"
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to unconfirm ${guest.name}? They will be marked as Pending.`)) return;

                          try {
                            const query = guest.type === 'friend' ? `friendId=${guest.id}` : `rsvpId=${guest.rsvp.id}`;
                            const res = await fetch(`/api/instances/${instance.id}/rsvp?${query}`, {
                              method: 'DELETE',
                            });

                            if (res.ok) {
                              // Refresh stats
                              fetchInstance();
                            } else {
                              alert('Failed to unconfirm guest');
                            }
                          } catch (e) {
                            console.error(e);
                            alert('An error occurred');
                          }
                        }}
                      >
                        Unconfirm
                      </Button>
                    )}
                  </div>
                </div>
              ))}

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

          {/* Quick Actions Only (Public Banner Removed) */}
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
