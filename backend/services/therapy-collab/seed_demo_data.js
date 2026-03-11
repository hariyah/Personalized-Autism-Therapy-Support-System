const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/User');
const Child = require('./models/Child');
const Analysis = require('./models/Analysis');
const Notification = require('./models/Notification');
const { buildResultSummary, buildTreatmentSuggestions } = require('./utils/analysisRecommendations');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/autism_support';

function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function pickTop3(primary, secondary = 'daily_progress', tertiary = 'routine_change') {
    return [
        { label: primary, confidence: 0.91 },
        { label: secondary, confidence: 0.06 },
        { label: tertiary, confidence: 0.03 }
    ];
}

function buildReview(doctor, summary, treatmentSuggestions, treatmentStatus, careStage, followUpPlan, nextReviewDate) {
    return {
        doctor: doctor._id,
        doctorName: doctor.name,
        reviewedAt: new Date(),
        finalSummary: summary,
        finalTreatmentSuggestions: treatmentSuggestions,
        treatmentStatus,
        careStage,
        followUpPlan,
        nextReviewDate,
        reportIssuedAt: new Date()
    };
}

async function ensureUser(query, data) {
    let user = await User.findOne(query);
    if (!user) {
        user = await User.create(data);
    }
    return user;
}

async function ensureChild({ parent, doctor, childData }) {
    let child = await Child.findOne({ parent: parent._id, name: childData.name });
    if (!child) {
        child = await Child.create({
            ...childData,
            parent: parent._id,
            assignedDoctors: [doctor._id]
        });
    } else {
        child.dateOfBirth = childData.dateOfBirth;
        child.gender = childData.gender;
        child.diagnosisDetails = childData.diagnosisDetails;
        child.interests = childData.interests;
        child.assignedDoctors = [...new Set([...(child.assignedDoctors || []).map(id => id.toString()), doctor._id.toString()])];
        await child.save();
    }
    return child;
}

async function ensureAnalysis({ child, performedBy, issueLabel, urgencyLabel, transcript, summary, reviewed, doctor }) {
    const resultSummary = buildResultSummary({ issueLabel, urgencyLabel, summary });
    const treatmentSuggestions = buildTreatmentSuggestions(issueLabel, urgencyLabel);
    const issueTop3 = pickTop3(issueLabel);
    const urgencyTop3 = pickTop3(urgencyLabel, urgencyLabel === 'high' ? 'medium' : 'high', urgencyLabel === 'low' ? 'medium' : 'low');

    let analysis = await Analysis.findOne({ child: child._id, transcript });
    if (!analysis) {
        analysis = new Analysis({
            child: child._id,
            performedBy: performedBy._id,
            inputType: 'text',
            transcript,
            issueLabel,
            issueTop3,
            urgencyLabel,
            urgencyTop3,
            summary,
            resultSummary,
            treatmentSuggestions,
            isReviewed: false
        });
    } else {
        analysis.performedBy = performedBy._id;
        analysis.inputType = 'text';
        analysis.issueLabel = issueLabel;
        analysis.issueTop3 = issueTop3;
        analysis.urgencyLabel = urgencyLabel;
        analysis.urgencyTop3 = urgencyTop3;
        analysis.summary = summary;
        analysis.resultSummary = resultSummary;
        analysis.treatmentSuggestions = treatmentSuggestions;
    }

    if (reviewed) {
        const finalSummary = `${summary} Doctor validated the care plan and published a monitored treatment report.`;
        const finalTreatmentSuggestions = treatmentSuggestions.slice(0, 3);
        analysis.isReviewed = true;
        analysis.doctorReview = buildReview(
            doctor,
            finalSummary,
            finalTreatmentSuggestions,
            reviewed.treatmentStatus,
            reviewed.careStage,
            reviewed.followUpPlan,
            reviewed.nextReviewDate
        );
        analysis.doctorNotes = [{
            doctor: doctor._id,
            note: finalSummary,
            recommendations: finalTreatmentSuggestions.join('\n'),
            createdAt: new Date()
        }];
    }

    await analysis.save();
    return analysis;
}

async function ensureNotification({ user, title, message, severity, child, analysis, actionUrl }) {
    const existing = await Notification.findOne({ user: user._id, title, analysis: analysis?._id || null });
    if (!existing) {
        await Notification.create({
            user: user._id,
            type: 'new_analysis',
            severity,
            title,
            message,
            child: child?._id,
            analysis: analysis?._id,
            action_url: actionUrl
        });
    }
}

