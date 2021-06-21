"use strict";

function v(id: string): string {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        return "";
    }
    return el.value;
}

function vs(id: string) {
    let val = v(id);
    if (val) {
        val = " " + val;
    }
    return val;
}
function c(id: string, valueOn?: string, valueOff?: string): string {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        return "";
    }
    if (!element.checked) {
        return valueOff || "";
    }
    return valueOn || "--" + id;
}
function cs(id: string, valueOn?: string, valueOff?: string): string {
    const val = c(id, valueOn, valueOff);
    if (!val) {
        return "";
    }
    return " " + val;
}
function rs(val: string): string {
    while (val.charAt(0) === " ") {
        val = val.substring(1);
    }
    return val;
}
function vf(id: string): string {
    const val = v(id);
    if (!val) {
        return "";
    }
    return " --" + id + "=" + val;
}
function vv(id: string): string {
    const val = v(id);
    if (!val) {
        return "";
    }
    return " " + id.toUpperCase() + '="' + val + '"';
}
function regenerate() {
    let config = v("configure");
    let cflags = "";
    let cxxflags = "";
    let ldflags = "";
    config += vv("cc");
    config += vv("cxx");
    ldflags += cs("use-gold", "-fuse-ld=gold");
    cflags += cs("debuginfo", "-g3");
    cxxflags += cs("debuginfo", "-g3");
    cflags += cs("optimized", "-O2", "-O0");
    config += cs("with-system-readline");
    config += cs("with-system-zlib");
    cxxflags += cs("optimized", "-O2", "-O0");
    for (const tool of ["binutils", "gold", "ld", "gprof", "gas", "sim"]) {
        config += cs("disable-" + tool);
    }
    config += vf("target");
    config += vf("enable-targets");
    config += vf("with-expat");
    config += vf("with-python");
    config += vf("with-guile");
    config += cs("with-intel-pt");
    config += cs("with-babeltrace");
    config += cs("with-debuginfod");
    config += cs("enable-libctf");
    config += cs("disable-nls");
    cflags += cs("sanitize-address", "-fsanitize=address");
    cxxflags += cs("sanitize-address", "-fsanitize=address");
    ldflags += cs("sanitize-address", "-fsanitize=address");
    cxxflags += cs("glibcxx-debug", "-D_GLIBCXX_DEBUG=1");

    const maxErrors = v("max-errors");
    if (maxErrors.length > 0) {
        const cflagsMaxErrorsFlag = v("cc").includes("clang") ? "-ferror-limit=" : "-fmax-errors";
        cflags += " " + cflagsMaxErrorsFlag + "=" + maxErrors;
        const cxxflagsMaxErrorsFlag = v("cxx").includes("clang") ? "-ferror-limit=" : "-fmax-errors";
        cxxflags += " " + cxxflagsMaxErrorsFlag + "=" + maxErrors;
    }

    cflags += cs("diagnostics-color-always", "-fdiagnostics-color=always");
    cxxflags += cs("diagnostics-color-always", "-fdiagnostics-color=always");

    cflags += vs("additional-cflags");
    cxxflags += vs("additional-cxxflags");
    ldflags += vs("additional-ldflags");
    config += cflags ? ' CFLAGS="' + rs(cflags) + '"' : "";
    config += cxxflags ? ' CXXFLAGS="' + rs(cxxflags) + '"' : "";
    config += ldflags ? ' LDFLAGS="' + rs(ldflags) + '"' : "";
    const textarea = document.getElementById("result");
    if (!(textarea instanceof HTMLTextAreaElement)) {
        return;
    }
    textarea.value = config;
}
document.addEventListener("DOMContentLoaded", (event: Event) => {
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
