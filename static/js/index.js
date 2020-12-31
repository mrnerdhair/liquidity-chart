const cached = {};

export default function define(runtime, observer) {
  const main = runtime.module();

  // a dependency on "data" prevents the header from updating before the chart does
  main.variable(observer()).define(["html", "currencyPair", "data"], (html, currencyPair, data) => html`
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
  <h1 class="h2">${currencyPair.from}-${currencyPair.to}</h1>
</div>
  `);

  main.variable(observer("legend")).define("legend",
    ["DOM", "html", "margin", "color", "data", "shape", "d3"],
    (DOM, html, margin, color, data, shape, d3) => {
      const id = DOM.uid().id;
      return html`<style>

.${id} {
  display: flex;
  min-height: 33px;
  font: 10px sans-serif;
  margin-left: 2em;//${margin.left}px;
  margin-bottom: 1em;
}

.${id}-item {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

</style>
<div class="${id}">${color.domain().map((name, i) => html`
  <div class="${id}-item" title="${data.labels === undefined ? "" : (data.labels[i] + "").replace(/"/g, "&quot;")}">
    <svg viewBox="-10 -10 20 20" width="20" height="20" style="margin-right: 3px;">
      <path fill="${color(name)}" d="${d3.symbol().type(d3.symbolCircle)()}"></path>
      <!--<path fill="black" d="${shape(name)}"></path>-->
    </svg>
    ${document.createTextNode(name)}
  </div>`).concat([
  html`<div class="${id}-item" title="Bid">
    <svg viewBox="-10 -10 20 20" width="20" height="20" style="margin-right: 3px;">
      <path fill="none" stroke="black" d="${d3.symbol().type(d3.symbolDiamond)()}"></path>
    </svg>
    ${document.createTextNode("Bid")}
  </div>`,
  html`<div class="${id}-item" title="Ask">
    <svg viewBox="-10 -10 20 20" width="20" height="20" style="margin-right: 3px;">
      <path fill="none" stroke="black" d="${d3.symbol().type(d3.symbolCircle)()}"></path>
    </svg>
    ${document.createTextNode("Ask")}
  </div>`
])}
</div>`;
    },
  );

  main.variable(observer("chart")).define("chart",
    ["d3", "width", "height", "xAxis", "yAxis", "grid", "data", "x", "y", "color", "shape"],
    (d3, width, height, xAxis, yAxis, grid, data, x, y, color, shape) => {
      const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

      svg.append("g")
        .call(xAxis);

      svg.append("g")
        .call(yAxis);

      svg.append("g")
        .call(grid);

      svg.append("g")
          .attr("stroke-width", 1.5)
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
        .selectAll("path")
        .data(data)
        .join("path")
          .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
          .attr("fill", d => "none")
          .attr("stroke", d => color(d.category))
          // .attr("stroke", d => (d.y > 0 ? "green" : (d.y < 0 ? "black" : "none")))//color(d.category))
          // .attr("d", d => shape(d.category));
          .attr("d", d => d3.symbol().type(d.y >= 0 ? d3.symbolCircle : d3.symbolDiamond)());

      return svg.node();
    },
  );
  
  main.variable(observer("data")).define("data",
    ["d3", "currencyPair"],
    async (d3, currencyPair) => {
      function fetchOnce(url) {
        const init = {
          cache: "force-cache",
        }
        if (!(url in cached)) init.cache = "reload";
        cached[url] = true;
        return d3.json(url, init);
      }
      
      // Look ma, no server-side!
      /*const bittrexOrderBook = await fetchOnce(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.bittrex.com/v3/markets/${currencyPair.to}-${currencyPair.from}/orderbook?depth=25`)}`);
      const poloniexOrderBook = await fetchOnce(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://poloniex.com/public?command=returnOrderBook&currencyPair=${currencyPair.from}_${currencyPair.to}&depth=25`)}`);
      const binanceOrderBook = await fetchOnce(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.binance.com/api/v3/depth?symbol=${currencyPair.to}${currencyPair.from}&limit=20`)}`);

      const bittrexData = bittrexOrderBook.bid.map(x => ({category: "Bittrex", x: Number.parseFloat(x.rate), y: -1 * Number.parseFloat(x.quantity)})).concat(bittrexOrderBook.ask.map(x => ({category: "Bittrex", x: Number.parseFloat(x.rate), y: Number.parseFloat(x.quantity)})));
      const poloniexData = poloniexOrderBook.bids.map(x => ({category: "Poloniex", x: Number.parseFloat(x[0]), y: -1 * x[1]})).concat(poloniexOrderBook.asks.map(x => ({category: "Poloniex", x: Number.parseFloat(x[0]), y: x[1]})));
      const binanceData = binanceOrderBook.bids.map(x => ({category: "Binance", x: Number.parseFloat(x[0]), y: -1 * Number.parseFloat(x[1])})).concat(binanceOrderBook.asks.map(x => ({category: "Binance", x: Number.parseFloat(x[0]), y: Number.parseFloat(x[1])})));

      const data = [].concat(bittrexData, poloniexData, binanceData);*/

      const data = (await fetchOnce(`/api/${currencyPair.from}-${currencyPair.to}/orders`)).map(order => ({
        x: order.rate,
        y: order.quantity,
        category: order.exchange,
      }))

      return Object.assign(data, {
        x: `Price (${currencyPair.from}) →`,
        y: `Available Liquidity (${currencyPair.to}; bids negative)`,
      });
    },
  );
 
  main.variable(observer("x")).define("x",
    ["d3", "data", "margin", "width"],
    (d3, data, margin, width) => (
      d3.scaleLinear()
        .domain(d3.extent(data, d => d.x)).nice()
        .range([margin.left, width - margin.right])
    ),
  );
  
  main.variable(observer("y")).define("y",
    ["d3", "data", "height", "margin"],
    (d3, data, height, margin) => (
      d3.scaleLinear()
        .domain(d3.extent(data, d => d.y)).nice()
        .range([height - margin.bottom, margin.top])
    ),
  );

  main.variable(observer("color")).define("color",
    ["d3", "data"],
    (d3, data) => d3.scaleOrdinal(data.map(d => d.category), d3.schemeCategory10),
  );

  main.variable(observer("shape")).define("shape",
    ["d3", "data"],
    (d3, data) => d3.scaleOrdinal(data.map(d => d.category), d3.symbols.map(s => d3.symbol().type(s)())),
  );

  main.variable(observer("xAxis")).define("xAxis",
    ["height", "margin", "d3", "x", "width", "data"],
    (height, margin, d3, x, width, data) => (
    g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.format(".4s")))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", width)
        .attr("y", margin.bottom - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(data.x))
    ),
  );
  
  main.variable(observer("yAxis")).define("yAxis",
    ["margin","d3","y","data"],
    (margin, d3, y, data) => (
      g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".3s")))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.y))
    ),
  );
 
  main.variable(observer("grid")).define("grid",
    ["x", "margin", "height", "y", "width"],
    (x, margin, height, y, width) => (
      g => g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call(g => g.append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
            .attr("x1", d => 0.5 + x(d))
            .attr("x2", d => 0.5 + x(d))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom))
        .call(g => g.append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right))
    ),
  );
  
  main.variable(observer("margin")).define("margin", () => ({top: 25, right: 20, bottom: 35, left: 40}));
  main.variable(observer("height")).define("height", () => 600);
  main.variable(observer("currencyPair")).define("currencyPair", () => ({from: "BTC", to: "ETH"}));
  main.variable(observer("d3")).define("d3", () => d3);
  return main;
}
