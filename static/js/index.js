import swatches from "./swatches.js";

const cached = {};

export default function define(runtime, observer) {
  const main = runtime.module();

  // a dependency on "data" prevents the header from updating before the chart does
  main.variable(observer()).define(
    ["html", "currencyPair", "data"],
    (html, currencyPair, data) => html`
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
  <h1 class="h2">${currencyPair.from}-${currencyPair.to}</h1>
</div>`,
  );

  main.variable(observer("key")).define("key",
    ["swatches", "color", "margin"],
    (swatches, color, margin) => swatches({color, marginLeft: margin.left, columns: "180px"})
  );

  main.variable(observer("chart")).define("chart",
    ["d3", "width", "height", "series", "color", "area", "xAxis", "yAxis"],
    (d3,width,height,series,color,area,xAxis,yAxis) => {
      const svg = d3.create("svg")
          .attr("viewBox", [0, 0, width, height]);

      svg.append("g")
        .selectAll("path")
        .data(series)
        .join("path")
          .attr("fill", ({key}) => color(key))
          .attr("d", area)
        .append("title")
          .text(({key}) => key);

      svg.append("g")
          .call(xAxis);

      svg.append("g")
          .call(yAxis);

      return svg.node();
    },
  );
  
  function fetchOnce(url) {
    const init = {
      cache: "force-cache",
    }
    if (!(url in cached)) init.cache = "reload";
    cached[url] = true;
    return d3.json(url, init);
  }

  async function mapValuesAsync(obj, f) {
    return Object.fromEntries(await Promise.all(Object.entries(obj).map(async ([k, v]) => [k, await f(v)])))
  }

  function calcBidLiquidity(bids) {
    return d3.zip(bids.map(x => x.price), d3.reverse(d3.cumsum(d3.reverse(bids), x => x.quantity))).map(([price, liquidity]) => ({price, liquidity}))
  }

  function calcAskLiquidity(asks) {
    return d3.zip(asks.map(x => x.price), d3.cumsum(asks, x => x.quantity)).map(([price, liquidity]) => ({price, liquidity}))
  }

  function calcLiquidity(x) {
    return {
      orders: x,
      liquidity: {
        bids: calcBidLiquidity(x.bids),
        asks: calcAskLiquidity(x.asks),
      },
    }
  }

  main.variable(observer("orderBooks")).define("orderBooks",
    ["d3", "currencyPair"],
    async (d3, currencyPair) => await mapValuesAsync(
      await fetchOnce(`/api/${currencyPair.from}-${currencyPair.to}/orders`),
      async x => calcLiquidity({
        bids: d3.sort(x.bids, y => y.price),
        asks: d3.sort(x.asks, y => y.price),
      }),
    ),
  );

  // Look, ma, no server-side!
  /*
  function corsFetch(url) {
    return fetchOnce(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  }

  main.variable(observer("orderBooks")).define("orderBooks",
    ["d3", "currencyPair"],
    async (d3, currencyPair) => {
      const exchanges = {
        Bittrex: {
          url: x => `https://api.bittrex.com/v3/markets/${x.to}-${x.from}/orderbook?depth=500`,
          bids: x => x.bid,
          asks: x => x.ask,
          convert: x => ({price: Number.parseFloat(x.rate), quantity: Number.parseFloat(x.quantity)})
        },
        Poloniex: {
          url: x => `https://poloniex.com/public?command=returnOrderBook&currencyPair=${x.from}_${x.to}&depth=100`,
          bids: x => x.bids,
          asks: x => x.asks,
          convert: x => ({price: Number.parseFloat(x[0]), quantity: x[1]})
        },
        Binance: {
          url: x => `https://www.binance.com/api/v3/depth?symbol=${currencyPair.to}${currencyPair.from}&limit=500`,
          bids: x => x.bids,
          asks: x => x.asks,
          convert: x => ({price: Number.parseFloat(x[0]), quantity: Number.parseFloat(x[1])})
        },
      }

      const orderBooks = await mapValuesAsync(exchanges, async x => {
        const data = await corsFetch(x.url(currencyPair))
        return calcLiquidity({
          bids: d3.sort(x.bids(data).map(x.convert), x => x.price),
          asks: d3.sort(x.asks(data).map(x.convert), x => x.price),
        })
      })

      return orderBooks
    },
  );
  */

  main.variable(observer("rawData")).define("rawData",
    ["orderBooks", "d3", "currencyPair", "maxDepth"],
    (orderBooks, d3, currencyPair, maxDepth) => {
      const exchanges = Object.keys(orderBooks)
      const highestBidVolume = Object.fromEntries(exchanges.map(x => {
        const bids = orderBooks[x].liquidity.bids.slice(-1 * maxDepth);
        return [x, bids[0].liquidity];
      }))

      const crossoverPoints = {}
      const data = d3.sort(
          Object.entries(orderBooks)
            .flatMap(([k, v]) => (
              [].concat(
                v.liquidity.bids.slice(-1 * maxDepth).map(x => Object.assign({}, x, {exchange: k, liquidity: -1 * x.liquidity})),
                v.liquidity.asks.slice(0, maxDepth).map(x => Object.assign({}, x, {exchange: k})),
              )
            )),
          x => x.price,
        ).reduce((acc, x) => {
          const lastDatum = acc[acc.length - 1] ?? {}
          if (lastDatum[x.exchange] < 0 && x.liquidity > 0) {
            crossoverPoints[x.exchange] = [lastDatum.price, x.price]
          }
          return acc.concat([Object.assign(
            Object.fromEntries(Object.keys(orderBooks).map(x => [x, -1 * highestBidVolume[x]])),
            lastDatum,
            {
              price: x.price,
              [x.exchange]: x.liquidity,
            },
          )])
        }, [])

      return Object.assign(data, {
        columns: ["price"].concat(exchanges),
        x: `Price (${currencyPair.from})`,
        y: `Liquidity (${currencyPair.to}; asks positive, bids negative)`,
        crossoverPoints
      })
    },
  );

  main.variable(observer("spreads")).define("spreads",
    ["rawData", "d3"],
    (rawData, d3) => Object.fromEntries(Object.entries(rawData.crossoverPoints).map(([k, v]) => [k, {
      midpoint: d3.mean(v),
      size: v[1] - v[0],
    }])),
  );

  main.variable(observer("meanPrice")).define("meanPrice",
    ["d3", "spreads"],
    (d3, spreads) => d3.mean(Object.values(spreads).map(x => x.midpoint)),
  );

  main.variable(observer("maxAskVolume")).define("maxAskVolume",
    ["d3", "rawData", "categories"],
    (d3, rawData, categories) => d3.max(Object.entries(rawData[rawData.length - 1]).filter(([k, v]) => categories.includes(k)).map(([k, v]) => v)),
  );

  main.variable(observer("maxAskPrice")).define("maxAskPrice",
    ["rawData"],
    (rawData) => rawData[rawData.length - 1].price,
  );

  main.variable(observer("lowestSanePrice")).define("lowestSanePrice",
    ["rawData", "categories", "maxAskVolume"],
    (rawData, categories, maxAskVolume) => rawData.find(x => Object.entries(x).filter(([k, v]) => categories.includes(k)).map(([k, v]) => v).every(y => y >= -1 * maxAskVolume)).price,
  );

  main.variable(observer("lowestSymmetricalPrice")).define("lowestSymmetricalPrice",
    ["meanPrice", "maxAskPrice"],
    (meanPrice, maxAskPrice) => meanPrice - (maxAskPrice - meanPrice),
  );

  main.variable(observer("xKey")).define("xKey",
    ["rawData"],
    (rawData) => rawData.columns[0],
  );

  main.variable(observer("categories")).define("categories",
    ["rawData"],
    (rawData) => rawData.columns.slice(1),
  );

  main.variable(observer("data")).define("data",
    ["rawData", "onlySymmetricalVolumes", "lowestSanePrice", "onlySymmetricalPrices", "lowestSymmetricalPrice"],
    (rawData, onlySymmetricalVolumes, lowestSanePrice, onlySymmetricalPrices, lowestSymmetricalPrice) => {
      let data = Array.from(rawData)
      const extraProps = Object.fromEntries(Object.getOwnPropertyNames(rawData).slice(rawData.length).filter(x => x !== "length").map(x => [x, rawData[x]]))

      if (onlySymmetricalVolumes) {
        data = data.filter(x => x.price >= lowestSanePrice)
      }
      if (onlySymmetricalPrices) {
        data = data.filter(x => x.price >= lowestSymmetricalPrice)
      }
      return Object.assign(data, extraProps)
    },
  );

  main.variable(observer("series")).define("series",
    ["d3", "categories", "data"],
    (d3, categories, data) => d3.stack().keys(categories)(data),
  );

  main.variable(observer("area")).define("area",
    ["d3", "x", "xKey", "y"],
    (d3, x, xKey, y) => (
      d3.area()
        .x(d => x(d.data[xKey]))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
    ),
  );

  main.variable(observer("x")).define("x",
    ["d3", "data", "xKey", "margin", "width"],
    (d3, data, xKey, margin, width) => (
      d3.scaleLinear()
        .domain(d3.extent(data, d => d[xKey]))
        .range([margin.left, width - margin.right])
    ),
  );
  
  main.variable(observer("y")).define("y",
    ["d3", "series", "height", "margin"],
    (d3, series, height, margin) => (
      d3.scaleLinear()
        .domain([d3.min(series, d => d3.min(d, d => d[1])), d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top])
    ),
  );

  main.variable(observer("color")).define("color",
    ["d3", "categories"],
    (d3, categories) => (
      d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeTableau10)
    ),
  );

  main.variable(observer("xAxis")).define("xAxis",
    ["height", "margin", "d3", "x", "width", "data"],
    (height, margin, d3, x, width, data) => (
      g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.format(".4s")).tickSizeOuter(0))
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("y", "-1.5em")
          .attr("text-anchor", "end")
          .attr("font-weight", "bold")
          .text(data.x))
    ),
  );

  main.variable(observer("yAxis")).define("yAxis",
    ["margin", "d3", "y", "data"],
    (margin, d3, y, data) => (
      g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".3s")))
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", "1em")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y))
    ),
  );

  main.variable(observer("margin")).define("margin", () => ({top: 20, right: 30, bottom: 30, left: 40}));
  main.variable(observer("height")).define("height", () => 500);
  main.variable(observer("maxDepth")).define("maxDepth", () => 100);
  main.variable(observer("onlySymmetricalVolumes")).define("onlySymmetricalVolumes", () => false);
  main.variable(observer("onlySymmetricalPrices")).define("onlySymmetricalPrices", () => false);
  main.variable(observer("currencyPair")).define("currencyPair", () => ({from: "BTC", to: "ETH"}));
  main.variable(observer("d3")).define("d3", () => d3);

  main.variable(observer("maxDepthLabel")).define("maxDepthLabel",
    ["html", "maxDepth"],
    (html, maxDepth) => html`<label for="maxDepth" class="form-label">Maximum Order Book Depth: ${maxDepth}</label>`,
  )

  main.import("swatches", runtime.module(swatches));
  return main;
}
