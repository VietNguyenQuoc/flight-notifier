const { formatPrice } = require("../../../infra/utils");
const BOOK_FLIGHT_URL = "https://www.traveloka.com/en-vn/prebooking/";

const composePriceChangedMailOptions = (flightData, sessionKey, receiver) => {
  const {
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate,
    departureTime,
    price,
    previousPrice,
    currency
  } = flightData;

  const [year, month, day] = flightDate.split('-');
  const [hour, minute] = departureTime.split(':');

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
    flightDate,
    departureTime,
    price,
    currency
  } = flightData;

  const [year, month, day] = flightDate.split('-');
  const [hour, minute] = departureTime.split(':');

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

module.exports = {
  composePriceChangedMailOptions,
  composeSuccessfulSubscriptionMailOptions
}