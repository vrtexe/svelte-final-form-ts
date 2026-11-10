// State shared by the legacy fixtures and legacy.test.js. The fixtures take no props and declare no
// reactive variables, so one file compiles under Svelte 4 and under Svelte 5 in both modes: a test
// fills `config` before it renders, and a fixture follows later changes only through stores.
import { writable } from 'svelte/store';

/** What Profile.svelte, MissingOnSubmit.svelte and OutsideForm.svelte read when they mount. */
export const config = {};

/** The fields Profile.svelte mounts. */
export const fields = writable([]);

/** The form-level validator; a test replaces it to check a validate prop given after mount. */
export const validateStore = writable(undefined);

/** The name of the field in RenameField.svelte. */
export const fieldName = writable('firstName');

/** Every form API Probe.svelte obtained through getForm, in mount order. */
export const forms = [];

/** The subscriptions made through a tracked form API and not yet ended. */
export const live = { subscriptions: 0 };

/**
 * Counts the subscriptions made through `form.subscribe` from now on, so a test can see whether
 * the components that subscribed end them. Each unsubscribe counts once.
 */
export function track(form) {
	const subscribe = form.subscribe;
	form.subscribe = (...args) => {
		const unsubscribe = subscribe(...args);
		let ended = false;
		live.subscriptions += 1;
		return () => {
			if (!ended) live.subscriptions -= 1;
			ended = true;
			unsubscribe();
		};
	};
}

const renders = {};

/**
 * Counts one render of the content under `key`. The template expression that calls it passes the
 * slot props it shows, so the expression runs again exactly when one of them changes.
 */
export function rendered(key, ...slotProps) {
	void slotProps;
	renders[key] = (renders[key] ?? 0) + 1;
	return '';
}

export function renderCount(key) {
	return renders[key] ?? 0;
}

export function reset() {
	for (const key of Object.keys(config)) delete config[key];
	config.onSubmit = () => undefined;
	fields.set(['firstName', 'age', 'address.city']);
	fieldName.set('firstName');
	validateStore.set(undefined);
	forms.length = 0;
	live.subscriptions = 0;
	for (const key of Object.keys(renders)) delete renders[key];
}

/** The number an `<input type="number">` holds, undefined when it is empty. */
export function toAge(raw) {
	return raw === '' ? undefined : Number(raw);
}
