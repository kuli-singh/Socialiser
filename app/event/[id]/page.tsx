
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
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Check,
  X
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            {instance.customTitle || instance.activity.name}
          </h1>
          <p className="text-lg text-gray-600">You're invited to join us!</p>
        </div>

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
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">
                  {instance.detailedDescription || instance.activity.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {instance.requirements && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">What to Bring/Know</h4>
                <p className="text-amber-800">{instance.requirements}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instance.capacity && (
                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-3 text-purple-600" />
                  <span>Max {instance.capacity} people</span>
                </div>
              )}
              {instance.priceInfo && (
                <Badge variant="outline" className="border-green-300 text-green-700 w-fit">
                  {instance.priceInfo}
                </Badge>
              )}
            </div>

            {/* Contact Info */}
            {instance.contactInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                <p className="text-blue-800">{instance.contactInfo}</p>
              </div>
            )}

            {/* Values */}
            {(instance?.activity?.values?.length ?? 0) > 0 && (
              <div className="flex items-start text-gray-700">
                <Heart className="h-5 w-5 mr-3 mt-1 text-red-600" />
                <div>
                  <div className="font-semibold mb-2">What We Value</div>
                  <div className="flex flex-wrap gap-2">
                    {(instance?.activity?.values ?? []).map((av) => (
                      <Badge key={av?.value?.id} variant="outline">
                        {av?.value?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="flex items-start text-gray-700">
              <Users className="h-5 w-5 mr-3 mt-1 text-purple-600" />
              <div>
                <div className="font-semibold">
                  {(instance.participantCount + rsvps.filter(r =>
                    !r.friendId &&
                    !instance.invitedFriends?.some(f => f.name.toLowerCase() === r.name.toLowerCase())
                  ).length)} people attending
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {[
                    ...instance.participantNames,
                    ...rsvps.filter(r =>
                      !r.friendId &&
                      !instance.invitedFriends?.some(f => f.name.toLowerCase() === r.name.toLowerCase())
                    ).map(r => r.name)
                  ].join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <Card className="shadow-lg">
          <CardHeader>
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
                  className="w-full"
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Recent RSVPs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(rsvps ?? []).slice(0, 5).map((rsvp) => (
                <div key={rsvp.id} className="border border-gray-200 rounded-lg p-4">
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

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by Social Organizer</p>
        </div>
      </div>
    </div>
  );
}
