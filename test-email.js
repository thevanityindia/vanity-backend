const http = require('http');

function testEmail() {
    const data = JSON.stringify({ email: 'THEVANITYINDIA@gmail.com' });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/send-otp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Response Body:", body);
        });
    });

    req.on('error', (error) => {
        console.error("Error:", error);
    });

    req.write(data);
    req.end();
}

testEmail();
