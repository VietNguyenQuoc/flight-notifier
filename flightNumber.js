const axios = require("axios");
const sendMail = require("./services/mailer");
const { isEmpty, searchDataTemplate, formatPrice } = require("./utils");
const fetchFlights = require("./apis/fetchFlights");

const BOOK_FLIGHT_URL = "https://www.traveloka.com/en-vn/prebooking/";

let responsedUser = false;

const composePriceChangedMailOptions = (flightData, sessionKey, receiver) => {
  const {
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate: { day, month, year },
    departureTime: { hour, minute },
    price,
    previousPrice,
    currency
  } = flightData;

  const mailOptions = {
    from: "Z-flight",
    to: receiver,
    html: `
      <p>Price has changed from ${formatPrice(
      previousPrice
    )} ${currency} to ${formatPrice(price)} ${currency}</p> 
      <p>Click <a href=${BOOK_FLIGHT_URL}${sessionKey}>this link</a> to book the flight </p>
      `,
    subject: `[FLIGHT NOTIFICATION] Flight ${flightNumber} ${departureAirport}-${arrivalAirport} ${
      hour < 10 ? `0${hour}` : hour
      }:${
      minute < 10 ? `0${minute}` : minute
      } ${day}-${month}-${year} price has changed`
  };

  return mailOptions;
};

const composeSuccessfulSubscriptionMailOptions = (
  flightData,
  sessionKey,
  receiver
) => {
  const {
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate: { day, month, year },
    departureTime: { hour, minute },
    price,
    currency
  } = flightData;

  const mailOptions = {
    from: "Z-flight",
    to: receiver,
    html: `
      <p>Flight number: ${flightNumber}</p>
      <p>Departure from: ${departureAirport}</p>
      <p>Arrival to: ${arrivalAirport}</p>
      <p>Current price: ${price} ${currency}</p> 
      <p>Click <a href=${BOOK_FLIGHT_URL}${sessionKey}>this link</a> to book the flight </p>
      `,
    subject: `[FLIGHT NOTIFICATION] Flight ${flightNumber} ${departureAirport}-${arrivalAirport} ${
      hour < 10 ? `0${hour}` : hour
      }:${
      minute < 10 ? `0${minute}` : minute
      } ${day}-${month}-${year} has been successfully monitored`
  };

  return mailOptions;
};

const composeSearchData = ({
  departureAirport,
  arrivalAirport,
  flightDate
}) => {
  const searchData = searchDataTemplate();
  searchData.data.destinationAirportOrArea = arrivalAirport;
  searchData.data.sourceAirportOrArea = departureAirport;
  searchData.data.flightDate = flightDate;

  return searchData;
};

const getFlightData = async ({
  flightNumber: monitoringFlightNumber,
  departureAirport,
  arrivalAirport,
  flightDate
}) => {
  const searchData = composeSearchData({
    departureAirport,
    arrivalAirport,
    flightDate
  });
  try {
    const flights = await fetchFlights(searchData);

    let monitoringFlight = flights.find(fl => {
      const { flightNumber } = fl.connectingFlightRoutes[0].segments[0];

      return flightNumber === monitoringFlightNumber;
    });

    const segment = monitoringFlight.connectingFlightRoutes[0].segments[0];
    const {
      departureTime,
      flightNumber,
      departureAirport,
      arrivalAirport
    } = segment;
    const { amount: price, currency } = monitoringFlight.desktopPrice;

    monitoringFlight = {
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate,
      departureTime,
      price,
      currency
    };

    return monitoringFlight;
  } catch (ex) {
    console.log(ex);
    process.send("error");
  }
};

let flightData = {};

const flightsNotify = async ({
  email: receiver,
  flightNumber,
  departureAirport,
  arrivalAirport,
  flightDate,
  sessionKey
}) => {
  try {
    const newData = await getFlightData({
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate
    });

    if (isEmpty(flightData)) {
      flightData = newData;
      flightData.previousPrice = flightData.price;
      const mailOptions = composeSuccessfulSubscriptionMailOptions(
        newData,
        sessionKey,
        receiver
      );
      sendMail(mailOptions);
    } else {
      flightData.price = newData.price;
      flightData.departureTime = newData.departureTime;
      if (flightData.previousPrice !== flightData.price) {
        const mailOptions = composePriceChangedMailOptions(
          flightData,
          sessionKey,
          receiver
        );
        sendMail(mailOptions);
        flightData.previousPrice = flightData.price;
      }
    }

    if (!responsedUser) {
      process.send("ok");
      responsedUser = true;
    }
  } catch (e) {
    process.send(e);
  }
};

const refreshSession = async ({ sessionKey }) => {
  await axios.get(`${BOOK_FLIGHT_URL}${sessionKey}`);
};

flightsNotify(JSON.parse(process.argv[2]));
setInterval(() => {
  flightsNotify(JSON.parse(process.argv[2]));
}, 60000);

setInterval(() => {
  refreshSession(JSON.parse(process.argv[2]));
}, 85000000);
