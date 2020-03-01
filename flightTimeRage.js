const axios = require("axios");
const mail = require("nodemailer");

const transport = mail.createTransport({
  service: "gmail",
  auth: {
    user: "nqviet157@gmail.com",
    pass: "quocviet"
  }
});

const mailOptions = {
  from: "1414660@hcmut.edu.vn",
  to: "nqviet157@gmail.com"
};

const searchData = {
  clientInterface: "desktop",
  data: {
    currency: "VND",
    destinationAirportOrArea: "HUI",
    flightDate: { day: "21", month: "02", year: "2020" },
    locale: "en_VN",
    newResult: true,
    numSeats: { numAdults: "1", numChildren: "0", numInfants: "0" },
    seatPublishedClass: "ECONOMY",
    seqNo: null,
    sortFilter: {
      filterAirlines: [],
      filterArrive: [],
      filterDepart: [],
      filterTransit: [],
      selectedDeparture: "",
      sort: null
    },
    sourceAirportOrArea: "SGN",
    searchId: null,
    usePromoFinder: false,
    useDateFlow: true,
    visitId: "f0b1e02f-91a0-4918-bb88-2736dca8d616"
  },
  fields: []
};

const cookie = `tv-repeat-visit=true; G_ENABLED_IDPS=google; ajs_group_id=null; _ga=GA1.2.1429962272.1575883533; _gcl_au=1.1.1559476804.1575883533; ajs_anonymous_id=%228a8bedd0-5486-4784-9b4a-54a113307a5d%22; __ssid=29736ead2bda00f2f29b8add9eb5049; flightFlightType=ONE_WAY; flightNumOfAdults=1; flightNumChildren=0; flightNumInfants=0; flightSeatClassType=ECONOMY; flexibility=0; cto_lwid=93601008-0edd-4f28-ae8c-8e6691c45885; useDateFlow=true; ContactData={"LAST_FIRST_NAME":{"isCollapse":false,"refill":false,"value":{"travelerForm":{"formInput":{"title":"","name.last":"Nguyen","name.first":"Quoc Viet","phoneNumber":{"phoneNumber":"916121519","countryCode":"+84"},"emailAddress":"nqviet157@gmail.com","birthDate":""},"isValid":true}}}}; fbm_327855397302636=base_domain=.www.traveloka.com; ajs_user_id=%2296794236%22; flightDepartureDate=3-1-2020; flightSourceAirport=SGN; flightSourceLocation=Ho%20Chi%20Minh%20City; flightDestinationAirport=HUI; flightDestinationLocation=Hue; tv-pnheader=1; _gid=GA1.2.2078073894.1577161180; lux_uid=157724508937736759; tvl=qgdHX7GvehrD9XH5a3S4PdE8AYpuF3hYPaT5bxhY7ZZ/HKDjIBgz17aqI5Em2wKuHPokSDqjLI9S5zYYPIYcPwumPAl9g8LzkZmReA2NITnjDts3nW0X3KW6jwqRIjamIgdetETRv8AzkktrZwymJ1d8I6DHpwNrNufdf5Ywfxc5kJU4V6rTFRN0S5qNNt0ypBu2U4IQW2Elb7cOx8/UBwZSi+YnY8cSKxv3UGxjlerV7MvKTEfbAQAo3Gaq7QVzlkLqeblckL22ML73tOo7rg==; tvs=qgdHX7GvehrD9XH5a3S4PXWKx93/3Xi103f/kPpnhg1IQez7AjqOPow88qqCMiL7CqvJjpn5Z2svD8QZzAmUN8I7bk86ki9gpnRvB7n1SMhlKkC+AP1MRsNF8yi1num66uGU8xnhPcVPWo/ia5JQxFtUHCIehHLTZOCQiqdYX+dkavLdHuL5giNG8aqotFC9IC7JMCec+F6jzqu/ChOZR4G6YV68HZIC986bmx7ZCKNzhqybedlp1a2IR7AJpbsPAKkqQZ4GUq1zahDLDl/D7FwWZBj17ouLNJKxgBH9LSq0BewEonTN3e0s2XslgnJMfipT+D3TSg3iGpV3xcDY+hx1YgxnOeSEm0ZkEDZsZ3Pf6u8nPJclnZIp684AwXTe; _gat=1; datadome=Bf-VEgT8heBJy--q0xBIPZZ9cZC7rmQdzc5XgJtFk4rOq9-7P0ZlJS_HiXjf2Xb3rIaluJoDinIx86ZGSWJkQT64pt8cbDKVGgJhdSkkOw`;

const getFlightsData = async () => {
  try {
    const response = await axios.post(
      "https://www.traveloka.com/api/v2/flight/search/oneway",
      searchData,
      {
        headers: {
          "x-domain": "flight",
          cookie: cookie
        }
      }
    );
    const flights = response.data.data.searchResults;

    const monitoringFlights = flights.find(fl => {
      const { flightNumber } = fl.connectingFlightRoutes[0].segments[0];

      return flightNumber === "VN-1374";
    });
    console.log(monitoringFlights);

    const flightsMapArray = monitoringFlights.map(flight => {
      const segment = flight.connectingFlightRoutes[0].segments[0];
      const {
        departureTime,
        flightNumber,
        departureAirport,
        arrivalAirport
      } = segment;
      const { amount: price, currency } = flight.desktopPrice;

      return {
        flightNumber,
        departureAirport,
        arrivalAirport,
        departureTime,
        price,
        currency
      };
    });

    const flightExtract = {};
    for (flight of flightsMapArray) {
      flightExtract[flight.flightNumber] = flight;
    }
    return flightExtract;
  } catch (ex) {
    console.log(ex);
  }
};

let flightsData = {};
const flightsNotify = async () => {
  const newData = await getFlightsData();
  let countChangePriceFlight = 0;
  let mailBody = "";

  const previousNumOfFlights = Object.keys(flightsData).length;

  for (key in newData) {
    if (Object.keys(flightsData).includes(key)) {
      flightsData[key].price = newData[key].price;
      if (flightsData[key].previousPrice !== flightsData[key].price) {
        ++countChangePriceFlight;
        flightsData[key].previousPrice = flightsData[key].price;
      }
    } else {
      flightsData[key] = newData[key];
      flightsData[key].previousPrice = flightsData[key].price;
    }
  }
  console.log(flightsData);

  for (flight in flightsData) {
    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      price,
      currency
    } = flightsData[flight];
    mailBody = mailBody.concat(
      `Flight ${flightNumber} from ${departureAirport} to ${arrivalAirport}, departure time: ${departureTime.hour}:${departureTime.minute} ==> Price ${price} ${currency}\n`
    );
  }

  const currentNumOfFlights = Object.keys(flightsData).length;
  const diffNumOfFlights = currentNumOfFlights - previousNumOfFlights;

  if (
    countChangePriceFlight > 0 ||
    previousNumOfFlights !== currentNumOfFlights
  ) {
    mailOptions.subject = `[IMPORTANT] Flights notification - ${diffNumOfFlights} ${
      diffNumOfFlights >= 0 ? ` new flight` : `flight removed`
    } - ${countChangePriceFlight} flights price changed`;
    mailOptions.text = mailBody;
    transport.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });
  }
};

flightsNotify();
setInterval(flightsNotify, 60000);
