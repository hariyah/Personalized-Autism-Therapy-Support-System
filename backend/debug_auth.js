const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const debugAuth = async () => {
    try {
        console.log('🔍 DEBUG: Auth Issue\n');
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autismcare';
        console.log(`📍 MongoDB URI: ${mongoUri}`);
        
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        // Check if users exist
        const allUsers = await User.find({});
        console.log(`👥 Total users in database: ${allUsers.length}`);
        
        if (allUsers.length === 0) {
            console.log('❌ ERROR: No users found in database!');
            console.log('Run: npm run seed:all');
            process.exit(1);
        }

        // Try to find the doctor user
        const doctorUser = await User.findOne({ email: 'doctor@example.com' }).select('+password');
        
        if (!doctorUser) {
            console.log('❌ ERROR: doctor@example.com not found!');
            console.log('\nAvailable users:');
            allUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
            process.exit(1);
        }

        console.log(`✓ Found user: ${doctorUser.email}`);
        console.log(`  Name: ${doctorUser.name}`);
        console.log(`  Role: ${doctorUser.role}`);
        console.log(`  Password hash exists: ${!!doctorUser.password}\n`);

        // Test password comparison
        const testPassword = 'Password123';
        console.log(`🔐 Testing password comparison...`);
        console.log(`  Input password: ${testPassword}`);
        console.log(`  Stored hash: ${doctorUser.password.substring(0, 20)}...`);

        const isMatch = await doctorUser.comparePassword(testPassword);
        console.log(`  Password match: ${isMatch ? '✅ YES' : '❌ NO'}\n`);

        if (isMatch) {
            console.log('✅ AUTHENTICATION SHOULD WORK!');
            console.log('Try login again at http://localhost:3000/login');
        } else {
            console.log('❌ PASSWORD MISMATCH!');
            console.log('The stored password hash does not match "Password123"');
            console.log('\n🔧 SOLUTION: Re-seed the database...');
            console.log('Run: npm run seed:all');
        }

        process.exit(isMatch ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🚨 MongoDB is not running!');
            console.log('Start MongoDB with: mongod --dbpath "C:\\data\\db"');
        }
        process.exit(1);
    }
};

debugAuth();
