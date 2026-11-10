import { describe, expect, it } from 'vitest';
import * as root from '../lib/index.js';

describe('root entry', () => {
	it('exports Form, Field, FormSpy, getForm and FORM and nothing else at runtime', () => {
		expect(Object.keys(root).sort()).toEqual(['FORM', 'Field', 'Form', 'FormSpy', 'getForm']);
	});

	it('exports FORM as a context key', () => {
		expect(typeof root.FORM).toBe('symbol');
	});
});
