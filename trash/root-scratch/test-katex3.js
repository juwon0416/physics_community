import katex from 'katex';

const macros = {
    "\\ketStandard": "\\left| #1 \\right\\rangle",
    "\\ketInner": "\\mathinner{\\left|{#1}\\right\\rangle}",
    "\\ketMskip": "\\left|\\mskip 1mu #1 \\mskip 1mu \\right\\rangle"
};

console.log("Standard:\n", katex.renderToString("\\ketStandard{a_k}", { macros, throwOnError: true }));
console.log("\nMathinner:\n", katex.renderToString("\\ketInner{a_k}", { macros, throwOnError: true }));
console.log("\nMskip:\n", katex.renderToString("\\ketMskip{a_k}", { macros, throwOnError: true }));
