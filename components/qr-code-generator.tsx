
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode, Eye } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  eventTitle: string;
}

export function QRCodeGenerator({ url, eventTitle }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [url]);

  const generateQRCode = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const openEventPage = () => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 text-blue-600 mr-2" />
            QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-pulse">Generating QR code...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 text-blue-600 mr-2" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrDataUrl && (
          <div className="text-center">
            <img 
              src={qrDataUrl} 
              alt="Event QR Code" 
              className="mx-auto border border-gray-200 rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Scan to view event details and RSVP
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button onClick={downloadQRCode} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={openEventPage} variant="outline" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">How to use:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Print and post the QR code at your venue</li>
            <li>Share the image in social media or messaging apps</li>
            <li>Anyone can scan to view details and RSVP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
