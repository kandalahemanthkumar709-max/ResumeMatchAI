import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const listModels = async () => {
    try {
        console.log('Fetching available models...');
        // The listModels method is on the root genAI instance or needs to be fetched manually?
        // Actually, the @google/generative-ai package has a listModels functionality depending on the version.
        // If not, we can try common ones.
        
        // Let's try gemini-1.5-flash-latest as well.
        const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash'];
        
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent('test');
                console.log(`✅ Model ${m} is AVAILABLE`);
            } catch (err) {
                console.log(`❌ Model ${m} is NOT available: ${err.message}`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

listModels();
