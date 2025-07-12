
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export const dynamic = "force-dynamic";

function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AI-DEBUG ${timestamp}] ${message}`);
  if (data) {
    console.log(`[AI-DEBUG ${timestamp}] Data:`, JSON.stringify(data, null, 2));
  }
}

export async function GET(request: NextRequest) {
  debugLog("=== AI DEBUG TEST STARTED ===");
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as any,
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };

  // Test 1: Check if user is authenticated
  debugLog("Test 1: Authentication check");
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      results.tests.authentication = {
        status: 'PASS',
        message: 'User is authenticated',
        data: { userId: session.user.id, email: session.user.email }
      };
      results.summary.passed++;
    } else {
      results.tests.authentication = {
        status: 'FAIL',
        message: 'No authenticated user found',
        data: null
      };
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.authentication = {
      status: 'ERROR',
      message: 'Authentication check failed',
      error: error instanceof Error ? error.message : String(error)
    };
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 2: Check API key
  debugLog("Test 2: API key validation");
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (apiKey) {
    results.tests.apiKey = {
      status: 'PASS',
      message: 'API key is present',
      data: {
        exists: true,
        prefix: apiKey.substring(0, 8) + '...',
        length: apiKey.length
      }
    };
    results.summary.passed++;
  } else {
    results.tests.apiKey = {
      status: 'FAIL',
      message: 'ABACUSAI_API_KEY environment variable is not set',
      data: null
    };
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 3: Test basic LLM API connectivity
  debugLog("Test 3: LLM API connectivity test");
  if (apiKey) {
    try {
      debugLog("Making test request to LLM API");
      const testResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'user',
              content: 'Hello! Please respond with just "API test successful" to confirm connectivity.'
            }
          ],
          temperature: 0.1,
          max_tokens: 50,
        }),
      });

      debugLog("LLM API test response received", {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        const responseContent = testData.choices?.[0]?.message?.content || '';
        
        results.tests.llmApi = {
          status: 'PASS',
          message: 'LLM API is accessible and responding',
          data: {
            status: testResponse.status,
            responseLength: responseContent.length,
            responsePreview: responseContent.substring(0, 100),
            model: testData.model || 'unknown',
            usage: testData.usage || null
          }
        };
        results.summary.passed++;
      } else {
        const errorText = await testResponse.text();
        results.tests.llmApi = {
          status: 'FAIL',
          message: `LLM API returned error status ${testResponse.status}`,
          data: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            errorBody: errorText
          }
        };
        results.summary.failed++;
      }
    } catch (error) {
      debugLog("LLM API test failed", error);
      results.tests.llmApi = {
        status: 'ERROR',
        message: 'LLM API request failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
      results.summary.failed++;
    }
  } else {
    results.tests.llmApi = {
      status: 'SKIP',
      message: 'Skipped due to missing API key',
      data: null
    };
  }
  results.summary.total++;

  // Test 4: Environment check
  debugLog("Test 4: Environment variables check");
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT_SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    ABACUSAI_API_KEY: process.env.ABACUSAI_API_KEY ? 'SET' : 'NOT_SET'
  };

  results.tests.environment = {
    status: 'INFO',
    message: 'Environment variables status',
    data: envVars
  };
  results.summary.total++;

  debugLog("=== AI DEBUG TEST COMPLETED ===", results);

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  debugLog("=== AI DEBUG MANUAL TEST STARTED ===");
  
  try {
    const body = await request.json();
    const { testMessage } = body;
    
    if (!testMessage) {
      return NextResponse.json({
        error: 'testMessage is required',
        example: { testMessage: 'Hello AI, are you working?' }
      }, { status: 400 });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to test AI functionality'
      }, { status: 401 });
    }

    // Check API key
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key missing',
        message: 'ABACUSAI_API_KEY environment variable is not set'
      }, { status: 500 });
    }

    // Make test request
    debugLog("Making manual test request", { testMessage });
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: testMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    debugLog("Manual test response received", {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'LLM API error',
        status: response.status,
        statusText: response.statusText,
        body: errorText
      }, { status: response.status });
    }

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices?.[0]?.message?.content || '';

    debugLog("Manual test successful", { 
      responseLength: aiMessage.length,
      usage: aiResponse.usage
    });

    return NextResponse.json({
      success: true,
      testMessage,
      aiResponse: aiMessage,
      usage: aiResponse.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    debugLog("Manual test failed", error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
