import * as Model from "./model"
import { mustValidate } from "./util"
import fetch from "node-fetch"

class Order extends Array {
    static validate(x: any): x is Order {
        return Array.isArray(x) && x.length === 2
            && typeof x[0] === "string"
            && typeof x[1] === "number"
    }
    static convert(x: Order): Model.Order {
        return {
            exchange: "Poloniex",
            quantity: x[1],
            rate: Number.parseFloat(x[0]),
        }
    }

    0: string = "0"
    1: number = 0
}

class OrderBook {
    static validate(x: any): x is OrderBook {
        return Array.isArray(x.asks) && x.asks.every(Order.validate)
            && Array.isArray(x.bids) && x.bids.every(Order.validate)
            && typeof x.isFrozen === "string"
            && typeof x.seq === "number"
    }
    static convert(x: OrderBook): Model.OrderBook {
        return ([] as Model.OrderBook).concat(
            x.bids.map(Order.convert).map(y => (y.quantity *= -1, y)),
            x.asks.map(Order.convert),
        )
    }

    asks: Order[] = []
    bids: Order[] = []
    isFrozen: string = "0"
    seq: number = 0
}

export async function GetOrderBook(fromCurrency: string, toCurrency: string): Promise<Model.OrderBook> {
    // const cachedOrderBook = '{"asks":[["0.02673399",62.34757222],["0.02673400",28.0558],["0.02674690",13.9],["0.02674999",5.6114805],["0.02675000",0.679],["0.02675094",3.03066],["0.02675431",3],["0.02675700",0.707],["0.02675995",10],["0.02675996",18.1],["0.02676300",0.756],["0.02677386",17],["0.02677500",0.644],["0.02678917",2.084],["0.02678918",18],["0.02679037",6.27],["0.02680284",22],["0.02680717",25],["0.02680718",20.658],["0.02680813",0.00409925],["0.02681719",22],["0.02683021",0.07864327],["0.02683179",16],["0.02683673",0.2],["0.02685849",0.013778]],"bids":[["0.02671264",0.6238063],["0.02671263",3.04073],["0.02671091",5.61042982],["0.02669601",10],["0.02669600",0.672],["0.02669480",13.9],["0.02669349",15],["0.02669000",0.7],["0.02667830",18],["0.02667410",2.084],["0.02667409",0.02096976],["0.02666813",0.00414452],["0.02666490",22],["0.02665323",0.243492],["0.02664980",16],["0.02664945",6.27],["0.02663668",17.3],["0.02663277",0.078836],["0.02663265",0.2],["0.02662710",25],["0.02662709",0.03221037],["0.02662377",7.7],["0.02661304",20.658],["0.02660702",3.5241797],["0.02660000",0.25]],"isFrozen":"0","seq":986361740}'
    // return OrderBook.convert(mustValidate(OrderBook.validate, JSON.parse(cachedOrderBook)))

    const url = `https://poloniex.com/public?command=returnOrderBook&currencyPair=${fromCurrency}_${toCurrency}&depth=25`
    const data = await (await fetch(url)).json()
    return OrderBook.convert(mustValidate(OrderBook.validate, data))
}
