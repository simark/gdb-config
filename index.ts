"use strict";

function v(id: string) {
    var el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        return "";
    }
    return el.value;
}

function vs(id: string) {
    var val = v(id);
    if (val) {
        val = " " + val;
    }
    return val;
}
function c(id: string, valueOn: string, valueOff: string): string {
    var element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        return "";
    }
    if (!element.checked) {
        return valueOff || "";
    }
    return valueOn || "--" + id;
}
function cs(id, valueOn, valueOff) {
    var val = c(id, valueOn, valueOff);
    if (!val) {
        return "";
    }
    return " " + val;
}
function rs(val) {
    while (val.charAt(0) === " ") {
        val = val.substring(1);
    }
    return val;
}
function vf(id) {
    var val = v(id);
    if (!val) {
        return "";
    }
    return " --" + id + "=" + val;
}
function vv(id) {
    var val = v(id);
    if (!val) {
        return "";
    }
    return " " + id.toUpperCase() + '="' + val + '"';
}
function regenerate() {
    var config = v("configure");
    var cflags = "";
    var cxxflags = "";
    var ldflags = "";
    config += vv("cc");
    config += vv("cxx");
    ldflags += cs("use-gold", "-fuse-ld=gold");
    cflags += cs("debuginfo", "-g3");
    cxxflags += cs("debuginfo", "-g3");
    cflags += cs("optimized", "-O2", "-O0");
    config += cs("with-system-readline");
    cxxflags += cs("optimized", "-O2", "-O0");
    for (
        var _i = 0, _a = ["binutils", "gold", "ld", "gprof", "gas"];
        _i < _a.length;
        _i++
    ) {
        var tool = _a[_i];
        config += cs("disable-" + tool);
    }
    config += vf("target");
    config += vf("enable-targets");
    config += vf("with-python");
    config += vf("with-guile");
    config += cs("with-intel-pt");
    config += cs("with-babeltrace");
    cflags += cs("sanitize-address", "-fsanitize=address");
    cxxflags += cs("sanitize-address", "-fsanitize=address");
    ldflags += cs("sanitize-address", "-fsanitize=address");
    cxxflags += cs("glibcxx-debug", "-D_GLIBCXX_DEBUG=1");
    cflags += vs("additional-cflags");
    cxxflags += vs("additional-cxxflags");
    ldflags += vs("additional-ldflags");
    config += cflags ? ' CFLAGS="' + rs(cflags) + '"' : "";
    config += cxxflags ? ' CXXFLAGS="' + rs(cxxflags) + '"' : "";
    config += ldflags ? ' LDFLAGS="' + rs(ldflags) + '"' : "";
    var textarea = document.getElementById("result");
    if (!(textarea instanceof HTMLTextAreaElement)) {
        return;
    }
    textarea.value = config;
}
document.addEventListener("DOMContentLoaded", function() {
    var els = document.getElementsByTagName("input");
    for (var i = 0; i < els.length; i++) {
        var el = els.item(i);
        el.onchange = regenerate;
        el.onkeyup = regenerate;
    }
    regenerate();
});
//# sourceMappingURL=index.js.map
