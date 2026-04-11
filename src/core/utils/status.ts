import chalk from 'chalk';
import figures from 'figures';
import { logger } from '../../utils/logging.js';
const icons = {
  success: chalk.hex('#22c55e')(figures.tick),
  error: chalk.hex('#ef4444')(figures.cross),
  warning: chalk.hex('#f59e0b')(figures.warning),
  info: chalk.hex('#6366f1')(figures.info),
  pending: chalk.hex('#6b7280')(figures.circle),
  running: chalk.hex('#d946ef')(figures.play),
  pointer: chalk.hex('#8b5cf6')(figures.pointer),
  bullet: chalk.dim(figures.bullet),
};
function showInfinityStatus() {}
function statusLine(icon, text) {
  logger.log(`  ${icon} ${text}`);
}
function header(text) {
  logger.log('');
  logger.log(chalk.bold.hex('#8b5cf6')(`  ${text}`));
  logger.log(chalk.dim('  ' + '\u2500'.repeat(50)));
}
function separator() {
  logger.log('');
}
const STATUS_ICONS = {
  success: figures.tick,
  error: figures.cross,
  warning: figures.warning,
  info: figures.info,
  loading: figures.play,
  pause: figures.squareSmallFilled,
  stop: figures.square,
  check: figures.checkboxOn,
  unchecked: figures.checkboxOff,
  arrowLeft: figures.arrowLeft,
  arrowRight: figures.arrowRight,
  arrowUp: figures.arrowUp,
  arrowDown: figures.arrowDown,
  heart: figures.heart,
  star: figures.star,
  circle: figures.circle,
  bullet: figures.bullet,
  dot: figures.dot,
  line: figures.line,
  ellipsis: figures.ellipsis,
  home: figures.home,
  laptop: figures.laptop,
  mobile: figures.mobile,
  gear: figures.gear,
  bell: figures.bell,
  lock: figures.lock,
  unlock: figures.lockOpen,
  eye: figures.eye,
  eyeHidden: figures.eyeHidden,
  key: figures.key,
  mail: figures.mail,
  link: figures.link,
  cross: figures.cross,
  tick: figures.tick,
  checkboxOn: figures.checkboxOn,
  checkboxOff: figures.checkboxOff,
  radioOn: figures.radioOn,
  radioOff: figures.radioOff,
  pointer: figures.pointer,
  pointerSmall: figures.pointerSmall,
  play: figures.play,
  triangleUp: figures.triangleUp,
  triangleLeft: figures.triangleLeft,
  triangleRight: figures.triangleRight,
  triangleDown: figures.triangleDown,
  lozenge: figures.lozenge,
  lozengeOutline: figures.lozengeOutline,
  diamond: figures.diamond,
  diamondOutline: figures.diamondOutline,
  ballotCross: figures.ballotCross,
  ballotX: figures.ballotX,
  ballotChecked: figures.ballotChecked,
  one: figures.one,
  two: figures.two,
  three: figures.three,
  four: figures.four,
  five: figures.five,
  six: figures.six,
  seven: figures.seven,
  eight: figures.eight,
  nine: figures.nine,
  copyright: figures.copyright,
  registered: figures.registered,
  trademark: figures.trademark,
  paragraph: figures.paragraph,
  pilcrow: figures.pilcrow,
  section: figures.section,
  masculineOrdinalIndicator: figures.masculineOrdinalIndicator,
  feminineOrdinalIndicator: figures.feminineOrdinalIndicator,
  degree: figures.degree,
  minus: figures.minus,
  plus: figures.plus,
  divide: figures.divide,
  multiplication: figures.multiplication,
  infinity: figures.infinity,
  superscriptOne: figures.superscriptOne,
  superscriptTwo: figures.superscriptTwo,
  superscriptThree: figures.superscriptThree,
  subscriptOne: figures.subscriptOne,
  subscriptTwo: figures.subscriptTwo,
  subscriptThree: figures.subscriptThree,
  blank: figures.space,
  space: figures.space,
  dotSmall: figures.dotSmall,
};
const STATUS_COLORS = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  loading: 'cyan',
  neutral: 'white',
  muted: 'gray',
};
function getStatusIcon(type = 'info') {
  return STATUS_ICONS[type] || STATUS_ICONS.info;
}
function getStatusColor(type = 'info') {
  return STATUS_COLORS[type] || 'white';
}
function colorize(text, type = 'info') {
  const color = getStatusColor(type);
  return chalk[color](text);
}
function formatStatus(message, type = 'info') {
  const icon = getStatusIcon(type);
  const color = getStatusColor(type);
  return chalk[color](`${icon} ${message}`);
}
function formatSuccess(message) {
  return formatStatus(message, 'success');
}
function formatError(message) {
  return formatStatus(message, 'error');
}
function formatWarning(message) {
  return formatStatus(message, 'warning');
}
function formatInfo(message) {
  return formatStatus(message, 'info');
}
function formatLoading(message) {
  return formatStatus(message, 'loading');
}
function formatProgress(current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.floor((current / total) * 20);
  const empty = 20 - filled;
  const progressBar = chalk.green('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
  const progressText = chalk.dim(`[${current}/${total}] ${percentage}%`);
  return `${progressBar} ${progressText} ${message}`;
}
function formatBadge(text, type = 'info', options = {}) {
  const { uppercase = false } = options;
  const displayText = uppercase ? text.toUpperCase() : text;
  const color = getStatusColor(type);
  return chalk[color].bold(` ${displayText} `);
}
function formatStatusCard(title, message, type = 'info') {
  const icon = getStatusIcon(type);
  const color = getStatusColor(type);
  const card = [chalk[color].bold(`${icon} ${title}`), chalk[color](message), ''].join('\n');
  return card;
}
function formatStatusRow(icon, label, value, type = 'info') {
  const statusColor = getStatusColor(type);
  return `${chalk[statusColor](icon)} ${label.padEnd(20)} ${chalk.dim(value)}`;
}
function formatStatusSummary(items) {
  let output = '';
  items.forEach((item) => {
    const itemType = item.type || 'info';
    const icon = getStatusIcon(itemType);
    const color = getStatusColor(itemType);
    output += `${chalk[color](icon)} ${item.label}: ${chalk.bold[itemType || 'white'](item.value)}
`;
  });
  return output;
}
function formatTimeline(events) {
  let output = '';
  events.forEach((event, index) => {
    const icon = index === events.length - 1 ? figures.pointer : figures.pointerSmall;
    const type = event.type || 'info';
    const color = getStatusColor(type);
    output += `${chalk[color](icon)} ${event.timestamp || ''} ${event.message}
`;
  });
  return output;
}
function formatMeter(current, max, options = {}) {
  const {
    width = 20,
    filledChar = '\u2588',
    emptyChar = '\u2591',
    showPercentage = true,
  } = options;
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const filled = Math.floor((current / max) * width);
  const empty = width - filled;
  const bar = chalk.green(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty));
  const display = showPercentage ? `${bar} ${percentage}%` : bar;
  return display;
}
function formatMultiStatus(statuses) {
  const statusStrings = statuses.map((status) => {
    const icon = getStatusIcon(status.type);
    const color = getStatusColor(status.type);
    return chalk[color](`${icon} ${status.label}`);
  });
  return statusStrings.join('  ');
}
var status_default = {
  icons,
  showInfinityStatus,
  statusLine,
  header,
  separator,
  getStatusIcon,
  getStatusColor,
  colorize,
  formatStatus,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatLoading,
  formatProgress,
  formatBadge,
  formatStatusCard,
  formatStatusRow,
  formatStatusSummary,
  formatTimeline,
  formatMeter,
  formatMultiStatus,
};
function _handleModuleError(error, context = 'status') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch {
    // Logging failure should not break the caller
  }
}
export {
  colorize,
  status_default as default,
  formatBadge,
  formatError,
  formatInfo,
  formatLoading,
  formatMeter,
  formatMultiStatus,
  formatProgress,
  formatStatus,
  formatStatusCard,
  formatStatusRow,
  formatStatusSummary,
  formatSuccess,
  formatTimeline,
  formatWarning,
  getStatusColor,
  getStatusIcon,
  header,
  icons,
  separator,
  showInfinityStatus,
  statusLine,
};
