# liquidity-chart

This is an example app which shows how to retrieve, process, and visualize data. See it in action [here](https://liquidity-chart.herokuapp.com).

It uses [Node.js](https://nodejs.org) and [Typescript](https://www.typescriptlang.org) for the back-end, and [D3.js](https://d3js.org), [Observable](https://github.com/observablehq/runtime), and [Bootstrap](https://getbootstrap.com/) for the front end. Hosted on [Heroku](https://heroku.com).

## Data Sources

Data is collected from the order books of various cryptocurrency exchanges via their public APIs:

- [Bittrex](https://bittrex.github.io/api/v3#operation--markets--marketSymbol--orderbook-get)
- [Poloniex](https://docs.poloniex.com/#returnorderbook)
- [Binance](https://binance-docs.github.io/apidocs/spot/en/#order-book)

Each exchange provides data in a slightly different format. The server-side TypeScript code contains definitions and validators for each format, as well as conversion routines which normalize the data into a consistent format.

## Notes

### Architecture

The server-side code here is designed to demonstrate how TypeScript works, meaning it's way longer and more verbose than it strictly needs to be for what it does. There's no real need for a server-side data model at all, in fact; a simple CORS-bypass proxy would suffice (see the comments in `static/js/index.js` for an example). That said, going that route wouldn't help demonstrate how TypeScript works on the server side very well, so just imagine this is the first step in building an integrated multi-currency megaplatform that does [many magical things](https://github.com/EnterpriseQualityCoding/FizzBuzzEnterpriseEdition/issues/492) that are as-yet-unspecified, and don't worry too much about it.

### Colors

The color palette used in the chart was created for [Tableau 10](https://www.tableau.com/about/blog/2016/7/colors-upgrade-tableau-10-56782). Color is one of the trickier parts of data visualization to get right; for example, when coloring data to distinguish between different unrelated categories, using the wrong set of colors can cause the brain to subconsiously see relationships that aren't there. Anyone interested in exploring data visualization in more depth should check out how the Tableau 10 team developed their palettes.

### Use of `tslint`

While `tslint` has been officially deprecated in favor of `eslint`, the latter's TypeScript support still leaves something to be desired at the moment. Some rules are broken when dealing with not-terribly-uncommon edge cases, and `tslint.json` is much easier to work with than `.eslintrc.js`. So, for the time being, this project still uses `tslint`.

## Stuff which could still be done

- Unit tests
- More user-friendly error handling
- Data freshness indicator / explicit reload button
- Add a loading spinner when switching pages
- More graph interactivity (tooltips, animations)
- Turn the client-side D3 code into TypeScript and transpile during the build step
