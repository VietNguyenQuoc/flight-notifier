const sendMail = require("../../infra/services/mailer");
const { searchDataTemplate, formatPrice } = require("../../infra/utils");
const FlightRepository = require("./Flight.Repository");
const { Builder } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

const BOOK_FLIGHT_URL = "https://www.traveloka.com/en-vn/prebooking/";

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
  const flights = await FlightRepository.fetchFlights(searchData);

  let monitoringFlight = flights.find(fl => {
    const { flightNumber } = fl.connectingFlightRoutes[0].segments[0];

    return flightNumber === monitoringFlightNumber;
  });

  const segment = monitoringFlight.connectingFlightRoutes[0].segments[0];
  const {
    departureTime,
    flightNumber,
    departureAirport: da,
    arrivalAirport: aa
  } = segment;
  const { amount: price, currency } = monitoringFlight.desktopPrice;

  return ({
    flightNumber,
    departureAirport: da,
    arrivalAirport: aa,
    flightDate,
    departureTime,
    price,
    currency
  });
};

// const flightsNotify = async ({
//   email: receiver,
//   flightNumber,
//   departureAirport,
//   arrivalAirport,
//   flightDate,
//   sessionKey
// }) => {
//   try {
//     const newData = await getFlightData({
//       flightNumber,
//       departureAirport,
//       arrivalAirport,
//       flightDate
//     });

//     if (isEmpty(flightData)) {
//       flightData = newData;
//       flightData.previousPrice = flightData.price;
//       const mailOptions = composeSuccessfulSubscriptionMailOptions(
//         newData,
//         sessionKey,
//         receiver
//       );
//       sendMail(mailOptions);
//     } else {
//       flightData.price = newData.price;
//       flightData.departureTime = newData.departureTime;
//       if (flightData.previousPrice !== flightData.price) {
//         const mailOptions = composePriceChangedMailOptions(
//           flightData,
//           sessionKey,
//           receiver
//         );
//         sendMail(mailOptions);
//         flightData.previousPrice = flightData.price;
//       }
//     }
//   } catch (e) {
//     console.log(e);
//     throw e;
//   }
// };

const notifyUserOnFlight = async ({
  email: receiver,
  flightNumber,
  departureAirport,
  arrivalAirport,
  flightDate,
  departureTime,
  price,
  currency,
  sessionKey,
  latestPrice: previousPrice
}) => {
  try {
    const flightData = {
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate,
      departureTime,
      price,
      currency
    }

    if (!previousPrice) {
      const mailOptions = composeSuccessfulSubscriptionMailOptions(
        flightData,
        sessionKey,
        receiver
      );
      return sendMail(mailOptions);
    }

    if (previousPrice !== flightData.price) {
      const mailOptions = composePriceChangedMailOptions(
        flightData,
        sessionKey,
        receiver
      );
      return sendMail(mailOptions);
    }

    return;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const refreshBookingSession = async ({ sessionKey }) => {
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().headless()).build();
  try {
    await driver.get(`${BOOK_FLIGHT_URL}${sessionKey}`);
  }
  finally {
    setTimeout(async () => {
      await driver.quit();
    }, 10000)
  }
};

const getAllSubscription = async email => {
  const data = await FlightRepository.getAllFlightsByEmail(email)

  const flights = Object.keys(data).map(key => ({
    id: key,
    ...JSON.parse(key),
    pid: parseInt(data[key])
  }));

  return flights;
}

const getFlightByKey = async (email, key) => {
  return await FlightRepository.getFlightByKey(email, key);
}

const isFlightExist = async (email, key) => {
  return await FlightRepository.isFlightExist(email, key);
}

const unsubscribe = async (email, key) => {
  const flight = await FlightRepository.getFlightByKey(email, key);
  if (!flight) throw new Error('The subscription not found.');

  return await FlightRepository.removeFlight(email, key);
  // Remove queue job
}

module.exports = {
  getAllSubscription,
  getFlightByKey,
  isFlightExist,
  getFlightData,
  notifyUserOnFlight,
  refreshBookingSession,
  unsubscribe,
};