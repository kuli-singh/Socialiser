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
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/activities', label: 'Activities', icon: Activity },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/values', label: 'Values', icon: Heart },
    { href: '/ai-discovery', label: 'AI Discovery', icon: Sparkles },
    { href: '/settings', label: 'Settings', icon: Settings },
];
