const formatStringPrice = price => {
  const s = price.split("");
  let x = [];
  let c = 0;
  while (s.length) {
    if (c && c % 3 === 0) {
      x.push(".");
    }
    x.push(s.pop());
    c++;
  }

  return x.reverse().join("");
};

module.exports = price => {
  switch (typeof price) {
    case "number": {
      return formatStringPrice(price.toString());
    }

    case "string": {
      return formatStringPrice(price);
    }
  }
};
