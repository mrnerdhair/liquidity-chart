export class Order {
    static Compare(lhs: Order, rhs: Order) {
        if (lhs.rate < rhs.rate) return -1
        if (lhs.rate > rhs.rate) return 1
        return 0
    }

    quantity: number = 0
    rate: number = 0
    exchange: string = ""
}

export type OrderBook = Order[]
