import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill of inviteToken...');

    const participations = await prisma.participation.findMany({
        where: { inviteToken: null },
    });

    console.log(`Found ${participations.length} participations without inviteToken.`);

    for (const p of participations) {
        // Generate a simple unique token (UUID)
        // This satisfies the uniqueness constraint.
        const token = randomUUID();

        await prisma.participation.update({
            where: { id: p.id },
            data: { inviteToken: token },
        });
        process.stdout.write('.');
    }

    console.log('\nBackfill complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
