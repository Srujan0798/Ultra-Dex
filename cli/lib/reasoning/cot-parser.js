export function parseChainOfThought(text = '') {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const nodes = [];
  lines.forEach((line, index) => {
    nodes.push({
      id: `step-${index + 1}`,
      text: line,
      type: line.includes('because') ? 'inference' : 'fact',
      confidence: 0.5 + Math.min(index * 0.05, 0.4)
    });
  });
  return nodes;
}

export default {
  parseChainOfThought
};
