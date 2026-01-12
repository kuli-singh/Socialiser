import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const participation = await prisma.participation.findUnique({
            where: {
                inviteToken: token
            },
            include: {
                friend: true,
                activityInstance: {
                    include: {
                        activity: {
                            include: {
                                values: {
                                    include: {
                                        value: true
                                    }
                                }
                            }
                        },
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        participations: {
                            include: {
                                friend: true
                            }
                        },
                        publicRSVPs: true
                    }
                }
            }
        });

        if (!participation) {
            return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
        }

        return NextResponse.json(participation);
    } catch (error) {
        console.error('Error fetching invite:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invite details' },
            { status: 500 }
        );
    }
}
