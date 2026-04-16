"use strict";

import {
  buildConfigureCommand,
  type CommandBuilderInputs,
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

function regenerate() {
  const textarea = getResultTextarea();
  if (!textarea) {
    return;
  }

  textarea.value = buildConfigureCommand(collectCommandBuilderInputs());
}

document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of inputs) {
    input.addEventListener("input", regenerate);
    input.addEventListener("change", regenerate);
  }

  regenerate();
});
