const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('./models/User');
const Child = require('./models/Child');
const Activity = require('./models/Activity');
const Analysis = require('./models/Analysis');
const DoctorPatient = require('./models/DoctorPatient');
require('dotenv').config();

const seedComprehensiveData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autismcare');
        console.log('✓ Connected to MongoDB for comprehensive seeding...');

        // ====================
        // 1. CLEAR COLLECTIONS
        // ====================
        console.log('\n📦 Clearing collections...');
        await User.deleteMany({});
        await Child.deleteMany({});
        await Activity.deleteMany({});
        await Analysis.deleteMany({});
        await DoctorPatient.deleteMany({});
        const Notification = require('./models/Notification');
        await Notification.deleteMany({});
        console.log('✓ Collections cleared');

        // ====================
        // 2. SEED USERS
        // ====================
        console.log('\n👥 Seeding users...');
        const users = [
            {
                name: 'Dr. Sarah Johnson',
                email: 'doctor@example.com',
                password: 'Password123',
                role: 'doctor',
                specialization: 'Autism Spectrum Disorder Specialist',
                licenseNumber: 'MD-2024-001',
                phone: '+1-800-555-0101'
            },
            {
                name: 'Dr. Michael Chen',
                email: 'doctor2@example.com',
                password: 'Password123',
                role: 'doctor',
                specialization: 'Behavioral Therapist',
                licenseNumber: 'MD-2024-002',
                phone: '+1-800-555-0102'
            },
            {
                name: 'John Parent',
                email: 'parent@example.com',
                password: 'Password123',
                role: 'parent',
                address: '123 Main Street, Springfield, IL 62701',
                phone: '+1-800-555-0201'
            },
            {
                name: 'Emily Parent',
                email: 'parent2@example.com',
                password: 'Password123',
                role: 'parent',
                address: '456 Oak Avenue, Springfield, IL 62702',
                phone: '+1-800-555-0202'
            },
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Password123',
                role: 'admin'
            }
        ];

        // Hash passwords before insertion (insertMany bypasses pre/post hooks)
        for (const user of users) {
            user.password = await bcryptjs.hash(user.password, 10);
        }

        const createdUsers = await User.insertMany(users);
        console.log(`✓ Created ${createdUsers.length} users`);

        // Get user references
        const doctorSarah = createdUsers.find(u => u.email === 'doctor@example.com');
        const doctorMichael = createdUsers.find(u => u.email === 'doctor2@example.com');
        const parentJohn = createdUsers.find(u => u.email === 'parent@example.com');
        const parentEmily = createdUsers.find(u => u.email === 'parent2@example.com');

        // ====================
        // 3. SEED ACTIVITIES
        // ====================
        console.log('\n🎯 Seeding activities...');
        const activitiesData = [
            {
                title: "Social Story Reading",
                category: "social",
                description: "Read personalized social stories to help understand social situations and appropriate responses.",
                duration: "15-20 minutes",
                difficulty: "easy",
                materials: ["Social story book", "Quiet space"],
                benefits: ["Understanding social cues", "Empathy development", "Communication skills"],
                ageRange: "4-12 years",
                icon: "📚",
                costLevel: "low",
                socialRequirement: "low",
                emotionMapping: {
                    happy: 0.7,
                    sad: 0.3,
                    anxious: 0.2,
                    calm: 0.9,
                    excited: 0.5,
                    frustrated: 0.1,
                    neutral: 0.8
                },
                interestTags: ["visual", "reading", "quiet", "structured"]
            },
            {
                title: "Role-Playing Games",
                category: "social",
                description: "Practice social interactions through role-playing different scenarios.",
                duration: "20-30 minutes",
                difficulty: "medium",
                materials: ["Props (optional)", "Scenario cards"],
                benefits: ["Social confidence", "Conversation skills", "Problem-solving"],
                ageRange: "5-14 years",
                icon: "🎭",
                costLevel: "low",
                socialRequirement: "high",
                emotionMapping: {
                    happy: 0.8,
                    sad: 0.4,
                    anxious: 0.3,
                    calm: 0.7,
                    excited: 0.9,
                    frustrated: 0.2,
                    neutral: 0.7
                },
                interestTags: ["play-based", "movement", "structured"]
            },
            {
                title: "Visual Schedule Routine",
                category: "behavioral",
                description: "Use visual schedules to establish predictable routines and reduce anxiety.",
                duration: "Ongoing",
                difficulty: "easy",
                materials: ["Visual schedule board", "Picture cards"],
                benefits: ["Reduced anxiety", "Increased independence", "Better routine adherence"],
                ageRange: "4-16 years",
                icon: "📅",
                costLevel: "free",
                socialRequirement: "none",
                emotionMapping: {
                    happy: 0.6,
                    sad: 0.2,
                    anxious: 0.1,
                    calm: 0.95,
                    excited: 0.4,
                    frustrated: 0.1,
                    neutral: 0.9
                },
                interestTags: ["visual", "structured", "routine"]
            },
            {
                title: "Sensory Play Activities",
                category: "emotional",
                description: "Engage in sensory exploration with safe, controlled materials.",
                duration: "20-30 minutes",
                difficulty: "easy",
                materials: ["Sensory bins", "Textured items", "Safe objects"],
                benefits: ["Sensory regulation", "Stress relief", "Fine motor skills"],
                ageRange: "3-12 years",
                icon: "🎨",
                costLevel: "low",
                socialRequirement: "low",
                emotionMapping: {
                    happy: 0.85,
                    sad: 0.4,
                    anxious: 0.2,
                    calm: 0.8,
                    excited: 0.9,
                    frustrated: 0.15,
                    neutral: 0.7
                },
                interestTags: ["sensory", "hands-on", "creative"]
            },
            {
                title: "Outdoor Nature Walk",
                category: "behavioral",
                description: "Take a walk in nature to promote physical activity and relaxation.",
                duration: "20-40 minutes",
                difficulty: "easy",
                materials: ["Comfortable shoes", "Water bottle"],
                benefits: ["Physical exercise", "Fresh air", "Nature appreciation"],
                ageRange: "5-16 years",
                icon: "🌳",
                costLevel: "free",
                socialRequirement: "low",
                emotionMapping: {
                    happy: 0.8,
                    sad: 0.5,
                    anxious: 0.3,
                    calm: 0.85,
                    excited: 0.75,
                    frustrated: 0.2,
                    neutral: 0.8
                },
                interestTags: ["outdoor", "physical", "nature"]
            }
        ];

        const createdActivities = await Activity.insertMany(activitiesData);
        console.log(`✓ Created ${createdActivities.length} activities`);

        // ====================
        // 4. SEED CHILDREN
        // ====================
        console.log('\n👶 Seeding children...');
        const children = [
            {
                name: "Tommy",
                dateOfBirth: new Date('2015-03-15'),
                gender: "male",
                parent: parentJohn._id,
                diagnosisDetails: {
                    diagnosisType: "Autism Spectrum Disorder",
                    severity: "moderate",
                    diagnosisDate: new Date('2017-06-20')
                },
                assignedDoctors: [doctorSarah._id],
                interests: ["dinosaurs", "building", "music"],
                financialStatus: "medium",
                socialStatus: "alone"
            },
            {
                name: "Lisa",
                dateOfBirth: new Date('2016-08-22'),
                gender: "female",
                parent: parentJohn._id,
                diagnosisDetails: {
                    diagnosisType: "Autism Spectrum Disorder",
                    severity: "mild",
                    diagnosisDate: new Date('2018-04-10')
                },
                assignedDoctors: [doctorSarah._id, doctorMichael._id],
                interests: ["reading", "animals", "drawing"],
                financialStatus: "high",
                socialStatus: "with-parent"
            },
            {
                name: "Marcus",
                dateOfBirth: new Date('2017-11-05'),
                gender: "male",
                parent: parentEmily._id,
                diagnosisDetails: {
                    diagnosisType: "Autism Spectrum Disorder",
                    severity: "severe",
                    diagnosisDate: new Date('2019-01-15')
                },
                assignedDoctors: [doctorMichael._id],
                interests: ["puzzles", "numbers", "videos"],
                financialStatus: "low",
                socialStatus: "group"
            }
        ];

        const createdChildren = await Child.insertMany(children);
        console.log(`✓ Created ${createdChildren.length} children profiles`);

        const tommy = createdChildren.find(c => c.name === 'Tommy');
        const lisa = createdChildren.find(c => c.name === 'Lisa');
        const marcus = createdChildren.find(c => c.name === 'Marcus');

        // ====================
        // 5. SEED ANALYSES
        // ====================
        console.log('\n📊 Seeding analyses...');
        const analyses = [
            {
                child: tommy._id,
                performedBy: doctorSarah._id,
                inputType: "audio",
                transcript: "I don't want to go to school today, I'm scared of the big kids",
                issueLabel: "anxiety",
                issueTop3: [
                    { label: "anxiety", confidence: 0.85 },
                    { label: "social_fear", confidence: 0.72 },
                    { label: "separation_anxiety", confidence: 0.54 }
                ],
                urgencyLabel: "high",
                urgencyTop3: [
                    { label: "high", confidence: 0.88 },
                    { label: "medium", confidence: 0.12 }
                ],
                summary: "Child expresses anxiety about attending school due to fear of older students.",
                audioFilename: "sample_1.wav",
                isReviewed: true,
                doctorNotes: [
                    {
                        doctor: doctorSarah._id,
                        note: "Initial assessment shows clear anxiety patterns.",
                        recommendations: "Gradual exposure therapy, social story practice, breathing exercises"
                    }
                ],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                child: tommy._id,
                performedBy: doctorSarah._id,
                inputType: "audio",
                transcript: "Can we play with blocks? I really like building tall towers",
                issueLabel: "positive_engagement",
                issueTop3: [
                    { label: "positive_engagement", confidence: 0.92 },
                    { label: "interest_expression", confidence: 0.88 }
                ],
                urgencyLabel: "low",
                urgencyTop3: [
                    { label: "low", confidence: 0.88 },
                    { label: "medium", confidence: 0.12 }
                ],
                summary: "Child showing positive engagement and expressing preferred activities.",
                audioFilename: "sample_2.wav",
                isReviewed: false,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                child: lisa._id,
                performedBy: doctorMichael._id,
                inputType: "audio",
                transcript: "She took my favorite book and won't give it back. I'm really upset",
                issueLabel: "frustration",
                issueTop3: [
                    { label: "frustration", confidence: 0.79 },
                    { label: "sharing_conflict", confidence: 0.68 },
                    { label: "emotional_regulation", confidence: 0.55 }
                ],
                urgencyLabel: "medium",
                urgencyTop3: [
                    { label: "medium", confidence: 0.54 },
                    { label: "high", confidence: 0.46 }
                ],
                summary: "Child expressing frustration over shared belongings with siblings.",
                audioFilename: "sample_3.wav",
                isReviewed: true,
                doctorNotes: [
                    {
                        doctor: doctorMichael._id,
                        note: "Recommend peer conflict resolution activities.",
                        recommendations: "Emotion regulation skills, conflict resolution practice"
                    }
                ],
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                child: marcus._id,
                performedBy: doctorMichael._id,
                inputType: "audio",
                transcript: "No! I don't like that! Stop touching me! Leave me alone!",
                issueLabel: "meltdown",
                issueTop3: [
                    { label: "meltdown", confidence: 0.91 },
                    { label: "sensory_overload", confidence: 0.85 },
                    { label: "aggression", confidence: 0.72 }
                ],
                urgencyLabel: "high",
                urgencyTop3: [
                    { label: "high", confidence: 0.94 },
                    { label: "medium", confidence: 0.06 }
                ],
                summary: "Child experiencing sensory meltdown with aggressive response.",
                audioFilename: "sample_4.wav",
                isReviewed: true,
                doctorNotes: [
                    {
                        doctor: doctorMichael._id,
                        note: "Urgent: Child in sensory distress. Immediate intervention needed.",
                        recommendations: "Sensory break, safe space access, calming sensory input, parental guidance"
                    }
                ],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];

        const createdAnalyses = await Analysis.insertMany(analyses);
        console.log(`✓ Created ${createdAnalyses.length} sample analyses`);

        // ====================
        // 6. SEED DOCTOR-PATIENT RELATIONS
        // ====================
        console.log('\n🔗 Seeding doctor-patient relations...');
        const doctorPatientRelations = [
            {
                doctor: doctorSarah._id,
                child: tommy._id,
                status: 'active',
                assignedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            },
            {
                doctor: doctorSarah._id,
                child: lisa._id,
                status: 'active',
                assignedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
            },
            {
                doctor: doctorMichael._id,
                child: lisa._id,
                status: 'active',
                assignedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
            },
            {
                doctor: doctorMichael._id,
                child: marcus._id,
                status: 'active',
                assignedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
        ];

        const createdRelations = await DoctorPatient.insertMany(doctorPatientRelations);
        console.log(`✓ Created ${createdRelations.length} doctor-patient relationships`);

        // ====================
        // 7. SEED NOTIFICATIONS
        // ====================
        console.log('\n🔔 Seeding notifications...');
        const notifications = [
            {
                user: parentJohn._id,
                type: "new_analysis",
                severity: "high",
                title: "High Urgency Alert",
                message: "Tommy's recent analysis shows signs of anxiety. Please review the details.",
                child: tommy._id,
                analysis: createdAnalyses[0]._id,
                isRead: false,
                action_url: `/parent/children/${tommy._id}`
            },
            {
                user: parentJohn._id,
                type: "doctor_note",
                severity: "medium",
                title: "Doctor Note from Dr. Sarah",
                message: "Dr. Sarah has left a note on Tommy's latest analysis with recommendations.",
                child: tommy._id,
                analysis: createdAnalyses[0]._id,
                isRead: true,
                readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                action_url: `/parent/children/${tommy._id}`
            },
            {
                user: parentEmily._id,
                type: "alert",
                severity: "high",
                title: "Urgent: Behavioral Alert",
                message: "Marcus is experiencing a sensory meltdown. Immediate parental guidance needed.",
                child: marcus._id,
                analysis: createdAnalyses[3]._id,
                isRead: false,
                action_url: `/parent/children/${marcus._id}`
            },
            {
                user: doctorSarah._id,
                type: "new_analysis",
                severity: "low",
                title: "New Analysis: Positive Engagement",
                message: "Tommy shows positive engagement in activities. Keep encouraging creative play.",
                child: tommy._id,
                analysis: createdAnalyses[1]._id,
                isRead: false,
                action_url: `/doctor/patients/${tommy._id}`
            },
            {
                user: doctorMichael._id,
                type: "reminder",
                severity: "medium",
                title: "Follow-up Needed",
                message: "Schedule follow-up session with Marcus to monitor sensory interventions.",
                child: marcus._id,
                isRead: false,
                action_url: `/doctor/patients/${marcus._id}`
            }
        ];

        const createdNotifications = await Notification.insertMany(notifications);
        console.log(`✓ Created ${createdNotifications.length} notifications`);

        // ====================
        // SUMMARY
        // ====================
        console.log('\n=====================================');
        console.log('✅ COMPREHENSIVE SEEDING COMPLETE');
        console.log('=====================================');
        console.log(`✓ ${createdUsers.length} Users`);
        console.log(`✓ ${createdActivities.length} Therapy Activities`);
        console.log(`✓ ${createdChildren.length} Child Profiles`);
        console.log(`✓ ${createdAnalyses.length} Sample Analyses`);
        console.log(`✓ ${createdRelations.length} Doctor-Patient Relationships`);
        console.log(`✓ ${createdNotifications.length} Notifications`);
        console.log('\n📝 Test Credentials:');
        console.log('─────────────────────────────────────');
        console.log('👨‍⚕️  Doctor (Sarah):');
        console.log('  Email: doctor@example.com');
        console.log('  Password: Password123');
        console.log('─────────────────────────────────────');
        console.log('👨‍⚕️  Doctor (Michael):');
        console.log('  Email: doctor2@example.com');
        console.log('  Password: Password123');
        console.log('─────────────────────────────────────');
        console.log('👨‍👩‍👧 Parent (John):');
        console.log('  Email: parent@example.com');
        console.log('  Password: Password123');
        console.log('👨‍👩‍👧 Parent (Emily):');
        console.log('  Email: parent2@example.com');
        console.log('  Password: Password123');
        console.log('─────────────────────────────────────');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding data:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedComprehensiveData();
