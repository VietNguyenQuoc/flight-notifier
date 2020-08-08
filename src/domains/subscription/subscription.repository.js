const { Subscription, Flight } = require('../../infra/db/sequelize/models');

const createSubscription = async subscriptionDto => {
  return await Subscription.create(subscriptionDto);
}

const getAllSubscriptionsByUserId = async (userId, conditions) => {
  return await Subscription.findAll({
    where: { userId, ...conditions },
    include: Flight
  });
}

const getSubscription = async (conditions = {}) => {
  return await Subscription.findOne({ where: conditions });
}

const getSubscriptionByUserId = async (userId, subscriptionId) => {
  return await Subscription.findOne({ where: { id: subscriptionId, userId }, include: Flight });
}

const getSubscriptionByFlightData = async (userId, flightData = {}) => {
  return await Subscription.findOne({
    where: { userId, status: 'active' },
    include: [
      {
        model: Flight,
        where: flightData,
        required: true
      }
    ]
  });
}

const updateSubscription = async (id, data) => {
  return await Subscription.update(data, { where: { id } });
}

const countFlightSubscribers = async flightId => {
  return await Subscription.count({ where: { flightId, status: 'active' } });
}

module.exports = {
  createSubscription,
  getAllSubscriptionsByUserId,
  getSubscriptionByUserId,
  getSubscriptionByFlightData,
  getSubscription,
  updateSubscription,
  countFlightSubscribers,
}
