export type CommandBuilderInputs = {
  values: Record<string, string | undefined>;
  checked: Record<string, boolean | undefined>;
};

export type CommandPresetName =
  | "debug"
  | "debug-all-targets"
  | "optimized"
  | "optimized-all-targets"
  | "perf";

type FlagBucket = "cflags" | "cxxflags" | "ldflags";

type CheckedOption = {
  id: string;
  valueOn?: string;
  valueOff?: string;
};

type FlagOption = CheckedOption & {
  buckets: FlagBucket[];
};

const envVarOptions = ["cc", "cxx"];

const configureModeOptions: CheckedOption[] = [
  { id: "enable-silent-rules" },
  { id: "disable-silent-rules" },
  { id: "enable-werror" },
  { id: "disable-werror" },
];

const configureFeatureOptions: CheckedOption[] = [
  { id: "with-system-readline" },
  { id: "with-system-zlib" },
  { id: "with-intel-pt" },
  { id: "with-babeltrace" },
  { id: "with-debuginfod" },
  { id: "enable-libctf" },
  { id: "disable-nls" },
  { id: "enable-ubsan" },
];

const configureValueOptions = [
  "target",
  "enable-targets",
  "with-expat",
  "with-python",
  "with-guile",
];

const linkerOptions: FlagOption[] = [
  { id: "use-ld-bfd", valueOn: "-fuse-ld=bfd", buckets: ["ldflags"] },
  { id: "use-ld-gold", valueOn: "-fuse-ld=gold", buckets: ["ldflags"] },
  { id: "use-ld-lld", valueOn: "-fuse-ld=lld", buckets: ["ldflags"] },
  { id: "use-ld-mold", valueOn: "-fuse-ld=mold", buckets: ["ldflags"] },
];

const configureDisableToolOptions: CheckedOption[] = [
  { id: "disable-binutils" },
  { id: "disable-gold" },
  { id: "disable-ld" },
  { id: "disable-gprof" },
  { id: "disable-gprofng" },
  { id: "disable-gas" },
  { id: "disable-sim" },
];

const compilerBaseFlagOptions: FlagOption[] = [
  { id: "debuginfo", valueOn: "-g3", buckets: ["cflags", "cxxflags"] },
  {
    id: "optimized",
    valueOn: "-O2",
    valueOff: "-O0",
    buckets: ["cflags", "cxxflags"],
  },
];

const compilerExtraFlagOptions: FlagOption[] = [
  {
    id: "sanitize-address",
    valueOn: "-fsanitize=address",
    buckets: ["cflags", "cxxflags", "ldflags"],
  },
  { id: "glibcxx-debug", valueOn: "-D_GLIBCXX_DEBUG=1", buckets: ["cxxflags"] },
  {
    id: "diagnostics-color-always",
    valueOn: "-fdiagnostics-color=always",
    buckets: ["cflags", "cxxflags"],
  },
];

const additionalFlagInputs: Array<{ id: string; bucket: FlagBucket }> = [
  { id: "additional-cflags", bucket: "cflags" },
  { id: "additional-cxxflags", bucket: "cxxflags" },
  { id: "additional-ldflags", bucket: "ldflags" },
];

const debugPresetInputs: CommandBuilderInputs = {
  values: {
    configure: "~/src/binutils-gdb/configure",
    cc: "gcc",
    cxx: "g++",
    target: "",
    "enable-targets": "",
    "with-expat": "yes",
    "with-python": "python3",
    "with-guile": "guile-2.0",
    "max-errors": "1",
    "additional-cflags": "",
    "additional-cxxflags": "",
    "additional-ldflags": "",
  },
  checked: {
    "enable-silent-rules": true,
    "disable-silent-rules": false,
    "auto-silent-rules": false,
    "enable-werror": false,
    "disable-werror": false,
    "auto-werror": true,
    "use-ld-default": true,
    "use-ld-bfd": false,
    "use-ld-gold": false,
    "use-ld-lld": false,
    "use-ld-mold": false,
    "use-ccache": true,
    debuginfo: true,
    optimized: false,
    "with-system-readline": true,
    "with-system-zlib": true,
    "disable-binutils": false,
    "disable-gold": true,
    "disable-ld": true,
    "disable-gprof": true,
    "disable-gprofng": true,
    "disable-gas": true,
    "disable-sim": false,
    "with-intel-pt": true,
    "with-babeltrace": true,
    "with-debuginfod": true,
    "enable-libctf": true,
    "disable-nls": false,
    "sanitize-address": true,
    "enable-ubsan": true,
    "glibcxx-debug": true,
    "diagnostics-color-always": true,
  },
};

function cloneInputs(inputs: CommandBuilderInputs): CommandBuilderInputs {
  return {
    values: { ...inputs.values },
    checked: { ...inputs.checked },
  };
}

export function createPresetInputs(
  presetName: CommandPresetName,
): CommandBuilderInputs {
  const inputs = cloneInputs(debugPresetInputs);

  switch (presetName) {
    case "debug-all-targets":
      inputs.values["enable-targets"] = "all";
      break;
    case "optimized":
      inputs.checked.optimized = true;
      break;
    case "optimized-all-targets":
      inputs.checked.optimized = true;
      inputs.values["enable-targets"] = "all";
      break;
    case "perf":
      inputs.checked.optimized = true;
      inputs.checked["sanitize-address"] = false;
      inputs.checked["enable-ubsan"] = false;
      inputs.checked["glibcxx-debug"] = false;
      break;
    case "debug":
      break;
  }

  return inputs;
}

function getInputValue(inputs: CommandBuilderInputs, id: string): string {
  return inputs.values[id] ?? "";
}

