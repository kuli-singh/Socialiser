import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, type, address, description, website } = body;

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Ensure user owns the location
    const existingLocation = await prisma.location.findFirst({
        where: {
            id: params.id,
            userId: user.id
        }
    });

    if (!existingLocation) {
        return NextResponse.json({ error: "Location not found or unauthorized" }, { status: 404 });
    }

    const location = await prisma.location.update({
        where: { id: params.id },
        data: {
            name,
            type: type || "Venue",
            address,
            description,
            website
        }
    });

    return NextResponse.json(location);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure user owns the location
    const existingLocation = await prisma.location.findFirst({
        where: {
            id: params.id,
            userId: user.id
        }
    });

    if (!existingLocation) {
        return NextResponse.json({ error: "Location not found or unauthorized" }, { status: 404 });
    }

    await prisma.location.delete({
        where: { id: params.id }
    });

    return NextResponse.json({ success: true });
}
