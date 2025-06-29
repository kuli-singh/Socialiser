
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Download, ExternalLink, Smartphone } from 'lucide-react';

interface CalendarIntegrationProps {
  instanceId: string;
  activityName: string;
}

export function CalendarIntegration({ instanceId, activityName }: CalendarIntegrationProps) {
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [openingGoogle, setOpeningGoogle] = useState(false);

  const handleDownloadIcs = async () => {
    setDownloadingIcs(true);
    try {
      const response = await fetch(`/api/calendar/${instanceId}`);
      if (!response.ok) throw new Error('Failed to generate calendar file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activityName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download calendar file');
    } finally {
      setDownloadingIcs(false);
    }
  };

  const handleGoogleCalendar = async () => {
    setOpeningGoogle(true);
    try {
      const response = await fetch(`/api/calendar/google/${instanceId}`);
      if (!response.ok) throw new Error('Failed to generate Google Calendar URL');
      
      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      alert('Failed to open Google Calendar');
    } finally {
      setOpeningGoogle(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Add to Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Save this event to your calendar so you don't forget!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Google Calendar */}
          <Button
            onClick={handleGoogleCalendar}
            disabled={openingGoogle}
            className="h-auto py-3 px-4 bg-blue-600 hover:bg-blue-700"
          >
            <div className="flex items-center justify-center w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Google Calendar</div>
                <div className="text-xs opacity-90">Opens in new tab</div>
              </div>
            </div>
          </Button>

          {/* Download ICS */}
          <Button
            onClick={handleDownloadIcs}
            disabled={downloadingIcs}
            variant="outline"
            className="h-auto py-3 px-4"
          >
            <div className="flex items-center justify-center w-full">
              <Download className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Download .ics</div>
                <div className="text-xs text-gray-600">Apple, Outlook, etc.</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Smartphone className="h-4 w-4 mr-1" />
            How to use:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li><strong>Google Calendar:</strong> Opens directly in your browser</li>
            <li><strong>Download .ics:</strong> Works with Apple Calendar, Outlook, and most calendar apps</li>
            <li>The event includes all details, participants, and your core values</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
