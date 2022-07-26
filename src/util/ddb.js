const AWS = require('aws-sdk');
const { Table, Entity } = require('dynamodb-toolbox');

const { ENTITY_TABLE } = process.env;

const DocumentClient = new AWS.DynamoDB.DocumentClient();

const EntityTable = new Table({
  name: ENTITY_TABLE,
  partitionKey: 'pk',
  sortKey: 'sk',
  DocumentClient,
});

const User = new Entity({
  name: 'USER',
  attributes: {
    pk: { partitionKey: true },
    sk: { sortKey: true },
    id: { type: 'string' },
    name: { type: 'string' },
  },
  table: EntityTable,
});

module.exports = {
  EntityTable,
  User,
};