function isChecked(inputs: CommandBuilderInputs, id: string): boolean {
  return inputs.checked[id] ?? false;
}

function getCheckedOptionValue(
  inputs: CommandBuilderInputs,
  id: string,
  valueOn?: string,
  valueOff?: string,
): string {
  if (!isChecked(inputs, id)) {
    if (valueOff) {
      return " " + valueOff;
    }

    return "";
  }

  if (valueOn) {
    return " " + valueOn;
  }

  return " --" + id;
}

function trimLeadingSpace(val: string): string {
  while (val.charAt(0) === " ") {
    val = val.substring(1);
  }

  return val;
}

function shellQuote(val: string): string {
  return "'" + val.replace(/'/g, String.raw`'"'"'`) + "'";
}

function shellQuotePath(val: string): string {
  const match = val.match(/^(~(?:[^/]+)?)(?:\/(.*))?$/);
  if (!match) {
    return shellQuote(val);
  }

  const homeDir = match[1];
  const pathWithinHome = match[2];
  if (!pathWithinHome) {
    return homeDir;
  }

  return homeDir + "/" + shellQuote(pathWithinHome);
}

function buildValueOption(inputs: CommandBuilderInputs, id: string): string {
  const val = getInputValue(inputs, id);
  if (!val) {
    return "";
  }

  return " --" + id + "=" + shellQuote(val);
}

function buildEnvVarAssignment(
  inputs: CommandBuilderInputs,
  id: string,
): string {
  let val = getInputValue(inputs, id);
  if (!val) {
    return "";
  }

  if ((id === "cc" || id === "cxx") && isChecked(inputs, "use-ccache")) {
    val = "ccache " + val;
  }

  if (!val) {
    return "";
  }

  return " " + id.toUpperCase() + "=" + shellQuote(val);
}

function appendOptions(base: string, values: string[]): string {
  return base + values.join("");
}

function collectCheckedOptions(
  inputs: CommandBuilderInputs,
  options: CheckedOption[],
): string[] {
  return options
    .map((option) =>
      getCheckedOptionValue(inputs, option.id, option.valueOn, option.valueOff),
    )
    .filter((value) => value.length > 0);
}

function collectValueOptions(
  inputs: CommandBuilderInputs,
  ids: string[],
): string[] {
  return ids
    .map((id) => buildValueOption(inputs, id))
    .filter((value) => value.length > 0);
}

function addFlagOptions(
  inputs: CommandBuilderInputs,
  flagValues: Record<FlagBucket, string[]>,
  options: FlagOption[],
): void {
  for (const option of options) {
    const value = trimLeadingSpace(
      getCheckedOptionValue(inputs, option.id, option.valueOn, option.valueOff),
    );
    if (!value) {
      continue;
    }

    for (const bucket of option.buckets) {
      flagValues[bucket].push(value);
    }
  }
}

function addAdditionalFlags(
  inputs: CommandBuilderInputs,
  flagValues: Record<FlagBucket, string[]>,
): void {
  for (const input of additionalFlagInputs) {
    const value = getInputValue(inputs, input.id);
    if (!value) {
      continue;
    }

    flagValues[input.bucket].push(value);
  }
}

function appendFlagVariables(
  config: string,
  flagValues: Record<FlagBucket, string[]>,
): string {
  const flagVariables: Array<{ name: string; bucket: FlagBucket }> = [
    { name: "CFLAGS", bucket: "cflags" },
    { name: "CXXFLAGS", bucket: "cxxflags" },
    { name: "LDFLAGS", bucket: "ldflags" },
  ];

  for (const variable of flagVariables) {
    const values = flagValues[variable.bucket];
    if (values.length === 0) {
      continue;
    }

    config += " " + variable.name + "=" + shellQuote(values.join(" "));
  }

  return config;
}

export function buildConfigureCommand(inputs: CommandBuilderInputs): string {
  let config = getInputValue(inputs, "configure");
  if (config) {
    config = shellQuotePath(config);
  }

  const flagValues: Record<FlagBucket, string[]> = {
    cflags: [],
    cxxflags: [],
    ldflags: [],
  };

  config = appendOptions(
    config,
    envVarOptions.map((id) => buildEnvVarAssignment(inputs, id)),
  );
  config = appendOptions(
    config,
    collectCheckedOptions(inputs, configureModeOptions),
  );

  addFlagOptions(inputs, flagValues, linkerOptions);
  addFlagOptions(inputs, flagValues, compilerBaseFlagOptions);

  config = appendOptions(
    config,
    collectCheckedOptions(inputs, configureFeatureOptions.slice(0, 2)),
  );
  config = appendOptions(
    config,
    collectCheckedOptions(inputs, configureDisableToolOptions),
  );
  config = appendOptions(
    config,
    collectValueOptions(inputs, configureValueOptions),
  );
  config = appendOptions(
    config,
    collectCheckedOptions(inputs, configureFeatureOptions.slice(2)),
  );

  addFlagOptions(inputs, flagValues, compilerExtraFlagOptions);

  const maxErrors = getInputValue(inputs, "max-errors");
  if (maxErrors.length > 0) {
    const cflagsMaxErrorsFlag = getInputValue(inputs, "cc").includes("clang")
      ? "-ferror-limit"
      : "-fmax-errors";
    flagValues.cflags.push(cflagsMaxErrorsFlag + "=" + maxErrors);
    const cxxflagsMaxErrorsFlag = getInputValue(inputs, "cxx").includes("clang")
      ? "-ferror-limit"
      : "-fmax-errors";
    flagValues.cxxflags.push(cxxflagsMaxErrorsFlag + "=" + maxErrors);
  }

  addAdditionalFlags(inputs, flagValues);
  return appendFlagVariables(config, flagValues);
}
