const fs = require('fs');
const content = fs.readFileSync('src/components/ui/EntropyHero.tsx', 'utf8');
const newContent = content.replace(/navigate\(\`\/field\/\$\{label\.slug\}\`\);/, "navigate(`/graph?field=${label.slug}`);");
fs.writeFileSync('src/components/ui/EntropyHero.tsx', newContent, 'utf8');
console.log('Fixed EntropyHero.tsx');
