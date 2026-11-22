# Client localization

Add each interface string to both [English](./en.json) and [Turkish](./tr.json) under the same English key. Keep placeholders such as `{count}` identical in both translations.

In a client component, call `useLocalization()` and use `t("key", { count })` to render the text. Both dictionaries are loaded with the client bundle. English is the default; the header language selector saves the preference in local storage.

Translate interface labels, not user content, generated questions and answers, or machine-readable export keys.
