import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting Participations...');

    const participations = await prisma.participation.findMany({
        take: 5,
        include: {
            activityInstance: {
                select: { customTitle: true, activity: { select: { name: true } } }
            },
            friend: {
                select: { name: true }
            }
        }
    });

    if (participations.length === 0) {
        console.log('No participations found.');
    }

    for (const p of participations) {
        console.log('------------------------------------------------');
        console.log(`Event: ${p.activityInstance.customTitle || p.activityInstance.activity.name}`);
        console.log(`Friend: ${p.friend.name}`);
        console.log(`Token: ${p.inviteToken}`);
        console.log(`ID: ${p.id}`);
    }

    // Also verify detailed instance fetch (mocking the API logic)
    if (participations.length > 0) {
        const instanceId = participations[0].activityInstanceId;
        console.log('\n--- Mocking API Fetch for Instance ---');
        const instance = await prisma.activityInstance.findFirst({
            where: { id: instanceId },
            include: {
                participations: true
            }
        });
        console.log('Participations in Instance Fetch:', JSON.stringify(instance?.participations, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
