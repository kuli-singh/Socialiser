
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register')) {
          return true;
        }
        
        // Allow access to public event pages without token
        if (req.nextUrl.pathname.startsWith('/event/') ||
            req.nextUrl.pathname.startsWith('/api/public-events/')) {
          return true;
        }
        
        // For all other protected routes, require token
        // Temporarily allow access to activities page and API for testing
        if (req.nextUrl.pathname.startsWith('/activities') ||
            req.nextUrl.pathname.startsWith('/api/activities')) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - samples (sample CSV files)
     * - test-activities.html (test page)
     * - auto-login.html (test page)
     */
    '/((?!api/auth|api/test-activities|_next/static|_next/image|favicon.ico|samples|test-activities.html|auto-login.html|simple-login.html).*)',
  ],
};
