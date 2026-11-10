import { describe, expect, it, vi } from 'vitest';
import { fieldSubscriptionItems } from 'final-form';
import type { FieldSubscription, FieldValidator } from 'final-form';
import { createTypedForm } from '../lib/core/form.js';
import type { FormConfig } from '../lib/core/form.js';
import { allFieldSubscription, registerTypedField, sameSubscription } from '../lib/core/field.js';
import type { FieldOptions } from '../lib/core/field.js';
import type {
	FieldPath,
	FieldPathValue,
	FieldRenderProps,
	TypedFormApi
} from '../lib/core/types.js';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

const MIN_AGE_ERROR = 'Must be 18 or older';

function profileForm(config: Partial<FormConfig<Profile>> = {}): TypedFormApi<Profile> {
	return createTypedForm<Profile>({ onSubmit: () => undefined, ...config });
}

/** Registers the field and returns a getter for the latest render props it published. */
function watchField<N extends FieldPath<Profile>>(
	form: TypedFormApi<Profile>,
	name: N,
	subscription?: FieldSubscription,
	options?: FieldOptions<FieldPathValue<Profile, N>>
): () => FieldRenderProps<N, FieldPathValue<Profile, N>> {
	let latest: FieldRenderProps<N, FieldPathValue<Profile, N>> | undefined;
	registerTypedField(form, name, (props) => (latest = props), subscription, options);
	return () => {
		if (!latest) throw new Error(`field ${name} published nothing`);
		return latest;
	};
}

const minAge: FieldOptions<number> = {
	getValidator: () => (value) => (value < 18 ? MIN_AGE_ERROR : undefined)
};

describe('allFieldSubscription', () => {
	it('subscribes to every key final-form publishes', () => {
		const keys = Object.keys(allFieldSubscription).filter(
			(key) => allFieldSubscription[key as keyof FieldSubscription]
		);

		expect(keys.sort()).toEqual([...fieldSubscriptionItems].sort());
	});
});

describe('registerTypedField', () => {
	it('hands the content the input name and the initial value', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const field = watchField(form, 'firstName');

		expect(field().input).toMatchObject({ name: 'firstName', value: 'Ana' });
	});

	it('reads the value at a nested path', () => {
		const form = profileForm({ initialValues: { address: { city: 'Skopje', zip: '1000' } } });

		const field = watchField(form, 'address.city');

		expect(field().input.value).toBe('Skopje');
	});

	it('publishes the new value of a nested path after onChange', () => {
		const form = profileForm({ initialValues: { address: { city: 'Skopje', zip: '1000' } } });
		const field = watchField(form, 'address.city');

		field().input.onChange('Bitola');

		expect(field().input.value).toBe('Bitola');
	});

	it('writes a nested path into the form values and leaves its siblings unchanged', () => {
		const form = profileForm({ initialValues: { address: { city: 'Skopje', zip: '1000' } } });
		const field = watchField(form, 'address.city');

		field().input.onChange('Bitola');

		expect(form.getState().values.address).toEqual({ city: 'Bitola', zip: '1000' });
	});

	it('marks the field touched after onFocus and onBlur', () => {
		const form = profileForm();
		const field = watchField(form, 'firstName');

		field().input.onFocus();
		field().input.onBlur();

		expect(field().meta.touched).toBe(true);
	});

	it('keeps name, value and the final-form handlers out of meta', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const field = watchField(form, 'firstName');

		const leaked = Object.keys(field().meta).filter((key) =>
			['name', 'value', 'change', 'blur', 'focus'].includes(key)
		);
		expect(leaked).toEqual([]);
	});

	it('shows the field-level validator error in the field meta', () => {
		const form = profileForm();
		const field = watchField(form, 'age', undefined, minAge);

		field().input.onChange(17);

		expect(field().meta.error).toBe(MIN_AGE_ERROR);
	});

	it('makes the form invalid when the field-level validator fails', () => {
		const form = profileForm();
		const field = watchField(form, 'age', undefined, minAge);

		field().input.onChange(17);

		expect(form.getState().valid).toBe(false);
	});

	it.each([
		{ age: 17, error: MIN_AGE_ERROR },
		{ age: 18, error: undefined }
	])('gives age $age the field error $error', ({ age, error }) => {
		const form = profileForm();
		const field = watchField(form, 'age', undefined, minAge);

		field().input.onChange(age);

		expect(field().meta.error).toBe(error);
	});

	it('reads the validator through getValidator on every validation', () => {
		let maximum = 100;
		const form = profileForm();
		const field = watchField(form, 'age', undefined, {
			getValidator: () => (value) => (value > maximum ? 'Too old' : undefined)
		});
		maximum = 50;

		field().input.onChange(60);

		expect(field().meta.error).toBe('Too old');
	});

	it('shows a form-level error for a nested path in that field meta', () => {
		const form = profileForm({
			initialValues: { address: { city: '', zip: '1000' } },
			validate: (values) => (values.address?.city ? {} : { address: { city: 'Required' } })
		});

		const field = watchField(form, 'address.city');

		expect(field().meta.error).toBe('Required');
	});

	it('limits meta to the subscribed keys', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const field = watchField(form, 'firstName', { value: true });

		expect(field().input.value).toBe('Ana');
		expect(field().meta.touched).toBeUndefined();
		expect(field().meta.error).toBeUndefined();
	});

	it('publishes every meta key without a subscription', () => {
		const form = profileForm();

		const field = watchField(form, 'firstName');

		expect(field().meta).toMatchObject({ touched: false, pristine: true, valid: true });
	});

	it('unregisters the field when the returned function is called', () => {
		const form = profileForm();
		const unregister = registerTypedField(form, 'age', vi.fn());
		registerTypedField(form, 'firstName', vi.fn());

		unregister();

		expect(form.getRegisteredFields()).toEqual(['firstName']);
	});

	it('rejects a name that is not a path of the form values at compile time', () => {
		const form = profileForm();

		// @ts-expect-error "address.town" is not a path of Profile.
		const register = () => registerTypedField(form, 'address.town', vi.fn());

		expect(register).not.toThrow();
	});
});

