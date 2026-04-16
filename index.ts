"use strict";

import {
  buildConfigureCommand,
  type CommandBuilderInputs,
  type CommandPresetName,
  createPresetInputs,
} from "./command-builder.js";

function getResultTextarea(): HTMLTextAreaElement | null {
  const element = document.getElementById("result");
  if (!(element instanceof HTMLTextAreaElement)) {
    return null;
  }

  return element;
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

function applyPreset(presetName: CommandPresetName) {
  applyInputsToForm(createPresetInputs(presetName));
  setActivePresetButton(presetName);
  regenerate();
}

function regenerate() {
  const textarea = getResultTextarea();
  if (!textarea) {
    return;
  }

  textarea.value = buildConfigureCommand(collectCommandBuilderInputs());
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
      applyPreset(presetName);
    });
  }

  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of inputs) {
    const handleInputChange = () => {
      setActivePresetButton(null);
      regenerate();
    };

    input.addEventListener("input", handleInputChange);
    input.addEventListener("change", handleInputChange);
  }

  setActivePresetButton("debug-all-targets");
  regenerate();
});
