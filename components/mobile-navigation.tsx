'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { navItems } from '@/lib/nav-config';

export function MobileNavigation() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    // Filter for key mobile items (Dashboard, Schedule, Activities, Friends, Locations, Settings)
    // AI Discovery is removed as requested
    const mobileItems = navItems.filter(item =>
        ['Dashboard', 'Schedule', 'Activities', 'Friends', 'Locations', 'Settings'].includes(item.label)
    );

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {mobileItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label.replace('Discovery', '')}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
