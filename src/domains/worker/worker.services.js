const { User, Subscription } = require('../../infra/db/sequelize/models');
const cron = require('node-cron');
const SubscriptionServices = require('../subscription/subscription.services');
const FlightServices = require('../flight/flight.services');
const { workerEmitter } = require('../../infra/services/eventEmitter');

workerEmitter.on('flight/create', flight => {
  createFlightCronJob(flight)
});

const createFlightCronJob = async flight => {
  console.log(`Cron job for flight ${flight.code}`);
  const job = cron.scheduleImmediate('*/1 * * * *', async () => {
    const subscriptions = await Subscription.findAll({ where: { flightId: flight.id, status: 'active' } });
    if (!subscriptions.length) {
      console.log(`Flight ${flight.code} has no subscribers`);
      return job.destroy();
    }
    const subscribers = await User.findAll({ where: { id: subscriptions.map(s => s.userId) }, attributes: ['email'] });
    const subEmails = subscribers.map(s => s.email);

    const [year, month, day] = flight.date.split('-');
    // Fetch new flight data from vendor
    const flightData = await FlightServices.getFlightData({
      flightExternalId: flight.externalId,
      flightDate: { year, month, day },
      arrivalAirport: flight.destination,
      departureAirport: flight.source
    });
    // Get the latest price from redis
    const latestPrice = await FlightServices.getFlightLatestPrice(flight.id);
    await SubscriptionServices.notifyUserOnFlight({ ...flightData, email: subEmails, latestPrice, sessionKey: 'abc' });
    // Update the latest price
    FlightServices.setFlightLatestPrice(flight.id, flightData.price);
  });
}

const initializeJobs = async () => {
  console.log("Initializing cron jobs...");
  const flights = await FlightServices.getAllMonitoringFlights();
  flights.forEach(createFlightCronJob);
}

module.exports = {
  initializeJobs,
}