describe('sameSubscription', () => {
	it('treats subscriptions with the same truthy keys as the same', () => {
		const same = sameSubscription({ value: true, error: false }, { value: true });

		expect(same).toBe(true);
	});

	it('treats subscriptions with different truthy keys as different', () => {
		const same = sameSubscription({ value: true }, { value: true, error: true });

		expect(same).toBe(false);
	});

	it('treats two missing subscriptions as the same', () => {
		const same = sameSubscription(undefined, undefined);

		expect(same).toBe(true);
	});

	it('treats a missing subscription as the full subscription', () => {
		const same = sameSubscription(undefined, { ...allFieldSubscription });

		expect(same).toBe(true);
	});

	it('treats a missing subscription and a partial one as different', () => {
		const same = sameSubscription(undefined, { value: true });

		expect(same).toBe(false);
	});
});

describe('field core boundaries', () => {
	it('uses the validator getValidator returns now, not the one it returned at registration', () => {
		let validator: FieldValidator<number> = () => undefined;
		const form = profileForm();
		const field = watchField(form, 'age', undefined, { getValidator: () => validator });
		validator = () => 'Replaced';

		field().input.onChange(60);

		expect(field().meta.error).toBe('Replaced');
	});

	it('reports no error and keeps the form valid when getValidator returns undefined', () => {
		const form = profileForm();
		const field = watchField(form, 'age', undefined, { getValidator: () => undefined });

		field().input.onChange(17);

		expect(field().meta.error).toBeUndefined();
		expect(form.getState().valid).toBe(true);
	});

	it('clears the field error once the value crosses the boundary back to 18', () => {
		const form = profileForm();
		const field = watchField(form, 'age', undefined, minAge);
		field().input.onChange(17);

		field().input.onChange(18);

		expect(field().meta.error).toBeUndefined();
		expect(form.getState().valid).toBe(true);
	});

	it('creates the nested object when writing a nested path without initial values', () => {
		const form = profileForm();
		const field = watchField(form, 'address.city');

		field().input.onChange('Bitola');

		expect(field().input.value).toBe('Bitola');
		expect(form.getState().values).toEqual({ address: { city: 'Bitola' } });
	});

	it('hands the full dot path as the input name', () => {
		const form = profileForm();

		const field = watchField(form, 'address.city');

		expect(field().input.name).toBe('address.city');
	});

	it('keeps working when the input handlers are called detached from the props', () => {
		const form = profileForm();
		const field = watchField(form, 'firstName');
		const { onChange, onFocus, onBlur } = field().input;

		onFocus();
		onChange('Petar');
		onBlur();

		expect(field().input.value).toBe('Petar');
		expect(field().meta.touched).toBe(true);
	});

	it('exposes no meta key at all with the subscription { value: true }', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const field = watchField(form, 'firstName', { value: true });

		expect(field().meta).toEqual({});
	});

	it('leaves input.value undefined when value is not subscribed', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const field = watchField(form, 'firstName', { error: true });

		expect(field().input.value).toBeUndefined();
	});

	it('stops calling the listener after the field is unregistered', () => {
		const form = profileForm();
		const listener = vi.fn();
		const unregister = registerTypedField(form, 'firstName', listener);
		listener.mockClear();

		unregister();
		form.change('firstName', 'Elena');

		expect(listener).not.toHaveBeenCalled();
	});

	it('passes the field options through to final-form', () => {
		const form = profileForm();

		const field = watchField(form, 'firstName', undefined, { initialValue: 'Ana' });

		expect(field().input.value).toBe('Ana');
		expect(form.getState().values.firstName).toBe('Ana');
	});
});

describe('sameSubscription boundaries', () => {
	it('ignores the order of the keys', () => {
		const same = sameSubscription({ error: true, value: true }, { value: true, error: true });

		expect(same).toBe(true);
	});

	it('treats an empty subscription and an all-false one as the same', () => {
		const same = sameSubscription({}, { value: false, error: false });

		expect(same).toBe(true);
	});

	it('treats an empty subscription as different from a missing one', () => {
		const same = sameSubscription({}, undefined);

		expect(same).toBe(false);
	});

	it('treats subscriptions with disjoint keys of the same count as different', () => {
		const same = sameSubscription({ value: true }, { error: true });

		expect(same).toBe(false);
	});
});
