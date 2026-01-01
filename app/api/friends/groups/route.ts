
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

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

        // Fetch distinct groups for the user
        // Prisma distinct query
        const groups = await prisma.friend.findMany({
            where: {
                userId: user.id,
                group: {
                    not: null
                }
            },
            select: {
                group: true
            },
            distinct: ['group'],
            orderBy: {
                group: 'asc'
            }
        });

        // Extract strings and filter out any empty strings if they exist
        const groupNames = groups
            .map(g => g.group)
            .filter((g): g is string => !!g && g.trim().length > 0);

        return NextResponse.json({ groups: groupNames });
    } catch (error) {
        console.error('Error fetching friend groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        );
    }
}
