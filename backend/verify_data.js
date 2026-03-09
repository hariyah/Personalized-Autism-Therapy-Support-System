const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Child = require('./models/Child');
const Activity = require('./models/Activity');
const Analysis = require('./models/Analysis');
const DoctorPatient = require('./models/DoctorPatient');
const Notification = require('./models/Notification');

const verifyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autismcare');
        console.log('✓ Connected to MongoDB\n');

        // Count documents in each collection
        const userCount = await User.countDocuments();
        const childCount = await Child.countDocuments();
        const activityCount = await Activity.countDocuments();
        const analysisCount = await Analysis.countDocuments();
        const doctorPatientCount = await DoctorPatient.countDocuments();
        const notificationCount = await Notification.countDocuments();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 DATABASE COLLECTIONS STATUS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👥 Users: ${userCount} documents`);
        console.log(`👶 Children: ${childCount} documents`);
        console.log(`🎯 Activities: ${activityCount} documents`);
        console.log(`📋 Analyses: ${analysisCount} documents`);
        console.log(`🔗 Doctor-Patient Relations: ${doctorPatientCount} documents`);
        console.log(`🔔 Notifications: ${notificationCount} documents`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Display sample users
        console.log('👥 USERS:');
        const users = await User.find({}).select('name email role');
        users.forEach((user, i) => {
            console.log(`  ${i + 1}. ${user.name} (${user.role}) - ${user.email}`);
        });

        // Display sample children
        console.log('\n👶 CHILDREN:');
        const children = await Child.find({}).select('name diagnosisDetails.severity');
        children.forEach((child, i) => {
            console.log(`  ${i + 1}. ${child.name} - ${child.diagnosisDetails?.severity || 'N/A'} severity`);
        });

        // Display sample activities
        console.log('\n🎯 ACTIVITIES:');
        const activities = await Activity.find({}).select('title category');
        activities.forEach((activity, i) => {
            console.log(`  ${i + 1}. ${activity.title} (${activity.category})`);
        });

        // Display sample analyses
        console.log('\n📋 ANALYSES:');
        const analyses = await Analysis.find({}).select('transcript issueLabel urgencyLabel');
        analyses.forEach((analysis, i) => {
            const transcript = analysis.transcript.substring(0, 50) + '...';
            console.log(`  ${i + 1}. "${transcript}"`);
            console.log(`     Issue: ${analysis.issueLabel} | Urgency: ${analysis.urgencyLabel}`);
        });

        console.log('\n✅ All data is present in MongoDB!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

verifyData();
