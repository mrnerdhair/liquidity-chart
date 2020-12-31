// These functions demonstrate advanced features of the TypeScript type system,
// such as type inference and generics. Note how these functional operators
// avoid erasing inferred type information from functions they are applied to.

type BasicFunction = (...args: any) => any
type FirstParameter<F extends BasicFunction> = F extends (x: infer X, ...args: any) => any ? X : never
type OtherParameters<F extends BasicFunction> = F extends (x: any, ...args: infer P) => any ? P : never

export function must<
    F extends BasicFunction,
    P extends Parameters<F>,
    R extends ReturnType<F>,
>(f: F, ...args: P): NonNullable<R> {
    const x: R = f(...Array.from(args))
    if (x === null || x === undefined) throw new TypeError(x + " must not be null")
    return (x as NonNullable<R>)
}

export function curry<
    F extends BasicFunction,
    X extends FirstParameter<F>,
    P extends OtherParameters<F>,
    R extends ReturnType<F>,
>(f: F, x: X): (...args: P) => R {
    return (...args: P): R => f(x, ...args)
}
