import { describe, expect, it } from 'vitest';
import * as root from '../lib/index.js';

describe('root entry', () => {
	it('exports Form, Field, FormSpy and getForm and nothing else at runtime', () => {
		expect(Object.keys(root).sort()).toEqual(['Field', 'Form', 'FormSpy', 'getForm']);
	});
});
