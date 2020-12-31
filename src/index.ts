import * as Binance from "./binance"
import * as Bittrex from "./bittrex"
import * as Model from "./model"
import * as Poloniex from "./poloniex"

import express from "express"
import path from "path"

const app = express()
const port = process.env.PORT ?? 8000

console.log(`serving static files from ${path.join(__dirname, "static")}`)
app.use(express.static(path.join(__dirname, "../static")))
app.get("/api/:from-:to/orders", async (req, res) => {
  try {
    const fromCurrency = req.params.from
    const toCurrency = req.params.to

    const symbolRegex = /^(BTC|ETH|DOGE|USDT)$/
    if (!(fromCurrency && toCurrency && symbolRegex.test(fromCurrency) && symbolRegex.test(toCurrency))) throw new Error("invalid currency symbol")

    const data = ([] as Model.OrderBook).concat(
        await Bittrex.GetOrderBook(fromCurrency, toCurrency),
        await Poloniex.GetOrderBook(fromCurrency, toCurrency),
        await Binance.GetOrderBook(fromCurrency, toCurrency),
    )
    data.sort(Model.Order.Compare)

    res.json(data)
  } catch (e) {
    res.status(500).json({
      error: e.toString(),
    })
  }
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
