
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  CheckCircle, 
  MessageCircle, 
  Mail, 
  Smartphone, 
  Share2,
  Link,
  Calendar,
  Users
} from 'lucide-react';

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
  activity: {
    id: string;
    name: string;
    description: string | null;
    values: Array<{
      value: {
        id: string;
        name: string;
      };
    }>;
  };
  participations: Array<{
    friend: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
  }>;
}

interface CopyToClipboardHubProps {
  instance: ActivityInstance;
  eventUrl: string;
}

export function CopyToClipboardHub({ instance, eventUrl }: CopyToClipboardHubProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const formatDateTime = (datetime: string) => {
    try {
      const date = new Date(datetime);
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
    } catch {
      return { date: 'Date TBD', time: 'Time TBD' };
    }
  };

  const getLocation = () => {
    if (instance.venue) {
      let location = instance.venue;
      if (instance.address) location += `, ${instance.address}`;
      if (instance.city) location += `, ${instance.city}`;
      if (instance.state) location += `, ${instance.state}`;
      return location;
    }
    return instance.location || 'Location TBD';
  };

  const { date, time } = formatDateTime(instance.datetime);
  const location = getLocation();
  const eventTitle = instance.customTitle || instance.activity.name;

  // Smart recipient detection
  const friendsWithEmail = instance.participations?.filter(p => p?.friend?.email) ?? [];
  const friendsWithoutEmail = instance.participations?.filter(p => !p?.friend?.email) ?? [];

  const generateWhatsAppFormat = () => {
    let message = `🎉 You're invited to: ${eventTitle}!\n\n`;
    message += `📅 When: ${date} at ${time}\n`;
    if (location !== 'Location TBD') message += `📍 Where: ${location}\n`;
    if (instance.detailedDescription || instance.activity.description) {
      message += `📝 About: ${instance.detailedDescription || instance.activity.description}\n`;
    }
    if (instance.requirements) message += `📋 What to bring: ${instance.requirements}\n`;
    if (instance.priceInfo) message += `💰 Price: ${instance.priceInfo}\n`;
    message += `\n🔗 View details & RSVP: ${eventUrl}\n\n`;
    message += `Looking forward to seeing you there! 😊`;
    return message;
  };

  const generateEmailFormat = () => {
    let message = `Subject: You're invited: ${eventTitle} - ${date}\n\n`;
    message += `Hi there!\n\nYou're invited to join us for:\n\n`;
    message += `🎉 ${eventTitle}\n`;
    message += `📅 ${date}\n`;
    message += `🕐 ${time}\n`;
    if (location !== 'Location TBD') message += `📍 ${location}\n`;
    
    if (instance.detailedDescription || instance.activity.description) {
      message += `\n📋 About this event:\n${instance.detailedDescription || instance.activity.description}\n`;
    }

    if (instance.requirements) {
      message += `\n📝 What to bring/know:\n${instance.requirements}\n`;
    }

    if (instance.contactInfo) {
      message += `\n📞 Contact: ${instance.contactInfo}\n`;
    }

    if (instance.priceInfo) {
      message += `\n💰 Price: ${instance.priceInfo}\n`;
    }

    message += `\n🔗 View full details and RSVP online:\n${eventUrl}\n`;
    message += `\n📅 Add to calendar:\n`;
    message += `Google Calendar: ${window.location.origin}/api/calendar/google/${instance.id}\n`;
    message += `Download .ics: ${window.location.origin}/api/calendar/${instance.id}\n`;
    message += `\nLooking forward to seeing you there!\n\n`;
    message += `---\nSent via Social Organizer`;
    return message;
  };

  const generateSMSFormat = () => {
    let message = `${eventTitle} - ${date} at ${time}`;
    if (location !== 'Location TBD') message += ` at ${location}`;
    message += `. View details & RSVP: ${eventUrl}`;
    return message;
  };

  const generateGenericFormat = () => {
    let message = `EVENT INVITATION\n\n`;
    message += `${eventTitle}\n`;
    message += `${date} at ${time}\n`;
    if (location !== 'Location TBD') message += `Location: ${location}\n`;
    
    if (instance.detailedDescription || instance.activity.description) {
      message += `\nDescription:\n${instance.detailedDescription || instance.activity.description}\n`;
    }

    if (instance.requirements) {
      message += `\nRequirements: ${instance.requirements}\n`;
    }

    if (instance.priceInfo) {
      message += `\nPrice: ${instance.priceInfo}\n`;
    }

    message += `\nView details and RSVP: ${eventUrl}\n`;
    message += `\nOrganized via Social Organizer`;
    return message;
  };

  const copyToClipboard = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const copyEventUrl = async () => {
    await copyToClipboard(eventUrl, 'url');
  };

  const formats = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'green',
      content: generateWhatsAppFormat(),
      description: 'Perfect for WhatsApp messages and chat groups'
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'blue',
      content: generateEmailFormat(),
      description: 'Professional format with calendar links included'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: Smartphone,
      color: 'purple',
      content: generateSMSFormat(),
      description: 'Short format for text messages (160 characters max)'
    },
    {
      id: 'generic',
      name: 'Generic',
      icon: Share2,
      color: 'gray',
      content: generateGenericFormat(),
      description: 'Universal format for any platform'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Event Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 text-blue-600 mr-2" />
            Shareable Event Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={eventUrl}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
            <Button onClick={copyEventUrl} variant="outline">
              {copied === 'url' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              🌟 <strong>Anyone can view this link!</strong> Share it anywhere - social media, 
              messaging apps, email, or just copy-paste. No account required to view or RSVP.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Recipient Detection */}
      {(instance.participations?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              Invited Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friendsWithEmail.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Can receive emails ({friendsWithEmail.length})
                  </h4>
                  <div className="space-y-1">
                    {friendsWithEmail.map(p => (
                      <div key={p?.friend?.id} className="text-sm text-gray-600">
                        {p?.friend?.name} - {p?.friend?.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {friendsWithoutEmail.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-700 mb-2 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Phone only ({friendsWithoutEmail.length})
                  </h4>
                  <div className="space-y-1">
                    {friendsWithoutEmail.map(p => (
                      <div key={p?.friend?.id} className="text-sm text-gray-600">
                        {p?.friend?.name} - {p?.friend?.phone}
                      </div>
                    ))}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs border-orange-300 text-orange-700">
                    Use WhatsApp or SMS formats
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy-to-Clipboard Hub */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Copy className="h-5 w-5 text-blue-600 mr-2" />
            Copy Invite Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {formats.map(format => {
                const IconComponent = format.icon;
                return (
                  <TabsTrigger key={format.id} value={format.id} className="flex items-center">
                    <IconComponent className="h-4 w-4 mr-1" />
                    {format.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {formats.map(format => (
              <TabsContent key={format.id} value={format.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{format.name} Format</h4>
                    <p className="text-sm text-gray-600">{format.description}</p>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(format.content, format.id)}
                    className={`bg-${format.color}-600 hover:bg-${format.color}-700`}
                  >
                    {copied === format.id ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <Textarea
                  value={format.content}
                  readOnly
                  rows={format.id === 'sms' ? 3 : 10}
                  className="font-mono text-sm"
                />
                
                {format.id === 'sms' && format.content.length > 160 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This message is {format.content.length} characters. Consider shortening for SMS (160 char limit).
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
