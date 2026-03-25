import katex from 'katex';

const PHYSICS_MACROS = {
    "\\ket": "\\htmlclass{custom-bra}{|}\\mkern-4mu{#1}\\mkern-4mu\\htmlclass{custom-ket}{>}",
    "\\bra": "\\htmlclass{custom-bra}{<}\\mkern-4mu{#1}\\mkern-4mu\\htmlclass{custom-pipe}{|}",
    "\\braket": "\\htmlclass{custom-bra}{<}\\mkern-4mu{#1}\\mkern-4mu\\htmlclass{custom-pipe}{|}\\mkern-4mu{#2}\\mkern-4mu\\htmlclass{custom-ket}{>}",
};

try {
    const res = katex.renderToString("\\ket{\\psi}", {
        macros: PHYSICS_MACROS,
        trust: true,
        throwOnError: true,
    });
    console.log("SUCCESS:", res);
} catch (e) {
    console.error("ERROR:", e);
}
