// ----------------------------------------------------------------------------
// PHYSICS MACROS DEFINITION
// ----------------------------------------------------------------------------
// These will be passed to KaTeX to render them correctly in the preview.
export const PHYSICS_MACROS = {
    "\\ket": "\\raisebox{-0.2ex}{\\small $\\left\\lvert\\vphantom{#1 A}\\right.$} \\!\\!\\! \\left. #1 \\vphantom{A} \\right\\rangle",
    "\\bra": "\\left\\langle #1 \\vphantom{A} \\right. \\!\\!\\! \\raisebox{-0.2ex}{\\small $\\left.\\vphantom{#1 A}\\right\\rvert$}",
    "\\braket": "\\left\\langle #1 \\vphantom{A} \\right. \\!\\!\\! \\raisebox{-0.2ex}{\\small $\\left.\\vphantom{#1 #2 A}\\middle\\vert\\right.$} \\!\\!\\! \\left. #2 \\vphantom{A} \\right\\rangle",
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
