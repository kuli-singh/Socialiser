
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    const user = users[0];
    console.log(`Checking user: ${user.email} (${user.id})`);
    console.log('DB isAdmin value:', user.isAdmin);

    // Simulate API Logic
    const isAdmin = user.isAdmin || false;

    // Base response with user-specific settings
    const response = {
        ...(user.preferences || {}),
        name: user.name || '',
        isAdmin,
        hasApiKey: !!user.googleApiKey
    };

    // Only return sensitive/global config if Admin
    if (!isAdmin) {
        delete response.systemPrompt;
        delete response.preferredModel;
        delete response.enableGoogleSearch;
        console.log("Not Admin - stripping fields");
    } else {
        console.log("Is Admin - keeping fields");
    }

    console.log('Simulated API Response:', JSON.stringify(response, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
