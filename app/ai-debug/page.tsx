
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/loading-spinner';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Send,
  RefreshCw,
  Zap
} from 'lucide-react';

interface DebugResults {
  timestamp: string;
  tests: {
    [key: string]: {
      status: 'PASS' | 'FAIL' | 'ERROR' | 'INFO' | 'SKIP';
      message: string;
      data?: any;
      error?: string;
      stack?: string;
    };
  };
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

interface ManualTestResult {
  success?: boolean;
  error?: string;
  testMessage?: string;
  aiResponse?: string;
  usage?: any;
  timestamp?: string;
  status?: number;
  statusText?: string;
  body?: string;
}

export default function AIDebugPage() {
  const [debugResults, setDebugResults] = useState<DebugResults | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [manualTestMessage, setManualTestMessage] = useState('');
  const [manualTestResult, setManualTestResult] = useState<ManualTestResult | null>(null);
  const [isRunningManualTest, setIsRunningManualTest] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runDiagnostics = async () => {
    console.log('[AI-DEBUG] Starting diagnostic tests');
    setIsRunningTests(true);
    setDebugResults(null);

    try {
      const response = await fetch('/api/debug-ai', {
        method: 'GET',
      });

      console.log('[AI-DEBUG] Diagnostics response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Diagnostics failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      console.log('[AI-DEBUG] Diagnostics results:', results);
      setDebugResults(results);
    } catch (error) {
      console.error('[AI-DEBUG] Diagnostics error:', error);
      setDebugResults({
        timestamp: new Date().toISOString(),
        tests: {
          diagnostics: {
            status: 'ERROR',
            message: 'Failed to run diagnostics',
            error: error instanceof Error ? error.message : String(error)
          }
        },
        summary: { passed: 0, failed: 1, total: 1 }
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const runManualTest = async () => {
    if (!manualTestMessage.trim()) return;

    console.log('[AI-DEBUG] Starting manual test:', manualTestMessage);
    setIsRunningManualTest(true);
    setManualTestResult(null);

    try {
      const response = await fetch('/api/debug-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMessage: manualTestMessage
        }),
      });

      console.log('[AI-DEBUG] Manual test response:', response.status, response.statusText);

      const result = await response.json();
      console.log('[AI-DEBUG] Manual test result:', result);
      setManualTestResult(result);
    } catch (error) {
      console.error('[AI-DEBUG] Manual test error:', error);
      setManualTestResult({
        error: `Network error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunningManualTest(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'SKIP':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PASS: 'default',
      FAIL: 'destructive',
      ERROR: 'destructive',
      INFO: 'secondary',
      SKIP: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">AI Functionality Debug Console</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This page helps diagnose AI functionality issues. Use the automated tests to check system status 
          and the manual test to directly test AI responses.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="diagnostics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagnostics">Automated Diagnostics</TabsTrigger>
          <TabsTrigger value="manual">Manual Test</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Diagnostics
                <Button 
                  onClick={runDiagnostics} 
                  disabled={isRunningTests}
                  className="ml-4"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Diagnostics
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugResults ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <strong>Test Summary:</strong> {debugResults.summary.passed} passed, {debugResults.summary.failed} failed 
                      of {debugResults.summary.total} total tests
                    </div>
                    <div className="text-xs text-gray-500">
                      Run at: {new Date(debugResults.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="space-y-3">
                    {Object.entries(debugResults.tests).map(([testName, result]) => (
                      <Card key={testName}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(result.status)}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
                                  {getStatusBadge(result.status)}
                                </div>
                                <p className="text-sm text-gray-600">{result.message}</p>
                              </div>
                            </div>
                          </div>

                          {result.data && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                              <strong>Data:</strong>
                              <pre className="mt-1 overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                          )}

                          {result.error && (
                            <div className="mt-3 p-3 bg-red-50 text-red-800 rounded text-xs">
                              <strong>Error:</strong> {result.error}
                            </div>
                          )}

                          {result.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {result.stack}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Run Diagnostics" to test AI system components
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual AI Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={manualTestMessage}
                  onChange={(e) => setManualTestMessage(e.target.value)}
                  placeholder="Enter a test message for the AI (e.g., 'Find me a cooking class in San Francisco')"
                  disabled={isRunningManualTest}
                  onKeyPress={(e) => e.key === 'Enter' && runManualTest()}
                />
                <Button 
                  onClick={runManualTest} 
                  disabled={isRunningManualTest || !manualTestMessage.trim()}
                >
                  {isRunningManualTest ? (
                    <LoadingSpinner />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {manualTestResult && (
                <Card>
                  <CardContent className="p-4">
                    {manualTestResult.success ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <h4 className="font-semibold text-green-700">Test Successful!</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <strong>Your message:</strong> {manualTestResult.testMessage}
                          </div>
                          <div>
                            <strong>AI Response:</strong>
                            <div className="mt-1 p-3 bg-blue-50 rounded">
                              {manualTestResult.aiResponse}
                            </div>
                          </div>
                          {manualTestResult.usage && (
                            <div>
                              <strong>Usage:</strong>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                                {JSON.stringify(manualTestResult.usage, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <h4 className="font-semibold text-red-700">Test Failed</h4>
                        </div>
                        
                        <div className="text-red-600">
                          <strong>Error:</strong> {manualTestResult.error}
                        </div>

                        {manualTestResult.status && (
                          <div>
                            <strong>HTTP Status:</strong> {manualTestResult.status} {manualTestResult.statusText}
                          </div>
                        )}

                        {manualTestResult.body && (
                          <div>
                            <strong>Response Body:</strong>
                            <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                              {manualTestResult.body}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Tested at: {manualTestResult.timestamp ? new Date(manualTestResult.timestamp).toLocaleString() : 'Unknown'}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Debug logs are printed to the browser console. Open Developer Tools (F12) and check the Console tab
                  to see detailed logs from both frontend and backend operations.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2 text-sm">
                <h4 className="font-semibold">What to look for in console logs:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><code>[AI-CHAT DEBUG]</code> - Backend API processing steps</li>
                  <li><code>[AI-CHAT FRONTEND]</code> - Frontend API calls and responses</li>
                  <li><code>[AI-DEBUG]</code> - Debug page operations</li>
                  <li>API key validation results</li>
                  <li>LLM API request/response details</li>
                  <li>Error stack traces and detailed error messages</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
