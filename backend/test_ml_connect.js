// Simple connectivity test to ML service
const axios = require('axios');
(async () => {
  try {
    const resp = await axios.get('http://127.0.0.1:5000/health', { timeout: 5000 });
    console.log('ML health response:', resp.data);
  } catch (e) {
    console.error('ML health error details:', {
      message: e.message,
      code: e.code,
      errno: e.errno,
      stack: e.stack
    });
    process.exit(1);
  }
})();
