"use strict";

function v(id: string): string {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        return "";
    }
    return el.value;
}

function checked(id: string, valueOn?: string, valueOff?: string): string {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        return "";
    }
    if (!element.checked) {
        if (valueOff) {
            return " " + valueOff;
        } else {
            return "";
        }
    }
    if (valueOn) {
        return " " + valueOn;
    } else {
        return " --" + id;
    }
}
function rs(val: string): string {
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
function vf(id: string): string {
    const val = v(id);
    if (!val) {
        return "";
    }
    return " --" + id + "=" + shellQuote(val);
}
function vv(id: string): string {
    const val = v(id);
    if (!val) {
        return "";
    }
    return " " + id.toUpperCase() + "=" + shellQuote(val);
}
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
    { id: "optimized", valueOn: "-O2", valueOff: "-O0", buckets: ["cflags", "cxxflags"] },
];

const compilerExtraFlagOptions: FlagOption[] = [
    { id: "sanitize-address", valueOn: "-fsanitize=address", buckets: ["cflags", "cxxflags", "ldflags"] },
    { id: "glibcxx-debug", valueOn: "-D_GLIBCXX_DEBUG=1", buckets: ["cxxflags"] },
    { id: "diagnostics-color-always", valueOn: "-fdiagnostics-color=always", buckets: ["cflags", "cxxflags"] },
];

const additionalFlagInputs: Array<{ id: string; bucket: FlagBucket }> = [
    { id: "additional-cflags", bucket: "cflags" },
    { id: "additional-cxxflags", bucket: "cxxflags" },
    { id: "additional-ldflags", bucket: "ldflags" },
];

function appendOptions(base: string, values: string[]): string {
    return base + values.join("");
}

function collectCheckedOptions(options: CheckedOption[]): string[] {
    return options
        .map((option) => checked(option.id, option.valueOn, option.valueOff))
        .filter((value) => value.length > 0);
}

function collectValueOptions(ids: string[]): string[] {
    return ids.map((id) => vf(id)).filter((value) => value.length > 0);
}

function addFlagOptions(flagValues: Record<FlagBucket, string[]>, options: FlagOption[]): void {
    for (const option of options) {
        const value = rs(checked(option.id, option.valueOn, option.valueOff));
        if (!value) {
            continue;
        }

        for (const bucket of option.buckets) {
            flagValues[bucket].push(value);
        }
    }
}

function addAdditionalFlags(flagValues: Record<FlagBucket, string[]>): void {
    for (const input of additionalFlagInputs) {
        const value = v(input.id);
        if (!value) {
            continue;
        }

        flagValues[input.bucket].push(value);
    }
}

function appendFlagVariables(config: string, flagValues: Record<FlagBucket, string[]>): string {
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

function regenerate() {
    let config = v("configure");
    if (config) {
        config = shellQuotePath(config);
    }
    const flagValues: Record<FlagBucket, string[]> = {
        cflags: [],
        cxxflags: [],
        ldflags: [],
    };

    config = appendOptions(config, envVarOptions.map((id) => vv(id)));
    config = appendOptions(config, collectCheckedOptions(configureModeOptions));

    addFlagOptions(flagValues, linkerOptions);
    addFlagOptions(flagValues, compilerBaseFlagOptions);

    config = appendOptions(config, collectCheckedOptions(configureFeatureOptions.slice(0, 2)));
    config = appendOptions(config, collectCheckedOptions(configureDisableToolOptions));
    config = appendOptions(config, collectValueOptions(configureValueOptions));
    config = appendOptions(config, collectCheckedOptions(configureFeatureOptions.slice(2)));

    addFlagOptions(flagValues, compilerExtraFlagOptions);

    const maxErrors = v("max-errors");
    if (maxErrors.length > 0) {
        const cflagsMaxErrorsFlag = v("cc").includes("clang") ? "-ferror-limit=" : "-fmax-errors";
        flagValues.cflags.push(cflagsMaxErrorsFlag + "=" + maxErrors);
        const cxxflagsMaxErrorsFlag = v("cxx").includes("clang") ? "-ferror-limit=" : "-fmax-errors";
        flagValues.cxxflags.push(cxxflagsMaxErrorsFlag + "=" + maxErrors);
    }

    addAdditionalFlags(flagValues);
    config = appendFlagVariables(config, flagValues);
    const textarea = document.getElementById("result");
    if (!(textarea instanceof HTMLTextAreaElement)) {
        return;
    }
    textarea.value = config;
}
document.addEventListener("DOMContentLoaded", () => {
    const els = document.getElementsByTagName("input");
    for (let i = 0; i < els.length; i++) {
        const el = els.item(i);
        if (!el) {
            continue;
        }

        el.onchange = regenerate;
        el.onkeyup = regenerate;
    }
    regenerate();
});
