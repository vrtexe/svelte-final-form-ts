// The root entry: every value and type export resolves with skipLibCheck false, and the form API
// from getForm is typed by the given form values. The two rejected calls are listed in
// expected-errors.json.
import {
	getForm,
	type AnyFormValues,
	type FieldInputProps,
	type FieldMeta,
	type FieldPath,
	type FieldPathValue,
	type FieldRenderProps,
	type FormRenderProps,
	type FormSpyRenderProps,
	type TypedFormApi
} from 'svelte-final-form-ts';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

export const path: FieldPath<Profile> = 'address.zip';
export const city: FieldPathValue<Profile, 'address.city'> = 'Skopje';
export type Exports = [
	AnyFormValues,
	FieldInputProps<'age', number>,
	FieldMeta<number>,
	FieldRenderProps<'age', number>,
	FormRenderProps<Profile>,
	FormSpyRenderProps<Profile>
];

export function editProfile(): TypedFormApi<Profile> {
	const form = getForm<Profile>();
	form.change('address.city', 'Ohrid');
	form.change('age', 31);
	form.change('address.city', 5);
	form.change('address.town', 'Ohrid');
	return form;
}
