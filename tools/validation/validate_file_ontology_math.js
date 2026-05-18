import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';

const TARGET_FILES = [
  'src/data/fundamentalsChapter1Ontology.ts',
  'src/data/fundamentalsChapter2Ontology.ts',
  'src/lib/fileOntology.ts',
  'src/lib/ontologyWorkflow.ts',
];

function isEscaped(source, index) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function lineColumn(source, index) {
  const before = source.slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function findUnescaped(source, needle, startIndex) {
  let cursor = startIndex;
  while (cursor < source.length) {
    const found = source.indexOf(needle, cursor);
    if (found === -1) return -1;
    if (!isEscaped(source, found)) return found;
    cursor = found + needle.length;
  }
  return -1;
}

function skipTemplateInterpolation(source, startIndex) {
  if (!source.startsWith('${', startIndex)) return startIndex;

  let depth = 1;
  let cursor = startIndex + 2;
  while (cursor < source.length && depth > 0) {
    if (source[cursor] === '{' && !isEscaped(source, cursor)) depth += 1;
    if (source[cursor] === '}' && !isEscaped(source, cursor)) depth -= 1;
    cursor += 1;
  }
  return cursor;
}

function collectTemplateBlocks(source, filePath) {
  const blocks = [];
  const markers = [/String\.raw\s*`/g, /content:\s*`/g];

  markers.forEach((marker) => {
    let match;
    while ((match = marker.exec(source)) !== null) {
      const start = source.indexOf('`', match.index);
      if (start === -1) continue;

      let cursor = start + 1;
      while (cursor < source.length) {
        if (source[cursor] === '`' && !isEscaped(source, cursor)) {
          blocks.push({
            filePath,
            source: source.slice(start + 1, cursor),
            offset: start + 1,
            fileSource: source,
          });
          marker.lastIndex = cursor + 1;
          break;
        }
        cursor += 1;
      }
    }
  });

  return blocks;
}

function collectMathExpressions(block) {
  const expressions = [];
  const errors = [];
  const source = block.source;
  let cursor = 0;

  while (cursor < source.length) {
    if (source.startsWith('```', cursor)) {
      const end = source.indexOf('```', cursor + 3);
      cursor = end === -1 ? source.length : end + 3;
      continue;
    }

    if (source.startsWith('${', cursor)) {
      cursor = skipTemplateInterpolation(source, cursor);
      continue;
    }

    if (source.startsWith('$$', cursor)) {
      const end = findUnescaped(source, '$$', cursor + 2);
      if (end === -1) {
        errors.push({ index: cursor, message: 'Unclosed display math fence "$$".' });
        break;
      }

      expressions.push({
        index: cursor,
        displayMode: true,
        tex: source.slice(cursor + 2, end).trim(),
      });
      cursor = end + 2;
      continue;
    }

    if (source.startsWith('\\[', cursor)) {
      const end = findUnescaped(source, '\\]', cursor + 2);
      if (end === -1) {
        errors.push({ index: cursor, message: 'Unclosed display math fence "\\[".' });
        break;
      }

      expressions.push({
        index: cursor,
        displayMode: true,
        tex: source.slice(cursor + 2, end).trim(),
      });
      cursor = end + 2;
      continue;
    }

    if (source.startsWith('\\(', cursor)) {
      const end = findUnescaped(source, '\\)', cursor + 2);
      if (end === -1) {
        errors.push({ index: cursor, message: 'Unclosed inline math fence "\\(".' });
        break;
      }

      expressions.push({
        index: cursor,
        displayMode: false,
        tex: source.slice(cursor + 2, end).trim(),
      });
      cursor = end + 2;
      continue;
    }

    if (
      source[cursor] === '$' &&
      source[cursor + 1] !== '$' &&
      source[cursor + 1] !== '{' &&
      !isEscaped(source, cursor)
    ) {
      const end = findUnescaped(source, '$', cursor + 1);
      if (end === -1) {
        errors.push({ index: cursor, message: 'Unclosed inline math fence "$".' });
        break;
      }

      expressions.push({
        index: cursor,
        displayMode: false,
        tex: source.slice(cursor + 1, end).trim(),
      });
      cursor = end + 1;
      continue;
    }

    cursor += 1;
  }

  return { expressions, errors };
}

function validateExpression(expression, block) {
  if (!expression.tex) return null;

  try {
    katex.renderToString(expression.tex, {
      displayMode: expression.displayMode,
      throwOnError: true,
      strict: 'ignore',
      trust: false,
    });
    return null;
  } catch (error) {
    const position = lineColumn(block.fileSource, block.offset + expression.index);
    return {
      filePath: block.filePath,
      line: position.line,
      column: position.column,
      message: error instanceof Error ? error.message : String(error),
      tex: expression.tex,
    };
  }
}

const failures = [];
let expressionCount = 0;

TARGET_FILES.forEach((relativePath) => {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return;

  const source = fs.readFileSync(absolutePath, 'utf8');
  const blocks = collectTemplateBlocks(source, relativePath);

  blocks.forEach((block) => {
    const { expressions, errors } = collectMathExpressions(block);
    errors.forEach((error) => {
      const position = lineColumn(block.fileSource, block.offset + error.index);
      failures.push({
        filePath: block.filePath,
        line: position.line,
        column: position.column,
        message: error.message,
        tex: '',
      });
    });

    expressions.forEach((expression) => {
      expressionCount += 1;
      const failure = validateExpression(expression, block);
      if (failure) failures.push(failure);
    });
  });
});

if (failures.length > 0) {
  console.error('File ontology math validation failed:');
  failures.forEach((failure) => {
    console.error(`- ${failure.filePath}:${failure.line}:${failure.column} ${failure.message}`);
    if (failure.tex) console.error(`  ${failure.tex}`);
  });
  process.exit(1);
}

console.log(`File ontology math validation passed (${expressionCount} expressions).`);
