const { DB_NAME, DB_CLUSTER_ARN, DB_SECRET_ARN } = process.env;
const db = require('data-api-client')({ secretArn: DB_SECRET_ARN, resourceArn: DB_CLUSTER_ARN, database: DB_NAME });

exports.handler = async event => {
  console.log('event: ', event);
  const statusCode = 200;
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const body = JSON.stringify({ status: 'ok' });

  // query db table names
  const result = await db.query(`SELECT datname FROM pg_database WHERE datistemplate = false;`)
  console.log('result: ', result);

  return { statusCode, headers, body };
};

