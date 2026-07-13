require('dotenv').config();
const { updatePerfume } = require('./api/index.js');

// Mock request and response for testing the API handler directly
const http = require('http');
const apiHandler = require('./api/index.js');

const mockReq = {
  method: 'PUT',
  url: '/api/perfumes/36',
  headers: { host: 'localhost:3000' },
  body: {
    name: "Test Perfume",
    descripcion: "Test Desc",
    category: "Mujer",
    price: 1500,
    mililitros: 100,
    stock: 5,
    imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=".repeat(5000),
    available: true
  }
};

const mockRes = {
  setHeader: () => {},
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log(`STATUS: ${this.statusCode}`);
    console.log(`RESPONSE:`, data);
  },
  end: function() {
    console.log(`STATUS: ${this.statusCode}`);
    console.log('ENDED');
  }
};

(async () => {
  console.log("Testing API handler...");
  await apiHandler(mockReq, mockRes);
})();
