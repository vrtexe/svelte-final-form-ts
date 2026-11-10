<!--
	"The field value is typed from its path": each field hands its input value to a parameter of the
	target type. Only the "age" to string and "newsletter" to number rows are errors.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';

	const initialValues = {
		firstName: 'Ana',
		age: 30,
		address: { city: 'Skopje', zip: '1000' },
		newsletter: false
	};
	const toNumberOrUndefined = (value: number | undefined): string => String(value);
	const toString = (value: string): string => value;
	const toStringOrUndefined = (value: string | undefined): string => String(value);
	const toBooleanOrUndefined = (value: boolean | undefined): string => String(value);
	const toNumber = (value: number): string => String(value);
</script>

<Form onSubmit={() => undefined} {initialValues} let:form>
	<Field {form} name="age" let:input>{toNumberOrUndefined(input.value)}</Field>
	<Field {form} name="age" let:input>{toString(input.value)}</Field>
	<Field {form} name="address.city" let:input>{toStringOrUndefined(input.value)}</Field>
	<Field {form} name="newsletter" let:input>{toBooleanOrUndefined(input.value)}</Field>
	<Field {form} name="newsletter" let:input>{toNumber(input.value)}</Field>
</Form>
