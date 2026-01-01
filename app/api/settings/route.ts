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
            select: {
                name: true,
                preferences: true,
                googleApiKey: true,
                isAdmin: true
            }
        });

        const isAdmin = user?.isAdmin || false;

        // Base response with user-specific settings
        const response: any = {
            ...(user?.preferences as object || {}),
            name: user?.name || '',
            isAdmin,
            hasApiKey: !!user?.googleApiKey
        };

        // Only return sensitive/global config if Admin
        if (!isAdmin) {
            // Non-admins don't see the API key presence status for the *system* here, 
            // but if they had one stored personally it would be visible. 
            // However, strictly hiding the global key.
            // We can strip out global preferences from the returned object if we want strictly clean output,
            // but UI hiding is the primary mechanism.
            // Crucially, we do NOT return the actual API key value (though the original code didn't either, just masked).
            delete response.systemPrompt;
            delete response.preferredModel;
            delete response.enableGoogleSearch;
        }

        return NextResponse.json(response);
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

        // Check if user is admin
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true }
        });
        const isAdmin = currentUser?.isAdmin || false;

        const data = await request.json();
        let { name, defaultLocation, socialLocation, systemPrompt, preferredModel, enableGoogleSearch, googleApiKey } = data;

        // Define update data object
        const updateData: any = {
            name: name || undefined, // Allow updating name
            preferences: {
                // Always preserve existing preferences, merge new ones
                // We'll need to fetch existing prefs if we want to be purely additive, 
                // but Prisma's update on JSON replaces the whole object usually unless deep merge.
                // Simpler: We construct the new object based on role.
            }
        };

        // fetch current preferences to merge
        const currentPrefs = (await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferences: true }
        }))?.preferences as any || {};

        // 1. User-Specific Fields (Allowed for Everyone)
        const newPreferences = {
            ...currentPrefs,
            defaultLocation: defaultLocation !== undefined ? defaultLocation : currentPrefs.defaultLocation,
            socialLocation: socialLocation !== undefined ? socialLocation : currentPrefs.socialLocation,
        };

        // 2. Admin-Only Fields
        if (isAdmin) {
            // API Key
            if (googleApiKey !== undefined) {
                // Only update if provided (empty string clears it)
                updateData.googleApiKey = googleApiKey;
            }

            // Global AI Prefs
            if (systemPrompt !== undefined) newPreferences.systemPrompt = systemPrompt;
            if (preferredModel !== undefined) newPreferences.preferredModel = preferredModel;
            if (enableGoogleSearch !== undefined) newPreferences.enableGoogleSearch = enableGoogleSearch;
        }

        updateData.preferences = newPreferences;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                name: true,
                preferences: true,
                isAdmin: true,
                googleApiKey: true
            }
        });

        return NextResponse.json({
            ...(updatedUser.preferences as object),
            name: updatedUser.name,
            isAdmin: updatedUser.isAdmin,
            hasApiKey: !!updatedUser.googleApiKey
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
