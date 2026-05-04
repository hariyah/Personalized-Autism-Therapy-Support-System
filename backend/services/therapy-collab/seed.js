const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/User');
const Child = require('./models/Child');
const Analysis = require('./models/Analysis');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/autism_support';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Child.deleteMany({});
        await Analysis.deleteMany({});

        // Create Parent
        const parent = await User.create({
            name: 'John Parent',
            email: 'parent@example.com',
            password: 'password123',
            role: 'parent',
            phone: '123-456-7890'
        });

        // Create Doctor
        const doctor = await User.create({
            name: 'Dr. Sarah Specialist',
            email: 'doctor@example.com',
            password: 'password123',
            role: 'doctor',
            specialization: 'Child Psychology',
            licenseNumber: 'MD123456'
        });

        // Create Child
        const child = await Child.create({
            name: 'Sammy',
            dateOfBirth: new Date('2018-05-15'),
            gender: 'male',
            parent: parent._id,
            diagnosisDetails: {
                diagnosisType: 'Autism Spectrum Disorder',
                severity: 'mild',
                diagnosisDate: new Date('2021-10-01')
            },
            assignedDoctors: [doctor._id]
        });

        // Create Sample Analysis
        await Analysis.create({
            child: child._id,
            performedBy: doctor._id,
            inputType: 'audio',
            transcript: 'Sammy showed some repetitive behavior during screen time today.',
            issueLabel: 'repetitive_behavior',
            issueTop3: [{ label: 'repetitive_behavior', confidence: 0.85 }, { label: 'sensory_overload', confidence: 0.1 }],
            urgencyLabel: 'low',
            urgencyTop3: [{ label: 'low', confidence: 0.9 }],
            summary: 'Minor repetitive actions noted during routine activities.',
            isReviewed: true
        });

        console.log('✅ Seeding complete!');
        console.log('Parent Login: parent@example.com / password123');
        console.log('Doctor Login: doctor@example.com / password123');

        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
