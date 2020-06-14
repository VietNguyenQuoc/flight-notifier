const router = require('express').Router();
const auth = require("../middlewares/auth");
const flightIdWrapper = require("../../infra/utils/wrappers/flightIdWrapper");
const client = require('../../infra/db/in-memory/redis');
const Queue = require('bull');
const FlightServices = require('../../domains/Flight/Flight.Services');

const queue = new Queue('monitoring_flights');

router.get("/subscribe", auth, async (req, res) => {
  const { email } = req.user;

  const flights = await FlightServices.getAllSubscription(email);

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

  const key = flightIdWrapper(req.body);

  if (await FlightServices.isFlightExist()) {
    return res.status(400).send("This flight has already been monitoring.");
  }

  queue.process(key, async job => {
    const {
      email,
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate,
      sessionKey,
      latestPrice } = job.data;
    console.log(job.data.latestPrice);
    const flightData = await FlightServices.getFlightData({ flightNumber, flightDate, arrivalAirport, departureAirport });
    await FlightServices.notifyUserOnFlight({ ...flightData, email, latestPrice, sessionKey });
    return await job.update({ ...job.data, latestPrice: flightData.price });
  });

  const job = await queue.add(key, {
    email,
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate,
    sessionKey
  }, { repeat: { every: 1000 } });

  client.hset(`monitoring_flights:${email}`, key, job.id);
  return res.status(200).json({
    success: true,
    message:
      "Successfully subscribed to the flight price change. You will be notified via email. Thank you",
    data: { id: key, pid: job.id }
  });
});

router.post("/subscribe/detail", auth, async (req, res) => {
  const { email } = req.user;

  const flightId = flightIdWrapper(req.body);
  const flight = await FlightServices.getFlightByKey(email, flightId);
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
  const { email } = req.user;
  const { id: key } = req.body;

  await FlightServices.unsubscribe(email, key)
    .catch(e => { return res.status(400).send(e.message) })

  return res.status(200).json({
    success: true,
    message: "Sucessfully unsubscribed"
  });
});

module.exports = router;