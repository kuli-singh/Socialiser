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

// Prisma query result types for API responses
export type ActivityWithValues = {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  values: {
    id: string
    activityId: string
    valueId: string
    value: {
      id: string
      userId: string
      name: string
      description: string | null
      createdAt: Date
      updatedAt: Date
    }
  }[]
  _count?: {
    instances: number
  }
}

export type ActivityInstanceWithRelations = {
  id: string
  userId: string
  datetime: Date
  endDate: Date | null
  isAllDay: boolean
  location: string | null
  activityId: string
  createdAt: Date
  updatedAt: Date
  customTitle: string | null
  venue: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  detailedDescription: string | null
  requirements: string | null
  contactInfo: string | null
  venueType: string | null
  priceInfo: string | null
  capacity: number | null
  activity: {
    id: string
    userId: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    values: {
      id: string
      activityId: string
      valueId: string
      value: {
        id: string
        userId: string
        name: string
        description: string | null
        createdAt: Date
        updatedAt: Date
      }
    }[]
  }
  participations: {
    id: string
    userId: string
    friendId: string
    activityInstanceId: string
    createdAt: Date
    friend: {
      id: string
      userId: string
      name: string
      phone: string
      email: string | null
      group: string | null
      createdAt: Date
      updatedAt: Date
    }
  }[]
}

export type SerializedActivityWithValues = {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: string | null
  updatedAt: string | null
  values: {
    id: string
    activityId: string
    valueId: string
    value: {
      id: string
      userId: string
      name: string
      description: string | null
      createdAt: string | null
      updatedAt: string | null
    }
  }[]
  _count?: {
    instances: number
  }
}

export type SerializedActivityInstanceWithRelations = {
  id: string
  userId: string
  datetime: string | null
  endDate: string | null
  isAllDay: boolean
  location: string | null
  activityId: string
  createdAt: string | null
  updatedAt: string | null
  customTitle: string | null
  venue: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  detailedDescription: string | null
  requirements: string | null
  contactInfo: string | null
  venueType: string | null
  priceInfo: string | null
  capacity: number | null
  activity: {
    id: string
    userId: string
    name: string
    description: string | null
    createdAt: string | null
    updatedAt: string | null
    values: {
      id: string
      activityId: string
      valueId: string
      value: {
        id: string
        userId: string
        name: string
        description: string | null
        createdAt: string | null
        updatedAt: string | null
      }
    }[]
  }
  participations: {
    id: string
    userId: string
    friendId: string
    activityInstanceId: string
    createdAt: Date
    friend: {
      id: string
      userId: string
      name: string
      phone: string
      email: string | null
      group: string | null
      createdAt: Date
      updatedAt: Date
    }
  }[]
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