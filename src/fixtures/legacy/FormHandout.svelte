<!--
	Hands the enclosing form API to onForm during initialisation. Placed first in the form content, it
	runs before the fields and spies after it subscribe.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { getForm, type TypedFormApi } from '$lib/index.js';
	import type { Profile } from '../../specs/suite.js';

	let { onForm }: { onForm?: (form: TypedFormApi<Profile>) => void } = $props();

	untrack(() => onForm)?.(getForm<Profile>());
</script>
