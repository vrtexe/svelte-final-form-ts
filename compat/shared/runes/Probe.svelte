<!-- Obtains the form API through getForm, records it and changes the first name through it. -->
<script lang="ts">
	import { getForm } from 'svelte-final-form-ts/runes';
	import { forms, type Profile } from './setup.js';

	const form = getForm<Profile>();
	forms.push(form);
</script>

<button type="button" onclick={() => form.change('firstName', 'Elena')}>
	Change through getForm
</button>
