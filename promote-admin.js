
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    // Promote the first user found (or all, since user implied only they exist/should be admin)
    // But safer to just promote the one user if there is only one.
    // The user said "There's one user in the user table and that's me".

    const user = users[0];
    console.log(`Promoting user ${user.email} (${user.id}) to Admin...`);

    await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
    });

    console.log('User promoted successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
