const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Activity = require('./models/Activity');
require('dotenv').config();

const seedActivities = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autism_support');
        console.log('Connected to MongoDB for seeding...');

        const activitiesPath = path.join(__dirname, 'data', 'activities.json');
        const activitiesData = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));

        // Clear existing activities
        await Activity.deleteMany({});
        console.log('Cleared existing activities');

        // Insert new activities
        await Activity.insertMany(activitiesData);
        console.log(`Successfully seeded ${activitiesData.length} activities!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding activities:', error);
        process.exit(1);
    }
};

seedActivities();
