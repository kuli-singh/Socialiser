
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkInstances() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking activity instances in database...');
    
    const instances = await prisma.activityInstance.findMany({
      include: {
        activity: true,
        participations: {
          include: {
            friend: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    });
    
    console.log(`Found ${instances.length} total instances:`);
    
    const now = new Date();
    const futureInstances = instances.filter(instance => new Date(instance.datetime) > now);
    
    console.log(`Found ${futureInstances.length} future instances:`);
    
    futureInstances.forEach((instance, index) => {
      console.log(`${index + 1}. ${instance.activity.name}`);
      console.log(`   Date: ${instance.datetime}`);
      console.log(`   Location: ${instance.location}`);
      console.log(`   Participants: ${instance.participations.length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstances();
