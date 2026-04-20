import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConfigureCommand,
  createPresetInputs,
  mergeInputs,
  parseSerializedInputs,
  serializeInputs,
} from "./command-builder.js";

function createDefaultInputs() {
  return createPresetInputs("debug-all-targets");
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
  inputs.values.cc = "clang";
  inputs.values.cxx = "clang++";

  const command = buildConfigureCommand(inputs);

  assert.match(command, /CFLAGS='[^']*-ferror-limit=1'/);
  assert.match(command, /CXXFLAGS='[^']*-ferror-limit=1'/);
  assert.doesNotMatch(command, /-ferror-limit==1/);
});

test("use-ccache checkbox prepends ccache to compiler commands", () => {
  const inputs = createDefaultInputs();
  inputs.values.cc = "clang";
  inputs.values.cxx = "clang++";

  const withCcache = buildConfigureCommand(inputs);
  assert.match(withCcache, / CC='ccache clang'/);
  assert.match(withCcache, / CXX='ccache clang\+\+'/);

  inputs.checked["use-ccache"] = false;
  const withoutCcache = buildConfigureCommand(inputs);
  assert.match(withoutCcache, / CC='clang'/);
  assert.match(withoutCcache, / CXX='clang\+\+'/);
  assert.doesNotMatch(withoutCcache, /ccache clang/);
});

test("debug preset omits all-targets while debug-all-targets includes it", () => {
  const debugCommand = buildConfigureCommand(createPresetInputs("debug"));
  const allTargetsCommand = buildConfigureCommand(
    createPresetInputs("debug-all-targets"),
  );

  assert.doesNotMatch(debugCommand, /--enable-targets=/);
  assert.match(allTargetsCommand, /--enable-targets='all'/);
});

test("optimized presets mirror debug presets but use -O2", () => {
  const optimizedCommand = buildConfigureCommand(createPresetInputs("optimized"));
  const optimizedAllTargetsCommand = buildConfigureCommand(
    createPresetInputs("optimized-all-targets"),
  );

  assert.match(optimizedCommand, /CFLAGS='[^']*-g3 -O2 /);
  assert.match(optimizedCommand, /CXXFLAGS='[^']*-g3 -O2 /);
  assert.doesNotMatch(optimizedCommand, /--enable-targets=/);
  assert.match(optimizedAllTargetsCommand, /--enable-targets='all'/);
  assert.match(optimizedAllTargetsCommand, /CFLAGS='[^']*-g3 -O2 /);
  assert.match(optimizedAllTargetsCommand, /CXXFLAGS='[^']*-g3 -O2 /);
});

test("perf preset enables optimization and disables sanitizers", () => {
  const command = buildConfigureCommand(createPresetInputs("perf"));

  assert.match(command, /CFLAGS='[^']*-g3 -O2 /);
  assert.doesNotMatch(command, /-fsanitize=address/);
  assert.doesNotMatch(command, /--enable-ubsan/);
  assert.doesNotMatch(command, /_GLIBCXX_DEBUG/);
});

test("serializeInputs round-trips permalink state", () => {
  const inputs = createDefaultInputs();
  inputs.values.configure = "~/src/it has spaces";
  inputs.values["additional-cflags"] = "-DMESSAGE=hello";
  inputs.checked["use-ccache"] = false;
  inputs.checked.optimized = true;

  assert.deepEqual(parseSerializedInputs(serializeInputs(inputs)), inputs);
});

test("parseSerializedInputs rejects invalid permalink payloads", () => {
  assert.throws(() => parseSerializedInputs("not json"));
  assert.throws(
    () =>
      parseSerializedInputs(
        JSON.stringify({
          values: { configure: 42 },
          checked: { "use-ccache": true },
        }),
      ),
    /Invalid permalink values/,
  );
  assert.throws(
    () =>
      parseSerializedInputs(
        JSON.stringify({
          values: { configure: "~/src/binutils-gdb/configure" },
          checked: { "use-ccache": "yes" },
        }),
      ),
    /Invalid permalink options/,
  );
});

test("mergeInputs preserves defaults for missing permalink fields", () => {
  const defaults = createDefaultInputs();
  const merged = mergeInputs(defaults, {
    values: { target: "riscv64-elf" },
    checked: { optimized: true },
  });

  assert.equal(merged.values.target, "riscv64-elf");
  assert.equal(merged.checked.optimized, true);
  assert.equal(merged.values.cc, defaults.values.cc);
  assert.equal(merged.checked["use-ccache"], defaults.checked["use-ccache"]);
});
