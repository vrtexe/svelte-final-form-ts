import { getContext, setContext } from 'svelte';
import type { AnyFormValues, TypedFormApi } from './types.js';

// One key for both component sets, so getForm finds a Form from either.
const FORM_CONTEXT_KEY = Symbol('svelte-final-form-ts.form');

/** The context key every `Form` provides and `getForm` reads, for consumers that read it directly. */
export const FORM: symbol = FORM_CONTEXT_KEY;

const OUTSIDE_FORM_MESSAGE =
	'getForm() must be called inside a <Form> component, during component initialisation';

/**
 * Returns the form API of the innermost enclosing `Form`.
 *
 * Must be called during component initialisation.
 *
 * @returns the form API, typed by the given form values
 * @throws Error when no `Form` encloses the calling component
 */
export function getForm<V extends AnyFormValues = AnyFormValues>(): TypedFormApi<V> {
	const form = getContext<TypedFormApi<V> | undefined>(FORM_CONTEXT_KEY);
	if (!form) {
		throw new Error(OUTSIDE_FORM_MESSAGE);
	}
	return form;
}

/**
 * Makes the form API available to `getForm` in the calling component's descendants.
 *
 * Must be called during component initialisation.
 *
 * @param form the form API to provide
 */
export function setFormContext<V extends AnyFormValues>(form: TypedFormApi<V>): void {
	setContext(FORM_CONTEXT_KEY, form);
}
