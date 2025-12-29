
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USER PREFERENCES DUMP ---');
    for (const user of users) {
        console.log(`User: ${user.email} (ID: ${user.id})`);
        console.log('Preferences:', JSON.stringify(user.preferences, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
