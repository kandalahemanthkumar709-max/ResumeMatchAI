import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const testGemini = async () => {
    try {
        console.log('Loaded API key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'MISSING');
        console.log('Testing Gemini API with model: gemini-1.5-flash');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello!');
        const response = await result.response;
        console.log('Response:', response.text());
        
        console.log('\nTesting Gemini API with model: gemini-2.0-flash-lite');
        const model2 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result2 = await model2.generateContent('Say hello!');
        const response2 = await result2.response;
        console.log('Response:', response2.text());
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testGemini();
