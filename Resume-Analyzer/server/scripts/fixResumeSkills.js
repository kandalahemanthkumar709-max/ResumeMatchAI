import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import MatchCache from '../models/MatchCache.js';
import dotenv from 'dotenv';
dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const result = await Resume.findByIdAndUpdate(
            '69d580485e92089f5db2f084',
            {
                $set: {
                    'parsedData.skills.hard': ['React', 'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'Redux', 'TypeScript', 'REST APIs', 'Python', 'Java'],
                    'parsedData.skills.soft': ['Team Collaboration', 'Problem Solving', 'Communication', 'Quick Learner'],
                    'parsedData.skills.tools': ['Git', 'VS Code', 'Webpack', 'npm'],
                    'parsedData.experience': [
                        {
                            company: 'KODNEST',
                            title: 'Full Stack Developer Trainee',
                            location: 'Bangalore, India',
                            startDate: 'Jan 2024',
                            endDate: 'Present',
                            current: true,
                            description: 'Built React applications using hooks, Redux, and REST API integrations. Developed Node.js/Express backends.'
                        }
                    ]
                }
            },
            { new: true }
        );

        console.log('✅ Updated skills:', result.parsedData.skills);

        const deleted = await MatchCache.deleteMany({ resumeId: '69d580485e92089f5db2f084' });
        console.log('✅ Cleared', deleted.deletedCount, 'cached matches');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

fix();
