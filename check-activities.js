
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkActivities() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking activities in database...');
    
    const activities = await prisma.activity.findMany({
      include: {
        values: {
          include: {
            value: true
          }
        },
        _count: {
          select: {
            instances: true
          }
        }
      }
    });
    
    console.log(`Found ${activities.length} activities:`);
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.name} (${activity.values.length} values, ${activity._count.instances} instances)`);
    });
    
    // Also check users
    const users = await prisma.user.findMany();
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name})`);
    });
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();
