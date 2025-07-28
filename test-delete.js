
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteFunctionality() {
  try {
    console.log('🔍 Testing Activity Deletion Functionality...\n');

    // Get the test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Get all activities for the test user
    const activitiesBefore = await prisma.activity.findMany({
      where: { userId: testUser.id },
      include: {
        instances: {
          include: {
            participations: true
          }
        },
        values: true
      }
    });

    console.log(`📊 Before deletion: ${activitiesBefore.length} activities found`);

    if (activitiesBefore.length === 0) {
      console.log('❌ No activities to test deletion with');
      return;
    }

    // Get the first activity for testing
    const activityToDelete = activitiesBefore[0];
    console.log(`🎯 Testing deletion of activity: "${activityToDelete.name}"`);
    console.log(`   - Activity ID: ${activityToDelete.id}`);
    console.log(`   - Instances: ${activityToDelete.instances.length}`);
    console.log(`   - Values: ${activityToDelete.values.length}`);
    console.log(`   - Participations: ${activityToDelete.instances.reduce((sum, i) => sum + i.participations.length, 0)}`);

    // Count related records before deletion
    const instancesBefore = await prisma.activityInstance.count({
      where: { activityId: activityToDelete.id }
    });
    const valuesBefore = await prisma.activityValue.count({
      where: { activityId: activityToDelete.id }
    });
    const participationsBefore = await prisma.participation.count({
      where: { 
        activityInstanceId: { 
          in: activityToDelete.instances.map(i => i.id) 
        } 
      }
    });

    console.log(`\n📈 Related records before deletion:`);
    console.log(`   - Activity instances: ${instancesBefore}`);
    console.log(`   - Activity values: ${valuesBefore}`);
    console.log(`   - Participations: ${participationsBefore}`);

    // Perform the deletion (simulating the API DELETE endpoint logic)
    console.log(`\n🗑️  Deleting activity "${activityToDelete.name}"...`);
    
    await prisma.activity.delete({
      where: { id: activityToDelete.id }
    });

    console.log('✅ Activity deleted successfully!');

    // Verify cascading deletion worked
    const instancesAfter = await prisma.activityInstance.count({
      where: { activityId: activityToDelete.id }
    });
    const valuesAfter = await prisma.activityValue.count({
      where: { activityId: activityToDelete.id }
    });
    const participationsAfter = await prisma.participation.count({
      where: { 
        activityInstanceId: { 
          in: activityToDelete.instances.map(i => i.id) 
        } 
      }
    });

    console.log(`\n📉 Related records after deletion:`);
    console.log(`   - Activity instances: ${instancesAfter} (should be 0)`);
    console.log(`   - Activity values: ${valuesAfter} (should be 0)`);
    console.log(`   - Participations: ${participationsAfter} (should be 0)`);

    // Verify total activity count decreased
    const activitiesAfter = await prisma.activity.findMany({
      where: { userId: testUser.id }
    });

    console.log(`\n📊 After deletion: ${activitiesAfter.length} activities remaining`);
    console.log(`   Expected: ${activitiesBefore.length - 1}, Actual: ${activitiesAfter.length}`);

    // Verify cascading worked correctly
    const cascadeSuccess = (
      instancesAfter === 0 && 
      valuesAfter === 0 && 
      participationsAfter === 0 &&
      activitiesAfter.length === activitiesBefore.length - 1
    );

    if (cascadeSuccess) {
      console.log('\n🎉 SUCCESS: Delete functionality works correctly!');
      console.log('   ✅ Activity deleted');
      console.log('   ✅ Related instances deleted (cascade)');
      console.log('   ✅ Related values deleted (cascade)');
      console.log('   ✅ Related participations deleted (cascade)');
      console.log('   ✅ Activity count updated correctly');
    } else {
      console.log('\n❌ FAILURE: Delete functionality has issues');
      if (instancesAfter > 0) console.log('   ❌ Activity instances not deleted');
      if (valuesAfter > 0) console.log('   ❌ Activity values not deleted');
      if (participationsAfter > 0) console.log('   ❌ Participations not deleted');
      if (activitiesAfter.length !== activitiesBefore.length - 1) console.log('   ❌ Activity count incorrect');
    }

  } catch (error) {
    console.error('❌ Error testing delete functionality:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteFunctionality();
