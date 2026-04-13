
import https from 'https';

const payload = {
    to: 'kandalahemanthkumar709@gmail.com',
    subject: '🚨 LIVE SITE VERIFICATION 🚨',
    html: '<h1>Authentication Success</h1><p>The Render Internal Proxy is now active and verified.</p>',
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

console.log('Hitting: https://resumematchai-m9tq.onrender.com/api/sendMail');

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', body);
        if (res.statusCode === 200) {
            console.log('🚀 MISSION SUCCESS! The live server is delivering emails.');
        } else {
            console.log('❌ MISSION FAILED. Check server logs.');
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(data);
req.end();
