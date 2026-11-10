<!-- A Form without onSubmit; the untyped props bypass the type check that would reject it. -->
<script lang="ts">
	import { Form } from 'svelte-final-form-ts/runes';
	import { withoutOnSubmit } from './setup.js';
</script>

<Form {...withoutOnSubmit} />
