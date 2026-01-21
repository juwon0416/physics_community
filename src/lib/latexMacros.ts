// ----------------------------------------------------------------------------
// PHYSICS MACROS DEFINITION
// ----------------------------------------------------------------------------
// These will be passed to KaTeX to render them correctly in the preview.
export const PHYSICS_MACROS = {
    "\\ket": "\\left|\\, #1 \\,\\right\\rangle",
    "\\bra": "\\left\\langle\\, #1 \\,\\right|",
    "\\braket": "\\left\\langle\\, #1 \\,\\middle|\\, #2 \\,\\right\\rangle",
    "\\grad": "\\nabla",
    "\\div": "\\nabla\\cdot",
    "\\curl": "\\nabla\\times",
    "\\pd": "\\frac{\\partial #1}{\\partial #2}",
    "\\dd": "\\frac{d #1}{d #2}",
    "\\avg": "\\left\\langle#1\\right\\rangle",
    "\\dag": "^\\dagger",
    "\\L": "\\mathcal{L}",
    "\\H": "\\mathcal{H}",
    "\\unity": "\\mathbb{1}",
};
