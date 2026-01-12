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
import {
    Calendar,
    MapPin,
    Users,
    CheckCircle,
    Clock,
    Sparkles,
    Check,
    X,
    UserCheck
} from 'lucide-react';

interface InviteData {
    id: string; // Participation ID
    inviteToken: string;
    friend: {
        id: string;
        name: string;
        email: string | null;
        phoneNumber: string | null;
    };
    activityInstance: {
        id: string;
        datetime: string;
        location: string | null;
        customTitle: string | null;
        venue: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        detailedDescription: string | null;
        hostAttending: boolean;
        capacity: number | null;
        allowExternalGuests: boolean;
        activity: {
            name: string;
            description: string | null;
        };
        publicRSVPs: Array<{
            id: string;
            friendId: string | null;
        }>;
        user?: {
            name: string;
            email?: string;
        };
    };
}

export default function InviteJoinPage({ params }: { params: { token: string } }) {
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // RSVP form state (Pre-filled)
    const [rsvpForm, setRsvpForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    const fetchInvite = async () => {
        try {
            const response = await fetch(`/api/invites/${params.token}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Invite not found');
                throw new Error('Failed to load invite');
            }
            const data = await response.json();
            setInvite(data);

            // Pre-fill form
            setRsvpForm({
                name: data.friend.name,
                email: data.friend.email || '',
                phone: data.friend.phoneNumber || '',
                message: ''
            });

            // Check if already RSVP'd
            const existingRSVP = data.activityInstance.publicRSVPs.find((r: any) => r.friendId === data.friend.id);
            if (existingRSVP) {
                setRsvpSubmitted(true);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load invite');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvite();
    }, [params.token]);

    const handleRsvpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invite) return;

        setSubmitting(true);

        try {
            // Post to the public RSVP endpoint, but include friendId to link it
            const response = await fetch(`/api/public-events/${invite.activityInstance.id}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...rsvpForm,
                    friendId: invite.friend.id // CRITICAL: Link this RSVP to the friend
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit RSVP');
            }

            setRsvpSubmitted(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to submit RSVP');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (datetime: string) => {
        try {
            const date = new Date(datetime);
            if (isNaN(date.getTime())) return { date: 'Invalid Date', time: 'Invalid Time' };
            return {
                date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            };
        } catch {
            return { date: 'Invalid Date', time: 'Invalid Time' };
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!invite) return <ErrorMessage message="Invite not found" />;

    const { date, time } = formatDateTime(invite.activityInstance.datetime);
    const instance = invite.activityInstance;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

                {/* Welcome Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-4">
                        <UserCheck className="h-8 w-8 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {invite.friend.name}!
                    </h1>
                    <p className="text-lg text-gray-600">
                        You've been invited to a special event.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur text-gray-700 shadow-sm">
                            Hosted by {instance.hostAttending ? (instance.user?.name || 'the Host') : (instance.user?.name || 'the Host')}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Event Details */}
                    <Card className="border-l-4 border-l-purple-500 shadow-xl h-fit">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-purple-900">
                                {instance.customTitle || instance.activity.name}
                            </CardTitle>
                        </CardHeader>
                        {/* Date & Time */}
                        <div className="flex items-center text-gray-700">
                            <Calendar className="h-6 w-6 mr-4 text-purple-600" />
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
                                        {(instance.publicRSVPs?.length || 0) + (instance.hostAttending ? 1 : 0)}
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
                </Card>

                {/* RSVP Card */}
                <Card className="shadow-xl border-none">
                    <CardHeader className="bg-gray-50/50 border-b">
                        <CardTitle className="text-xl text-center">Your Response</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {rsvpSubmitted ? (
                            <div className="text-center space-y-4 py-6">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-green-900">You're going!</h3>
                                <p className="text-gray-600">Thanks for confirming, {invite.friend.name}.</p>

                                <div className="pt-4 space-y-3">
                                    <Link href={`/event/${instance.id}`} className="block">
                                        <Button variant="outline" className="w-full">
                                            View Public Event Page
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleRsvpSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                    <Input
                                        value={rsvpForm.name}
                                        disabled
                                        className="bg-gray-50 font-medium text-gray-900 border-gray-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <Input
                                        type="email"
                                        value={rsvpForm.email}
                                        onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                                        placeholder="Enter email to receive updates"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                                    <Input
                                        type="tel"
                                        value={rsvpForm.phone}
                                        onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                                        placeholder="Mobile number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                                    <Textarea
                                        value={rsvpForm.message}
                                        onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                                        placeholder="Excited to join!"
                                        rows={2}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base bg-purple-600 hover:bg-purple-700 shadow-md"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><Clock className="h-4 w-4 mr-2 animate-spin" />Confirming...</>
                                    ) : (
                                        <><Check className="h-4 w-4 mr-2" />Yes, I'll be there</>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            {/* Footer Branding & Credits */}
            <div className="space-y-6 pt-8">
                {/* Branding Card */}
                <Card className="border-none shadow-xl bg-white overflow-hidden ring-1 ring-gray-200 transform transition-all hover:scale-[1.01]">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-white" />
                                <h2 className="text-xl font-bold tracking-tight">Plan with Socialiser</h2>
                            </div>
                            <p className="text-blue-50 text-sm leading-relaxed">
                                Organized using <span className="font-bold">Socialiser</span>, the AI platform by <strong>Kuli Singh</strong> for friction-free meetups.
                            </p>
                            <Link href="/" className="block pt-4">
                                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg">
                                    Get Started for Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Developer Credit Footer */}
                <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                        SOCIALISER BY KULI SINGH • © 2025
                    </p>
                </div>
            </div>
        </div>
    );
}
