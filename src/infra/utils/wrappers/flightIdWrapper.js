module.exports = ({
  flightNumber,
  departureAirport,
  arrivalAirport,
  flightDate
}) =>
  JSON.stringify({
    flightNumber,
    departureAirport,
    arrivalAirport,
    flightDate
  });
