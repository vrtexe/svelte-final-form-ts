import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Profile from '../fixtures/legacy/Profile.svelte';
import ProfileNonRunes from '../fixtures/legacy/ProfileNonRunes.svelte';
import type { ProfileProps } from './suite.js';

interface Consumer {
	consumer: string;
	component: Component<ProfileProps>;
}

const consumers: Consumer[] = [
	{ consumer: 'runes-mode', component: Profile },
	{ consumer: 'non-runes', component: ProfileNonRunes }
];

const props: ProfileProps = {
	onSubmit: () => undefined,
	initialValues: { firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }
};

describe.each(consumers)(
	'legacy set rendered on the server from a $consumer consumer',
	({ component }) => {
		it('shows the initial values in the field inputs on the first render', () => {
			const { body } = render(component, { props });

			expect(body).toContain('value="Ana"');
			expect(body).toContain('value="Skopje"');
		});

		it('shows the initial values in the form state on the first render', () => {
			const { body } = render(component, { props });

			expect(body).toContain('"firstName":"Ana"');
		});
	}
);
