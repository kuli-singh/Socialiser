
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const friendId = searchParams.get('friendId');
        const rsvpId = searchParams.get('rsvpId');

        if (!friendId && !rsvpId) {
            return NextResponse.json(
                { error: 'Either friendId or rsvpId is required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const instance = await prisma.activityInstance.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            }
        });

        if (!instance) {
            return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });
        }

        // Delete Logic
        if (friendId) {
            // Unconfirm a friend (keep the participation, just delete the RSVP)
            await prisma.publicRSVP.deleteMany({
                where: {
                    activityInstanceId: params.id,
                    friendId: friendId
                }
            });
        } else if (rsvpId) {
            // Delete a specific RSVP (e.g. external guest)
            await prisma.publicRSVP.delete({
                where: {
                    id: rsvpId
                }
            });
        }

        return NextResponse.json({ message: 'RSVP removed successfully' });
    } catch (error) {
        console.error('Error removing RSVP:', error);
        return NextResponse.json(
            { error: 'Failed to remove RSVP' },
            { status: 500 }
        );
    }
}
