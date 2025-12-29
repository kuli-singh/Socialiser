
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const instances = await prisma.activityInstance.findMany({
        include: {
            activity: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 5
    });

    console.log('--- LATEST INSTANCES ---');
    instances.forEach(ins => {
        console.log(`ID: ${ins.id}`);
        console.log(`Title: ${ins.customTitle || ins.activity.name}`);
        console.log(`Venue: ${ins.venue} (Type: ${typeof ins.venue})`);
        console.log(`VenueType: ${ins.venueType} (Type: ${typeof ins.venueType})`);
        console.log(`PriceInfo: ${ins.priceInfo} (Type: ${typeof ins.priceInfo})`);
        console.log(`Location: ${ins.location} (Type: ${typeof ins.location})`);
        console.log('------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
