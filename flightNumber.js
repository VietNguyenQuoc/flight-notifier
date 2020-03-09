const axios = require("axios");
const sendMail = require("./services/mailer");
const { isEmpty, searchDataTemplate, formatPrice } = require("./utils");

const BOOK_FLIGHT_URL = "https://www.traveloka.com/en-vn/prebooking/";

let responsedUser = false;

const composeMailOptions = (flightData, sessionKey, receiver) => {
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

const cookie = `tv-repeat-visit=true; G_ENABLED_IDPS=google; ajs_group_id=null; _ga=GA1.2.1429962272.1575883533; _gcl_au=1.1.1559476804.1575883533; ajs_anonymous_id=%228a8bedd0-5486-4784-9b4a-54a113307a5d%22; __ssid=29736ead2bda00f2f29b8add9eb5049; flightFlightType=ONE_WAY; flightNumOfAdults=1; flightNumChildren=0; flightNumInfants=0; flightSeatClassType=ECONOMY; flexibility=0; cto_lwid=93601008-0edd-4f28-ae8c-8e6691c45885; useDateFlow=true; ContactData={"LAST_FIRST_NAME":{"isCollapse":false,"refill":false,"value":{"travelerForm":{"formInput":{"title":"","name.last":"Nguyen","name.first":"Quoc Viet","phoneNumber":{"phoneNumber":"916121519","countryCode":"+84"},"emailAddress":"nqviet157@gmail.com","birthDate":""},"isValid":true}}}}; fbm_327855397302636=base_domain=.www.traveloka.com; ajs_user_id=%2296794236%22; flightDepartureDate=3-1-2020; flightSourceAirport=SGN; flightSourceLocation=Ho%20Chi%20Minh%20City; flightDestinationAirport=HUI; flightDestinationLocation=Hue; tv-pnheader=1; _gid=GA1.2.2078073894.1577161180; lux_uid=157724508937736759; tvl=qgdHX7GvehrD9XH5a3S4PdE8AYpuF3hYPaT5bxhY7ZZ/HKDjIBgz17aqI5Em2wKuHPokSDqjLI9S5zYYPIYcPwumPAl9g8LzkZmReA2NITnjDts3nW0X3KW6jwqRIjamIgdetETRv8AzkktrZwymJ1d8I6DHpwNrNufdf5Ywfxc5kJU4V6rTFRN0S5qNNt0ypBu2U4IQW2Elb7cOx8/UBwZSi+YnY8cSKxv3UGxjlerV7MvKTEfbAQAo3Gaq7QVzlkLqeblckL22ML73tOo7rg==; tvs=qgdHX7GvehrD9XH5a3S4PXWKx93/3Xi103f/kPpnhg1IQez7AjqOPow88qqCMiL7CqvJjpn5Z2svD8QZzAmUN8I7bk86ki9gpnRvB7n1SMhlKkC+AP1MRsNF8yi1num66uGU8xnhPcVPWo/ia5JQxFtUHCIehHLTZOCQiqdYX+dkavLdHuL5giNG8aqotFC9IC7JMCec+F6jzqu/ChOZR4G6YV68HZIC986bmx7ZCKNzhqybedlp1a2IR7AJpbsPAKkqQZ4GUq1zahDLDl/D7FwWZBj17ouLNJKxgBH9LSq0BewEonTN3e0s2XslgnJMfipT+D3TSg3iGpV3xcDY+hx1YgxnOeSEm0ZkEDZsZ3Pf6u8nPJclnZIp684AwXTe; _gat=1; datadome=Bf-VEgT8heBJy--q0xBIPZZ9cZC7rmQdzc5XgJtFk4rOq9-7P0ZlJS_HiXjf2Xb3rIaluJoDinIx86ZGSWJkQT64pt8cbDKVGgJhdSkkOw`;

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
    const response = await axios.post(
      "https://www.traveloka.com/api/v2/flight/search/oneway",
      searchData,
      {
        headers: {
          "x-domain": "flight",
          cookie
        }
      }
    );
    const flights = response.data.data.searchResults;

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
    process.send("err");
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
      const mailOptions = composeMailOptions(newData, sessionKey, receiver);
      sendMail(mailOptions);
    } else {
      flightData.price = newData.price;
      flightData.departureTime = newData.departureTime;
      if (flightData.previousPrice !== flightData.price) {
        const mailOptions = composeMailOptions(flightData, receiver);
        sendMail(mailOptions);
        flightData.previousPrice = flightData.price;
      }
    }

    if (!responsedUser) {
      process.send("ok");
      responsedUser = true;
    }
  } catch (e) {
    process.emit("error");
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
  refreshSession(process.argv[2]);
}, 85000000);

process.on("message", msg => {
  if (msg === "unsubcribe") {
    process.exit(0);
  }
});
