
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEventData() {
    try {
        // Get the most recent ActivityInstance
        const instance = await prisma.activityInstance.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                participations: {
                    include: {
                        friend: true
                    }
                }
            }
        });

        if (!instance) {
            console.log('No activity instances found.');
            return;
        }

        console.log(`Checking Event ID: ${instance.id}`);
        console.log(`Title: ${instance.customTitle || 'Untitled'}`);
        console.log(`Allow External Guests: ${instance.allowExternalGuests}`);
        console.log(`Participation Count: ${instance.participations.length}`);

        if (instance.participations.length > 0) {
            console.log('Invited Friends:');
            instance.participations.forEach(p => {
                console.log(` - ${p.friend.name} (Friend ID: ${p.friendId})`);
            });
        } else {
            console.log('NO invited friends found for this event. The dropdown will NOT appear.');
        }

    } catch (error) {
        console.error('Error checking event data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkEventData();
