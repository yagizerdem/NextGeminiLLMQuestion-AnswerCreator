# Client localization

Add each interface string to [English](./en.json), [Turkish](./tr.json), [Dutch](./nl.json) and [Russian](./ru.json) under the same English key. Keep placeholders such as `{count}` identical in every translation.

In a client component, call `useLocalization()` and use `t("key", { count })` to render the text. All dictionaries are loaded with the client bundle. English is the default; the header language selector saves the preference in local storage.

Translate interface labels, not user content, generated questions and answers, or machine-readable export keys.
