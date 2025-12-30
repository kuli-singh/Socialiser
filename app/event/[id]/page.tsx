
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { CalendarIntegration } from '@/components/calendar-integration';
import { QRCodeGenerator } from '@/components/qr-code-generator';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  CheckCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Mail,
  Phone,
  MessageSquare,
  Check,
  X,
  Layers
} from 'lucide-react';

interface InvitedFriend {
  id: string;
  name: string;
}

interface PublicActivityInstance {
  id: string;
  datetime: string | null;
  location: string | null;
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
  eventUrl: string | null; // Added eventUrl
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
  participantCount: number;
  participantNames: string[];
  invitedFriends?: InvitedFriend[];
}

interface RSVP {
  id: string;
  name: string;
  message: string | null;
  friendId?: string | null;
  createdAt: string;
}

export default function PublicEventPage({ params }: { params: { id: string } }) {
  const [instance, setInstance] = useState<PublicActivityInstance | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // RSVP form state
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [linkedFriend, setLinkedFriend] = useState<InvitedFriend | null>(null);

  useEffect(() => {
    fetchEventData();
  }, [params.id]);

  const fetchEventData = async () => {
    try {
      const [eventResponse, rsvpResponse] = await Promise.all([
        fetch(`/api/public-events/${params.id}`),
        fetch(`/api/public-events/${params.id}/rsvp`)
      ]);

      if (!eventResponse.ok) {
        throw new Error('Event not found');
      }

      const eventData = await eventResponse.json();
      setInstance(eventData);

      if (rsvpResponse.ok) {
        const rsvpData = await rsvpResponse.json();
        setRsvps(rsvpData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/public-events/${params.id}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rsvpForm,
          friendId: linkedFriend?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit RSVP');
      }

      setRsvpSubmitted(true);
      setRsvpForm({ name: '', email: '', phone: '', message: '' });
      await fetchEventData(); // Refresh RSVPs
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (datetime: string | null) => {
    if (!datetime) {
      return { date: 'Date TBD', time: 'Time TBD' };
    }

    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        return { date: 'Invalid Date', time: 'Invalid Time' };
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
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!instance) return <ErrorMessage message="Event not found" />;

  const { date, time } = formatDateTime(instance.datetime);

  const eventUrl = typeof window !== 'undefined'
    ? window.location.href
    : '';

  const getSuggestions = () => {
    if (!instance?.invitedFriends || !rsvpForm.name || linkedFriend) return [];
    if (rsvpForm.name.length < 2) return [];

    return instance.invitedFriends.filter(f =>
      f.name.toLowerCase().includes(rsvpForm.name.toLowerCase()) &&
      !rsvps.some(r => r.name === f.name)
    ).slice(0, 3);
  };

  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            {instance.customTitle || instance.activity.name}
          </h1>
          <p className="text-lg text-gray-600">You're invited to join us!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details Card */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-0">
                {/* Template Attribution Header */}
                <div className="bg-slate-50/80 border-b border-slate-100 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Layers className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">Created from Template</p>
                      <h3 className="text-base font-bold text-slate-900">{instance.activity.name}</h3>
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 text-white border-none shadow-sm px-3 py-1">
                    Socialiser Playbook
                  </Badge>
                </div>

                <div className="p-8 space-y-8">
                  {/* Date & Time */}
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-6 w-6 mr-4 text-blue-600" />
                    <div>
                      <div className="text-xl font-semibold">{date}</div>
                      <div className="text-lg text-gray-600">{time}</div>
                    </div>
                  </div>

                  {/* Location */}
                  {(instance.venue || instance.address || instance.location) && (
                    <div className="space-y-2">
                      {instance.venue && (
                        <div className="flex items-center text-gray-900">
                          <MapPin className="h-6 w-6 mr-4 text-green-600" />
                          <div>
                            <div className="text-lg font-semibold">{instance.venue}</div>
                            {instance.venueType && (
                              <Badge variant="outline" className="mt-1 border-green-300 text-green-700">
                                {instance.venueType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {(instance.address || instance.city || instance.state) && (
                        <div className="flex items-start text-gray-700 ml-10">
                          <div>
                            {instance.address && <div className="text-base">{instance.address}</div>}
                            {(instance.city || instance.state || instance.zipCode) && (
                              <div className="text-base">
                                {[instance.city, instance.state, instance.zipCode].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!instance.venue && !instance.address && instance.location && (
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-6 w-6 mr-4 text-green-600" />
                          <span className="text-lg">{instance.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {(instance.detailedDescription || instance.activity.description) && (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">About This Event</h3>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {instance.detailedDescription || instance.activity.description}
                      </p>
                    </div>
                  )}

                  {/* Requirements & Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instance.requirements && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">What to Bring/Know</h4>
                        <p className="text-amber-900 text-sm whitespace-pre-wrap">{instance.requirements}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {instance.capacity && (
                        <div className="flex items-center text-gray-700 bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                          <Users className="h-5 w-5 mr-3 text-purple-600" />
                          <span className="text-sm font-medium">Limited to {instance.capacity} guests</span>
                        </div>
                      )}

                      {instance.priceInfo && (
                        <div className="flex items-center text-gray-700 bg-green-50/50 border border-green-100 rounded-xl p-4">
                          <Badge variant="outline" className="bg-white border-green-200 text-green-700 px-3 py-1">
                            {instance.priceInfo}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  {instance.contactInfo && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Contact Info</h4>
                      <p className="text-blue-900 text-sm">{instance.contactInfo}</p>
                    </div>
                  )}

                  <div className="pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Values */}
                    {(instance?.activity?.values?.length ?? 0) > 0 && (
                      <div className="flex items-start text-gray-700">
                        <Heart className="h-5 w-5 mr-3 mt-1 text-red-500" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Our Vibe</p>
                          <div className="flex flex-wrap gap-2">
                            {(instance?.activity?.values ?? []).map((av) => (
                              <Badge key={av?.value?.id} variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                                {av?.value?.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Participants */}
                    <div className="flex items-start text-gray-700">
                      <Users className="h-5 w-5 mr-3 mt-1 text-indigo-600" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Who's Joining</p>
                        <div className="font-semibold text-gray-900 mb-2">
                          {(instance.participantCount + rsvps.filter(r =>
                            !r.friendId &&
                            !instance.invitedFriends?.some(f => f.name.toLowerCase() === r.name.toLowerCase())
                          ).length)} attending
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {[
                            ...instance.participantNames,
                            ...rsvps.filter(r =>
                              !r.friendId &&
                              !instance.invitedFriends?.some(f => f.name.toLowerCase() === r.name.toLowerCase())
                            ).map(r => r.name)
                          ].map((name, idx) => {
                            const isHost = name.includes('(Host)');
                            const displayName = name.replace('(Host)', '').trim();

                            return (
                              <div key={idx} className="flex items-center">
                                <span className={`text-sm ${isHost ? 'font-bold text-indigo-900 underline decoration-indigo-200 underline-offset-4' : 'text-gray-600'}`}>
                                  {displayName}
                                </span>
                                {isHost && (
                                  <Badge className="ml-1.5 bg-indigo-600 text-white border-none text-[8px] h-3.5 px-1 leading-none font-black uppercase">
                                    Host
                                  </Badge>
                                )}
                                {idx < (instance.participantNames.length + rsvps.length - 1) && (
                                  <span className="ml-2 text-gray-300">•</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSVP Section */}
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gray-50/50 border-b">
                <CardTitle className="text-2xl text-center">RSVP for This Event</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {rsvpSubmitted ? (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                    <h3 className="text-xl font-semibold text-green-900">RSVP Submitted!</h3>
                    <p className="text-gray-600">Thank you for confirming your attendance. We look forward to seeing you there!</p>
                    <Button onClick={() => setRsvpSubmitted(false)} variant="outline">
                      Submit Another RSVP
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name *
                        </label>
                        <div className="relative">
                          <Input
                            value={rsvpForm.name}
                            onChange={(e) => {
                              setRsvpForm({ ...rsvpForm, name: e.target.value })
                            }}
                            required
                            placeholder="Enter your full name"
                            className={linkedFriend ? "border-green-500 pr-10" : ""}
                          />
                          {linkedFriend && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        {!linkedFriend && suggestions.length > 0 && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 animate-in fade-in slide-in-from-top-1">
                            <p className="text-xs text-blue-800 mb-2 font-medium">Are you one of these invited guests?</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setLinkedFriend(s);
                                    setRsvpForm(prev => ({ ...prev, name: s.name }));
                                  }}
                                  className="text-sm bg-white border border-blue-300 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center"
                                >
                                  {s.name}
                                  <Check className="h-3 w-3 ml-1" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {instance.eventUrl && (
                          <div className="flex items-center text-blue-600 mt-3">
                            <ExternalLink className="h-4 w-4 mr-3" />
                            <a
                              href={instance.eventUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              Visit Event Website
                            </a>
                          </div>
                        )}

                        {linkedFriend && (
                          <p className="text-xs text-green-600 mt-1 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Linked to invitation for <strong>{linkedFriend.name}</strong>
                            <button
                              type="button"
                              onClick={() => { setLinkedFriend(null); setRsvpForm(prev => ({ ...prev, name: '' })); }}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={rsvpForm.email}
                          onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={rsvpForm.phone}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                      <p className="text-xs text-gray-500 mt-1">Either email or phone is required</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <Textarea
                        value={rsvpForm.message}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                        placeholder="Any special requests or questions?"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg shadow-md"
                      disabled={submitting || (!rsvpForm.email && !rsvpForm.phone)}
                    >
                      {submitting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Attendance
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Recent RSVPs */}
            {(rsvps?.length ?? 0) > 0 && (
              <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b">
                  <CardTitle className="text-xl">Recent RSVPs</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {(rsvps ?? []).slice(0, 5).map((rsvp) => (
                    <div key={rsvp.id} className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{rsvp.name}</div>
                          {rsvp.message && (
                            <p className="text-sm text-gray-600 mt-1">{rsvp.message}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(rsvp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <div className="sticky top-8 space-y-6">
              {/* Branding & CTA Card - Primary Side Element */}
              <Card className="border-none shadow-2xl bg-white overflow-hidden ring-1 ring-gray-200">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                  {/* Decorative Sparkle Background */}
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="h-32 w-32 rotate-12" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">Plan with Socialiser</h2>
                    </div>

                    <div className="space-y-4">
                      <p className="text-blue-50 text-sm leading-relaxed">
                        Organized using <span className="font-bold underline decoration-blue-400">Socialiser</span>,
                        the AI platform by <strong>Kuli Singh</strong> for friction-free meetups.
                      </p>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3 text-xs text-blue-50">
                          <div className="bg-white/10 p-1.5 rounded-full mt-0.5">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <span className="font-bold block text-white">Build Your Circle</span>
                            Add your friends and organize group activities without the back-and-forth.
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs text-blue-50">
                          <div className="bg-white/10 p-1.5 rounded-full mt-0.5">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <span className="font-bold block text-white">Create Custom Playbooks</span>
                            Save your favorite activity templates—from casual drinks to epic weekend trips.
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs text-blue-50">
                          <div className="bg-white/10 p-1.5 rounded-full mt-0.5">
                            <Calendar className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <span className="font-bold block text-white">Launch Events in Seconds</span>
                            Pick a template, and let our AI handle the logistics and invite sync.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <div>
                        <p className="font-semibold text-sm text-white">Inspired?</p>
                        <p className="text-[10px] text-blue-200">Start planning your own events today.</p>
                      </div>
                      <Link href="/register" className="block">
                        <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg hover:scale-105 transition-all">
                          Get Started for Free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Guest Tools */}
              <CalendarIntegration
                instanceId={instance.id}
                activityName={instance.customTitle || instance.activity.name}
              />
              <QRCodeGenerator
                url={eventUrl}
                eventTitle={instance.customTitle || instance.activity.name}
              />

              {/* Developer Credit Footer (Mobile/Desktop consistent) */}
              <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  SOCIALISER BY KULI SINGH • © 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
