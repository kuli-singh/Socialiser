// Core entities
export type User = {
  id: string
  name: string
  email: string
  password?: string // Optional for frontend use
  createdAt: Date
  updatedAt: Date
  profilePicture?: string
  timezone?: string
  preferences?: any
}

export type Friend = {
  id: string
  userId: string
  name: string
  phone: string
  group?: string
  createdAt: Date
  updatedAt: Date
  user?: User
}

export type CoreValue = {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  user?: User
}

export type Activity = {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  user?: User
  values?: { value: CoreValue }[]
}

// Rich ActivityInstance with all new fields
export type ActivityInstance = {
  id: string
  userId: string
  datetime: Date
  location?: string
  activityId: string
  createdAt: Date
  updatedAt: Date
  
  // Rich instance fields
  customTitle?: string
  venue?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  detailedDescription?: string
  requirements?: string
  contactInfo?: string
  venueType?: string
  priceInfo?: string
  capacity?: number
  
  // Relations
  user?: User
  activity?: Activity
  participations?: { friend: Friend }[]
}

// Form data types for creating/editing instances
export type ActivityInstanceFormData = {
  activityId: string
  datetime: string
  location?: string
  friendIds?: string[]
  
  // Rich instance fields
  customTitle?: string
  venue?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  detailedDescription?: string
  requirements?: string
  contactInfo?: string
  venueType?: string
  priceInfo?: string
  capacity?: number
}

// AI suggestion data structure
export type AISuggestion = {
  customTitle: string
  venue?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  detailedDescription: string
  requirements?: string
  contactInfo?: string
  venueType?: string
  priceInfo?: string
  capacity?: number
}

// Venue types
export const VENUE_TYPES = [
  'indoor',
  'outdoor', 
  'online',
  'hybrid'
] as const

export type VenueType = typeof VENUE_TYPES[number]

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// NextAuth type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}