import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/User.js';
import Job from '../models/Job.js';
import connectDB from '../config/db.js';

dotenv.config();

/**
 * SAMPLE DATA: 1 Recruiter and 5 Jobs
 */
const seedData = async () => {
    try {
        await connectDB();

        // 1. CLEAR EXISTING DATA (Be careful!)
        console.log('🧹 Clearing old data...'.yellow);
        await Job.deleteMany();
        await User.deleteMany({ role: 'recruiter', email: 'demo@recruiter.com' });

        // 2. CREATE A DEMO RECRUITER
        console.log('👤 Creating Demo Recruiter...'.cyan);
        const recruiter = await User.create({
            name: 'Hemanth Kumar',
            email: 'demo@recruiter.com',
            password: 'password123', // This will be hashed by the User model pre-save hook
            role: 'recruiter',
            company: 'ResumeMatch AI Tech'
        });

        // 3. CREATE SAMPLE JOBS
        console.log('💼 Creating Sample Jobs...'.cyan);
        const jobs = [
            {
                title: 'Senior MERN Stack Developer',
                company: 'TechFlow Solutions',
                location: 'Hyderabad, India',
                locationType: 'remote',
                description: 'We are looking for a Senior MERN Developer to lead our core product team. You will work with React, Node.js, and MongoDB.',
                requirements: '5+ years experience with React and Node.js. Knowledge of AWS and Docker is a plus.',
                salary: { min: 1800000, max: 2500000, currency: 'INR' },
                jobType: 'full-time',
                postedBy: recruiter._id,
                structuredData: {
                    required_skills: ['React', 'Node.js', 'MongoDB', 'Express', 'AWS', 'Docker'],
                    experience_level: 'Senior',
                    education: 'B.Tech/MCA'
                }
            },
            {
                title: 'UI/UX Designer',
                company: 'Creative Pixel',
                location: 'Bangalore, India',
                locationType: 'hybrid',
                description: 'Join our design team to create stunning user interfaces for our global clients.',
                requirements: 'Proficiency in Figma and Adobe XD. Strong portfolio of mobile and web designs.',
                salary: { min: 1200000, max: 1800000, currency: 'INR' },
                jobType: 'full-time',
                postedBy: recruiter._id,
                structuredData: {
                    required_skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research'],
                    experience_level: 'Intermediate',
                    education: 'Design Degree'
                }
            },
            {
                title: 'Python Backend Engineer',
                company: 'AI Research Lab',
                location: 'Mumbai, India',
                locationType: 'onsite',
                description: 'Work on cutting-edge AI models and build scalable backend APIs using Django and FastAPI.',
                requirements: 'Python mastery. Experience with PostgreSQL and Redis. Interest in Machine Learning.',
                salary: { min: 1500000, max: 2200000, currency: 'INR' },
                jobType: 'contract',
                postedBy: recruiter._id,
                structuredData: {
                    required_skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Machine Learning'],
                    experience_level: 'Mid-Senior',
                    education: 'Computer Science'
                }
            },
            {
                title: 'Product Manager (SaaS)',
                company: 'SaaS Vision',
                location: 'Pune, India',
                locationType: 'remote',
                description: 'Own the product roadmap and coordinate between business and engineering teams.',
                requirements: 'Previous PM experience in SaaS. Excellent communication and analytical skills.',
                salary: { min: 2000000, max: 3000000, currency: 'INR' },
                jobType: 'full-time',
                postedBy: recruiter._id,
                structuredData: {
                    required_skills: ['Agile', 'Product Roadmap', 'Jira', 'Stakeholder Management'],
                    experience_level: 'Senior',
                    education: 'MBA preferred'
                }
            },
            {
                title: 'Java Developer Intern',
                company: 'Enterprise Systems',
                location: 'Chennai, India',
                locationType: 'onsite',
                description: 'Entry-level position for fresh graduates to learn enterprise Java development.',
                requirements: 'Solid understanding of Java core and OOP concepts. Motivation to learn Spring Boot.',
                salary: { min: 400000, max: 600000, currency: 'INR' },
                jobType: 'internship',
                postedBy: recruiter._id,
                structuredData: {
                    required_skills: ['Java', 'OOP', 'SQL', 'Spring Boot'],
                    experience_level: 'Entry',
                    education: 'Final year students'
                }
            }
        ];

        await Job.insertMany(jobs);

        console.log('✅ DATABASE SEEDED SUCCESSFULLY!'.green.bold);
        console.log(`\nDemo Recruiter Login:\nEmail: demo@recruiter.com\nPassword: password123\n`.white);
        
        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding data: ${error.message}`.red);
        process.exit(1);
    }
};

seedData();
