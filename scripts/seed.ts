
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test user first
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
    },
  });

  console.log(`Created test user: ${testUser.email}`);

  // Create Core Values
  const values = await Promise.all([
    prisma.coreValue.create({
      data: {
        name: 'Family Time',
        description: 'Spending quality time with family members',
        userId: testUser.id
      }
    }),
    prisma.coreValue.create({
      data: {
        name: 'Physical Health',
        description: 'Activities that promote physical wellness and fitness',
        userId: testUser.id
      }
    }),
    prisma.coreValue.create({
      data: {
        name: 'Learning',
        description: 'Educational and skill-building activities',
        userId: testUser.id
      }
    }),
    prisma.coreValue.create({
      data: {
        name: 'Community',
        description: 'Building connections and helping others',
        userId: testUser.id
      }
    }),
    prisma.coreValue.create({
      data: {
        name: 'Creativity',
        description: 'Artistic and creative expression',
        userId: testUser.id
      }
    }),
    prisma.coreValue.create({
      data: {
        name: 'Adventure',
        description: 'Exploring new places and experiences',
        userId: testUser.id
      }
    })
  ]);

  console.log('Created core values:', values.length);

  // Create Friends
  const friends = await Promise.all([
    prisma.friend.create({
      data: {
        name: 'Sarah Johnson',
        phone: '000',
        group: 'Close Friends',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Mike Chen',
        phone: '000',
        group: 'Work Friends',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Emily Rodriguez',
        phone: '000',
        group: 'Close Friends',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'David Kim',
        phone: '000',
        group: 'Gym Buddies',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Lisa Thompson',
        phone: '000',
        group: 'Book Club',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Alex Morgan',
        phone: '000',
        group: 'Neighbors',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Rachel Green',
        phone: '000',
        group: 'College Friends',
        userId: testUser.id
      }
    }),
    prisma.friend.create({
      data: {
        name: 'Tom Wilson',
        phone: '000',
        group: 'Family',
        userId: testUser.id
      }
    })
  ]);

  console.log('Created friends:', friends.length);

  // Create Activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        name: 'Morning Hike',
        description: 'A refreshing hike to start the day with nature and exercise',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Book Club Meeting',
        description: 'Monthly discussion about our current book selection',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Cooking Class',
        description: 'Learn new recipes and cooking techniques together',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Board Game Night',
        description: 'Fun evening playing various board games and socializing',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Volunteer at Food Bank',
        description: 'Help sort and distribute food to those in need',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Art Workshop',
        description: 'Creative painting and drawing session',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Beach Trip',
        description: 'Day trip to the beach for swimming and relaxation',
        userId: testUser.id
      }
    }),
    prisma.activity.create({
      data: {
        name: 'Fitness Bootcamp',
        description: 'High-intensity group workout session',
        userId: testUser.id
      }
    })
  ]);

  console.log('Created activities:', activities.length);

  // Create Activity-Value relationships
  const activityValues = await Promise.all([
    // Morning Hike - Physical Health, Adventure
    prisma.activityValue.create({
      data: {
        activityId: activities[0].id,
        valueId: values[1].id // Physical Health
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[0].id,
        valueId: values[5].id // Adventure
      }
    }),
    // Book Club - Learning, Community
    prisma.activityValue.create({
      data: {
        activityId: activities[1].id,
        valueId: values[2].id // Learning
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[1].id,
        valueId: values[3].id // Community
      }
    }),
    // Cooking Class - Learning, Creativity
    prisma.activityValue.create({
      data: {
        activityId: activities[2].id,
        valueId: values[2].id // Learning
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[2].id,
        valueId: values[4].id // Creativity
      }
    }),
    // Board Game Night - Family Time, Community
    prisma.activityValue.create({
      data: {
        activityId: activities[3].id,
        valueId: values[0].id // Family Time
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[3].id,
        valueId: values[3].id // Community
      }
    }),
    // Volunteer at Food Bank - Community
    prisma.activityValue.create({
      data: {
        activityId: activities[4].id,
        valueId: values[3].id // Community
      }
    }),
    // Art Workshop - Creativity, Learning
    prisma.activityValue.create({
      data: {
        activityId: activities[5].id,
        valueId: values[4].id // Creativity
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[5].id,
        valueId: values[2].id // Learning
      }
    }),
    // Beach Trip - Adventure, Physical Health
    prisma.activityValue.create({
      data: {
        activityId: activities[6].id,
        valueId: values[5].id // Adventure
      }
    }),
    prisma.activityValue.create({
      data: {
        activityId: activities[6].id,
        valueId: values[1].id // Physical Health
      }
    }),
    // Fitness Bootcamp - Physical Health
    prisma.activityValue.create({
      data: {
        activityId: activities[7].id,
        valueId: values[1].id // Physical Health
      }
    })
  ]);

  console.log('Created activity-value relationships:', activityValues.length);

  // Create Activity Instances (some in the future for upcoming activities)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const instances = await Promise.all([
    // Upcoming instances
    prisma.activityInstance.create({
      data: {
        datetime: tomorrow,
        location: 'Sunrise Trail Park',
        activityId: activities[0].id, // Morning Hike
        userId: testUser.id
      }
    }),
    prisma.activityInstance.create({
      data: {
        datetime: nextWeek,
        location: 'Community Center Room 5',
        activityId: activities[1].id, // Book Club Meeting
        userId: testUser.id
      }
    }),
    prisma.activityInstance.create({
      data: {
        datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        location: 'Culinary Arts Studio',
        activityId: activities[2].id, // Cooking Class
        userId: testUser.id
      }
    }),
    prisma.activityInstance.create({
      data: {
        datetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'Sarah\'s House',
        activityId: activities[3].id, // Board Game Night
        userId: testUser.id
      }
    }),
    prisma.activityInstance.create({
      data: {
        datetime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        location: 'Downtown Food Bank',
        activityId: activities[4].id, // Volunteer at Food Bank
        userId: testUser.id
      }
    }),
    prisma.activityInstance.create({
      data: {
        datetime: nextMonth,
        location: 'Malibu Beach',
        activityId: activities[6].id, // Beach Trip
        userId: testUser.id
      }
    })
  ]);

  console.log('Created activity instances:', instances.length);

  // Create Participations
  const participations = await Promise.all([
    // Morning Hike - Sarah, David, Alex
    prisma.participation.create({
      data: {
        friendId: friends[0].id, // Sarah
        activityInstanceId: instances[0].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[3].id, // David
        activityInstanceId: instances[0].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[5].id, // Alex
        activityInstanceId: instances[0].id,
        userId: testUser.id
      }
    }),
    // Book Club - Lisa, Emily, Rachel
    prisma.participation.create({
      data: {
        friendId: friends[4].id, // Lisa
        activityInstanceId: instances[1].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[2].id, // Emily
        activityInstanceId: instances[1].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[6].id, // Rachel
        activityInstanceId: instances[1].id,
        userId: testUser.id
      }
    }),
    // Cooking Class - Mike, Sarah
    prisma.participation.create({
      data: {
        friendId: friends[1].id, // Mike
        activityInstanceId: instances[2].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[0].id, // Sarah
        activityInstanceId: instances[2].id,
        userId: testUser.id
      }
    }),
    // Board Game Night - Tom, Emily, Alex, Rachel
    prisma.participation.create({
      data: {
        friendId: friends[7].id, // Tom
        activityInstanceId: instances[3].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[2].id, // Emily
        activityInstanceId: instances[3].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[5].id, // Alex
        activityInstanceId: instances[3].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[6].id, // Rachel
        activityInstanceId: instances[3].id,
        userId: testUser.id
      }
    }),
    // Volunteer - Mike, Lisa, Sarah
    prisma.participation.create({
      data: {
        friendId: friends[1].id, // Mike
        activityInstanceId: instances[4].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[4].id, // Lisa
        activityInstanceId: instances[4].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[0].id, // Sarah
        activityInstanceId: instances[4].id,
        userId: testUser.id
      }
    }),
    // Beach Trip - David, Alex, Emily, Tom
    prisma.participation.create({
      data: {
        friendId: friends[3].id, // David
        activityInstanceId: instances[5].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[5].id, // Alex
        activityInstanceId: instances[5].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[2].id, // Emily
        activityInstanceId: instances[5].id,
        userId: testUser.id
      }
    }),
    prisma.participation.create({
      data: {
        friendId: friends[7].id, // Tom
        activityInstanceId: instances[5].id,
        userId: testUser.id
      }
    })
  ]);

  console.log('Created participations:', participations.length);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