async function seedDemoData() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const parent = await ensureUser(
        { email: 'parent@example.com' },
        {
            name: 'John Parent',
            email: 'parent@example.com',
            password: 'password123',
            role: 'parent',
            phone: '123-456-7890'
        }
    );

    const doctor = await ensureUser(
        { email: 'doctor@example.com' },
        {
            name: 'Dr. Sarah Specialist',
            email: 'doctor@example.com',
            password: 'password123',
            role: 'doctor',
            specialization: 'Child Psychology',
            licenseNumber: 'MD123456'
        }
    );

    const children = await Promise.all([
        ensureChild({
            parent,
            doctor,
            childData: {
                name: 'Sammy',
                dateOfBirth: new Date('2018-05-15'),
                gender: 'male',
                diagnosisDetails: {
                    diagnosisType: 'Autism Spectrum Disorder',
                    severity: 'mild',
                    diagnosisDate: new Date('2021-10-01')
                },
                interests: ['Puzzles', 'Drawing', 'Music']
            }
        }),
        ensureChild({
            parent,
            doctor,
            childData: {
                name: 'Mia',
                dateOfBirth: new Date('2017-08-03'),
                gender: 'female',
                diagnosisDetails: {
                    diagnosisType: 'Autism Spectrum Disorder',
                    severity: 'moderate',
                    diagnosisDate: new Date('2020-06-15')
                },
                interests: ['Books', 'Clay', 'Animals']
            }
        }),
        ensureChild({
            parent,
            doctor,
            childData: {
                name: 'Leo',
                dateOfBirth: new Date('2019-02-21'),
                gender: 'male',
                diagnosisDetails: {
                    diagnosisType: 'Autism Spectrum Disorder',
                    severity: 'moderate',
                    diagnosisDate: new Date('2022-03-10')
                },
                interests: ['Trains', 'Blocks', 'Water play']
            }
        })
    ]);

    const [sammy, mia, leo] = children;

    const createdAnalyses = [];

    createdAnalyses.push(await ensureAnalysis({
        child: sammy,
        performedBy: doctor,
        issueLabel: 'sensory_overload',
        urgencyLabel: 'medium',
        transcript: 'Sammy covered his ears and cried in a crowded supermarket until he was moved to a quiet area.',
        summary: 'Sensory overload was triggered by noise and crowding during a community outing.',
        reviewed: {
            treatmentStatus: 'ongoing',
            careStage: 'follow_up',
            followUpPlan: 'Monitor the next three public outings and track sensory triggers plus recovery time.',
            nextReviewDate: daysFromNow(7)
        },
        doctor
    }));

    createdAnalyses.push(await ensureAnalysis({
        child: sammy,
        performedBy: parent,
        issueLabel: 'sleep_issue',
        urgencyLabel: 'medium',
        transcript: 'Sammy woke up four times overnight and showed strong bedtime resistance for most of the week.',
        summary: 'Sleep disruption is affecting bedtime routine and next-day regulation.',
        reviewed: null,
        doctor
    }));

    createdAnalyses.push(await ensureAnalysis({
        child: mia,
        performedBy: parent,
        issueLabel: 'regression_speech',
        urgencyLabel: 'medium',
        transcript: 'Mia is using fewer words than last month and often points instead of speaking during daily routines.',
        summary: 'Speech regression is reducing expressive communication across settings.',
        reviewed: {
            treatmentStatus: 'monitoring',
            careStage: 'ongoing',
            followUpPlan: 'Use visual supports daily and review speech output with the family next week.',
            nextReviewDate: daysFromNow(10)
        },
        doctor
    }));

    createdAnalyses.push(await ensureAnalysis({
        child: mia,
        performedBy: doctor,
        issueLabel: 'daily_progress',
        urgencyLabel: 'low',
        transcript: 'Mia followed peer-play prompts, tolerated circle time, and used a coping strategy independently.',
        summary: 'Positive progress was observed in social engagement and self-regulation.',
        reviewed: {
            treatmentStatus: 'completed',
            careStage: 'completed',
            followUpPlan: 'Keep the same reinforcement system and compare progress at the next monthly review.',
            nextReviewDate: daysFromNow(30)
        },
        doctor
    }));

    createdAnalyses.push(await ensureAnalysis({
        child: leo,
        performedBy: doctor,
        issueLabel: 'self_injury',
        urgencyLabel: 'high',
        transcript: 'Leo hit his own head repeatedly during a transition and required immediate caregiver support to stay safe.',
        summary: 'Self-injury risk is elevated during dysregulating transitions and needs active safety planning.',
        reviewed: {
            treatmentStatus: 'ongoing',
            careStage: 'follow_up',
            followUpPlan: 'Keep direct supervision during transitions and review safety data with the doctor in three days.',
            nextReviewDate: daysFromNow(3)
        },
        doctor
    }));

    createdAnalyses.push(await ensureAnalysis({
        child: leo,
        performedBy: parent,
        issueLabel: 'routine_change',
        urgencyLabel: 'low',
        transcript: 'Leo became upset after the morning schedule changed but settled once the visual routine was restored.',
        summary: 'Routine change sensitivity remains present but improved with visual support.',
        reviewed: null,
        doctor
    }));

    await ensureNotification({
        user: parent,
        title: 'Reviewed Treatment Plan Ready',
        message: 'Dr. Sarah Specialist has published updated treatment reports for your children.',
        severity: 'medium',
        child: sammy,
        analysis: createdAnalyses[0],
        actionUrl: `/parent/children/${sammy._id}?tab=care-plan`
    });

    console.log(`Parent login: ${parent.email} / password123`);
    console.log(`Doctor login: ${doctor.email} / password123`);
    console.log(`Children available: ${children.map(child => child.name).join(', ')}`);
    console.log(`Analyses ensured: ${createdAnalyses.length}`);

    await mongoose.disconnect();
    console.log('Demo data seeded without wiping existing records.');
}

seedDemoData().catch(async (error) => {
    console.error('Demo data seeding failed:', error);
    try {
        await mongoose.disconnect();
    } catch (disconnectError) {
        console.error('Disconnect failed:', disconnectError.message);
    }
    process.exit(1);
});
