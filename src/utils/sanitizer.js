/**
 * 文件名和内容清理工具
 */

/**
 * 清理文件名，移除非法字符
 * @param {string} name - 原始文件名
 * @param {number} maxLength - 最大长度，默认50
 * @param {string} defaultName - 默认文件名，默认'chat'
 * @returns {string} 清理后的文件名
 */
export function sanitizeFilename(name, maxLength = 50, defaultName = 'chat') {
  if (!name) return defaultName;

  let cleaned = name
    .replace(/^[\/\.]+/, '')
    .replace(/[\x00-\x1F<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-{2,}/g, '-');

  // 限制长度并确保非空
  cleaned = cleaned.substring(0, maxLength) || defaultName;

  return cleaned;
}

/**
 * HTML实体解码
 * @param {string} text - 包含HTML实体的文本
 * @returns {string} 解码后的文本
 */
export function decodeHtmlEntities(text) {
  if (!text) return '';

  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&mdash;': '—',
    '&ndash;': '–'
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // 处理数字实体
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

/**
 * 清理多余换行
 * @param {string} text - 原始文本
 * @returns {string} 清理后的文本
 */
export function cleanupNewlines(text) {
  if (!text) return '';
  return text.replace(/\n{4,}/g, '\n\n\n').trim();
}

/**
 * 清理HTML标签（简单版本）
 * @param {string} html - HTML字符串
 * @returns {string} 纯文本
 */
export function stripHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}
