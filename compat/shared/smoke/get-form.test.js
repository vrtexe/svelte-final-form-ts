import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { getForm } from 'svelte-final-form-ts';
import GetFormAlone from './GetFormAlone.svelte';

const outsideForm =
	'getForm() must be called inside a <Form> component, during component initialisation';

describe('getForm from the packed tarball', () => {
	it('throws the documented error in a component that no Form encloses', () => {
		const { container } = render(GetFormAlone);
		expect(container.querySelector('p')?.textContent).toBe(outsideForm);
	});

	it("lets Svelte's own error surface when called outside component initialisation", () => {
		let error;
		try {
			getForm();
		} catch (e) {
			error = e;
		}
		expect(error).toBeInstanceOf(Error);
		expect(error.message).not.toBe(outsideForm);
	});

	it('cannot be deep-imported from dist/core, which has no export-map entry', async () => {
		const load = (specifier) => import(/* @vite-ignore */ specifier);
		// The same runtime import of the root entry resolves, so the rejection is the export map's.
		await expect(load('svelte-final-form-ts')).resolves.toHaveProperty('getForm', getForm);
		await expect(load('svelte-final-form-ts/dist/core/context.js')).rejects.toThrow();
	});
});
