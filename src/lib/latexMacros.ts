// ----------------------------------------------------------------------------
// PHYSICS MACROS DEFINITION
// ----------------------------------------------------------------------------
// These will be passed to KaTeX to render them correctly in the preview.
export const PHYSICS_MACROS = {
    "\\ket": "\\left|\\mkern-1.5mu #1 \\mkern1.5mu\\right\\rangle",
    "\\bra": "\\left\\langle\\mkern1.5mu #1 \\mkern-1.5mu\\right|",
    "\\braket": "\\left\\langle\\mkern1.5mu #1 \\middle| #2 \\mkern1.5mu\\right\\rangle",
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
