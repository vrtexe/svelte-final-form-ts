# svelte-final-form-ts

[![npm version](https://img.shields.io/npm/v/svelte-final-form-ts.svg)](https://www.npmjs.com/package/svelte-final-form-ts)
[![npm downloads](https://img.shields.io/npm/dm/svelte-final-form-ts.svg)](https://www.npmjs.com/package/svelte-final-form-ts)
[![license](https://img.shields.io/npm/l/svelte-final-form-ts.svg)](./LICENSE.md)
[![Svelte](https://img.shields.io/badge/svelte-4%20%7C%205-ff3e00.svg)](https://svelte.dev)
[![final-form](https://img.shields.io/badge/final--form-4%20%7C%205-1f8ecc.svg)](https://final-form.org)

Type-safe [final-form](https://final-form.org) bindings for Svelte 4 and Svelte 5.

`Form`, `Field` and `FormSpy` keep final-form's rendering model — you own the markup — and add
TypeScript on top: field names are checked against the paths of your values, field values are typed
from their path, and the form API only accepts names that exist.

## Features

- **Two entries, one API.** `svelte-final-form-ts/runes` for Svelte 5 runes mode,
  `svelte-final-form-ts` for Svelte 4 and Svelte 5 non-runes mode. Same component names, same props.
- **Typed field paths.** `name="address.city"` is checked against your values type; `input.value`
  is inferred as `string`, and `form.change()` refuses an unknown path.
- **No wrapper markup.** `Form` renders no element of its own, so your `<form>` keeps its classes,
  layout and submit handling.
- **final-form underneath.** Validation, subscriptions, `mutators`, `debug` and the full `FormApi`
  stay available.
- **SSR and first render.** final-form calls its subscriber immediately, so state is populated
  during the first render rather than after hydration.
- **Small surface.** Three components, `getForm`, and the types you need for your own components.

## Install

```sh
npm install svelte-final-form-ts final-form
```

Peer dependencies: `svelte` `^4.2.0 || ^5.0.0` and `final-form` `^4.20.0 || ^5.0.0`. TypeScript 4.7
or newer is required for the component generics.

## Quick start (Svelte 5, runes)

```svelte
<script lang="ts">
	import { Field, Form, FormSpy } from 'svelte-final-form-ts/runes';

	interface Profile {
		firstName: string;
		email: string;
		address: { city: string };
	}

	const initialValues: Partial<Profile> = { firstName: '', address: { city: '' } };

	async function save(values: Partial<Profile>) {
		await fetch('/api/profile', { method: 'POST', body: JSON.stringify(values) });
	}
</script>

<Form {initialValues} onSubmit={save}>
	{#snippet children({ state, handleSubmit })}
		<form onsubmit={handleSubmit}>
			<Field name="firstName">
				{#snippet children({ input, meta })}
					<input
						value={input.value ?? ''}
						oninput={(event) => input.onChange(event.currentTarget.value)}
						onfocus={input.onFocus}
						onblur={input.onBlur}
					/>
					{#if meta.touched && meta.error}
						<p class="error">{meta.error}</p>
					{/if}
				{/snippet}
			</Field>

			<FormSpy subscription={{ valid: true, submitting: true }}>
				{#snippet children({ state })}
					<button type="submit" disabled={!state.valid || state.submitting}>Save</button>
				{/snippet}
			</FormSpy>

			{#if state.submitFailed}
				<p class="error">The server rejected the profile.</p>
			{/if}
		</form>
	{/snippet}
</Form>
```

## Quick start (Svelte 4, slots)

```svelte
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';
</script>

<Form {initialValues} {validate} onSubmit={save} let:state let:handleSubmit>
	<form on:submit={handleSubmit}>
		<Field name="firstName" let:input let:meta>
			<input
				value={input.value ?? ''}
				on:input={(event) => input.onChange(event.currentTarget.value)}
				on:focus={input.onFocus}
				on:blur={input.onBlur}
			/>
			{#if meta.touched && meta.error}
				<p class="error">{meta.error}</p>
			{/if}
		</Field>

		<button type="submit" disabled={state.pristine || state.submitting}>Save</button>
	</form>
</Form>
```

The legacy entry compiles in Svelte 4 and in Svelte 5 with `runes: false`. Import from
`svelte-final-form-ts` only when the surrounding component uses that mode.

## Validation

Form-level validators receive the whole values object and return errors keyed by field path:

```ts
import type { Profile } from './types';

function validate(values: Partial<Profile>) {
	const errors: Record<string, string> = {};
	if (!values.firstName) errors.firstName = 'Required';
	if (values.address && !values.address.city) errors['address.city'] = 'Required';
	return errors;
}
```

```svelte
<Form {validate} onSubmit={save}>
```

Field-level validators take only that field's value and run in addition to the form validator:

```svelte
<Field name="email" validate={(value) => (value?.includes('@') ? undefined : 'Enter an email')}>
```

A new validator passed to `Field` takes effect on the next validation without re-registering the
field.

## API

### `<Form>`

| Prop                      | Type                                  | Default          | Notes                                       |
| ------------------------- | ------------------------------------- | ---------------- | ------------------------------------------- |
| `onSubmit`                | `(values, form, callback) => unknown` | —                | Required; final-form throws without it.     |
| `initialValues`           | `Partial<V>`                          | `undefined`      | Read once at creation in runes mode.        |
| `validate`                | `(values) => errors`                  | `undefined`      | Whole-form validator.                       |
| `validateOnBlur`          | `boolean`                             | final-form value |                                             |
| `destroyOnUnregister`     | `boolean`                             | final-form value | Drops values of unmounted fields.           |
| `keepDirtyOnReinitialize` | `boolean`                             | final-form value | `initialize()` keeps edits of dirty fields. |
| `mutators`                | `Mutators`                            | `undefined`      | Read once at creation.                      |
| `debug`                   | `DebugFunction`                       | `undefined`      | Read once at creation.                      |
| `subscription`            | `FormSubscription`                    | every key        | Only subscribed keys reach `state`.         |

Renders `children` / the default slot with `{ form, state, handleSubmit }`. `handleSubmit` calls
`preventDefault()` on the event and then `form.submit()`.

In runes mode `initialValues` is read once; call `form.initialize()` to apply new values. The legacy
`Form` watches `initialValues` and reinitialises when the object changes shallowly.

### `<Field>`

| Prop             | Type                | Default          | Notes                                      |
| ---------------- | ------------------- | ---------------- | ------------------------------------------ |
| `name`           | `FieldPath<V>`      | —                | Dot path, e.g. `"address.city"`.           |
| `form`           | `TypedFormApi<V>`   | enclosing `Form` | Anchors the types; read once.              |
| `subscription`   | `FieldSubscription` | every key        |                                            |
| `validate`       | `(value) => error`  | `undefined`      | Read on every validation.                  |
| `validateFields` | `string[]`          | `undefined`      | Fields that revalidate when this one does. |
| `initialValue`   | `T`                 | `undefined`      |                                            |
| `defaultValue`   | `T`                 | `undefined`      |                                            |
| `isEqual`        | `(a, b) => boolean` | final-form value |                                            |
| `afterSubmit`    | `() => unknown`     | `undefined`      |                                            |
| `beforeSubmit`   | `() => unknown`     | `undefined`      |                                            |
| `data`           | `object`            | `undefined`      |                                            |

Renders `children` / the default slot with `{ input, meta }`:

- `input` — `{ name, value, onChange, onFocus, onBlur }`. Wire these individually as in the
  examples, or spread them only if the element accepts them as props.
- `meta` — the rest of final-form's `FieldState`: `error`, `touched`, `dirty`, `valid`,
  `submitting` and the other keys.

`Field` re-registers when `name` or the set of subscribed keys changes; a new inline subscription
object with the same keys is ignored.

### `<FormSpy>`

| Prop           | Type               | Default          | Notes                              |
| -------------- | ------------------ | ---------------- | ---------------------------------- |
| `form`         | `TypedFormApi<V>`  | enclosing `Form` | Read once.                         |
| `subscription` | `FormSubscription` | every key        | Read once.                         |
| `onChange`     | `(state) => void`  | `undefined`      | Called before the content renders. |

Renders `{ state, form }` (the legacy component also exposes the alias `formState`). Use it when only
part of the tree needs form state, instead of re-rendering everything inside `<Form>`.

### `getForm()`

Returns the innermost enclosing form, typed by the values you pass:

```svelte
<script lang="ts">
	import { getForm } from 'svelte-final-form-ts/runes';

	const form = getForm<Profile>();
</script>

<button type="button" onclick={() => form.change('address.city', 'Skopje')}>Use Skopje</button>
```

It reads Svelte context, so both entries find each other's forms. It must be called during component
initialisation and throws outside a `<Form>`.

## Type safety

- `FieldPath<V>` lists dot paths six levels deep; arrays, dates and functions are leaves, so `Field`
  typing does not try to descend into them.
- `FieldPathValue<V, P>` resolves the value type at a path, unions included.
- `TypedFormApi<V>` narrows final-form's `change`, `blur`, `focus`, `getFieldState` and
  `resetFieldState` to those paths.
- Untyped values (`Record<string, any>`) fall back to `string` paths and `any` values.

Exported types: `AnyFormValues`, `FieldPath`, `FieldPathValue`, `TypedFormApi`, `FieldInputProps`,
`FieldMeta`, `FormRenderProps`, `FieldRenderProps`, `FormSpyRenderProps`.

## Subscriptions

`Form`, `Field` and `FormSpy` default to every published key. Narrow them when a form gets large:

```svelte
<Form subscription={{ dirty: true, valid: true, submitting: true }} onSubmit={save}>
```

The state object then contains only those keys, and the component re-renders only when one of them
changes.

## FAQ

**Does it work with SvelteKit?** Yes. Both entries render their state during the first render, so
server-rendered markup already contains field values, errors and disabled submit buttons, and
hydration does not flash an empty form.

**Can I use zod, valibot or yup for validation?** Yes. final-form takes a plain function that
receives values and returns errors keyed by field path, so any schema library works through a thin
adapter: parse the values, then map the issues to `{ [path]: message }`.

**Does it support nested fields?** Yes, through dot paths such as `address.city`, up to six levels
deep. Arrays are treated as leaves, so indexed paths like `items.0.name` are not typed in this
version.

**Can I mix Svelte 4 and Svelte 5 components?** Not in one component. The root entry is compiled for
Svelte 4 and non-runes mode, the `/runes` entry for runes mode; pick the one that matches the
component you are writing. A form from either entry is found by `getForm()` in the other.

**How does this differ from writing final-form directly?** final-form is unchanged: same form
instance, same validation, same subscriptions. This package only adds the Svelte bindings
(`Form`, `Field`, `FormSpy` as components instead of hook calls) and the TypeScript layer for field
paths. Anything final-form can do, you can still reach through `form`.

## Developing

```sh
npm install
npm run dev -- --open   # showcase app
npm run check           # svelte-check
npm run test:unit -- --run
```

`npm run test:compat` packs the library and installs the tarball into the consumer projects under
`compat/`, once per Svelte and final-form version pair in its matrix — the peer floors and current
versions of Svelte 4, Svelte 5, final-form 4 and final-form 5. It needs registry access and works in
the git-ignored `compat/.work/` folder.

## License

[MIT](./LICENSE.md)
