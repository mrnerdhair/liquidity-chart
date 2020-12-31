export class Order {
    static Compare(lhs: Order, rhs: Order) {
        if (lhs.price < rhs.price) return -1
        if (lhs.price > rhs.price) return 1
        return 0
    }

    price: number = 0
    quantity: number = 0
}

export interface OrderBook {
    asks: Order[]
    bids: Order[]
}
