// Requirements change 5: Form, Field, FormSpy, getForm and the public types resolve with
// declarations from svelte-final-form-ts/runes, checked with skipLibCheck false.
import { Field, Form, FormSpy, getForm } from 'svelte-final-form-ts/runes';
import type {
	AnyFormValues,
	FieldInputProps,
	FieldMeta,
	FieldPath,
	FieldPathValue,
	FieldRenderProps,
	FormRenderProps,
	FormSpyRenderProps,
	TypedFormApi
} from 'svelte-final-form-ts/runes';
import type { Profile } from '../../runes/setup.js';

export const components = [Form, Field, FormSpy] as const;
export const helper: <V extends AnyFormValues>() => TypedFormApi<V> = getForm;

export type Checked = [
	FieldPath<Profile>,
	FieldPathValue<Profile, 'address.city'>,
	FieldInputProps<'age', number>,
	FieldMeta<number>,
	FieldRenderProps<'age', number>,
	FormRenderProps<Profile>,
	FormSpyRenderProps<Profile>
];
