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
                        let queryString_setNewAccount = `INSERT INTO CustomersTable(CustomerId, Fname, Lname, Email, Telephone, AccountNumber, AccountBalance) VALUES ('${email}','${Fname}','${Lname}','${contact_email}','${Telephone}',${nextAccountNumber},100.00) ; `;
                        functions.logger.info(`queryString_setNewAccount =  ${queryString_setNewAccount}`, { structuredData: true });

                        getQuery(queryString_setNewAccount)
                            .then(() => {
                                functions.logger.info('new account success! ', { structuredData: true });
                                // set new transaction
                                const queryString_setNewTransaction = `INSERT INTO TransactionsTable(AccountNumber, TransactionTime,TransactionAmount,Payee,AccountBalanceBefore,AccountBalanceAfter) VALUES (${nextAccountNumber},${Date.now()},100.0,'Bad Bank Welcome Gift',0.00,100.0) ; `;
                                getQuery(queryString_setNewTransaction)
                                    .then(() => {
                                        functions.logger.info('new transaction success! ', { structuredData: true });
                                        // #region get new account and get transaction history
                                        const queryString_getNewAccount = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
                                        getQuery(queryString_getNewAccount)
                                            .then((results) => {
                                                let badBankUser = results[0];
                                                badBankUser['TransactionHistory'] = [];

                                                const queryString_getNewTransaction = `SELECT * FROM TransactionsTable WHERE AccountNumber=${nextAccountNumber} ORDER BY TransactionTime DESC; `;
                                                getQuery(queryString_getNewTransaction)
                                                    .then((results) => {
                                                        functions.logger.info('got transaction history! ', { structuredData: true });
                                                        badBankUser.TransactionHistory = results;

                                                        functions.logger.info('sending badBankUser = ', { structuredData: true });
                                                        functions.logger.info(badBankUser, { structuredData: true });
                                                        response.send(badBankUser);
                                                    })
                                                    .catch((error) => {
                                                        functions.logger.error(error, { structuredData: true });
                                                        response.send('sql_error');
                                                    });


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
                        if (typeof badBankUser !== 'undefined') {
                            badBankUser['TransactionHistory'] = [];
                            const queryString_getNewTransaction = `SELECT * FROM TransactionsTable WHERE AccountNumber=${badBankUser.AccountNumber}  ORDER BY TransactionTime DESC; `;
                            getQuery(queryString_getNewTransaction)
                                .then((results) => {
                                    badBankUser.TransactionHistory = results;
                                    functions.logger.info('sending badBankUser = ', { structuredData: true });
                                    functions.logger.info(badBankUser, { structuredData: true });
                                    response.send(badBankUser);
                                })
                                .catch((error) => {
                                    functions.logger.error(error, { structuredData: true });
                                    response.send('sql_error');
                                });
                        }
                        else {
                            functions.logger.info('user_not_set_up', { structuredData: true });
                            response.send('user_not_set_up');

                        }
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

exports.deposit_Authenticated = functions.https.onRequest(async (request, response) => {
    functions.logger.info(" inside deposit_Authenticated", { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");

    // const requestObject = {
    //     id_token:id_token,
    //      amount:amount 
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

    const requestObject = JSON.parse(request.body);
    const id_token = requestObject.id_token;
    const amount = requestObject.amount;
    let decodedToken;
    if (id_token) {
        try {
            decodedToken = await admin.auth().verifyIdToken(id_token);
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('authentication_failed');
            return null;
        }
        // const decodedToken = await admin.auth().verifyIdToken(id_token);
        const email = decodedToken.email;
        const queryString_getAccountBalance = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
        const account_results = await getQuery(queryString_getAccountBalance);
        let badBankUser = account_results[0];
        const AccountBalance = badBankUser.AccountBalance;
        const AccountNumber = badBankUser.AccountNumber;

        const NewAccountBalance = parseFloat(AccountBalance) + parseFloat(amount);
        // for sending back to client: 
        badBankUser.AccountBalance = NewAccountBalance;
        try {
            // write new account balance
            const queryString_setAccountBalance = `UPDATE CustomersTable SET AccountBalance=${NewAccountBalance} WHERE CustomerId='${email}';`
            functions.logger.info(`queryString_setAccountBalance = ${queryString_setAccountBalance}`, { structuredData: true });

            await getQuery(queryString_setAccountBalance);
            // for sending back to client: 
            badBankUser.AccountBalance = NewAccountBalance;
            // write new transaction 
            const queryString_setNewTransaction = `INSERT INTO TransactionsTable(AccountNumber, TransactionTime,TransactionAmount,Payee,AccountBalanceBefore,AccountBalanceAfter) VALUES (${AccountNumber},${Date.now()},${amount},'Deposit',${AccountBalance},${NewAccountBalance}) ; `;
            await getQuery(queryString_setNewTransaction);
            // get transactions 
            const queryString_getNewTransaction = `SELECT * FROM TransactionsTable WHERE AccountNumber=${AccountNumber} ORDER BY TransactionTime DESC; `;
            const transaction_results = await getQuery(queryString_getNewTransaction);
            badBankUser['TransactionHistory'] = transaction_results;
            functions.logger.info('sending badBankUser = ', { structuredData: true });
            functions.logger.info(badBankUser, { structuredData: true });
            response.send(badBankUser);
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('sql_error');
            return null;
        }


    }
});

exports.withdraw_Authenticated = functions.https.onRequest(async (request, response) => {
    functions.logger.info(" inside withdraw_Authenticated", { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");

    // const requestObject = {
    //     id_token:id_token,
    //      amount:amount 
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

    const requestObject = JSON.parse(request.body);
    const id_token = requestObject.id_token;
    const amount = requestObject.amount;
    let decodedToken;
    if (id_token) {
        try {
            decodedToken = await admin.auth().verifyIdToken(id_token);
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('authentication_failed');
            return null;
        }
        // const decodedToken = await admin.auth().verifyIdToken(id_token);
        const email = decodedToken.email;
        const queryString_getAccountBalance = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
        const account_results = await getQuery(queryString_getAccountBalance);
        let badBankUser = account_results[0];
        const AccountBalance = badBankUser.AccountBalance;
        const AccountNumber = badBankUser.AccountNumber;

        const NewAccountBalance = parseFloat(AccountBalance) - parseFloat(amount);
        // for sending back to client: 
        badBankUser.AccountBalance = NewAccountBalance;
        try {
            // write new account balance
            const queryString_setAccountBalance = `UPDATE CustomersTable SET AccountBalance=${NewAccountBalance} WHERE CustomerId='${email}';`
            functions.logger.info(`queryString_setAccountBalance = ${queryString_setAccountBalance}`, { structuredData: true });

            await getQuery(queryString_setAccountBalance);
            // for sending back to client: 
            badBankUser.AccountBalance = NewAccountBalance;
            // write new transaction 
            const queryString_setNewTransaction = `INSERT INTO TransactionsTable(AccountNumber, TransactionTime,TransactionAmount,Payee,AccountBalanceBefore,AccountBalanceAfter) VALUES (${AccountNumber},${Date.now()},-${amount},'Withdrawal',${AccountBalance},${NewAccountBalance}) ; `;
            await getQuery(queryString_setNewTransaction);
            // get transactions 
            const queryString_getNewTransaction = `SELECT * FROM TransactionsTable WHERE AccountNumber=${AccountNumber} ORDER BY TransactionTime DESC; `;
            const transaction_results = await getQuery(queryString_getNewTransaction);
            badBankUser['TransactionHistory'] = transaction_results;
            functions.logger.info('sending badBankUser = ', { structuredData: true });
            functions.logger.info(badBankUser, { structuredData: true });
            response.send(badBankUser);
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('sql_error');
            return null;
        }


    }
});

exports.createGoogleUserAccount_Authenticated = functions.https.onRequest(async (request, response) => {
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
    functions.logger.info(`inside createGoogleUserAccount_Authenticated`, { structuredData: true });
    functions.logger.info(`request.body = ${request.body}`, { structuredData: true });
    response.set("Access-Control-Allow-Origin", "*");
    const requestObject = JSON.parse(request.body);
    const id_token = requestObject.id_token;
    const Fname = requestObject.Fname;
    const Lname = requestObject.Lname;
    const Telephone = requestObject.Telephone;

    let decodedToken; 

    if (id_token) {
        try {
            decodedToken = await admin.auth().verifyIdToken(id_token);
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('authentication_failed');
            return null;
        }
        try {
            const email = decodedToken.email;
            const queryString_selectMaxAccountNumber = `SELECT MAX(AccountNumber) FROM CustomersTable;`;
            const results_1 = await getQuery(queryString_selectMaxAccountNumber);
            const nextAccountNumber = results_1[0]['MAX(AccountNumber)'] + 1;
            const queryString_setNewAccount = `INSERT INTO CustomersTable(CustomerId, Fname, Lname, Email, Telephone, AccountNumber, AccountBalance) VALUES ('${email}','${Fname}','${Lname}','${email}','${Telephone}',${nextAccountNumber},100.00) ; `;
            await getQuery(queryString_setNewAccount);
            const queryString_setNewTransaction = `INSERT INTO TransactionsTable(AccountNumber, TransactionTime,TransactionAmount,Payee,AccountBalanceBefore,AccountBalanceAfter) VALUES (${nextAccountNumber},${Date.now()},100.0,'Bad Bank Welcome Gift',0.00,100.0) ; `;
            await getQuery(queryString_setNewTransaction);
            const queryString_getNewAccount = `SELECT * FROM CustomersTable WHERE CustomerId='${email}'; `;
            const results_2 = await getQuery(queryString_getNewAccount);
            let badBankUser = results_2[0];
            badBankUser['TransactionHistory'] = [];
            const queryString_getNewTransaction = `SELECT * FROM TransactionsTable WHERE AccountNumber=${nextAccountNumber} ORDER BY TransactionTime DESC; `;
            const results_3 = await getQuery(queryString_getNewTransaction);
            badBankUser.TransactionHistory = results_3;
            functions.logger.info('sending google badBankUser = ', { structuredData: true });
            functions.logger.info(badBankUser, { structuredData: true });
            response.send(badBankUser);
            return null;
        }
        catch (error) {
            functions.logger.info(`error = ${JSON.stringify(error)}`, { structuredData: true });
            response.send('sql_error');
            return null;
        }


    }
    else {
        functions.logger.info("no_id_token", { structuredData: true });
        response.send('authentication_failed');
        return null;
    }

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



