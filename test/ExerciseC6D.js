var Test = require("../config/testConfig.js");
//var BigNumber = require('bignumber.js');

contract("ExerciseC6D", async (accounts) => {
  const TEST_ORACLES_COUNT = 10;
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);

    // Watch contract events
    const ON_TIME = 10;
    // let events = config.exerciseC6D.contract.events;

    // console.log(events);

    // events.watch((error, result) => {
    //   if (result.event.contract === "OracleRequest") {
    //     console.log(
    //       `\n\nOracle Requested: index: ${result.args.index.toNumber()}, flight:  ${
    //         result.args.flight
    //       }, timestamp: ${result.args.timestamp.toNumber()}`
    //     );
    //   } else {
    //     console.log(
    //       `\n\nFlight Status Available: flight: ${
    //         result.args.flight
    //       }, timestamp: ${result.args.timestamp.toNumber()}, status: ${
    //         result.args.status.toNumber() == ON_TIME ? "ON TIME" : "DELAYED"
    //       }, verified: ${result.args.verified ? "VERIFIED" : "UNVERIFIED"}`
    //     );
    //   }
    // });

    // Past events
    //events.get((error, logs) => {  });
  });

  it("can register oracles", async () => {
    // ARRANGE
    let fee = await config.exerciseC6D.REGISTRATION_FEE.call();

    // ACT
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      await config.exerciseC6D.registerOracle({
        from: accounts[a],
        value: fee,
      });
      const result = await config.exerciseC6D.getOracle(accounts[a]);
      console.log("Registering new Oracle...");
      result.forEach((r) => console.log("Oracle index:", r.toNumber()));
    }
  });

  it("can request flight status", async () => {
    // ARRANGE
    let flight = "ND1309"; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await config.exerciseC6D.fetchFlightStatus(flight, timestamp);

    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      // Get oracle information
      // For a real contract, we would not want to have this capability
      // so oracles can remain secret (at least to the extent one doesn't look
      // in the blockchain data)
      let oracleIndexes = await config.exerciseC6D.getOracle(accounts[a]);
      for (let idx = 0; idx < 3; idx++) {
        try {
          // Submit a response...it will only be accepted if there is an Index match
          const result = await config.exerciseC6D.submitOracleResponse(
            oracleIndexes[idx],
            flight,
            timestamp,
            10,
            { from: accounts[a] }
          );
          const indexRequest = result.logs[0].args.index.toNumber();
          const flightResult = result.logs[0].args.flight;
          const dateResult = result.logs[0].args.timestamp.toNumber();
          const statusResult =
            result.logs[0].args.status.toNumber() == 10 ? "On time" : "Delayed";
          const verificationResult = result.logs[0].args.verified
            ? "VERIFIED"
            : "NOT VERIFIED";

          console.log("Oracle Requested", indexRequest);
          console.log("Flight:", flightResult);
          console.log("Date", new Date(dateResult));
          console.log("Status", statusResult);
          console.log("Verification", verificationResult);

          // Check to see if flight status is available
          // Only useful while debugging since flight status is not hydrated until a
          // required threshold of oracles submit a response
          //let flightStatus = await config.exerciseC6D.viewFlightStatus(flight, timestamp);
          console.log(
            "\nPost",
            idx,
            oracleIndexes[idx].toNumber(),
            flight,
            timestamp,
            flightStatus
          );
        } catch (e) {
          // Enable this when debugging
          console.log(
            "\nError",
            idx,
            oracleIndexes[idx].toNumber(),
            flight,
            timestamp
          );
        }
      }
    }
  });
});
