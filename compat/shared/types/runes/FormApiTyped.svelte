<!-- "The form API from the helper is typed by the given form values", from the runes entry. -->
<script lang="ts">
	import { getForm } from 'svelte-final-form-ts/runes';
	import type { Profile } from '../../runes/setup.js';

	const form = getForm<Profile>();
	form.change('address.city', 5);
</script>
