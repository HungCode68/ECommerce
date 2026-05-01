const axios = require('axios');
const API_BASE_URL = 'http://localhost:8081';

async function test() {
  try {
    const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, { identifier: 'admin', password: 'password' });
    const token = loginRes.data.data.access_token;
    
    const res = await axios.get(`${API_BASE_URL}/api/admin/categories?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}
test();
