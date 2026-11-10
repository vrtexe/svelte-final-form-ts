<!--
	The Form, Field and FormSpy slot props and the getForm API are typed by the form values, not any:
	each line marked in expected-errors.json is exactly one error, so an export typed as any fails
	the harness as a missing error. "The form API from the helper is typed by the given form values"
	is the getForm line.
-->
<script lang="ts">
	import { Field, Form, FormSpy, getForm } from 'svelte-final-form-ts';

	type Profile = {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	};

	const onSubmit = (values: Profile): undefined => void values;
	const edit = (): void => getForm<Profile>().change('address.city', 5);
	const toNumber = (value: number): number => value;
	void edit;
</script>

<Form {onSubmit} let:form let:state>
	{toNumber(state.values?.firstName ?? '')}
	<Field {form} name="age" let:meta>{toNumber(meta.touched)}</Field>
	<FormSpy {form} let:state={spyState}>{spyState.values?.lastName}</FormSpy>
</Form>

<Form {onSubmit} initialValues={{ age: 'thirty' }}><span></span></Form>

<Form onSubmit={() => undefined} initialValues={{ age: 30, address: { city: 'Skopje' } }} let:form>
	<Field {form} name="age.toFixed" />
	<Field {form} name="address." />
</Form>
