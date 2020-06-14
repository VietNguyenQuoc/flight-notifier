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

module.exports = isEmpty;
