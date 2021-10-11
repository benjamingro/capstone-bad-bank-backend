/* eslint-disable max-len*/

const functions = require("firebase-functions");

const mysql = require("promise-mysql");

exports.createUnixSocketPool = () => {
  const dbSocketPath = "/cloudsql/"+functions.config().mysql.cloud_sql_connection_name;

  // Establish a connection to the database
  return mysql.createPool({
    user: functions.config().mysql.db_user, // e.g. 'my-db-user'
    password: functions.config().mysql.db_pass, // e.g. 'my-db-password'
    database: functions.config().mysql.db_name, // e.g. 'my-database'
    socketPath: dbSocketPath,
    connectionLimit: 5,
    connectTimeout: 60000, // 10000 -> 10 seconds
    acquireTimeout: 60000, // 10000 -> 10 seconds
    waitForConnections: true, // Default: true
    queueLimit: 0, // Default: 0
  });
};

exports.createTcpPool = () => {
  // Extract host and port from socket address
  // const dbSocketAddr = process.env.DB_HOST.split(':');

  // Establish a connection to the database
  return mysql.createPool({
    user: functions.config().mysql.db_user, // e.g. 'my-db-user'
    password: functions.config().mysql.db_pass, // e.g. 'my-db-password'
    database: functions.config().mysql.db_name, // e.g. 'my-database'
    host: "127.0.0.1", // e.g. '127.0.0.1'
    port: "3307", // e.g. '3306'
    // ... Specify additional properties here.
    connectionLimit: 5,
    connectTimeout: 60000, // 10000 -> 10 seconds
    acquireTimeout: 60000, // 10000 -> 10 seconds
    waitForConnections: true, // Default: true
    queueLimit: 0, // Default: 0
  });
};
