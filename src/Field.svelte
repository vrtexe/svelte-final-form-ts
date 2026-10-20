<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script
	lang="ts"
	generics="FormValues = Record<string, any>, InitialFormValues extends Partial<FormValues> = Partial<FormValues>"
>
	import { onMount } from 'svelte';
	import { FormContext } from './Form.svelte';
	import type { FieldConfig, FieldSubscriber, FieldSubscription } from 'final-form';

	export let name: keyof FormValues;
	export let subscriber: FieldSubscriber<FormValues[keyof FormValues]>;
	export let subscription: FieldSubscription;
	export let config: FieldConfig<FormValues[keyof FormValues]> | undefined = undefined;

	export const form = FormContext.get<FormValues, InitialFormValues>();

	onMount(() => form.registerField(name, subscriber, subscription, config));
</script>

<slot {form} />
