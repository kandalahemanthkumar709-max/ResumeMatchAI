import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import { parseResume } from '../services/parser.service.js';
import analyzeResume from '../utils/groqAI.js';
import colors from 'colors';

dotenv.config();

const filePath = "C:\\Users\\Tejasri\\OneDrive\\Desktop\\ANAND_AGENTIC_AI_RESUME.pdf";

const manualUpload = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB for manual upload...'.cyan);

        // 1. Find John Seeker
        const seeker = await User.findOne({ email: 'john@myskills.com' });
        if (!seeker) {
            console.error('❌ Seeker "john@myskills.com" not found. Please register him first.'.red);
            process.exit(1);
        }

        // 2. Read the file
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found at: ${filePath}`.red);
            process.exit(1);
        }
        const buffer = fs.readFileSync(filePath);
        console.log(`📄 Read file: ${path.basename(filePath)} (${(buffer.length / 1024).toFixed(1)} KB)`);

        // 3. Parse and Analyze (Mirroring the controller)
        console.log('⚙️  Parsing PDF text...'.yellow);
        const rawText = await parseResume(buffer, 'application/pdf');
        
        console.log('🤖 Analyzing with Groq AI...'.yellow);
        const aiResult = await analyzeResume(buffer, rawText);
        
        // 4. Create Resume in DB
        await Resume.create({
            userId: seeker._id,
            label: 'ANAND_AGENTIC_AI_RESUME',
            fileUrl: `local://${path.basename(filePath)}`,
            originalName: path.basename(filePath),
            mimeType: 'application/pdf',
            rawText,
            parsedData: aiResult,
            atsScore: aiResult.score || 0,
            atsIssues: aiResult.weaknesses || [],
            status: 'parsed',
            isDefault: true
        });

        console.log('\n🚀 RESUME UPLOADED SUCCESSFULLY TO JOHN!'.green.bold);
        console.log('-----------------------------------');
        console.log('User: John Seeker (john@myskills.com)');
        console.log('File: ANAND_AGENTIC_AI_RESUME.pdf');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('❌ MANUAL UPLOAD FAILED:'.red, err.message);
        process.exit(1);
    }
};

manualUpload();
