import { describe, expect, it } from 'vitest';
import { VERSION } from 'svelte/compiler';
import * as root from 'svelte-final-form-ts';

const publicApi = ['Field', 'Form', 'FormSpy', 'getForm'];
const svelte5 = Number(VERSION.split('.')[0]) >= 5;

describe('svelte-final-form-ts', () => {
	it('exports getForm and nothing outside the public API', () => {
		expect(root.getForm).toBeTypeOf('function');
		expect(Object.keys(root).filter((name) => !publicApi.includes(name))).toEqual([]);
	});
});

describe.skipIf(!svelte5)('svelte-final-form-ts/runes', () => {
	it('exports the same getForm as the root entry, so both share one context key', async () => {
		const runes = await import('svelte-final-form-ts/runes');
		expect(runes.getForm).toBe(root.getForm);
		expect(Object.keys(runes).filter((name) => !publicApi.includes(name))).toEqual([]);
	});
});
