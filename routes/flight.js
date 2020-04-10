const router = require('express').Router();
const { fork } = require("child_process");
const auth = require("../middlewares/auth");
const flightIdWrapper = require("../utils/wrappers/flightIdWrapper");
const client = require('../services/redis');

router.get("/subscribe", auth, async (req, res) => {
  const { email } = req.user;

  const data = await client.hgetall(`monitoring_flights:${email}`);
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

router.post("/subscribe", auth, async (req, res) => {
  const { email } = req.user;

  const {
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

  const key = flightIdWrapper(req.body);

  if (await client.hexists(`monitoring_flights:${email}`, key)) {
    return res.status(400).send("This flight has already been monitoring.");
  }

  const flightNotifyForked = fork("flightNumber.js", [data]);

  flightNotifyForked.on("message", msg => {
    if (msg === "ok") {
      client.hset(`monitoring_flights:${email}`, key, flightNotifyForked.pid);
      return res.status(200).json({
        success: true,
        message:
          "Successfully subscribed to the flight price change. You will be notified via email. Thank you",
        data: { id: key, pid: flightNotifyForked.pid }
      });
    }
  });
});

router.post("/subscribe/detail", auth, async (req, res) => {
  const { email } = req.user;

  const flightId = flightIdWrapper(req.body);

  const flight = await client.hget(`monitoring_flights:${email}`, flightId);

  if (!flight)
    return res.status(404).json({
      success: false,
      message: "Flight not found."
    });

  return res.status(200).json({
    success: true,
    data: { id: flightId, ...flight }
  });
});

router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { email } = req.user;
    const { id } = req.body;

    const pid = await client.hget(`monitoring_flights:${email}`, id);
    if (!pid)
      return res.status(404).json({
        success: false,
        message: "The subscription not found"
      });

    await client.hdel(`monitoring_flights:${email}`, id);
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

module.exports = router;