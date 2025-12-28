import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferences: true }
        });

        return NextResponse.json(user?.preferences || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { defaultLocation, systemPrompt, preferredModel, enableGoogleSearch } = data;

        // Validate if needed, but strings are generally safe

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                preferences: {
                    defaultLocation: defaultLocation || '',
                    systemPrompt: systemPrompt || '',
                    preferredModel: preferredModel || 'gemini-flash-latest',
                    enableGoogleSearch: enableGoogleSearch !== undefined ? enableGoogleSearch : true
                }
            },
            select: { preferences: true }
        });

        return NextResponse.json(updatedUser.preferences);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
