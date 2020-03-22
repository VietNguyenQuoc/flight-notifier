const express = require("express");
const app = express();
const Redis = require("ioredis");
const { promisify: prmsf } = require("util");
const { fork } = require("child_process");

// Initialize redis client
const client = new Redis();

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

  if (await client.hexists(`users:${email}`, key)) {
    return res.status(400).send("This flight has already been monitoring.");
  }

  const flightNotifyForked = fork("flightNumber.js", [data]);

  flightNotifyForked.on("message", msg => {
    if (msg === "ok") {
      client.hset(`users:${email}`, key, flightNotifyForked.pid);
      return res.status(200).json({
        success: true,
        message:
          "Successfully subcribed to the flight price change. You will be notified via email. Thank you",
        data: { id: key, pid: flightNotifyForked.pid }
      });
    }
  });
});

app.get("/flight/subscribe", async (req, res) => {
  const { email } = req.query;

  const data = await client.hgetall(`users:${email}`);
  if (!data) return res.status(404).send("Email subscription not found.");

  const flights = Object.keys(data).map(key => ({
    id: key,
    ...JSON.parse(key),
    pid: parseInt(data[key])
  }));

  return res.status(200).json({
    success: true,
    data: flights
  });
});

app.post("/flight/subscribe/detail", async (req, res) => {
  const {
    email,
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate
  } = req.body;

  const flightId = JSON.stringify({
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate
  });
  console.log(flightId);

  const flight = await client.hget(`users:${email}`, flightId);

  if (!flight)
    return res
      .status(404)
      .json({ success: false, message: "Flight not found." });

  return res
    .status(200)
    .json({ success: true, data: { id: flightId, ...flight } });
});

app.post("/flight/unsubscribe", async (req, res) => {
  try {
    const { email, id } = req.body;

    const pid = await client.hget(`users:${email}`, id);
    if (!pid)
      return res.status(404).json({
        success: false,
        message: "The subscription not found"
      });

    await client.hdel(`users:${email}`, id);
    process.kill(pid);

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
