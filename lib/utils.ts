import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Friend } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function searchFriends(friends: Friend[], query: string): Friend[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return friends;
  
  return friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm) ||
    friend.email.toLowerCase().includes(searchTerm) ||
    (friend.phone && friend.phone.toLowerCase().includes(searchTerm)) ||
    (friend.notes && friend.notes.toLowerCase().includes(searchTerm)) ||
    (friend.tags && friend.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}

export function sortFriends(friends: Friend[], sortBy: keyof Friend, order: 'asc' | 'desc' = 'asc'): Friend[] {
  return [...friends].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return order === 'asc' ? 1 : -1;
    if (bValue === undefined) return order === 'asc' ? -1 : 1;
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
}
