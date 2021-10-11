/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

const functions = require("firebase-functions");

const admin = require("firebase-admin");
const serviceAccount = require("../secrets/mit-xpro-319116-firebase-adminsdk-q8fc2-4e20db433b.json");
// const serviceAccount = require("../secrets/mit-xpro-319116-firebase-adminsdk-q8fc2-525e7b9976.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mit-xpro-319116-default-rtdb.firebaseio.com",
});

const mySqlDb = require("./database");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});



exports.createUserAccount_Authenticated = functions.https.onRequest((request, response) => {
    // request object :
    // 
    // const requestObject = {
    //     id_token:id_token,
    //     Fname : Fname, 
    //     Lname : Lname, 
    //     Email : Email, 
    //     Telephone : Telephone
    //   }
    // response object 
    // 'authentication_failed'
    // 'sql_error'
    //  {   CustomerId:'ben@nutrition.engineering',
    //      Fname:"Ben",Lname:"Gross",
    //      Email:'ben@nutrition.engineering',
    //      Telephone:"999-999-9999",
    //      AccountNumber:7,
    //      AccountBalance:100,
    //      TransactionHistory:[]
    //   }



    functions.logger.info(`inside createUserAccountWithEmail_Authenticated`, { structuredData: true });
    functions.logger.info(`request.body = ${request.body}`, { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");
    const requestObject = JSON.parse(request.body);
    const id_token = requestObject.id_token;
    const Fname = requestObject.Fname;
    const Lname = requestObject.Lname;
    const Telephone = requestObject.Telephone;
    const contact_email = requestObject.Email;


    functions.logger.info(`id_token = ${id_token}`, { structuredData: true });

    if (id_token) {
        // functions.logger.info(`id_token = ${id_token}`, {structuredData: true});
        // response.send(`id_token = ${id_token}`); 
        admin.auth().verifyIdToken(id_token)
            .then((decodedToken) => {
                functions.logger.info(`Authentication succeded`, { structuredData: true });
                functions.logger.info(`decodedToken = ${decodedToken}`, { structuredData: true });
                const email = decodedToken.email;
                functions.logger.info(`email = ${email}`, { structuredData: true });

                // const queryString = `SELECT *  FROM CustomersTable WHERE CustomerId = ${email};`
                // const getMaxCustomerId_queryString = `SELECT MAX(CustomerId) FROM CustomersTable;`;
                const queryString_selectMaxAccountNumber = `SELECT MAX(AccountNumber) FROM CustomersTable;`;

                getQuery(queryString_selectMaxAccountNumber)
                    .then(results => {
                        const nextAccountNumber = results[0]['MAX(AccountNumber)'] + 1;
                        const queryString_setNewAccount = `INSERT INTO CustomersTable(CustomerId, Fname, Lname, Email, Telephone, AccountNumber, AccountBalance) VALUES ('${email}','${Fname}','${Lname}','${contact_email}','${Telephone}',${nextAccountNumber},100.00) ;`;
                        
                        functions.logger.info(`queryString_setNewAccount =  ${queryString_setNewAccount}`, { structuredData: true });

                        getQuery(queryString_setNewAccount)
                            .then(() => {
                                functions.logger.info('new account success! ', { structuredData: true });
                                // #region get new account and get transaction history
                                const queryString_getNewAccount = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
                                getQuery(queryString_getNewAccount)
                                    .then((results) => {
                                        let badBankUser = results[0];
                                        badBankUser['TransactionHistory'] = [];
                                        functions.logger.info('sending badBankUser = ', { structuredData: true });
                                        functions.logger.info(badBankUser, { structuredData: true });
                                        response.send(badBankUser);
                                    })
                                    .catch((error) => {
                                        functions.logger.error(error, { structuredData: true });
                                        response.send('sql_error');
                                    });
                                // #endregion
                            })
                            .catch((error) => {
                                functions.logger.error(error, { structuredData: true });
                                response.send('sql_error');
                            });

                    })
                    .catch(error => {
                        functions.logger.error(error, { structuredData: true });
                        response.send('sql_error');
                    });
            })
            .catch((error) => {
                functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
                response.send('authentication_failed');
            });

    }
    else {
        functions.logger.info("no_id_token", { structuredData: true });
        response.send('authentication_failed');
    }

});

exports.getUserAccount_Authenticated = functions.https.onRequest((request, response) => {
    functions.logger.info(" inside getUserAccount_Authenticated", { structuredData: true });

        // const requestObject = {
    //     id_token:id_token
    //   }
    // response object 
    // 'authentication_failed'
    // 'sql_error'
    //  {   CustomerId:'ben@nutrition.engineering',
    //      Fname:"Ben",
    //      Lname:"Gross",
    //      Email:'ben@nutrition.engineering',
    //      Telephone:"999-999-9999",
    //      AccountNumber:7,
    //      AccountBalance:100,
    //      TransactionHistory:[]
    //   }

    response.set("Access-Control-Allow-Origin", "*");

    const requestObject = JSON.parse(request.body);
    const id_token = requestObject.id_token;


    functions.logger.info(`id_token = ${id_token}`, { structuredData: true });

    if (id_token) {
        // functions.logger.info(`id_token = ${id_token}`, {structuredData: true});
        // response.send(`id_token = ${id_token}`); 
        admin.auth().verifyIdToken(id_token)
            .then((decodedToken) => {
                functions.logger.info(`Authentication succeded`, { structuredData: true });
                functions.logger.info(`decodedToken = ${decodedToken}`, { structuredData: true });
                const email = decodedToken.email;
                functions.logger.info(`email = ${email}`, { structuredData: true });

                // #region get new account and get transaction history
                const queryString_getNewAccount = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
                getQuery(queryString_getNewAccount)
                    .then((results) => {
                        let badBankUser = results[0];
                        // need to get transaction history here 
                        badBankUser['TransactionHistory'] = [];
                        functions.logger.info('sending badBankUser = ', { structuredData: true });
                        functions.logger.info(badBankUser, { structuredData: true });
                        response.send(badBankUser);
                    })
                    .catch((error) => {
                        functions.logger.error(error, { structuredData: true });
                        response.send('sql_error');
                    });
                // #endregion
            })
            .catch((error) => {
                functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
                response.send('authentication_failed');
            });

    }
    else {
        functions.logger.info("no_id_token", { structuredData: true });
        response.send('authentication_failed');
    }

    // const id_token = JSON.parse(request.body).id_token; 
    // functions.logger.info(`received id_token = ${id_token}`, {structuredData: true});


});


function getQuery(queryString) {
    return new Promise((resolve, reject) => {
        // mySqlDb.createUnixSocketPool()
        mySqlDb.createTcpPool()
            .then((pool) => {
                //   const queryString = "SELECT Fname FROM CustomersTable WHERE Fname LIKE '%shaq%';";
                pool.query(queryString)
                    .then((results) => {
                        resolve(results);
                    })
                    .catch((error) => {
                        functions.logger.error("error inside pool.query", { structuredData: true });
                        console.log("error inside pool.query");
                        reject(error);
                    });
            })
            .catch((error) => {
                functions.logger.error("error inside createPool", { structuredData: true });
                console.log("error inside createPool");
                functions.logger.error(error, { structuredData: true });
                // reject(new Error("sql_error"));
                reject(error);
            });
    });
}



