/**
 * Markdown生成器
 * 接收统一数据结构，输出Markdown
 */
import { sanitizeFilename, decodeHtmlEntities, cleanupNewlines } from './sanitizer.js';

/**
 * Markdown生成器类
 */
export class MarkdownGenerator {
  constructor() {
    this.content = '';
  }

  /**
   * 生成完整Markdown
   * @param {Object} data - 统一数据结构
   * @param {string} data.title - 对话标题
   * @param {Array} data.conversations - 对话列表
   * @param {string} data.url - 页面URL (可选)
   * @param {string} data.platform - 平台名称 (可选)
   * @returns {string} Markdown字符串
   */
  generate(data) {
    this.content = '';

    this._addYamlFrontMatter(data.url, data.platform);

    // 添加标题
    this._addTitle(data.title);

    // 添加所有对话
    data.conversations.forEach((conv, index) => {
      this._addConversation(conv);

      // 添加分隔线（最后一个对话除外）
      if (index < data.conversations.length - 1) {
        this._addHorizontalRule();
      }
    });

    return cleanupNewlines(this.content);
  }

  /**
   * 添加YAML Front Matter
   * @param {string} url - 页面URL
   * @param {string} platform - 平台名称
   * @private
   */
  _addYamlFrontMatter(url, platform) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const created = `${year}-${month}-${day} ${hour}:${minute}`;

    this.content += '---\n';
    if (url) this.content += `url: ${url}\n`;
    this.content += `created: ${created}\n`;
    if (platform) this.content += `平台: ${platform}\n`;
    this.content += '---\n\n';
  }

  /**
   * 添加标题
   * @param {string} title - 标题
   * @private
   */
  _addTitle(title) {
    const sanitized = sanitizeFilename(title, 100);
    this.content += `# ${sanitized}\n\n`;
  }

  /**
   * 添加对话
   * @param {Object} conversation - 单个对话
   * @private
   */
  _addConversation(conversation) {
    this.content += `## ${conversation.question}\n\n`;

    const answer = conversation.answer;

    if (answer.thinking) {
      this._addSection('思考过程', answer.thinking);
    }

    if (answer.search) {
      this._addSection('搜索结果', answer.search);
    }

    if (answer.thinking || answer.search) {
      this._addHorizontalRule();
    }

    if (answer.content) {
      const decodedContent = decodeHtmlEntities(answer.content.trim());
      this.content += `${decodedContent}\n\n`;
    }

    if (answer.codeBlocks && answer.codeBlocks.length > 0) {
      this._addCodeBlocks(answer.codeBlocks);
    }
  }

  /**
   * 添加章节
   * @param {string} title - 章节标题
   * @param {string} content - 章节内容
   * @private
   */
  _addSection(title, content) {
    if (!content) return;

    const decodedContent = decodeHtmlEntities(content.trim());
    this.content += `### ${title}\n\n${decodedContent}\n\n`;
  }

  /**
   * 添加代码块
   * @param {Array} codeBlocks - 代码块数组
   * @private
   */
  _addCodeBlocks(codeBlocks) {
    codeBlocks.forEach(codeBlock => {
      this._addCodeBlock(codeBlock.code, codeBlock.language);
    });
  }

  /**
   * 添加单个代码块
   * @param {string} code - 代码内容
   * @param {string} language - 编程语言
   * @private
   */
  _addCodeBlock(code, language = '') {
    const decodedCode = decodeHtmlEntities(code.trim());
    this.content += `\`\`\`${language}\n${decodedCode}\n\`\`\`\n\n`;
  }

  /**
   * 添加分隔线
   * @private
   */
  _addHorizontalRule() {
    this.content += `---\n\n`;
  }
}

/**
 * 创建全局生成器实例
 */
export const markdownGenerator = new MarkdownGenerator();
