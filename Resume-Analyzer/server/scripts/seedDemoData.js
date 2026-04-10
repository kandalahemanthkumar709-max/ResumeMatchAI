import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import MatchCache from '../models/MatchCache.js';
import colors from 'colors';

dotenv.config();

/**
 * DEMO SEEDER
 * 
 * Why?
 * To show off the analytics dashboards, you need data.
 * This script creates a test seeker with:
 * - 5 Resumes (with varying ATS scores)
 * - 15 Job Matches (across the score spectrum)
 * - 10 Applications (in different stages)
 * - Historical data (applications spread over the last 8 weeks)
 */

const seedDemo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB for seeding...'.cyan);

        // 1. Surgical Cleanup (Only demo data)
        const demoEmail = 'demo@resumematch.ai';
        const existingDemoUser = await User.findOne({ email: demoEmail });
        
        if (existingDemoUser) {
            console.log('🧹 Cleaning up old Alexandria demo data...'.yellow);
            await Application.deleteMany({ seekerId: existingDemoUser._id });
            await Resume.deleteMany({ userId: existingDemoUser._id });
            await MatchCache.deleteMany({ seekerId: existingDemoUser._id });
            await Job.deleteMany({ postedBy: existingDemoUser._id });
            await User.deleteOne({ _id: existingDemoUser._id });
        }
        
        // 2. Create Demo User
        const demoUser = await User.create({
            name: 'Alex Demo',
            email: demoEmail,
            password: 'Password123!',
            role: 'seeker'
        });
        console.log('✅ Created Demo User'.green);

        // 3. Create Sample Resumes
        const resumeScores = [45, 62, 78, 85, 92];
        const resumes = await Promise.all(resumeScores.map(async (score, i) => {
            return await Resume.create({
                userId: demoUser._id,
                label: `Resume Version ${i + 1}`,
                status: 'parsed',
                atsScore: score,
                fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
                cloudinaryPublicId: `demo_resume_${i}`,
                parsedData: {
                    name: 'Alex Demo',
                    summary: 'Experienced software engineer focused on modern JS frameworks.',
                    skills: {
                        hard: ['React', 'Node.js', 'Express', 'MongoDB'],
                        soft: ['Communication', 'Leadership'],
                        tools: ['Git', 'VS Code']
                    },
                    missingSkills: i < 3 ? ['AWS', 'Docker', 'Kubernetes'] : []
                }
            });
        }));
        console.log('✅ Created 5 Resumes with progressive scores'.green);

        // 4. Create Sample Jobs
        const jobs = await Promise.all([
            Job.create({ 
                title: 'Senior React Developer', 
                company: 'TechCorp', 
                status: 'active', 
                postedBy: demoUser._id,
                description: 'Expertise in Hooks and Redux.',
                structuredData: { required_skills: ['React', 'Redux'], min_experience_years: 5 }
            }),
            Job.create({ 
                title: 'Fullstack Engineer', 
                company: 'StartUp Inc', 
                status: 'active', 
                postedBy: demoUser._id,
                description: 'Join our early stage startup.',
                structuredData: { required_skills: ['Node.js', 'React'], min_experience_years: 3 }
            }),
            Job.create({ 
                title: 'Node.js Backend Dev', 
                company: 'Global Solutions', 
                status: 'active', 
                postedBy: demoUser._id,
                description: 'Scalable APIs for enterprise clients.',
                structuredData: { required_skills: ['Node.js', 'Express'], min_experience_years: 4 }
            }),
            Job.create({ 
                title: 'Frontend Specialist', 
                company: 'Design Agency', 
                status: 'active', 
                postedBy: demoUser._id,
                description: 'Pixel perfect interfaces.',
                structuredData: { required_skills: ['HTML', 'CSS'], min_experience_years: 2 }
            }),
            Job.create({ 
                title: 'DevOps Engineer', 
                company: 'CloudWorks', 
                status: 'active', 
                postedBy: demoUser._id,
                description: 'AWS infrastructure and CI/CD.',
                structuredData: { required_skills: ['AWS', 'Docker'], min_experience_years: 3 }
            }),
        ]);
        console.log('✅ Created 5 Sample Jobs'.green);

        // 5. Create Match Cache (One for each job)
        const matchScoresArr = [95, 82, 76, 62, 45]; // Distribution across jobs
        await Promise.all(matchScoresArr.map(async (score, i) => {
            return await MatchCache.create({
                seekerId: demoUser._id,
                resumeId: resumes[4]._id,
                jobId: jobs[i]._id,
                overallScore: score,
                breakdown: { skillScore: score, experienceScore: score, educationScore: 100, locationScore: 100 }
            });
        }));
        console.log('✅ Created 5 Match Results for 5 jobs'.green);

        // 6. Create Applications (One for each job)
        const statusesArr = ['applied', 'screening', 'interview', 'offer', 'rejected'];
        for (let i = 0; i < jobs.length; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));

            await Application.create({
                seekerId: demoUser._id,
                jobId: jobs[i]._id,
                resumeId: resumes[4]._id,
                status: statusesArr[i % statusesArr.length],
                matchScore: Math.floor(Math.random() * 30) + 65,
                appliedAt: date
            });
        }
        console.log('✅ Created 5 Applications matching 5 jobs'.green);

        console.log('\n🚀 DEMO SEEDING COMPLETE!'.yellow.bold);
        console.log('-----------------------------------');
        console.log('Login Email: '.cyan + 'demo@resumematch.ai');
        console.log('Password:    '.cyan + 'Password123!');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('❌ SEEDING FAILED:'.red, err.message);
        process.exit(1);
    }
};

seedDemo();
