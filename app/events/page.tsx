'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Calendar, Clock, MapPin, Users, Edit, ExternalLink, Eye, Trash2, Plus, Search, Filter, SortAsc, SortDesc, Layers, CalendarCheck } from 'lucide-react';
import { formatDateTime, getTimeUntil, safeParseDate, getParticipantCount } from '@/lib/utils';

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
        <Card className={`hover:shadow-lg transition-shadow border-l-4 ${isUpcoming ? 'border-l-blue-500 bg-blue-50' : 'border-l-slate-400 bg-slate-50'}`}>
            <CardHeader className="pb-3 text-left">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className={`text-lg font-semibold mb-1 ${isUpcoming ? 'text-blue-900' : 'text-slate-900'}`}>
                            {title}
                        </CardTitle>
                        <div className="flex items-center text-sm text-blue-600 mb-2">
                            <Layers className="h-3 w-3 mr-1" />
                            {instance.activity.name}
                        </div>
                        {isUpcoming && (
                            <div className="flex items-center text-xs font-medium text-blue-700">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeUntil(instance.datetime)}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{date} at {time}</span>
                </div>

                {(instance.venue || fullAddress || instance.location) && (
                    <div className="flex items-start text-sm text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="truncate">
                            {instance.venue && <div className="font-medium">{instance.venue}</div>}
                            <div className="text-gray-600 text-xs">{fullAddress || instance.location}</div>
                        </div>
                    </div>
                )}

                <div className="flex items-center text-sm text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    <span>{getParticipantCount(instance)} participants</span>
                </div>


                <div className="flex space-x-2 pt-2">
                    <Link href={`/invite/${instance.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                        </Button>
                    </Link>
                    {instance.eventUrl && (
                        <a
                            href={instance.eventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button size="sm" variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Website
                            </Button>
                        </a>
                    )}
                    <Link href={`/schedule?edit=true&id=${instance.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="flex-none px-3"
                        onClick={() => onDelete(instance.id, title)}
                        disabled={deletingId === instance.id}
                    >
                        {deletingId === instance.id ? <LoadingSpinner /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
