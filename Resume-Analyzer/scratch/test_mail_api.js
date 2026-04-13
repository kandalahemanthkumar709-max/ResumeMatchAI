
import http from 'http';

const data = JSON.stringify({
    to: 'kandalahemanthkumar709@gmail.com',
    subject: 'API Test (Pure HTTP)',
    html: '<h1>Test</h1>',
    key: 'resume_match_proxy_key_123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/sendMail',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing local email API at http://localhost:5000/api/sendMail...');

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Method:', res.req.method);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(data);
req.end();
