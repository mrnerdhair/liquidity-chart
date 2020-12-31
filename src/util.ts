import { must, curry } from "./functional"

export * from "./functional"

export function guardedOrNull<T, U extends NonNullable<T>>(guard: (x: any) => x is U, x: unknown): U | null {
    return guard(x) ? x : null
}

export function mustValidate<T>(guard: (x: any) => x is T, x: any): T {
    return curry(must, curry(guardedOrNull, guard))(x)
}

// This version is simpler and has a better error message, but demonstrates less cool stuff (tm).
/*export function mustValidate<T>(guard: (x: any) => x is T, x: any): T {
    if (!guard(x)) throw new TypeError(x + " failed validation")
    return x
}*/
