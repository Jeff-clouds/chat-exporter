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
   * @returns {string} Markdown字符串
   */
  generate(data) {
    this.content = '';

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
   * @param {string} conversation.question - 问题
   * @param {Object} conversation.answer - 回答
   * @private
   */
  _addConversation(conversation) {
    // 添加问题
    this.content += `## ${conversation.question}\n\n`;

    // 添加回答
    const answer = conversation.answer;

    // 思考过程（可选）
    if (answer.thinking) {
      this._addSection('思考过程', answer.thinking);
    }

    // 搜索结果（可选）
    if (answer.search) {
      this._addSection('搜索结果', answer.search);
    }

    // 回答内容
    this._addSection('回答内容', answer.content);

    // 代码块（可选）
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
