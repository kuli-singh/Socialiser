
import { ActivityInstance, Activity, Friend, Participation, CoreValue, ActivityValue } from '@prisma/client';

type ActivityInstanceWithDetails = ActivityInstance & {
  activity: Activity & {
    values: (ActivityValue & {
      value: CoreValue;
    })[];
  };
  participations: (Participation & {
    friend: Friend;
  })[];
};

export function generateWhatsAppMessage(activityInstance: ActivityInstanceWithDetails): string {
  const { activity, datetime, location, participations } = activityInstance;
  
  const formattedDate = datetime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = datetime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const participantNames = participations.map(p => p.friend.name).join(', ');
  const values = activity.values.map(av => av.value.name).join(', ');

  let message = `🎉 You're invited to: ${activity.name}!\n\n`;
  message += `📅 When: ${formattedDate} at ${formattedTime}\n`;
  
  if (location) {
    message += `📍 Where: ${location}\n`;
  }
  
  if (activity.description) {
    message += `📝 About: ${activity.description}\n`;
  }
  
  if (values) {
    message += `💡 Values: ${values}\n`;
  }
  
  message += `👥 Who's coming: ${participantNames}\n\n`;
  message += `Please confirm your attendance! Looking forward to seeing you there! 😊`;

  return message;
}

export function generateWhatsAppUrl(message: string, phoneNumber?: string): string {
  const encodedMessage = encodeURIComponent(message);
  
  if (phoneNumber) {
    // Remove non-numeric characters from phone number
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/?text=${encodedMessage}`;
}
