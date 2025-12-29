import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Date utility functions with comprehensive error handling
export function safeParseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;

  try {
    const date = new Date(dateInput);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

export function formatDateTime(datetime: string | Date | null | undefined) {
  const date = safeParseDate(datetime);
  if (!date) {
    return {
      date: 'Invalid Date',
      time: 'Invalid Time'
    };
  }

  try {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  } catch {
    return {
      date: 'Invalid Date',
      time: 'Invalid Time'
    };
  }
}

export function getTimeUntil(datetime: string | Date | null | undefined): string {
  const eventDate = safeParseDate(datetime);
  if (!eventDate) return 'Date TBD';

  try {
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();

    if (diffMs < 0) return 'Past Event';

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  } catch {
    return 'Date TBD';
  }
}

export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = safeParseDate(dateString);
  return date !== null;
}

export function toISOStringSafe(date: Date | string | null | undefined): string | null {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return null;

  try {
    return parsedDate.toISOString();
  } catch {
    return null;
  }
}

export function getMinDateTime(): string {
  try {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  } catch {
    // Fallback to a default recent date if Date constructor fails
    return '2024-01-01T12:00';
  }
}

export function getParticipantCount(instance: any): number {
  if (!instance) return 0;

  const invitedCount = instance.participations?.length ?? 0;

  // Count external RSVPs that aren't linked to a friend or matched by email/name
  const externalRSVPCount = instance.publicRSVPs?.filter((r: any) => {
    // Already linked via friendId
    if (r.friendId) return false;

    // Check if it matches an invited friend's email or name
    const isMatched = instance.participations?.some((p: any) =>
      (p.friend?.email && r.email && p.friend.email.toLowerCase() === r.email.toLowerCase()) ||
      (p.friend?.name.toLowerCase() === r.name.toLowerCase())
    );

    return !isMatched;
  }).length ?? 0;

  const hostCount = instance.hostAttending ? 1 : 0;

  return invitedCount + externalRSVPCount + hostCount;
}