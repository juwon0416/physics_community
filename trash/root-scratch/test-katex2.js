import katex from 'katex';

const macros = {
    "\\ketStandard": "\\left| #1 \\right\\rangle",
    "\\ketAdjusted": "\\left\\lvert \\mkern2mu #1 \\mkern-2mu \\right\\rangle",
};

console.log("Standard:\n", katex.renderToString("\\ketStandard{x}", { macros, throwOnError: true }));
console.log("\nAdjusted:\n", katex.renderToString("\\ketAdjusted{x}", { macros, throwOnError: true }));
