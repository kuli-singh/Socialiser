
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillGuestPolicy() {
    try {
        console.log('Starting backfill for allowExternalGuests...');

        // Update all ActivityInstances to allowExternalGuests = true
        const result = await prisma.activityInstance.updateMany({
            data: {
                allowExternalGuests: true
            }
        });

        console.log(`Updated ${result.count} events to allow external guests.`);

        // Check specific event data again to debug the dropdown issue
        const recentEvents = await prisma.activityInstance.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                participations: true
            }
        });

        console.log('\n--- Recent Events Debug ---');
        recentEvents.forEach(event => {
            console.log(`Event: ${event.customTitle || event.id}`);
            console.log(`  - Allow Guests: ${event.allowExternalGuests}`);
            console.log(`  - Invited Friends Count: ${event.participations.length}`);
            if (event.participations.length === 0) {
                console.log('  -> WARNING: No invited friends. Dropdown will NOT appear.');
            }
        });

    } catch (error) {
        console.error('Error in backfill:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillGuestPolicy();
