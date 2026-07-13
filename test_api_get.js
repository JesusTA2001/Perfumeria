require('dotenv').config();
const apiHandler = require('./api/index.js');
const mockReq = {
  method: 'GET',
  url: '/api/perfumes',
  headers: { host: 'localhost:3000' },
};
const mockRes = {
  setHeader: () => {},
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log(`STATUS: ${this.statusCode}`); console.log(`RESPONSE:`, data); },
  end: function() { console.log(`STATUS: ${this.statusCode}`); console.log('ENDED'); }
};
(async () => {
  console.log("Testing GET /api/perfumes...");
  await apiHandler(mockReq, mockRes);
})();
