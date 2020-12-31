import * as Model from "./model"
import { mustValidate } from "./util"
import fetch from "node-fetch"

class Order {
    static validate(x: any): x is Order {
        return typeof x.quantity === "string"
            && typeof x.rate === "string"
    }
    static convert(x: Order): Model.Order {
        return {
            quantity: Number.parseFloat(x.quantity),
            price: Number.parseFloat(x.rate),
        }
    }

    quantity: string = "0"
    rate: string = "0"
}

class OrderBook {
    static validate(x: any): x is OrderBook {
        return Array.isArray(x.bid) && x.bid.every(Order.validate)
            && Array.isArray(x.ask) && x.ask.every(Order.validate)
    }
    static convert(x: OrderBook): Model.OrderBook {
        return {
            asks: x.ask.map(Order.convert),
            bids: x.bid.map(Order.convert),
        }
    }

    ask: Order[] = []
    bid: Order[] = []
}

export async function GetOrderBook(fromCurrency: string, toCurrency: string): Promise<Model.OrderBook> {
    // const cachedOrderBook = '{"bid":[{"quantity":"12.56719382","rate":"0.02674586"},{"quantity":"24.99307601","rate":"0.02674585"},{"quantity":"0.40000000","rate":"0.02674584"},{"quantity":"2.30590944","rate":"0.02674582"},{"quantity":"1.00000000","rate":"0.02674061"},{"quantity":"0.55794819","rate":"0.02674060"},{"quantity":"3.73726992","rate":"0.02673709"},{"quantity":"0.75000000","rate":"0.02673426"},{"quantity":"1.20000000","rate":"0.02673126"},{"quantity":"1.14600000","rate":"0.02672059"},{"quantity":"0.03736831","rate":"0.02672058"},{"quantity":"5.00000000","rate":"0.02671611"},{"quantity":"15.00000000","rate":"0.02671610"},{"quantity":"6.27380947","rate":"0.02670793"},{"quantity":"9.61556479","rate":"0.02668834"},{"quantity":"4.29624606","rate":"0.02668831"},{"quantity":"0.02103458","rate":"0.02668830"},{"quantity":"2.51500000","rate":"0.02668657"},{"quantity":"7.43900000","rate":"0.02667638"},{"quantity":"27.93987355","rate":"0.02666061"},{"quantity":"5.90000000","rate":"0.02666060"},{"quantity":"32.03534581","rate":"0.02664965"},{"quantity":"57.85281981","rate":"0.02663299"},{"quantity":"88.78468992","rate":"0.02662651"},{"quantity":"25.53000000","rate":"0.02662650"}],"ask":[{"quantity":"32.28562950","rate":"0.02676902"},{"quantity":"0.75000000","rate":"0.02676903"},{"quantity":"0.40000000","rate":"0.02676938"},{"quantity":"1.26808925","rate":"0.02676939"},{"quantity":"1.37720000","rate":"0.02676940"},{"quantity":"6.93144864","rate":"0.02676946"},{"quantity":"5.35400287","rate":"0.02676948"},{"quantity":"1.00000000","rate":"0.02678504"},{"quantity":"1.22937339","rate":"0.02679708"},{"quantity":"15.00000000","rate":"0.02679710"},{"quantity":"0.52441190","rate":"0.02679862"},{"quantity":"59.52150953","rate":"0.02679863"},{"quantity":"2.51500000","rate":"0.02680518"},{"quantity":"4.29383926","rate":"0.02680519"},{"quantity":"29.27186783","rate":"0.02680520"},{"quantity":"21.46910216","rate":"0.02683193"},{"quantity":"7.43900000","rate":"0.02683194"},{"quantity":"41.35944627","rate":"0.02686710"},{"quantity":"5.90000000","rate":"0.02686711"},{"quantity":"25.53000000","rate":"0.02687585"},{"quantity":"41.70747920","rate":"0.02687587"},{"quantity":"35.00760420","rate":"0.02689159"},{"quantity":"4.85303592","rate":"0.02690444"},{"quantity":"0.02628419","rate":"0.02691944"},{"quantity":"0.50000000","rate":"0.02693102"}]}'
    // return OrderBook.convert(mustValidate(OrderBook.validate, JSON.parse(cachedOrderBook)))

    const url = `https://api.bittrex.com/v3/markets/${toCurrency}-${fromCurrency}/orderbook?depth=500`
    const data = await (await fetch(url)).json()
    return OrderBook.convert(mustValidate(OrderBook.validate, data))
}
