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
import {
    Calendar,
    MapPin,
    Users,
    CheckCircle,
    Clock,
    Sparkles,
    Check,
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
            name: string;
            friendId: string | null;
        }>;
        participations?: Array<{
            id: string;
            friend: {
                id: string;
                name: string;
            };
        }>;
        showGuestList?: boolean;
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

    // Calculate confirmed count (same logic as Public Page)
    // Note: In friend invite API, publicRSVPs *are* the confirmations.
    const confirmedCount = (instance.publicRSVPs?.length || 0) + (instance.hostAttending ? 1 : 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

                {/* Welcome Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-4">
                        <UserCheck className="h-8 w-8 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {instance.customTitle || instance.activity.name}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Welcome, {invite.friend.name}! You've been invited.
                    </p>
                    <div className="flex justify-center gap-2">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur text-gray-700 shadow-sm">
                            Hosted by {instance.hostAttending ? (instance.user?.name || 'the Host') : (instance.user?.name || 'the Host')}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Details Card */}
                        <Card className="border-l-4 border-l-purple-500 shadow-lg">
                            <CardContent className="p-8 space-y-6">
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
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {instance.detailedDescription || instance.activity.description}
                                        </p>
                                    </div>
                                )}

                                {/* Participants Summary - Detailed Macro View */}
                                <div className="pt-4 border-t border-gray-100 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-gray-900 font-semibold">
                                                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                                                <span>{confirmedCount} Confirmed</span>
                                            </div>
                                            {instance.capacity && (
                                                <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                    Max {instance.capacity}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Detailed Stats */}
                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div>
                                                <span className="block text-xs text-gray-400 uppercase tracking-wide">Invited</span>
                                                <span className="font-medium text-gray-900">
                                                    {instance.participations?.length || 0} People
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-gray-400 uppercase tracking-wide">Pending</span>
                                                <span className="font-medium text-gray-900">
                                                    {/* Pending = Total Invites - (Invites that have RSVPed) */}
                                                    {(instance.participations?.length || 0) - (instance.participations?.filter((p: any) =>
                                                        instance.publicRSVPs?.some((r: any) => r.friendId === p.friend.id)
                                                    ).length || 0)} Waiting
                                                </span>
                                            </div>
                                            {instance.capacity && (
                                                <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-500">Free Spots</span>
                                                        <span className={`font-bold ${confirmedCount >= instance.capacity ? 'text-red-500' : 'text-green-600'}`}>
                                                            {Math.max(0, instance.capacity - confirmedCount)} Remaining
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {instance.allowExternalGuests ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                                External Guests Allowed
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                                                Invite Only
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Guest List (Conditionally Rendered) */}
                                {instance.showGuestList && (
                                    <div className="pt-6 border-t border-gray-100 animate-in fade-in duration-500">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Who's Coming</h3>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Host */}
                                            {instance.hostAttending && (
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                                                            HOST
                                                        </div>
                                                        <div className="font-medium text-gray-900">{instance.user?.name || 'Host'}</div>
                                                    </div>
                                                    <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-200">Organizer</Badge>
                                                </div>
                                            )}

                                            {/* Confirmed Public RSVPs */}
                                            {instance.publicRSVPs?.map((rsvp: any) => (
                                                <div key={rsvp.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs">
                                                            {rsvp.name.charAt(0)}
                                                        </div>
                                                        <div className="font-medium text-gray-900">{rsvp.name}</div>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-0">Going</Badge>
                                                </div>
                                            ))}

                                            {/* Pending Invites (Participations w/o RSVP) */}
                                            {instance.participations?.filter((p: any) =>
                                                !instance.publicRSVPs?.some((r: any) => r.friendId === p.friend.id)
                                            ).map((p: any) => (
                                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                            {p.friend.name.charAt(0)}
                                                        </div>
                                                        <div className="font-medium text-gray-500">{p.friend.name}</div>
                                                    </div>
                                                    <Badge variant="outline" className="text-gray-400 border-gray-200">Invited</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

                        {/* RSVP Card */}
                        <Card className="shadow-xl border-none">
                            <CardHeader className="bg-gray-50/50 border-b">
                                <CardTitle className="text-xl text-center">Your Response</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
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
                                    <form onSubmit={handleRsvpSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                                            <Input
                                                value={rsvpForm.name}
                                                disabled
                                                className="bg-gray-50 font-medium text-gray-900 border-gray-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <Input
                                                type="email"
                                                value={rsvpForm.email}
                                                onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                                                placeholder="Enter email to receive updates"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                                            <Input
                                                type="tel"
                                                value={rsvpForm.phone}
                                                onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                                                placeholder="Mobile number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                                            <Textarea
                                                value={rsvpForm.message}
                                                onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                                                placeholder="Excited to join!"
                                                rows={2}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700 shadow-md"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                    Confirming...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Yes, I'll be there
                                                </>
                                            )}
                                        </Button>
                                    </form>
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
                                    <Link href="/" className="block pt-4">
                                        <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg">
                                            Get Started for Free
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Guest Tools - Calendar ONLY (No QR) */}
                        <CalendarIntegration
                            instanceId={instance.id}
                            activityName={instance.customTitle || instance.activity.name}
                        />

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
