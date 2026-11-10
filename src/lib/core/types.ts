import type { FieldState, FormApi, FormState } from 'final-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFormValues = Record<string, any>;

type IsAny<T> = 0 extends 1 & T ? true : false;

// Values that are paths' end points: arrays and tuples (no index paths in this version), dates
// and functions, including callables with properties such as a debounced handler.
type Leaf = ReadonlyArray<unknown> | Date | ((...args: never[]) => unknown);

// Remaining recursion budget per level; FieldPath starts at 5, so it lists keys 6 levels deep.
type PrevDepth = [never, 0, 1, 2, 3, 4, 5];

// Distributes over a union of values, so each member contributes its own keys rather than only
// the keys every member shares.
type PathsOf<V, D extends number> = [D] extends [never]
	? never
	: V extends unknown
		? { [K in keyof V & string]-?: PathsFrom<K, NonNullable<V[K]>, D> }[keyof V & string]
		: never;

type PathsFrom<K extends string, T, D extends number> =
	IsAny<T> extends true
		? K | `${K}.${string}`
		: T extends Leaf
			? K
			: T extends object
				? K | `${K}.${PathsOf<T, PrevDepth[D]>}`
				: K;

/**
 * Dot paths to every key of the form values, objects included (`"address"` and
 * `"address.city"`). Arrays, dates and functions are leaves, and recursion stops 6 levels deep so
 * that recursive value types stay within TypeScript's instantiation limit. For untyped values
 * (`AnyFormValues`, or any type with a string index signature) it is `string`.
 */
export type FieldPath<V> =
	IsAny<V> extends true ? string : string extends keyof V ? string : PathsOf<V, 5>;

/**
 * The type found at path `P` in the form values `V`. For untyped values it is `any`. Unions are
 * resolved per member, as `FieldPath` lists them: a path found in only one member of a union
 * types as that member's value, and members without the path add nothing.
 */
export type FieldPathValue<V, P extends string> =
	IsAny<V> extends true
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
			any
		: V extends unknown
			? P extends keyof V
				? V[P]
				: P extends `${infer K}.${infer Rest}`
					? K extends keyof V
						? FieldPathValue<NonNullable<V[K]>, Rest>
						: never
					: never
			: never;

/**
 * The final-form API with field names checked against the paths of the form values and field
 * values typed from their path.
 */
export type TypedFormApi<V extends AnyFormValues> = Omit<
	FormApi<V, Partial<V>>,
	'change' | 'blur' | 'focus' | 'getFieldState' | 'resetFieldState'
> & {
	change<P extends FieldPath<V>>(name: P, value?: FieldPathValue<V, P>): void;
	blur(name: FieldPath<V>): void;
	focus(name: FieldPath<V>): void;
	getFieldState<P extends FieldPath<V>>(name: P): FieldState<FieldPathValue<V, P>> | undefined;
	resetFieldState(name: FieldPath<V>): void;
};

export interface FieldInputProps<N extends string, T> {
	name: N;
	value: T | undefined;
	onChange(value: T | undefined): void;
	onFocus(): void;
	onBlur(): void;
}

export type FieldMeta<T> = Omit<FieldState<T>, 'name' | 'value' | 'change' | 'blur' | 'focus'>;

export interface FormRenderProps<V extends AnyFormValues> {
	form: TypedFormApi<V>;
	/** Only the subscribed keys are populated. */
	state: FormState<V, Partial<V>>;
	handleSubmit: (event?: Event) => Promise<V | undefined> | undefined;
}

export interface FieldRenderProps<N extends string, T> {
	input: FieldInputProps<N, T>;
	meta: FieldMeta<T>;
}

export interface FormSpyRenderProps<V extends AnyFormValues> {
	state: FormState<V, Partial<V>>;
	form: TypedFormApi<V>;
}
