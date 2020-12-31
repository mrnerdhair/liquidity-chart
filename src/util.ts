export * from "./functional"

export function mustValidate<T>(guard: (x: any) => x is T, x: any): T {
    if (!guard(x)) throw new TypeError(x + " failed validation")
    return x
}

export function guardedOrNull<T, U extends NonNullable<T>>(guard: (x: any) => x is U, x: unknown): U | null {
    return guard(x) ? x : null
}
