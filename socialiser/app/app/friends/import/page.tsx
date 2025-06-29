
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  ArrowLeft,
  Users,
  Eye
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duplicates: Array<{
    row: number;
    name: string;
    reason: string;
  }>;
  importedFriends: Array<{
    name: string;
    phone: string;
    group: string | null;
  }>;
}

interface PreviewData {
  headers: string[];
  rows: any[];
}

export default function ImportFriendsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(file);
      setImportResult(null);
      setPreviewData(null);
      setShowPreview(false);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1, 6).map(line => // Show first 5 rows
            line.split(',').map(cell => cell.trim())
          );
          setPreviewData({ headers, rows });
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/friends/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
      setShowPreview(false);

    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/friends">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Friends
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Friends</h1>
              <p className="text-gray-600 mt-1">Upload a CSV file to bulk import your friends</p>
            </div>
          </div>
        </div>
        <Link href="/samples/friends-sample.csv" download>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Sample
          </Button>
        </Link>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600">
              Your CSV file should contain the following columns:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm">name,phone,group</code>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>name</strong> and <strong>phone</strong> are required fields</li>
              <li><strong>group</strong> is optional - leave empty if no group</li>
              <li>Phone numbers can be in any format (will be validated)</li>
              <li>Duplicates will be detected and skipped</li>
              <li>Maximum file size: 2MB</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Select CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-gray-600 mb-4">
              Supports CSV files up to 2MB
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedFile.name}</p>
                    <p className="text-sm text-green-700">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {previewData && (
                    <Button variant="outline" size="sm" onClick={togglePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Hide' : 'Preview'}
                    </Button>
                  )}
                  <Button 
                    onClick={handleImport} 
                    disabled={isUploading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Import Friends
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>File Preview (First 5 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {previewData.headers.map((header, index) => (
                      <th key={index} className="border border-gray-300 px-3 py-2 text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="font-medium">Importing friends...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.totalRows}
                </div>
                <p className="text-sm text-gray-600">Total Rows</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.successfulImports}
                </div>
                <p className="text-sm text-gray-600">Imported</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {importResult.duplicates.length}
                </div>
                <p className="text-sm text-gray-600">Duplicates</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </div>
                <p className="text-sm text-gray-600">Errors</p>
              </div>
            </div>

            {/* Success Message */}
            {importResult.successfulImports > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importResult.successfulImports} friends! 
                  <Link href="/friends" className="ml-2 underline font-medium">
                    View your friends list
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Imported Friends */}
            {importResult.importedFriends.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-700 mb-3">
                  Successfully Imported ({importResult.importedFriends.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importResult.importedFriends.map((friend, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <span className="font-medium">{friend.name}</span>
                        <span className="text-gray-600 ml-2">{friend.phone}</span>
                      </div>
                      {friend.group && (
                        <Badge variant="secondary">{friend.group}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Duplicates */}
            {importResult.duplicates.length > 0 && (
              <div>
                <h3 className="font-semibold text-orange-700 mb-3">
                  Duplicates Skipped ({importResult.duplicates.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importResult.duplicates.map((duplicate, index) => (
                    <div key={index} className="p-2 bg-orange-50 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Row {duplicate.row}: {duplicate.name}</span>
                      </div>
                      <p className="text-sm text-orange-700 ml-6">{duplicate.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-3">
                  Errors ({importResult.errors.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Row {error.row}</span>
                      </div>
                      <p className="text-sm text-red-700 ml-6">{error.error}</p>
                      <div className="text-xs text-gray-600 ml-6 mt-1">
                        Data: {JSON.stringify(error.data)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedFile(null);
                  setImportResult(null);
                  setPreviewData(null);
                  setShowPreview(false);
                }}
              >
                Import Another File
              </Button>
              <Link href="/friends">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  View Friends List
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
