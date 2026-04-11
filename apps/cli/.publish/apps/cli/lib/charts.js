import chalk from 'chalk';

/**
 * Chart and visualization utilities for Ultra-Dex CLI
 */

/**
 * Create a horizontal bar chart
 * @param {Array<{label: string, value: number, maxValue?: number}>} data - Chart data
 * @param {object} options - Chart options
 * @returns {string} Formatted bar chart
 */
export async function createBarChart(data, options = {}) {
  const width = options.width || 40;
  const barChar = options.barChar || '█';
  const emptyChar = options.emptyChar || '░';
  const maxValue = options.maxValue || Math.max(...data.map((d) => d.value), 1);
  const color = options.color || chalk.blue;

  let output = '';

  for (const item of data) {
    const ratio = item.value / maxValue;
    const barLength = Math.round(ratio * width);
    const bar = color(barChar.repeat(barLength));
    const empty = chalk.gray(emptyChar.repeat(width - barLength));

    const label = item.label.padEnd(15);
    const value = String(item.value).padStart(5);

    output += `${label} [${bar}${empty}] ${value}\n`;
  }

  return output;
}

/**
 * Create a simple pie chart representation using text
 * @param {Array<{label: string, value: number}>} data - Chart data
 * @param {object} options - Chart options
 * @returns {string} Text-based pie chart
 */
export async function createPieChart(data, options = {}) {
  const _radius = options.radius || 5;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return 'No data to display';
  }

  // Calculate percentages
  const percentages = data.map((item) => ({
    ...item,
    percentage: Math.round((item.value / total) * 100),
  }));

  // Create a simple text representation
  let output = '';

  // Draw the pie chart as a list of percentages
  for (const item of percentages) {
    const barWidth = 20;
    const filledBars = Math.round((item.percentage / 100) * barWidth);
    const bar = chalk.blue('█'.repeat(filledBars)) + chalk.gray('░'.repeat(barWidth - filledBars));

    output += `${item.label.padEnd(15)} [${bar}] ${item.percentage}%\n`;
  }

  return output;
}

/**
 * Create a line chart representation
 * @param {Array<{x: string|number, y: number}>} data - Chart data
 * @param {object} options - Chart options
 * @returns {string} Text-based line chart
 */
export async function createLineChart(data, options = {}) {
  const height = options.height || 10;
  const width = options.width || 50;
  const pointChar = options.pointChar || '●';

  if (data.length === 0) {
    return 'No data to display';
  }

  // Normalize data
  const values = data.map((d) => d.y);
  const minX = Math.min(...values);
  const maxX = Math.max(...values);
  const range = maxX - minX || 1; // Avoid division by zero

  // Create grid
  const grid = Array(height)
    .fill()
    .map(() => Array(width).fill(' '));

  // Scale and plot points
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    if (i >= width) break; // Limit to width

    const scaledY = Math.round(((point.y - minX) / range) * (height - 1));
    const y = height - 1 - scaledY; // Flip coordinate system
    const x = Math.round((i / (data.length - 1)) * (width - 1));

    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = pointChar;
    }
  }

  // Connect points with lines (simple implementation)
  for (let i = 0; i < data.length - 1; i++) {
    const idx1 = Math.round((i / (data.length - 1)) * (width - 1));
    const idx2 = Math.round(((i + 1) / (data.length - 1)) * (width - 1));

    if (idx1 >= width || idx2 >= width) continue;

    const y1 = height - 1 - Math.round(((data[i].y - minX) / range) * (height - 1));
    const y2 = height - 1 - Math.round(((data[i + 1].y - minX) / range) * (height - 1));

    // Draw simple line between points
    const xDiff = idx2 - idx1;
    const yDiff = y2 - y1;

    if (xDiff !== 0) {
      const slope = yDiff / xDiff;
      for (let x = Math.max(0, idx1); x <= Math.min(width - 1, idx2); x++) {
        const y = Math.round(y1 + slope * (x - idx1));
        if (y >= 0 && y < height) {
          if (grid[y][x] !== pointChar) {
            // Don't overwrite points
            grid[y][x] = options.lineChar || '─';
          }
        }
      }
    }
  }

  // Convert grid to string
  let output = '';
  for (const row of grid) {
    output += row.join('') + '\n';
  }

  return output;
}

/**
 * Create a simple gauge visualization
 * @param {number} value - Current value
 * @param {number} maxValue - Maximum value
 * @param {string} label - Label for the gauge
 * @param {object} options - Gauge options
 * @returns {string} Formatted gauge
 */
