
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { CalendarIntegration } from '@/components/calendar-integration';
import { QRCodeGenerator } from '@/components/qr-code-generator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  email?: string | null;
  phoneNumber?: string | null;
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
  allowExternalGuests: boolean; // Added for guest policy
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
  hostAttending?: boolean;
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

  const [selectedFriendId, setSelectedFriendId] = useState<string>('');



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

  useEffect(() => {
    fetchEventData();
  }, [params.id]);

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
          friendId: selectedFriendId && selectedFriendId !== 'external' ? selectedFriendId : undefined
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

  const eventUrl = typeof window !== 'undefined' ? window.location.href : '';

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
              <CardContent className="p-8 space-y-6">
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
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-6 w-6 mr-4 text-green-600 mt-1" />
                    <div>
                      {instance.venue && <div className="text-xl font-semibold">{instance.venue}</div>}
                      {instance.address && <div className="text-base">{instance.address}</div>}
                      {instance.city && <div className="text-base">{instance.city}, {instance.state} {instance.zipCode}</div>}
                      {!instance.venue && !instance.address && instance.location && <div className="text-xl">{instance.location}</div>}
                    </div>
                  </div>
                )}

                {/* Description */}
                {(instance.detailedDescription || instance.activity.description) && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">About This Event</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {instance.detailedDescription || instance.activity.description}
                    </p>
                  </div>
                )}

                {/* Participants */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3 text-indigo-600" />
                      <span className="font-semibold">
                        {rsvps.length + (instance.hostAttending ? 1 : 0)}
                        {instance.capacity ? ` / ${instance.capacity}` : ''} confirmed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center pl-8">
                    {instance.allowExternalGuests ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                        External Guests Allowed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                        Invite Only
                      </Badge>
                    )}
                    {instance.capacity && (
                      <Badge variant="outline" className="ml-2 text-gray-500 border-gray-300">
                        Max {instance.capacity} Guests
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 pb-4 px-8 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Socialiser Playbook</span>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-slate-200 text-slate-500 bg-white px-2 py-0.5 uppercase">
                  {instance.activity.name}
                </Badge>
              </CardFooter>
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
                    <p className="text-gray-600">Thank you for confirming your attendance.</p>
                    <Button onClick={() => setRsvpSubmitted(false)} variant="outline">Submit Another RSVP</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Event Full Check */}
                    {(instance.capacity && (rsvps.length + (instance.hostAttending ? 1 : 0) >= instance.capacity)) ? (
                      <div className="text-center p-8 bg-red-50 rounded-xl border border-red-100">
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Event Full</h3>
                        <p className="text-red-700">This event has reached its maximum capacity.</p>
                      </div>
                    ) : (
                      <>
                        {/* Manual Form - Always show for public access */}
                        <form onSubmit={handleRsvpSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                            <Input
                              value={rsvpForm.name}
                              onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                              required
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <Input
                              type="email"
                              value={rsvpForm.email}
                              onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                              placeholder="your.email@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <Input
                              type="tel"
                              value={rsvpForm.phone}
                              onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                              placeholder="(555) 123-4567"
                            />
                            <p className="text-xs text-gray-500 mt-1">Either email or phone is required</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
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
                              <><Clock className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-2" />Confirm Attendance</>
                            )}
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Branding Card */}
            <Card className="border-none shadow-2xl bg-white overflow-hidden ring-1 ring-gray-200">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-white" />
                    <h2 className="text-xl font-bold tracking-tight">Plan with Socialiser</h2>
                  </div>
                  <p className="text-blue-50 text-sm leading-relaxed">
                    Organized using <span className="font-bold">Socialiser</span>, the AI platform by <strong>Kuli Singh</strong> for friction-free meetups.
                  </p>
                  <Link href="/register" className="block pt-4">
                    <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg">
                      Get Started for Free
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Guest Tools */}
            <CalendarIntegration
              instanceId={instance.id}
              activityName={instance.customTitle || instance.activity.name}
            />
            {(!instance.capacity || (rsvps.length + (instance.hostAttending ? 1 : 0) < instance.capacity)) && (
              <QRCodeGenerator
                url={eventUrl}
                eventTitle={instance.customTitle || instance.activity.name}
              />
            )}

            {/* Developer Credit Footer */}
            <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                SOCIALISER BY KULI SINGH • © 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
