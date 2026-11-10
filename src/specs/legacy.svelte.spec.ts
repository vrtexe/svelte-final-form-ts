// The component scenarios on the legacy set (the root entry), from runes-mode and non-runes consumers.
import DerivedLabel from '../fixtures/legacy/DerivedLabel.svelte';
import MissingOnSubmit from '../fixtures/legacy/MissingOnSubmit.svelte';
import MissingOnSubmitNonRunes from '../fixtures/legacy/MissingOnSubmitNonRunes.svelte';
import NestedAccess from '../fixtures/legacy/NestedAccess.svelte';
import NestedAccessNonRunes from '../fixtures/legacy/NestedAccessNonRunes.svelte';
import NestedForms from '../fixtures/legacy/NestedForms.svelte';
import NestedFormsNonRunes from '../fixtures/legacy/NestedFormsNonRunes.svelte';
import OutsideForm from '../fixtures/legacy/OutsideForm.svelte';
import OutsideFormNonRunes from '../fixtures/legacy/OutsideFormNonRunes.svelte';
import Profile from '../fixtures/legacy/Profile.svelte';
import ProfileNonRunes from '../fixtures/legacy/ProfileNonRunes.svelte';
import RenameField from '../fixtures/legacy/RenameField.svelte';
import RenameFieldNonRunes from '../fixtures/legacy/RenameFieldNonRunes.svelte';
import StateProxy from '../fixtures/legacy/StateProxy.svelte';
import { componentSuite } from './suite.js';

componentSuite({
	name: 'legacy set, runes-mode consumer',
	mode: 'runes',
	Profile,
	NestedAccess,
	NestedForms,
	OutsideForm,
	RenameField,
	MissingOnSubmit,
	StateProxy,
	DerivedLabel
});

componentSuite({
	name: 'legacy set, non-runes consumer',
	mode: 'non-runes',
	Profile: ProfileNonRunes,
	NestedAccess: NestedAccessNonRunes,
	NestedForms: NestedFormsNonRunes,
	OutsideForm: OutsideFormNonRunes,
	RenameField: RenameFieldNonRunes,
	MissingOnSubmit: MissingOnSubmitNonRunes
});
