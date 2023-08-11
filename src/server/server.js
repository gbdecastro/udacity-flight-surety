const FlightSuretyAppABI = require('../../build/contracts/FlightSuretyApp.json');
const Config = require('./config.json');
const Web3 = require('web3');
const express = require('express');
const cors = require('cors');

// INITIALIZE EXPRESS
const app = express();
app.use(cors());

// WEB3 INTIALIZATION
let web3ProviderWebSocketUrl = Config["localhost"].url.replace('http', 'ws');
let web3 = new Web3(new Web3.providers.WebsocketProvider(web3ProviderWebSocketUrl));
web3.eth.defaultAccount = web3.eth.accounts[0];

// REFERENCE TO DEPLOYED CONTRACT INSTANCE
let flightSuretyApp = new web3.eth.Contract(FlightSuretyAppABI.abi, Config["localhost"].appAddress);

// // LISTEN FOR 'OracleRequest' EVENT
// flightSuretyApp.OracleRequest({}, (error, result) => {
//   if (error) console.error(error);
//   console.log(`ORACLE REQUEST => index: ${result.args.index}, flight: ${result.args.flight}, timestamp: ${result.args.timestamp}\n`);
// });

const flights = [
    {"id": 0, "name": "JJ3720"},
    {"id": 1, "name": "JJ4732"},
    {"id": 2, "name": "AD2626"},
    {"id": 3, "name": "AD2413"},
    {"id": 4, "name": "AD2950"},
    {"id": 5, "name": "G35638"},
    {"id": 6, "name": "AD4120"}
]

let oracleAddress = [];
let eventIndex = null;


function registerOracles() {
    return new Promise((resolve, reject) => {
        web3.eth.getAccounts().then(accounts => {
            let rounds = 2
            let oracles = [];
            flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
                accounts.slice(5, 7).forEach(account => {
                    flightSuretyApp.methods.registerOracle().send({
                        from: account,
                        value: fee,
                        gas: 999999,
                        gasPrice: 200000000
                    }).then(() => {
                        flightSuretyApp.methods.getMyIndexes().call({
                            from: account
                        }).then(result => {
                            oracles.push(result);
                            oracleAddress.push(account);
                            console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]} at ${account}`);
                            rounds -= 1;
                            if (!rounds) {
                                resolve(oracles);
                            }
                        }).catch(err => {
                            reject(err);
                        });
                    }).catch(err => {
                        reject(err);
                    });
                });

            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            console.error(err);
            reject(err);
        });
    });
}

function setExpressRouters() {
    app.get('/api', (req, res) => {
        res.send({
            message: 'API Online!'
        })
    })

    app.get('/flights', (req, res) => {
        res.json({
            result: flights
        })
    })

    app.get('/eventIndex', (req, res) => {
        res.json({
            result: eventIndex
        })
    })
    console.log("Express routers defined!");
}

function watchEvents() {
    flightSuretyApp.events.SubmitOracleResponse({fromBlock: "latest"}, (error, event) => {
        if (error) {
            console.log(error)
        }

        console.log(event);

        let airline = event.returnValues.airline;
        let flight = event.returnValues.flight;
        let timestamp = event.returnValues.timestamp;
        let indexes = event.returnValues.indexes;
        let statusCode = event.returnValues.statusCode;

        for (let a = 0; a < oracleAddress.length; a++) {
            console.log("Oracle loop ", a);
            flightSuretyApp.methods.submitOracleResponse(indexes, airline, flight, timestamp, statusCode)
                .send({
                    from: oracleAddress[a]
                }).then(result => {
                console.log(result);
            }).catch(err => {
                console.log("Oracle didn't respond");

            });
        }

    });

    flightSuretyApp.events.RegisterAirline({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log('Register Airline event: ', event)
    });

    flightSuretyApp.events.FundedAirlines({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log(event)
    });

    flightSuretyApp.events.PurchaseInsurance({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log(event)
    });

    flightSuretyApp.events.CreditInsurees({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log(event)
    });

    flightSuretyApp.events.Withdraw({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log(event)
    });

    flightSuretyApp.events.OracleRequest({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)

        eventIndex = event.returnValues.index;
        console.log(event)
    });

    flightSuretyApp.events.OracleReport({fromBlock: 0}, (error, event) => {
        if (error) console.log(error)
        console.log(event)
    });
}

registerOracles().then(oracles => {
    console.log("Oracles registered");
    setExpressRouters();
    // To show events (DEBUG)
    watchEvents();
}).catch(err => {
    console.log('Error to Initial Oracle: ', err.message);
})


export default app;