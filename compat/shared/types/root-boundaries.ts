// Boundaries of the root entry's types as a consumer sees them from the packed tarball, on each
// row's TypeScript. Every rejected line is listed in expected-errors.json; every other line must
// type-check.
import { getForm, type AnyFormValues, type FieldPath, type FieldPathValue } from 'svelte-final-form-ts';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
	tags: string[];
	born?: Date;
}

// Objects, arrays and dates are paths themselves; optional and nullable objects are entered.
export const accepted: FieldPath<Profile>[] = ['address', 'tags', 'born'];
export const optionalNested: FieldPath<{ a?: { b: string } | null }> = 'a.b';
export const untypedPath: FieldPath<AnyFormValues> = 'anything.at.all';
export const tags: FieldPathValue<Profile, 'tags'> = ['a'];

export const empty: FieldPath<Profile> = '';
export const arrayIndex: FieldPath<Profile> = 'tags.0';
export const dateMember: FieldPath<Profile> = 'born.getTime';
export const wrongCase: FieldPath<Profile> = 'firstname';
export const tagsAsNumbers: FieldPathValue<Profile, 'tags'> = [1];

export function typedApi(): void {
	const form = getForm<Profile>();
	form.change('address.city');
	form.change('born', undefined);
	// final-form 5.0.0 declares FormState.values optional (4.20 and 5.0.1 do not), hence the "!".
	const age: number = form.getState().values!.age;
	const ageAsText: string = form.getState().values!.age;
	const city: number | undefined = form.getFieldState('address.city')?.value;
	form.blur('address.town');
	form.focus('tags.0');
	void [age, ageAsText, city];
}

// Without form values the API falls back to untyped names and values.
export function untypedApi(): void {
	getForm().change('whatever.path', 42);
}
