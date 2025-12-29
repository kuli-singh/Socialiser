
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return null;
    }
    return session.user;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                preferences: true,
                googleApiKey: true
            }
        });

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return masked API key info
        return NextResponse.json({
            preferences: userData.preferences || {},
            hasApiKey: !!userData.googleApiKey,
            // For masking, we could return a placeholder if set
            maskedApiKey: userData.googleApiKey ? '••••••••' : ''
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { googleApiKey, preferences } = body;

        const updateData: any = {};
        if (preferences) updateData.preferences = preferences;

        // Only encrypt and save if a new key is provided
        if (googleApiKey && googleApiKey !== '••••••••') {
            updateData.googleApiKey = encrypt(googleApiKey);
        } else if (googleApiKey === '') {
            // Allow clearing the key
            updateData.googleApiKey = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            hasApiKey: !!updatedUser.googleApiKey
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
