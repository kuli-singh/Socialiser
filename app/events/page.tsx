'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Calendar, Clock, MapPin, Users, Edit, ExternalLink, Eye, Trash2, Plus, Search, Filter, SortAsc, SortDesc, Layers, CalendarCheck, Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { formatDateTime, getTimeUntil, safeParseDate, getParticipantCount, getEventParticipantStats } from '@/lib/utils';

interface ActivityInstance {
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
    requirements: string | null;
    contactInfo: string | null;
    venueType: string | null;
    priceInfo: string | null;
    capacity: number | null;
    eventUrl: string | null;
    activity: {
        id: string;
        name: string;
        description: string | null;
        values: Array<{
            value: {
                name: string;
            };
        }>;
    };
    participations: Array<{
        friend: {
            name: string;
        };
    }>;
}

export default function EventsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [instances, setInstances] = useState<ActivityInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchInstances();
        }
    }, [status]);

    const fetchInstances = async () => {
        try {
            const response = await fetch('/api/instances');
            if (!response.ok) throw new Error('Failed to fetch scheduled events');

            const data = await response.json();
            setInstances(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const deleteInstance = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the event "${title}"?`)) return;

        setDeletingId(id);
        try {
            const response = await fetch(`/api/instances/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete event');
            setInstances(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete event');
        } finally {
            setDeletingId(null);
        }
    };

    if (status === 'loading' || loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    const now = new Date();
    const upcomingEvents = instances.filter(i => {
        const d = safeParseDate(i.datetime);
        return d && d > now;
    }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    const pastEvents = instances.filter(i => {
        const d = safeParseDate(i.datetime);
        return d && d <= now;
    }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center">
                        <CalendarCheck className="h-8 w-8 text-blue-600 mr-3" />
                        Scheduled Events
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">View and manage all your scheduled activity instances</p>
                </div>
                <Link href="/schedule">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Event
                    </Button>
                </Link>
            </div>

            {instances.length === 0 ? (
                <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
                    <CardContent className="text-center py-12">
                        <CalendarCheck className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
                        <p className="text-gray-600 mb-4">Create your first event from an activity template</p>
                        <Link href="/schedule">
                            <Button size="lg">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Event
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center">
                                <Clock className="h-6 w-6 text-blue-600 mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-900">Upcoming Events</h2>
                                <Badge className="ml-3 bg-blue-100 text-blue-800">{upcomingEvents.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingEvents.map(instance => (
                                    <EventCard key={instance.id} instance={instance} isUpcoming={true} onDelete={deleteInstance} deletingId={deletingId} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center pt-4">
                                <Calendar className="h-6 w-6 text-slate-400 mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-900">Past Events</h2>
                                <Badge className="ml-3 bg-slate-100 text-slate-800">{pastEvents.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                                {pastEvents.map(instance => (
                                    <EventCard key={instance.id} instance={instance} isUpcoming={false} onDelete={deleteInstance} deletingId={deletingId} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function EventCard({ instance, isUpcoming, onDelete, deletingId }: {
    instance: ActivityInstance;
    isUpcoming: boolean;
    onDelete: (id: string, title: string) => void;
    deletingId: string | null;
}) {
    const { date, time } = formatDateTime(instance.datetime);
    const fullAddress = [instance.address, instance.city, instance.state].filter(Boolean).join(', ');
    const title = instance.customTitle || instance.activity.name;

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-white ring-1 ring-gray-100 overflow-hidden flex flex-col">
            <div className={`h-1.5 bg-gradient-to-r ${isUpcoming ? 'from-blue-500 to-indigo-600' : 'from-slate-400 to-slate-500'}`} />

            <CardHeader className="pb-2 px-5 pt-5">
                <div className="space-y-3">
                    {/* Status & Time Row */}
                    <div className="flex items-center justify-between">
                        {isUpcoming ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[10px] font-bold">
                                UPCOMING
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">
                                COMPLETED
                            </Badge>
                        )}
                        {isUpcoming && (
                            <div className="flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50/50 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeUntil(instance.datetime)}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <CardTitle className={`text-xl font-black group-hover:text-blue-600 transition-colors line-clamp-1 ${isUpcoming ? 'text-gray-900' : 'text-slate-700'}`}>
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
                {/* Date & Time Badge */}
                <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 w-fit px-2.5 py-1.5 rounded-lg shadow-sm">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-blue-500" />
                    <span>{date} at {time}</span>
                </div>

                {/* Rich Location */}
                {(instance.venue || fullAddress || instance.location) && (
                    <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100/30">
                        {instance.venue && (
                            <div className="flex items-center text-sm text-gray-900 font-bold truncate">
                                <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                                <span className="truncate">{instance.venue}</span>
                            </div>
                        )}
                        {fullAddress ? (
                            <div className="text-[11px] text-gray-500 ml-5.5 pl-0.5 line-clamp-1 italic text-left">
                                {fullAddress}
                            </div>
                        ) : instance.location && (
                            <div className="flex items-center text-sm text-gray-700">
                                <MapPin className="h-3.5 w-3.5 mr-2 text-green-600 shrink-0" />
                                <span className="truncate">{instance.location}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Social Row: Joining vs Values */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                    {/* Left: Who's Joining */}
                    <div className="space-y-1 border-r border-gray-100 pr-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-left">Who's Joining</p>
                        <div className="flex items-center text-sm text-gray-900 font-bold">
                            <div className="bg-indigo-50 p-1 rounded-md mr-2">
                                <Users className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <span>
                                {getEventParticipantStats(instance).invited} invited • {getEventParticipantStats(instance).confirmed} confirmed
                            </span>
                        </div>
                    </div>

                    {/* Right: Our Values */}
                    <div className="space-y-1 pl-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-right">Our Values</p>
                        <div className="flex items-center justify-end text-sm text-gray-900 font-bold">
                            <span className="truncate mr-2">
                                {instance?.activity?.values?.[0]?.value?.name || 'Connection'}
                            </span>
                            <div className="bg-red-50 p-1 rounded-md">
                                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-100" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 space-y-2">
                    <div className="flex gap-2">
                        <Link href={`/invite/${instance.id}`} className="flex-[2]">
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-sm">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Invite
                            </Button>
                        </Link>
                        <Link href={`/schedule?edit=true&id=${instance.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full font-semibold border-gray-200 hover:bg-gray-50">
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                            </Button>
                        </Link>
                    </div>

                    <div className="flex gap-2">
                        {instance.eventUrl && (
                            <a
                                href={instance.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1"
                            >
                                <Button size="sm" variant="ghost" className="w-full text-[10px] h-8 font-bold uppercase tracking-wider text-gray-400 hover:text-green-600 hover:bg-green-50">
                                    <ExternalLink className="h-3 w-3 mr-1.5 shrink-0" />
                                    Website
                                </Button>
                            </a>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider text-red-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => onDelete(instance.id, title)}
                            disabled={deletingId === instance.id}
                        >
                            {deletingId === instance.id ? <LoadingSpinner /> : <Trash2 className="h-3 w-3 mr-1.5 shrink-0" />}
                            Delete
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Template Playbook Footer - Absolute Bottom */}
            <CardFooter className="pt-3 pb-4 px-5 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded shadow-sm border border-slate-100">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Socialiser Playbook
                    </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-500 bg-white px-1.5 py-0 uppercase">
                    {instance.activity.name}
                </Badge>
            </CardFooter>
        </Card>
    );
}
