const isEmpty = obj => {
  switch (obj.constructor) {
    case Object: {
      return Object.keys(obj).length === 0;
    }
    case Array: {
      return obj.length === 0;
    }
    case String: {
      return obj.length === 0;
    }
  }
};

const searchDataTemplate = () => {
  return {
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
};

module.exports = {
  isEmpty,
  searchDataTemplate
};
