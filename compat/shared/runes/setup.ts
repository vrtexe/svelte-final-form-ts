// Test state shared by the snippet fixtures and runes.test.ts. Like the legacy set, the fixtures
// take no props: tests set `config` before rendering, and fixtures react to runtime changes only
// through stores. The runes set imports the library only from svelte-final-form-ts/runes, so it
// also runs in a consumer whose compilerOptions.runes is the boolean true.
import { writable } from 'svelte/store';
import type {
	FieldSubscription,
	FieldValidator,
	FormSubscription,
	SubmissionErrors,
	ValidationErrors
} from 'final-form';
import type { TypedFormApi } from 'svelte-final-form-ts/runes';

/** The profile form of 04-requirements.md. */
export interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

export type ProfileField = 'firstName' | 'age' | 'address.city';

export interface Config {
	onSubmit: (values: Profile) => SubmissionErrors | Promise<SubmissionErrors> | void;
	initialValues?: Partial<Profile>;
	validate?: (values: Profile) => ValidationErrors;
	formSubscription?: FormSubscription;
	fieldSubscription?: FieldSubscription;
	spySubscription?: FormSubscription;
	ageValidator?: FieldValidator<number>;
	/** What OutsideForm.svelte renders without an enclosing Form. */
	outside?: 'getForm' | 'Field' | 'FormSpy';
}

export const config: Config = { onSubmit: () => undefined };

/** Form props without onSubmit, untyped so that the type check requiring it is bypassed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withoutOnSubmit: any = { initialValues: { firstName: 'Ana' } };

/** The fields Profile.svelte mounts. */
export const fields = writable<ProfileField[]>([]);

/** The form-level validator; a test replaces it to check a validate prop given after mount. */
export const validateStore = writable<Config['validate']>(undefined);

/** The name of the field in RenameField.svelte. */
export const fieldName = writable<'firstName' | 'address.city'>('firstName');

/** Every form API Probe.svelte obtained through getForm, in mount order. */
export const forms: TypedFormApi<Profile>[] = [];

const renders: Record<string, number> = {};

/** Counts the runs of the template expression that passes `dependencies`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function rendered(key: string, ...dependencies: unknown[]): number {
	renders[key] = (renders[key] ?? 0) + 1;
	return renders[key];
}

export function renderCount(key: string): number {
	return renders[key] ?? 0;
}

export function reset(): void {
	for (const key of Object.keys(config)) delete (config as Partial<Config>)[key as keyof Config];
	config.onSubmit = () => undefined;
	fields.set(['firstName', 'age', 'address.city']);
	fieldName.set('firstName');
	validateStore.set(undefined);
	forms.length = 0;
	for (const key of Object.keys(renders)) delete renders[key];
}

export function toAge(raw: string): number | undefined {
	return raw === '' ? undefined : Number(raw);
}
