import katex from 'katex';

const tests = ["\\class{custom}{|}", "\\htmlClass{custom}{|}", "\\htmlId{custom}{|}"];

for (const t of tests) {
    try {
        console.log("Testing:", t);
        const res = katex.renderToString(t, { trust: true, throwOnError: true, strict: false });
        console.log("SUCCESS:", res);
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}
