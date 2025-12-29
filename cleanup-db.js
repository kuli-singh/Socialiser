
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    const result = await prisma.activityInstance.updateMany({
        where: {
            OR: [
                { venueType: 'undefined' },
                { priceInfo: 'undefined' },
                { customTitle: 'undefined' },
                { venue: 'undefined' },
                { address: 'undefined' },
                { city: 'undefined' },
                { state: 'undefined' },
                { zipCode: 'undefined' },
                { detailedDescription: 'undefined' },
                { requirements: 'undefined' },
                { contactInfo: 'undefined' },
                { eventUrl: 'undefined' }
            ]
        },
        data: {
            venueType: null,
            priceInfo: null,
            customTitle: null,
            venue: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            detailedDescription: null,
            requirements: null,
            contactInfo: null,
            eventUrl: null
        }
    });
    console.log('Cleaned:', result.count);
}

clean()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
