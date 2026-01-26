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

    // 添加YAML Front Matter
    if (data.url || data.platform) {
      this._addYamlFrontMatter(data.url, data.platform);
    }

    // 添加标题
    this._addTitle(data.title);

    // 添加所有对话
    data.conversations.forEach((conv, index) => {
      this._addConversation(conv, index + 1);

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
    this.content += '---\n';
    if (url) this.content += `url: ${url}\n`;
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
   * @param {number} index - 对话索引
   * @private
   */
  _addConversation(conversation, index) {
    // 添加问题 (一级目录)
    this.content += `# Question ${index}: ${conversation.question}\n\n`;

    // 添加回答 (二级目录)
    const answer = conversation.answer;
    
    // 添加 Answer 标识
    this.content += `## Answer ${index}:\n\n`;

    // 思考过程（可选，三级目录）
    if (answer.thinking) {
      this._addSection('思考过程', answer.thinking);
    }

    // 搜索结果（可选，三级目录）
    if (answer.search) {
      this._addSection('搜索结果', answer.search);
    }

    // 如果有思考过程或搜索结果，添加分隔线以区分正文
    if (answer.thinking || answer.search) {
      this._addHorizontalRule();
    }

    // 回答内容（不带标题，直接输出内容）
    // Turndown 已经处理了 HTML 实体和 Markdown 格式，不需要再次解码
    if (answer.content) {
      this.content += `${answer.content.trim()}\n\n`;
    }

    // 代码块（可选）
    // 注意：通常代码块已经包含在 answer.content 中（如果解析正确），
    // 这里的 codeBlocks 可能是为了额外展示或者兜底。
    // 如果 content 已经有了，这里再加可能会重复。
    // 暂时保留逻辑，但建议确认 content 是否已包含代码。
    // 既然之前的逻辑是分开的，这里也保持分开，但通常 Markdown 渲染时代码块就在 content 里。
    // 假设 selectors.js 里提取的 content 已经包含了代码块的 markdown 格式，
    // 那么这里其实不需要再单独添加代码块，除非是作为附件。
    // 但为了兼容旧逻辑，先保留，但要注意可能重复。
    if (answer.codeBlocks && answer.codeBlocks.length > 0) {
      // 只有当 content 为空时才补充代码块，或者作为独立部分
      // 这里保持原样，只是注意排版
      // this._addCodeBlocks(answer.codeBlocks); 
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
