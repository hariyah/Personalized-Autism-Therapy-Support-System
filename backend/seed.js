const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autismcare');
        console.log('✓ Connected to MongoDB for seeding...');

        // Clear existing users
        await User.deleteMany({});
        console.log('✓ Cleared existing users');

        // Create test users
        const testUsers = [
            {
                name: 'Dr. Sarah Johnson',
                email: 'doctor@example.com',
                password: 'Password123',
                role: 'doctor',
                specialization: 'Autism Therapy',
                licenseNumber: 'MD12345'
            },
            {
                name: 'John Parent',
                email: 'parent@example.com',
                password: 'Password123',
                role: 'parent',
                address: '123 Main St, City, State 12345',
                phone: '+1-800-555-0123'
            },
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Password123',
                role: 'admin'
            }
        ];

        // Hash passwords before insertion (insertMany bypasses pre/post hooks)
        for (const user of testUsers) {
            user.password = await bcryptjs.hash(user.password, 10);
        }

        // Insert test users
        const createdUsers = await User.insertMany(testUsers);
        console.log(`✓ Successfully created ${createdUsers.length} test users!`);
        
        console.log('\n📝 Test Credentials:');
        console.log('─────────────────────────────────────');
        console.log('Doctor:');
        console.log('  Email: doctor@example.com');
        console.log('  Password: Password123');
        console.log('─────────────────────────────────────');
        console.log('Parent:');
        console.log('  Email: parent@example.com');
        console.log('  Password: Password123');
        console.log('─────────────────────────────────────');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding users:', error.message);
        process.exit(1);
    }
};

seedUsers();
