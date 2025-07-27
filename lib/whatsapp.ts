
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
  
  // Safe date formatting with error handling
  let formattedDate = 'Date TBD';
  let formattedTime = 'Time TBD';
  
  try {
    if (datetime && !isNaN(datetime.getTime())) {
      formattedDate = datetime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      formattedTime = datetime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch {
    // Keep default values if date formatting fails
  }

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

export function generateWhatsAppUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}
