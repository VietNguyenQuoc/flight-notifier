const router = require('express').Router();
const auth = require("../../app/middlewares/auth");
const SubscriptionServices = require('./subscription.services');
const asyncMiddleware = require('../../app/middlewares/asyncMiddleware');

/**
 * GET /subscribes/getAll
 * @tag Subscribes
 * @operationId getAllSubscription
 * @summary Return all subscriptions of user
 * @queryParam {string} [status=active] - Select active or all subscriptions
 * @security Bearer
 * @response 200 - An array of subscriptions
 * @response default - Internal Server Error
 */
router.get(
  "/getAll",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: userId } = req.user;
    const { status } = req.query;

    const subscriptions = await SubscriptionServices.getAllSubscription(userId, { status });

    res.status(200).send(subscriptions.map(s => {
      const [year, month, day] = s.Flight.date.split('-');
      return {
        id: s.id,
        flightNumber: s.Flight.code,
        departureAirport: s.Flight.source,
        arrivalAirport: s.Flight.destination,
        flightDate: { year, month, day }
      };
    }))
  }));

/**
 * POST /subscribes/new
 * @tag Subscribes
 * @operationId createSubscribe
 * @summary Create new subscription to a flight ticket price
 * @security Bearer
 * @response 200 - success message
 * @response default - Internal Server Error
 */
router.post(
  "/new",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: userId } = req.user;
    const {
      flightId: flightExternalId,
      flightNumber,
      departureAirport,
      arrivalAirport,
      flightDate,
      sessionKey
    } = req.body;

    await SubscriptionServices.subscribe({
      userId,
      flightExternalId,
      flightNumber,
      arrivalAirport,
      departureAirport,
      flightDate,
      sessionKey
    });

    res.status(200).send("Successfully subscribed to the flight price change. You will be notified via email. Thank you")
  }));

/**
 * POST /subscribes/check
 * @tag Subscribes
 * @operationId checkSubscription
 * @summary Check if user has already subscribed to this flight
 * @bodyContent {checkSubscription} application/json
 * @security Bearer
 * @response 200 - {success: true, data: "object"}
 * @response default - Internal Server Error
 */
router.post(
  "/check",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: userId } = req.user;
    const { flightId } = req.body;

    const subscription = await SubscriptionServices.checkSubscription({ userId, flightExternalId: flightId });
    return res.status(200).json({ success: subscription ? true : false, data: subscription });
  }));

/**
 * POST /subscribes/unsubscribe
 * @tag Subscribes
 * @operationId cancelSubscription
 * @summary Cancel a subscription
 * @bodyContent {cancelSubscription} application/json
 * @security Bearer
 * @response 200 - success message
 * @response default - Internal Server Error
 */
router.post(
  "/unsubscribe",
  auth,
  asyncMiddleware(async (req, res) => {
    const { id: userId } = req.user;
    const { subscriptionId } = req.body;

    await SubscriptionServices.unsubscribe(userId, subscriptionId);
    res.status(200).send('Successfully unsubscribed.');
  }));

module.exports = router;