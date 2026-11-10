<!--
	Obtains the form API through getForm, records it, counts the subscriptions made through it from
	here on and changes the first name through it.
-->
<script>
	import { getForm } from 'svelte-final-form-ts';
	import { forms, track } from './setup.js';

	const form = getForm();
	forms.push(form);
	track(form);
</script>

<button type="button" on:click={() => form.change('firstName', 'Elena')}>
	Change through getForm
</button>
