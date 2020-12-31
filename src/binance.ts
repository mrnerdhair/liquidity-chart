import * as Model from "./model"
import { mustValidate } from "./util"
import fetch from "node-fetch"

class Order extends Array {
    static validate(x: any): x is Order {
        return Array.isArray(x) && x.length === 2
            && typeof x[0] === "string"
            && typeof x[1] === "string"
    }
    static convert(x: Order): Model.Order {
        return {
            quantity: Number.parseFloat(x[1]),
            rate: Number.parseFloat(x[0]),
            exchange: "Binance",
        }
    }

    0: string = "0"
    1: string = "0"
}

class OrderBook {
    static validate(x: any): x is OrderBook {
        return Array.isArray(x.bids) && x.bids.every(Order.validate)
            && Array.isArray(x.asks) && x.asks.every(Order.validate)
            && typeof x.lastUpdateId === "number"
    }
    static convert(x: OrderBook): Model.OrderBook {
        return ([] as Model.OrderBook).concat(
            x.bids.map(Order.convert).map(y => (y.quantity *= -1, y)),
            x.asks.map(Order.convert),
        )
    }

    asks: Order[] = []
    bids: Order[] = []
    lastUpdateId: number = 0
}

export async function GetOrderBook(fromCurrency: string, toCurrency: string): Promise<Model.OrderBook> {
    // const cachedOrderBook = '{"lastUpdateId":2049063509,"bids":[["0.02641700","57.66100000"],["0.02641200","3.00000000"],["0.02640900","4.00000000"],["0.02640800","14.41000000"],["0.02640700","3.78600000"],["0.02640600","4.00000000"],["0.02640400","3.23900000"],["0.02640300","1.60500000"],["0.02640200","7.63900000"],["0.02639900","6.50000000"],["0.02639800","3.27500000"],["0.02639600","4.93800000"],["0.02639500","7.59900000"],["0.02639400","2.67400000"],["0.02639300","25.00000000"],["0.02639200","5.74400000"],["0.02639100","10.54500000"],["0.02638900","7.69800000"],["0.02638800","9.69000000"],["0.02638600","3.24200000"]],"asks":[["0.02641800","5.02600000"],["0.02642200","2.50000000"],["0.02642300","3.00000000"],["0.02642500","6.51000000"],["0.02642600","3.93800000"],["0.02642700","6.96900000"],["0.02642800","14.47800000"],["0.02642900","3.84800000"],["0.02643000","18.31800000"],["0.02643100","11.40400000"],["0.02643200","3.74100000"],["0.02643300","9.87000000"],["0.02643500","3.32400000"],["0.02643600","15.83000000"],["0.02643700","10.84500000"],["0.02643800","0.11900000"],["0.02644200","2.03700000"],["0.02644300","10.54500000"],["0.02644500","16.86400000"],["0.02644600","77.38700000"]]}'
    // return OrderBook.convert(mustValidate(OrderBook.validate, JSON.parse(cachedOrderBook)))

    const url = `https://www.binance.com/api/v3/depth?symbol=${toCurrency}${fromCurrency}&limit=20`
    const data = await (await fetch(url)).json()
    return OrderBook.convert(mustValidate(OrderBook.validate, data))
}
