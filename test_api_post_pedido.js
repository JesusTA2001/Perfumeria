require('dotenv').config();
const apiHandler = require('./api/index.js');
const mockReq = {
  method: 'POST',
  url: '/api/pedidos',
  headers: { host: 'localhost:3000' },
  body: {
    clienteNombre: "jesus",
    telefono: "3512792934",
    comentarios: "hola",
    items: [ { id_presentacion: 34, cantidad: 1 } ] // 34 is the presentation ID for 724
  }
};
const mockRes = {
  setHeader: () => {},
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log(`STATUS: ${this.statusCode}`); console.log(`RESPONSE:`, data); },
  end: function() { console.log(`STATUS: ${this.statusCode}`); console.log('ENDED'); }
};
(async () => {
  console.log("Testing POST /api/pedidos...");
  await apiHandler(mockReq, mockRes);
})();
