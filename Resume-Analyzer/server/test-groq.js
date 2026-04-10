import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const testGroq = async () => {
    try {
        console.log('Loaded Groq API key:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) + '...' : 'MISSING');
        console.log('Testing Groq API with model: llama-3.3-70b-versatile');
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello!' }],
            model: 'llama-3.3-70b-versatile',
        });

        console.log('Response:', chatCompletion.choices[0]?.message?.content);
        console.log('✅ Groq integration is working!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testGroq();
