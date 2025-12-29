
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const fullInstructions = `
1. Suggest 3-4 diverse, REAL, CONCRETE event options matching the request happening around \${today}.
2. \${enableGoogleSearch ? 'Use Google Search to verify if events are actually happening.' : 'Since search is disabled, provide realistic suggestions based on your knowledge base.'} Do not hallucinate.
3. CRITICAL: You MUST provide a valid 'url' for EVERY event found. Use the link from the Google Search result.
4. Prioritize saved locations/activities if relevant.
5. LOCATION SELECTION LOGIC:
   - If the user specifies a location in the request, use that.
   - If the request implies TRAVEL (flight, holiday, getaway), treat 'HOME / ORIGIN' as the DEPARTURE point.
   - If the request implies LOCAL NATURE (hiking, walks), use 'HOME / ORIGIN'.
   - If the request implies URBAN SOCIALIZING (dinner, theatre, cinema), use 'SOCIAL HUB' unless stated otherwise.
`;

    // Note: The above string has template variables which won't be interpolated here in JS, 
    // but we want the LITERAL text in the DB so the user can verify/edit it.
    // HOWEVER, the backend code `route.ts` executes this prompt.
    // If I put literal `${today}` in the DB, `route.ts` will inject it?
    // `route.ts` logic: `const prompt = ... ${instructions} ...`.
    // It effectively injects the string. It does NOT recursively interpolate.
    // So if DB has "${today}", the AI receives "${today}" literally.
    // This is BAD. The AI needs the DATE.

    // FIX: The `defaultInstructions` in `route.ts` uses backticks so it Interpolates `today` at runtime.
    // If the user puts a custom prompt in DB, they can't easily use dynamic variables unless I support it.
    // The user JUST wants to see the text.
    // I should provide the TEXT without the dynamic variables, or hardcode them?
    // `happening around the current date`.
    // `Use Google Search...` (Hardcoded enabled?)

    const staticInstructions = `
1. Suggest 3-4 diverse, REAL, CONCRETE event options matching the request happening around the Current Date.
2. Use Google Search to verify if events are actually happening. Do not hallucinate.
3. CRITICAL: You MUST provide a valid 'url' for EVERY event found. Use the link from the Google Search result.
4. Prioritize saved locations/activities if relevant.
5. LOCATION SELECTION LOGIC:
   - If the user specifies a location in the request, use that.
   - If the request implies TRAVEL (flight, holiday, getaway), treat 'HOME / ORIGIN' as the DEPARTURE point.
   - If the request implies LOCAL NATURE (hiking, walks), use 'HOME / ORIGIN'.
   - If the request implies URBAN SOCIALIZING (dinner, theatre, cinema), use 'SOCIAL HUB' unless stated otherwise.
`;

    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        const prefs = (typeof user.preferences === 'object' && user.preferences) ? user.preferences : {};

        // Update systemPrompt
        const newPrefs = {
            ...prefs,
            systemPrompt: staticInstructions.trim()
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
