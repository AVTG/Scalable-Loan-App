// ✅ This works in CommonJS (default mode)
const axios = require('axios');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./loan_data_500.json', 'utf8'));
const ENDPOINT = 'http://localhost:3000/loan';

async function sendAll() {
  const promises = data.map(loan =>
    axios.post(ENDPOINT, loan)
  );

  try {
    const start = Date.now();
    const results = await Promise.all(promises);
    const latency = Date.now() - start;
    console.log(`✅ All ${results.length} loans sent successfully with latency ${latency}ms`);
  } catch (err) {
    console.error('One or more requests failed:', err.message);
  }
}

sendAll();
