const express = require("express");
const app = express();

const { fork } = require("child_process");
app.use(express.json());

app.post("/flight/subscribe", async (req, res) => {
  const {
    email,
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate
  } = req.body;

  const flightNotifyForked = fork("flightNumber.js", [
    JSON.stringify({
      email,
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate
    })
  ]);

  flightNotifyForked.on("message", msg => {
    if (msg === "ok") {
      return res.send(
        "Successfully subcribed to the flight price change. You will be notified via email. Thank you"
      );
    }

    if (msg === "err") {
      flightNotifyForked.kill("SIGINT");
      return res.status(400).send("Bad request");
    }
  });
});

app.listen(1507, () => {
  console.log(`Flight price notifier is listening...`);
});
