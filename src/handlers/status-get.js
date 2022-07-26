const AWS = require('aws-sdk');
const { DB_NAME, DB_CLUSTER_ARN, DB_SECRET_ARN } = process.env;
const db = require('data-api-client')({ secretArn: DB_SECRET_ARN, resourceArn: DB_CLUSTER_ARN, database: DB_NAME });
const s3 = new AWS.S3({ region, apiVersion: '2006-03-01' });

const { User } = require('../util/ddb');
const { ASSET_BUCKET } = process.env;

exports.handler = async event => {
  console.log('event: ', event);
  const statusCode = 200;
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const body = JSON.stringify({ status: 'ok' });

  // query db table names
  const result = await db.query(`SELECT datname FROM pg_database WHERE datistemplate = false;`)
  console.log('result: ', result);

  // insert ddb record
  await User.put({ pk: 'USER#1234', sk: 'USER#1234', id: '1234', name: 'bob' });

  // upload a JSON file to S3
  var buf = Buffer.from(JSON.stringify({id: '1234', type: 'test', count: 1}));
  var item = {
    Bucket: ASSET_BUCKET,
    Key: 'filename.json',
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'application/json',
  };
  await s3.upload(item).promise()


  return { statusCode, headers, body };
};
