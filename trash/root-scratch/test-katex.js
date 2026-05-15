import katex from 'katex';

const macros = {
    "\\ket": "\\left\\lvert \\mkern2mu #1 \\mkern-2mu \\right\\rangle",
    "\\bra": "\\left\\langle \\mkern-2mu #1 \\mkern2mu \\right\\rvert",
    "\\braket": "\\left\\langle \\mkern-2mu #1 \\mkern2mu \\middle\\vert \\mkern2mu #2 \\mkern-2mu \\right\\rangle",
};

try {
    const html1 = katex.renderToString("\\ket{x}", { macros, throwOnError: true });
    console.log("ket: SUCCESS");
    const html2 = katex.renderToString("\\bra{x}", { macros, throwOnError: true });
    console.log("bra: SUCCESS");
    const html3 = katex.renderToString("\\braket{x}{y}", { macros, throwOnError: true });
    console.log("braket: SUCCESS");
} catch (e) {
    console.error("ERROR:", e.message);
}