export async function createGauge(value, maxValue, label = '', options = {}) {
  const width = options.width || 30;
  const filledChar = options.filledChar || '█';
  const emptyChar = options.emptyChar || '░';
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  const filledLength = Math.round((value / maxValue) * width);
  const emptyLength = width - filledLength;

  const bar =
    chalk.green(filledChar.repeat(filledLength)) + chalk.gray(emptyChar.repeat(emptyLength));

  const displayValue =
    options.showValues !== false ? `${value}/${maxValue} (${percentage}%)` : `${percentage}%`;

  if (label) {
    return `${chalk.blue(label)}\n[${bar}] ${chalk.bold(displayValue)}`;
  }

  return `[${bar}] ${chalk.bold(displayValue)}`;
}

/**
 * Create a sparkline chart
 * @param {Array<number>} values - Numeric values
 * @param {object} options - Sparkline options
 * @returns {string} Text-based sparkline
 */
export async function createSparkline(values, _options = {}) {
  if (values.length === 0) {
    return '';
  }

  // Unicode block characters for sparklines
  const blocks = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  // Normalize values to 0-8 range
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const normalized = values.map((v) => {
    const ratio = (v - minVal) / range;
    return Math.floor(ratio * (blocks.length - 1));
  });

  return normalized.map((i) => chalk.blue(blocks[i])).join('');
}

/**
 * Create a heatmap-style visualization
 * @param {Array<Array<number>>} matrix - 2D array of values
 * @param {Array<string>} rowLabels - Labels for rows
 * @param {Array<string>} colLabels - Labels for columns
 * @param {object} options - Heatmap options
 * @returns {string} Text-based heatmap
 */
export async function createHeatmap(matrix, rowLabels = [], colLabels = [], _options = {}) {
  if (matrix.length === 0) {
    return 'No data to display';
  }

  // Find min and max values for normalization
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (const row of matrix) {
    for (const val of row) {
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
  }

  const range = maxVal - minVal || 1;

  // Create color scale function
  const getColor = (value) => {
    const ratio = (value - minVal) / range;
    if (ratio < 0.25) return chalk.bgBlue.white;
    if (ratio < 0.5) return chalk.bgCyan.black;
    if (ratio < 0.75) return chalk.bgYellow.black;
    return chalk.bgRed.white;
  };

  let output = '';

  // Add column labels if provided
  if (colLabels.length > 0) {
    output += '      ';
    for (const label of colLabels) {
      output += label.padEnd(6);
    }
    output += '\n';
  }

  // Add matrix rows
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex];
    if (rowLabels.length > 0) {
      output += rowLabels[rowIndex].padEnd(6);
    }

    for (const value of row) {
      const cell = getColor(value)(value.toString().padEnd(4));
      output += cell + '  ';
    }

    output += '\n';
  }

  return output;
}

/**
 * Create a tree diagram visualization
 * @param {Array<{name: string, children?: Array, level?: number}>} nodes - Tree nodes
 * @param {object} options - Tree options
 * @returns {string} Text-based tree diagram
 */
export async function createTree(nodes, options = {}) {
  const _indentChar = options.indentChar || '  ';
  const expandChar = options.expandChar || '├─';
  const lastChar = options.lastChar || '└─';

  function buildTree(nodeList, level = 0, isLastList = []) {
    let output = '';

    for (let index = 0; index < nodeList.length; index++) {
      const node = nodeList[index];
      const isLast = index === nodeList.length - 1;
      const isRoot = level === 0;

      // Build prefix
      let prefix = '';
      if (!isRoot) {
        for (let i = 0; i < level - 1; i++) {
          prefix += isLastList[i] ? '    ' : '│   ';
        }
        prefix += isLast ? lastChar : expandChar;
      }

      output += prefix + chalk.blue(node.name) + '\n';

      // Process children if they exist
      if (node.children && node.children.length > 0) {
        const newIsLastList = [...isLastList, isLast];
        output += buildTree(node.children, level + 1, newIsLastList);
      }
    }

    return output;
  }

  return buildTree(nodes);
}

/**
 * Format a chart title with consistent styling
 * @param {string} title - Chart title
 * @returns {string} Formatted title
 */
export async function formatChartTitle(title) {
  return chalk.bold.blue('\n' + title + '\n' + '─'.repeat(title.length) + '\n');
}

// Export all chart utilities
export default {
  createBarChart,
  createPieChart,
  createLineChart,
  createGauge,
  createSparkline,
  createHeatmap,
  createTree,
  formatChartTitle,
};
