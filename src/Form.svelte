<script module lang="ts">
	export const FormContext = {
		CONTEXT_KEY: 'FINAL_FORM',
		get<
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			FormValues = Record<string, any>,
			InitialFormValues extends Partial<FormValues> = Partial<FormValues>,
			T = FormApi<FormValues, InitialFormValues>
		>() {
			return getContext<T>(this.CONTEXT_KEY);
		},
		set<
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			FormValues = Record<string, any>,
			InitialFormValues extends Partial<FormValues> = Partial<FormValues>,
			T = FormApi<FormValues, InitialFormValues>
		>(value: T) {
			return setContext(this.CONTEXT_KEY, value);
		}
	};
</script>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script
	lang="ts"
	generics="FormValues = Record<string, any>, InitialFormValues extends Partial<FormValues> = Partial<FormValues>"
>
	import {
		createForm,
		type Config,
		type FormApi,
		type FormState,
		type FormSubscription
	} from 'final-form';
	import { getContext, onMount, setContext } from 'svelte';

	export let config: Config<FormValues, InitialFormValues>;
	export let subscriber: ((state: FormState<FormValues, InitialFormValues>) => void) | undefined =
		undefined;
	export let subscription: FormSubscription | undefined = {};

	export const form: FormApi<FormValues, InitialFormValues> = FormContext.set(createForm(config));
	export const getForm = () => form;

	onMount(() => {
		if (!subscriber || !subscription) return;
		return form.subscribe(subscriber, subscription);
	});
</script>

<slot {form} />
