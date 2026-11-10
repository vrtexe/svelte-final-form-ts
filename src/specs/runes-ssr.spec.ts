import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Profile from '../fixtures/runes/Profile.svelte';
import type { TypedFormApi } from '../lib/runes/index.js';
import type { Profile as ProfileValues, ProfileProps } from './suite.js';

const props: ProfileProps = {
	onSubmit: () => undefined,
	initialValues: { firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } },
	spySubscription: { values: true }
};

describe('runes set rendered on the server from a snippet consumer', () => {
	it('shows the initial values in the field inputs on the first render', () => {
		const { body } = render(Profile, { props });

		expect(body).toContain('value="Ana"');
		expect(body).toContain('value="Skopje"');
	});

	it('shows the initial values in the form state on the first render', () => {
		const { body } = render(Profile, { props });

		expect(body).toContain('"firstName":"Ana"');
	});

	it('shows the initial values in the form spy state on the first render', () => {
		const { body } = render(Profile, { props });

		expect(body).toMatch(/data-testid="spy-state"[^>]*>\{"values":\{"firstName":"Ana"/);
	});

	it('shows a failing field validator error on the first render', () => {
		const { body } = render(Profile, {
			props: {
				...props,
				initialValues: { age: 10 },
				ageValidator: (value: number) => (value < 18 ? 'Too young' : undefined)
			}
		});

		expect(body).toMatch(/data-testid="meta:age"[^>]*>[^<]*"error":"Too young"/);
	});

	it('leaves no subscription or registered field behind after the render', () => {
		let form: TypedFormApi<ProfileValues> | undefined;
		let open = 0;
		const onForm = (received: TypedFormApi<ProfileValues>) => {
			form = received;
			const { subscribe, registerField } = received;
			const track = (unsubscribe: () => void) => {
				open += 1;
				return () => {
					open -= 1;
					unsubscribe();
				};
			};
			received.subscribe = (listener, subscription) => track(subscribe(listener, subscription));
			received.registerField = (name, subscriber, subscription, config) =>
				track(registerField(name, subscriber, subscription, config));
		};

		// svelte/server renders lazily, on the first read of the result.
		const { body } = render(Profile, { props: { ...props, onForm } });

		expect(body).toContain('value="Ana"');
		expect(form).toBeDefined();
		expect(open).toBe(0);
		expect(form?.getRegisteredFields()).toEqual([]);
	});
});
