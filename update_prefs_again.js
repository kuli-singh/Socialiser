
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const travelLogic =
        `Location Context: (This is the user's current location/origin. If the request implies travel/flights/weekend away, treat this as the Origin, not the Destination).

If the user request implies travel (e.g. "flight", "holiday", "getaway", "short haul"), suggest destinations or travel options DEPARTING FROM the Location Context, rather than events strictly INSIDE the Location Context.`;

    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        const prefs = (typeof user.preferences === 'object' && user.preferences) ? user.preferences : {};

        // Preserve existing other prefs, just update systemPrompt
        const newPrefs = {
            ...prefs,
            systemPrompt: travelLogic
        };

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { preferences: newPrefs }
        });
        console.log(`Updated user ${user.email} (${user.id}). Prompt length: ${updated.preferences.systemPrompt.length}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
