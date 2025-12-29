import {
    Calendar,
    Activity,
    MapPin,
    Users,
    Heart,
    Sparkles,
    Settings
} from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: Calendar },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/activities', label: 'Activity Templates', icon: Activity },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/values', label: 'Values', icon: Heart },
    { href: '/settings', label: 'Settings', icon: Settings },
];
