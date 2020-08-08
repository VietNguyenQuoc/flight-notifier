const FlightRepository = require('./flight.repository');
const { searchDataTemplate } = require("../../infra/utils");

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
  flightExternalId,
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

  let monitoringFlight = flights.find(fl => fl.flightId === flightExternalId)
  if (!monitoringFlight) throw Error('Cannot get data of the monitoring flight');

  const segment = monitoringFlight.connectingFlightRoutes[0].segments[0]; /* eslint-disable-line */
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

const getAllMonitoringFlights = async () => {
  return await FlightRepository.getAllFlights();
}

const getFlightLatestPrice = async (flightId) => {
  return await FlightRepository.getFlightInMemoryValue(flightId, 'price');
}

const setFlightLatestPrice = async (flightId, price) => {
  return await FlightRepository.setFlightInMemoryValue(flightId, 'price', price);
}

module.exports = {
  getFlightData,
  getAllMonitoringFlights,
  getFlightLatestPrice,
  setFlightLatestPrice
}