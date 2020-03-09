const express = require("express");
const app = express();
const redis = require("redis");
const { promisify: prmsf } = require("util");
const { fork } = require("child_process");

// Initialize redis client
const client = redis.createClient();

const promisify = func => prmsf(func).bind(client);

app.use(express.json());

app.post("/flight/subscribe", async (req, res) => {
  const {
    email,
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate,
    key: sessionKey
  } = req.body;

  const data = JSON.stringify({
    email,
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate,
    sessionKey
  });

  const key = JSON.stringify({
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate
  });

  if (await promisify(client.hexists)(`users:${email}`, key)) {
    return res.status(400).send("This flight has already been monitoring.");
  }

  const flightNotifyForked = fork("flightNumber.js", [data]);

  flightNotifyForked.on("message", msg => {
    if (msg === "ok") {
      client.hset(`users:${email}`, key, flightNotifyForked.pid);
      return res.status(200).json({
        success: true,
        message:
          "Successfully subcribed to the flight price change. You will be notified via email. Thank you"
      });
    }
  });
});

app.get("/flight/subscribe/:email", async (req, res) => {
  const { email } = req.params;

  const data = await promisify(client.hgetall)(`users:${email}`);
  if (!data) return res.status(404).send("Email subscription not found.");

  const flights = Object.keys(data).map(key => ({
    ...JSON.parse(key),
    pid: parseInt(data[key])
  }));

  return res.status(200).json({
    success: true,
    data: flights
  });
});

app.post("/flight/unsubscribe", async (req, res) => {
  try {
    const { email, pid: kPid } = req.body;

    const data = await promisify(client.hgetall)(`users:${email}`);
    if (!data)
      return res.status(404).json({
        success: false,
        message: "The subscription not found"
      });

    const field = Object.keys(data)[
      Object.values(data).findIndex(pid => parseInt(pid) === kPid)
    ];

    if (!field)
      return res.status(404).json({
        success: false,
        message: "The subscription not found"
      });

    await promisify(client.hdel)(`users:${email}`, field);
    process.kill(kPid);

    return res.status(200).json({
      success: true,
      message: "Sucessfully unsubscribed"
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e.message
    });
  }
});

app.listen(1507, () => {
  console.log(`Flight price notifier is listening...`);
});
