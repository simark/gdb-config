"use strict";

import {
  buildConfigureCommand,
  type CommandBuilderInputs,
  type CommandPresetName,
  createPresetInputs,
  mergeInputs,
  parseSerializedInputs,
  serializeInputs,
} from "./command-builder.js";

const defaultPresetName: CommandPresetName = "debug-all-targets";
const permalinkParamName = "config";
const presetNames: CommandPresetName[] = [
  "debug",
  "debug-all-targets",
  "optimized",
  "optimized-all-targets",
  "perf",
];

function getResultTextarea(): HTMLTextAreaElement | null {
  const element = document.getElementById("result");
  if (!(element instanceof HTMLTextAreaElement)) {
    return null;
  }

  return element;
}

function getPermalinkStatus(): HTMLElement | null {
  const element = document.getElementById("permalink-status");
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  return element;
}

function setPermalinkStatus(message: string, isError = false) {
  const element = getPermalinkStatus();
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("text-danger", isError);
  element.classList.toggle("text-secondary", !isError);
}

function collectCommandBuilderInputs(): CommandBuilderInputs {
  const values: Record<string, string> = {};
  const checked: Record<string, boolean> = {};

  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of inputs) {
    if (!input.id) {
      continue;
    }

    checked[input.id] = input.checked;
    if (input.type === "checkbox" || input.type === "radio") {
      continue;
    }

    values[input.id] = input.value;
  }

  return { values, checked };
}

function applyInputsToForm(inputs: CommandBuilderInputs) {
  const formInputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of formInputs) {
    if (!input.id) {
      continue;
    }

    if (input.type === "checkbox" || input.type === "radio") {
      input.checked = inputs.checked[input.id] ?? false;
      continue;
    }

    input.value = inputs.values[input.id] ?? "";
  }
}

function setActivePresetButton(presetName: CommandPresetName | null) {
  const presetButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-preset]");
  for (const button of presetButtons) {
    const isActive = button.dataset.preset === presetName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function areInputsEqual(
  left: CommandBuilderInputs,
  right: CommandBuilderInputs,
): boolean {
  return serializeInputs(left) === serializeInputs(right);
}

function findMatchingPreset(
  inputs: CommandBuilderInputs,
): CommandPresetName | null {
  for (const presetName of presetNames) {
    if (areInputsEqual(inputs, createPresetInputs(presetName))) {
      return presetName;
    }
  }

  return null;
}

function buildPermalinkUrl(inputs: CommandBuilderInputs): string {
  const url = new URL(window.location.href);
  if (areInputsEqual(inputs, createPresetInputs(defaultPresetName))) {
    url.searchParams.delete(permalinkParamName);
  } else {
    url.searchParams.set(permalinkParamName, serializeInputs(inputs));
  }

  return url.toString();
}

function syncPermalink(inputs: CommandBuilderInputs) {
  const url = buildPermalinkUrl(inputs);
  window.history.replaceState(null, "", url);
}

function applyPreset(presetName: CommandPresetName) {
  const inputs = createPresetInputs(presetName);
  applyInputsToForm(inputs);
  setActivePresetButton(presetName);
  regenerate(inputs);
}

function regenerate(inputs = collectCommandBuilderInputs()) {
  const textarea = getResultTextarea();
  if (!textarea) {
    return;
  }

  textarea.value = buildConfigureCommand(inputs);
  syncPermalink(inputs);
}

function copyPermalink() {
  const permalinkUrl = buildPermalinkUrl(collectCommandBuilderInputs());

  if (!navigator.clipboard) {
    setPermalinkStatus("Copy the permalink from the browser URL bar.");
    return;
  }

  navigator.clipboard.writeText(permalinkUrl).then(
    () => {
      setPermalinkStatus("Permalink copied.");
    },
    () => {
      setPermalinkStatus("Couldn't copy permalink. Copy it from the URL bar.", true);
    },
  );
}

function loadInitialInputs(): CommandBuilderInputs {
  const inputs = createPresetInputs(defaultPresetName);
  const serializedInputs = new URL(window.location.href).searchParams.get(
    permalinkParamName,
  );

  if (!serializedInputs) {
    return inputs;
  }

  try {
    setPermalinkStatus("");
    return mergeInputs(inputs, parseSerializedInputs(serializedInputs));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid permalink config.";
    setPermalinkStatus(message + " Using the default config.", true);
    return inputs;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const presetButtons =
    document.querySelectorAll<HTMLButtonElement>("[data-preset]");
  for (const button of presetButtons) {
    const presetName = button.dataset.preset as CommandPresetName | undefined;
    if (!presetName) {
      continue;
    }

    button.addEventListener("click", () => {
      setPermalinkStatus("");
      applyPreset(presetName);
    });
  }

  const copyPermalinkButton = document.getElementById("copy-permalink");
  if (copyPermalinkButton instanceof HTMLButtonElement) {
    copyPermalinkButton.addEventListener("click", copyPermalink);
  }

  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of inputs) {
    const handleInputChange = () => {
      const currentInputs = collectCommandBuilderInputs();
      setPermalinkStatus("");
      setActivePresetButton(findMatchingPreset(currentInputs));
      regenerate(currentInputs);
    };

    input.addEventListener("input", handleInputChange);
    input.addEventListener("change", handleInputChange);
  }

  const initialInputs = loadInitialInputs();
  applyInputsToForm(initialInputs);
  setActivePresetButton(findMatchingPreset(initialInputs));
  regenerate(initialInputs);
});
