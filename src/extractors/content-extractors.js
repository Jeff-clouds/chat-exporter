/**
 * Content Extractors - 统一的内容提取函数库
 * 
 * 采用 IIFE + ES6 双导出模式：
 * - IIFE: 供 executeScript 注入到页面上下文（全局 window.ContentExtractors）
 * - ES6: 供其他模块 import 使用
 */

(function(global) {
  'use strict';

  /**
   * HTML 转 Markdown
   * 使用 TurndownService（如果可用）
   * @param {string} html - HTML 字符串
   * @param {Array} cleanupSelectors - 需要移除的元素选择器数组（可选）
   * @returns {string} Markdown 字符串
   */
  function htmlToMarkdown(html, cleanupSelectors) {
    if (!html) return '';
    
    // 使用 TurndownService（如果已加载）
    if (typeof TurndownService !== 'undefined') {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*'
      });

      // 添加 GFM 支持（如果可用）
      if (typeof turndownPluginGfm !== 'undefined') {
        turndownService.use(turndownPluginGfm.gfm);
      }
      
      // 预处理：移除不需要的元素
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      
      // 移除通用不需要的元素
      const unwanted = body.querySelectorAll('script, style, svg, button, input, select, textarea');
      unwanted.forEach(el => el.remove());
      
      // 移除平台特定的元素（通过 cleanupSelectors 参数传入）
      if (cleanupSelectors && cleanupSelectors.length > 0) {
        const platformUnwanted = body.querySelectorAll(cleanupSelectors.join(', '));
        platformUnwanted.forEach(el => el.remove());
      }
      
      return turndownService.turndown(body);
    }
    
    // Fallback：简单的 HTML 标签移除
    console.warn('TurndownService not available, using text extraction');
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 提取思考过程
   * @param {Element} answerBlock - 回答块元素
   * @param {Object} selectors - 选择器配置
   * @returns {string} 思考过程内容
   */
  function extractThinking(answerBlock, selectors) {
    if (!selectors.thinking) return '';

    const thinking = answerBlock.querySelector(selectors.thinking);
    if (!thinking) return '';

    const paragraphs = thinking.querySelectorAll('p');
    let content = '';

    paragraphs.forEach((p, index) => {
      const text = p.textContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      content += text + '\n';
    });

    return content;
  }

  /**
   * 提取搜索结果（DeepSeek 格式）
   * @param {Element} answerBlock - 回答块元素
   * @param {Object} selectors - 选择器配置
   * @returns {string} 搜索结果内容
   */
  function extractSearch(answerBlock, selectors) {
    if (!selectors.search) return '';

    const search = answerBlock.querySelector(selectors.search);
    if (!search || !search.textContent.trim()) return '';

    const searchText = search.textContent.trim();

    // DeepSeek 特定检查
    if (!searchText.includes('网页')) return '';

    return searchText;
  }

  /**
   * 提取带链接的搜索结果（YuanBao 格式）
   * @param {Element} answerBlock - 回答块元素
   * @param {Object} selectors - 选择器配置
   * @returns {string} 带链接的搜索结果
   */
  function extractSearchWithLinks(answerBlock, selectors) {
    if (!selectors.search) return '';

    const search = answerBlock.querySelector(selectors.search);
    if (!search || !search.textContent.trim()) return '';

    let content = '';

    const header = search.querySelector('.hyc-card-box-search-ref__content__header');
    if (header) {
      content += header.textContent.trim() + '\n';
    }

    const references = search.querySelectorAll('ul li.hyc-card-box-search-ref-content-detail');
    references.forEach((ref, index) => {
      const title = ref.getAttribute('data-title');
      const url = ref.getAttribute('data-url');
      content += `${index + 1}. [${title}](${url})\n`;
    });

    return content;
  }

  /**
   * 提取代码块
   * @param {Element} answerBlock - 回答块元素
   * @param {Object} selectors - 选择器配置
   * @returns {Array} 代码块数组 [{language, code}]
   */
  function extractCodeBlocks(answerBlock, selectors) {
    if (!selectors.codeBlock) return [];

    const codeBlocks = [];

    if (selectors.codeLanguage) {
      // 深度查找代码块元素
      const codeElements = answerBlock.querySelectorAll(selectors.codeBlock);
      codeElements.forEach(codeElement => {
        const languageEl = answerBlock.querySelector(selectors.codeLanguage);
        const language = languageEl ? languageEl.textContent.trim() : '';
        const code = codeElement.querySelector('pre')?.textContent || codeElement.textContent;

        if (code) {
          codeBlocks.push({ language, code });
        }
      });
    } else {
      // ChatGPT 方式
      const codeElements = answerBlock.querySelectorAll('pre');
      codeElements.forEach(codeElement => {
        const codeText = codeElement.textContent.trim();
        const codeEl = codeElement.querySelector('code');
        const language = codeEl ? extractLanguageFromCodeElement(codeEl) : '';

        if (codeText) {
          codeBlocks.push({ language, code: codeText });
        }
      });
    }

    return codeBlocks;
  }

  /**
   * 从 code 元素提取语言
   * @param {Element} codeElement - code 元素
   * @returns {string} 语言标识
   */
  function extractLanguageFromCodeElement(codeElement) {
    const classList = Array.from(codeElement.classList);
    const langClass = classList.find(cls => cls.startsWith('language-'));
    return langClass ? langClass.replace('language-', '') : '';
  }

  /**
   * 提取回答内容
   * @param {Element} answerBlock - 回答块元素
   * @param {Object} selectors - 选择器配置
   * @returns {string} Markdown 格式的回答内容
   */
  function extractContent(answerBlock, selectors) {
    let targets = [];
    
    if (selectors.markdownBlock) {
      const found = answerBlock.querySelectorAll(selectors.markdownBlock);
      if (found && found.length > 0) {
        targets = Array.from(found);
      }
    }
    
    // Fallback: 如果没有找到 markdown 块，使用整个回答块
    if (targets.length === 0) {
      targets = [answerBlock];
    }

    // 获取平台特定的清理选择器（如果定义了）
    const cleanupSelectors = selectors.cleanupSelectors || [];

    // 转换每个目标为 markdown 并拼接
    return targets.map(target => htmlToMarkdown(target.innerHTML, cleanupSelectors)).join('\n\n');
  }

  // 构建导出对象
  const ContentExtractors = {
    htmlToMarkdown,
    extractThinking,
    extractSearch,
    extractSearchWithLinks,
    extractCodeBlocks,
    extractLanguageFromCodeElement,
    extractContent
  };

  // 全局导出（页面注入用）
  if (typeof window !== 'undefined') {
    window.ContentExtractors = ContentExtractors;
  }
  
  // 兼容其他环境
  if (typeof global !== 'undefined' && global !== window) {
    global.ContentExtractors = ContentExtractors;
  }

})(typeof self !== 'undefined' ? self : this);
