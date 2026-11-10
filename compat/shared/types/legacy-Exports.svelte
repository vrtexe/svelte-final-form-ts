<!--
	"Every export ships a type declaration": a component that uses Form, Field, FormSpy and getForm
	from the root entry type-checks with skipLibCheck false and reports 0 errors. Never rendered.
-->
<script lang="ts">
	import { Field, Form, FormSpy, getForm, type TypedFormApi } from 'svelte-final-form-ts';

	type Profile = {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	};

	const onSubmit = (values: Profile): undefined => void values;
	const fromContext = (): TypedFormApi<Profile> => getForm<Profile>();
	const upper = (value: string | undefined): string => (value ?? '').toUpperCase();
</script>

<Form {onSubmit} let:form let:state let:handleSubmit>
	<form on:submit={handleSubmit}>
		<Field {form} name="address.city" let:input let:meta>
			<input
				value={upper(input.value)}
				on:input={(event) => input.onChange(event.currentTarget.value)}
				on:blur={input.onBlur}
			/>
			{#if meta.touched && meta.error}<span>{meta.error}</span>{/if}
		</Field>
		<FormSpy {form} subscription={{ values: true }} let:state={spyState}>
			<span>{upper(spyState.values?.firstName)}</span>
		</FormSpy>
		<button disabled={state.submitting}>Save</button>
	</form>
</Form>
