import assert from "node:assert/strict";
import test from "node:test";

import { buildConfigureCommand } from "./command-builder.js";

function createDefaultInputs() {
  return {
    values: {
      configure: "~/src/binutils-gdb/configure",
      cc: "ccache gcc",
      cxx: "ccache g++",
      target: "",
      "enable-targets": "all",
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
      "enable-werror": false,
      "disable-werror": false,
      "use-ld-default": true,
      "use-ld-bfd": false,
      "use-ld-gold": false,
      "use-ld-lld": false,
      "use-ld-mold": false,
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
}

test("buildConfigureCommand matches the default UI output", () => {
  assert.equal(
    buildConfigureCommand(createDefaultInputs()),
    "~/'src/binutils-gdb/configure' CC='ccache gcc' CXX='ccache g++' --enable-silent-rules --with-system-readline --with-system-zlib --disable-gold --disable-ld --disable-gprof --disable-gprofng --disable-gas --enable-targets='all' --with-expat='yes' --with-python='python3' --with-guile='guile-2.0' --with-intel-pt --with-babeltrace --with-debuginfod --enable-libctf --enable-ubsan CFLAGS='-g3 -O0 -fsanitize=address -fdiagnostics-color=always -fmax-errors=1' CXXFLAGS='-g3 -O0 -fsanitize=address -D_GLIBCXX_DEBUG=1 -fdiagnostics-color=always -fmax-errors=1' LDFLAGS='-fsanitize=address'",
  );
});

test("buildConfigureCommand shell-quotes paths and option values", () => {
  const inputs = createDefaultInputs();
  inputs.values.configure = "~/src/dir with spaces/it's configure";
  inputs.values.target = "aarch64 elf";
  inputs.values["with-python"] = "python3 -c 'print(1)'";
  inputs.values["additional-cflags"] = "-DMESSAGE='hello world'";

  const command = buildConfigureCommand(inputs);

  assert.match(command, /~\/'src\/dir with spaces\/it'"'"'s configure'/);
  assert.match(command, / --target='aarch64 elf'/);
  assert.ok(
    command.includes(
      String.raw` --with-python='python3 -c '"'"'print(1)'"'"''`,
    ),
  );
  assert.ok(command.includes(String.raw`-DMESSAGE='"'"'hello world'"'"'`));
});

test("buildConfigureCommand uses clang-specific max error flags", () => {
  const inputs = createDefaultInputs();
  inputs.values.cc = "ccache clang";
  inputs.values.cxx = "clang++";

  const command = buildConfigureCommand(inputs);

  assert.match(command, /CFLAGS='[^']*-ferror-limit=1'/);
  assert.match(command, /CXXFLAGS='[^']*-ferror-limit=1'/);
  assert.doesNotMatch(command, /-ferror-limit==1/);
});
