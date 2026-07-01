const serverless = require('serverless-http');
const { app, initDbPromise } = require('../server/app');

const handler = serverless(app);

module.exports = async (req, res) => {
	await initDbPromise;
	return handler(req, res);
};