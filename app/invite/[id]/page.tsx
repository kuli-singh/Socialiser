
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { CalendarIntegration } from '@/components/calendar-integration';
import { generateWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';
import { 
  ArrowLeft, 
  Copy, 
  Calendar, 
  MapPin, 
  Users, 
  Heart,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Mail
} from 'lucide-react';

interface ActivityInstance {
  id: string;
  datetime: string;
  location: string | null;
  // Rich instance fields
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

export default function InvitePage({ params }: { params: { id: string } }) {
  const [instance, setInstance] = useState<ActivityInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  useEffect(() => {
    fetchInstance();
  }, [params.id]);

  const fetchInstance = async () => {
    try {
      const response = await fetch(`/api/instances/${params.id}`);
      if (!response.ok) throw new Error('Activity instance not found');
      
      const data = await response.json();
      setInstance(data);
      
      // Generate WhatsApp message
      const message = generateWhatsAppMessage(data);
      setWhatsappMessage(message);
      
      // Generate email content
      const emailSubj = generateEmailSubject(data);
      const emailMsg = generateEmailMessage(data);
      setEmailSubject(emailSubj);
      setEmailMessage(emailMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity instance');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const openWhatsApp = (phone?: string) => {
    const url = generateWhatsAppUrl(whatsappMessage, phone);
    window.open(url, '_blank');
  };

  const formatDateTime = (datetime: string) => {
    if (!datetime) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }

    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        return {
          date: 'Invalid Date',
          time: 'Invalid Time'
        };
      }

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
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }
  };

  const generateEmailSubject = (instance: ActivityInstance) => {
    const eventTitle = instance.customTitle || instance.activity.name;
    const { date } = formatDateTime(instance.datetime);
    return `You're invited: ${eventTitle} - ${date}`;
  };

  const generateEmailMessage = (instance: ActivityInstance) => {
    const eventTitle = instance.customTitle || instance.activity.name;
    const { date, time } = formatDateTime(instance.datetime);
    
    // Construct location
    let location = '';
    if (instance.venue) {
      location = instance.venue;
      if (instance.address) location += `, ${instance.address}`;
      if (instance.city) location += `, ${instance.city}`;
      if (instance.state) location += `, ${instance.state}`;
      if (instance.zipCode) location += ` ${instance.zipCode}`;
    } else if (instance.location) {
      location = instance.location;
    }

    // Create calendar download URLs (using relative URLs for portability)
    const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
    const googleCalendarUrl = `${currentHost}/api/calendar/google/${instance.id}`;
    const icsDownloadUrl = `${currentHost}/api/calendar/${instance.id}`;

    let message = `Hi there!\n\nYou're invited to join us for:\n\n`;
    message += `🎉 ${eventTitle}\n`;
    message += `📅 ${date}\n`;
    message += `🕐 ${time}\n`;
    
    if (location) {
      message += `📍 ${location}\n`;
    }

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

    // Add calendar links
    message += `\n📅 Add to your calendar:\n`;
    message += `• Google Calendar: ${googleCalendarUrl}\n`;
    message += `• Download .ics file: ${icsDownloadUrl}\n`;

    message += `\nLooking forward to seeing you there!\n\n`;
    message += `---\nSent via Social Organizer`;

    return message;
  };

  const generateEmailUrl = (subject: string, body: string, email?: string) => {
    const params = new URLSearchParams({
      subject: subject,
      body: body
    });
    
    const baseUrl = email ? `mailto:${email}` : 'mailto:';
    return `${baseUrl}?${params.toString()}`;
  };

  const copyEmailToClipboard = async () => {
    try {
      const fullEmail = `Subject: ${emailSubject}\n\n${emailMessage}`;
      await navigator.clipboard.writeText(fullEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy email to clipboard');
    }
  };

  const openEmail = (email?: string) => {
    const url = generateEmailUrl(emailSubject, emailMessage, email);
    window.open(url, '_blank');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!instance) return <ErrorMessage message="Activity instance not found" />;

  const { date, time } = formatDateTime(instance.datetime);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/activities" className="hover:text-gray-700">
            Activity Templates
          </Link>
          <ArrowRight className="h-3 w-3" />
          <Link href={`/templates/${instance.activity.id}/events`} className="hover:text-gray-700">
            {instance.activity.name}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span>Event Details</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          Event Ready!
        </h1>
        <p className="text-gray-600 mt-1">Send invites and add to calendars</p>
      </div>

      {/* Template Connection */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Created from template:</p>
                <Link 
                  href={`/templates/${instance.activity.id}/events`}
                  className="font-medium text-slate-900 hover:text-slate-700 flex items-center"
                >
                  {instance.activity.name}
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 text-xs">
                    Template
                  </Badge>
                </Link>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/templates/${instance.activity.id}/events`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </Link>
              <Link href={`/schedule?template=${instance.activity.id}`}>
                <Button size="sm">
                  Create Another Event
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Summary Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div>
                {/* Custom Event Title - Primary */}
                <CardTitle className="text-xl font-bold text-blue-900 mb-2">
                  {instance.customTitle || instance.activity.name}
                </CardTitle>
                
                {/* Template Reference - Secondary */}
                <div className="flex items-center text-sm text-blue-600 mb-2">
                  <span>Template: {instance.activity.name}</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    Event
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">{date}</div>
                  <div className="text-sm text-gray-600">{time}</div>
                </div>
              </div>

              {/* Rich Location */}
              {(instance.venue || instance.address || instance.location) && (
                <div className="space-y-2">
                  {instance.venue && (
                    <div className="flex items-center text-gray-900">
                      <MapPin className="h-4 w-4 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium">{instance.venue}</div>
                        {instance.venueType && (
                          <Badge variant="outline" className="text-xs mt-1 border-green-300 text-green-700">
                            {instance.venueType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(instance.address || instance.city || instance.state) && (
                    <div className="flex items-start text-gray-700 ml-7">
                      <div className="text-sm">
                        {instance.address && <div>{instance.address}</div>}
                        {(instance.city || instance.state || instance.zipCode) && (
                          <div>
                            {[instance.city, instance.state, instance.zipCode].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!instance.venue && !instance.address && instance.location && (
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-3 text-green-600" />
                      <span>{instance.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info */}
              {instance.contactInfo && (
                <div className="flex items-center text-gray-700">
                  <MessageCircle className="h-4 w-4 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">Contact Info</div>
                    <div className="text-sm text-gray-600">{instance.contactInfo}</div>
                  </div>
                </div>
              )}

              {/* Capacity & Pricing */}
              <div className="flex flex-wrap gap-3">
                {instance.capacity && (
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="text-sm">Max {instance.capacity} people</span>
                  </div>
                )}
                {instance.priceInfo && (
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {instance.priceInfo}
                  </Badge>
                )}
              </div>

              {/* Participants */}
              <div className="flex items-start text-gray-700">
                <Users className="h-4 w-4 mr-3 mt-1 text-purple-600" />
                <div>
                  <div className="font-medium">{(instance?.participations?.length ?? 0)} participants invited</div>
                  <div className="text-sm text-gray-600">
                    {(instance?.participations ?? []).map(p => p?.friend?.name).filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>

              {/* Rich Description */}
              {(instance.detailedDescription || instance.activity.description) && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="font-medium text-gray-900 mb-1">About This Event</div>
                  <p className="text-sm text-gray-700">
                    {instance.detailedDescription || instance.activity.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {instance.requirements && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="font-medium text-amber-900 mb-1">What to Bring/Know</div>
                  <p className="text-sm text-amber-800">{instance.requirements}</p>
                </div>
              )}

              {/* Values */}
              {(instance?.activity?.values?.length ?? 0) > 0 && (
                <div className="flex items-start text-gray-700">
                  <Heart className="h-4 w-4 mr-3 mt-1 text-red-600" />
                  <div>
                    <div className="font-medium">Core Values (from template)</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(instance?.activity?.values ?? []).map((av) => (
                        <Badge key={av?.value?.id} variant="outline">
                          {av?.value?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(instance?.participations ?? []).map((participation) => (
                  <div
                    key={participation?.friend?.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {participation?.friend?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {participation?.friend?.phone}
                        {participation?.friend?.email && (
                          <div className="text-blue-600">{participation?.friend?.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => openWhatsApp(participation?.friend?.phone)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                      {participation?.friend?.email && (
                        <Button
                          size="sm"
                          onClick={() => openEmail(participation?.friend?.email!)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Calendar Integration */}
          <CalendarIntegration 
            instanceId={instance.id}
            activityName={instance.customTitle || instance.activity.name}
          />

          {/* WhatsApp Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                WhatsApp Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Personalized invite message:
                </label>
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    {copied ? (
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
                  <Button 
                    onClick={() => openWhatsApp()} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Quick Actions:</h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Copy message and paste in your WhatsApp groups</li>
                  <li>Use individual WhatsApp buttons above for direct messages</li>
                  <li>Add to your calendar so you don't forget</li>
                  <li>Edit the message before sending if needed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Email Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                Email Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Subject:
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email message with calendar links:
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button onClick={copyEmailToClipboard} variant="outline" className="flex-1">
                    {emailCopied ? (
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
                  <Button 
                    onClick={() => openEmail()} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Click individual Email buttons above for friends with email addresses</li>
                  <li>Use the Email button to compose a message manually</li>
                  <li>Copy the email content to paste into your email client</li>
                  <li>Calendar links are included for easy event saving</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/schedule?template=${instance.activity.id}`} className="block">
                <Button className="w-full" variant="outline">
                  Create Another Event from Template
                </Button>
              </Link>
              <Link href={`/templates/${instance.activity.id}/events`} className="block">
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Template Events
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
