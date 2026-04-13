
import https from 'https';

const payload = {
    to: 'kandalahemanthkumar709@gmail.com',
    subject: '🏁 FINAL PRODUCTION TEST - Port 587 Fix 🏁',
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h1 style="color: #0ea5e9;">Success!</h1>
            <p>If you are reading this on your phone, then the <strong>Render SMTP Port 587 Bypass</strong> is working perfectly.</p>
            <p>Your Resume-Analyzer is now fully production-ready.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #64748b;">Verified at: ${new Date().toLocaleString()}</p>
        </div>
    `,
    key: 'resume_match_proxy_key_123'
};

const data = JSON.stringify(payload);

const options = {
    hostname: 'resumematchai-m9tq.onrender.com',
    path: '/api/sendMail',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('--- FINAL TEST IN PROGRESS ---');
console.log('Sending to: kandalahemanthkumar709@gmail.com');
console.log('Target: https://resumematchai-m9tq.onrender.com/api/sendMail');

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', body);
        if (res.statusCode === 200) {
            console.log('🏆 SUCCESS! Check your phone.');
        } else {
            console.log('❌ FAILED. The live server might still be deploying. Wait 1 min and try again.');
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(data);
req.end();
