/**
 * 平台选择器配置
 * 每个平台定义选择器和数据提取函数
 */

/**
 * DeepSeek 平台配置
 */
const deepseekConfig = {
  name: 'DeepSeek',
  urlPatterns: ['deepseek.com', 'deepseek.ai'],

  selectors: {
    title: '.f8d1e4c0',
    question: '.fbb737a4',
    answer: '.f9bf7997',
    thinking: '.edb250b1',
    search: '.a6d716f5.db5991dd',
    markdownBlock: '.ds-markdown.ds-markdown--block',
    codeBlock: '.md-code-block',
    codeLanguage: '.md-code-block-infostring'
  },

  extractor: (document, selectors) => {
    const conversations = [];

    // 获取标题
    const titleEl = document.querySelector(selectors.title);
    const title = titleEl?.textContent?.trim() || 'deepseek-chat';

    // 获取问题和回答
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    for (let i = 0; i < count; i++) {
      const answerBlock = answers[i];

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          thinking: _extractThinking(answerBlock, selectors),
          search: _extractSearch(answerBlock, selectors),
          content: _extractContent(answerBlock, selectors),
          codeBlocks: _extractCodeBlocks(answerBlock, selectors)
        }
      });
    }

    return {
      title,
      conversations
    };
  }
};

/**
 * YuanBao AI 平台配置
 */
const yuanbaoConfig = {
  name: 'YuanBao AI',
  urlPatterns: ['yuanbao.tencent.com'],

  selectors: {
    title: '.agent-dialogue__content--common__header',
    question: '.agent-chat__bubble--human',
    answer: '.agent-chat__bubble--ai',
    thinking: '.hyc-component-reasoner__think',
    search: '.hyc-component-reasoner__search-list',
    markdownBlock: '.hyc-component-reasoner__text',
    simpleAnswer: '.agent-chat__speech-text, .agent-chat__speech-card__text',
    codeBlock: '.hyc-common-markdown__code pre.hyc-common-markdown__code-lan',
    codeLanguage: '.hyc-common-markdown__code__hd__l'
  },

  extractor: (document, selectors) => {
    const conversations = [];

    // 获取标题
    const titleEl = document.querySelector(selectors.title);
    const title = titleEl?.textContent?.trim() || 'yuanbao-chat';

    // 获取问题和回答
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    for (let i = 0; i < count; i++) {
      const answerBlock = answers[i];

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          thinking: _extractThinking(answerBlock, selectors),
          search: _extractSearchWithLinks(answerBlock, selectors),
          content: _extractContent(answerBlock, selectors),
          codeBlocks: _extractCodeBlocks(answerBlock, selectors)
        }
      });
    }

    return {
      title,
      conversations
    };
  }
};

/**
 * ChatGPT 平台配置
 */
const chatgptConfig = {
  name: 'ChatGPT',
  urlPatterns: ['chatgpt.com'],

  selectors: {
    question: '[data-message-author-role="user"] .whitespace-pre-wrap',
    answer: '[data-message-author-role="assistant"]',
    markdownBlock: '.markdown.prose',
    codeBlock: 'pre code'
  },

  extractor: (document, selectors) => {
    const conversations = [];

    // 获取问题和回答
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    // 使用第一个问题作为标题
    const title = questions[0]?.textContent?.trim().substring(0, 50) || 'chatgpt-chat';

    for (let i = 0; i < count; i++) {
      const answerBlock = answers[i];

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          content: _extractContent(answerBlock, selectors),
          codeBlocks: _extractCodeBlocks(answerBlock, selectors)
        }
      });
    }

    return {
      title,
      conversations
    };
  }
};

/**
 * Doubao 平台配置
 */
const doubaoConfig = {
  name: 'Doubao',
  urlPatterns: ['doubao.com'],

  selectors: {
    question: '.message-content.message-box-content-otxGGw.send-message-box-content-N1r3Gh.samantha-message-box-content-Qjmpja',
    answer: '.message-content.message-box-content-otxGGw.receive-message-box-content-_lREFj.samantha-message-box-content-Qjmpja',
    search: '.search-result-collapse-header-O_cFO3'
  },

  extractor: (document, selectors) => {
    const conversations = [];

    // 获取问题和回答
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    // 使用第一个问题作为标题
    const title = questions[0]?.textContent?.trim().substring(0, 50) || 'doubao-chat';

    for (let i = 0; i < count; i++) {
      const answerBlock = answers[i];

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          search: answerBlock.querySelector(selectors.search)?.textContent?.trim(),
          content: answerBlock.textContent.trim()
        }
      });
    }

    return {
      title,
      conversations
    };
  }
};

/**
 * Gemini 平台配置
 */
const geminiConfig = {
  name: 'Gemini',
  urlPatterns: ['gemini.google.com'],

  selectors: {
    title: '.conversation-title-container',
    question: '.user-query-container',
    answer: '.response-container'
  },

  extractor: (document, selectors) => {
    const conversations = [];

    // 获取标题
    const titleEl = document.querySelector(selectors.title);
    const title = titleEl?.textContent?.trim() || 'gemini-chat';

    // 获取问题和回答
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    for (let i = 0; i < count; i++) {
      const answerBlock = answers[i];

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          content: answerBlock.textContent.trim()
        }
      });
    }

    return {
      title,
      conversations
    };
  }
};

// ===== 辅助提取函数 =====

/**
 * 提取思考过程
 */
function _extractThinking(answerBlock, selectors) {
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
    content += text + (index === paragraphs.length - 1 ? '\n' : '\n');
  });

  return content;
}

/**
 * 提取搜索结果
 */
function _extractSearch(answerBlock, selectors) {
  if (!selectors.search) return '';

  const search = answerBlock.querySelector(selectors.search);
  if (!search || !search.textContent.trim()) return '';

  const searchText = search.textContent.trim();

  // DeepSeek特定检查
  if (!searchText.includes('网页')) return '';

  return searchText;
}

/**
 * 提取带链接的搜索结果（YuanBao）
 */
function _extractSearchWithLinks(answerBlock, selectors) {
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
 * 提取回答内容
 */
function _extractContent(answerBlock, selectors) {
  if (!selectors.markdownBlock) {
    return answerBlock.textContent.trim();
  }

  const markdownBlock = answerBlock.querySelector(selectors.markdownBlock);
  if (!markdownBlock) return '';

  let content = '';

  // 遍历子节点
  markdownBlock.childNodes.forEach(node => {
    // 跳过代码块（单独处理）
    if (node.classList?.contains(selectors.codeBlock?.replace(/\./g, '')?.split(' ').pop())) {
      return;
    }

    // 如果是代码块元素
    if (selectors.codeBlock && node.querySelector && node.querySelector(selectors.codeBlock)) {
      return;
    }

    let html = node.outerHTML || node.textContent;
    if (html) {
      content += _htmlToMarkdown(html);
    }
  });

  return content;
}

/**
 * 提取代码块
 */
function _extractCodeBlocks(answerBlock, selectors) {
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
    // ChatGPT方式
    const codeElements = answerBlock.querySelectorAll('pre');
    codeElements.forEach(codeElement => {
      const codeText = codeElement.textContent.trim();
      const codeEl = codeElement.querySelector('code');
      const language = codeEl ? (_extractLanguageFromCodeElement(codeEl)) : '';

      if (codeText) {
        codeBlocks.push({ language, code: codeText });
      }
    });
  }

  return codeBlocks;
}

/**
 * 从code元素提取语言
 */
function _extractLanguageFromCodeElement(codeElement) {
  const classList = Array.from(codeElement.classList);
  const langClass = classList.find(cls => cls.startsWith('language-'));
  return langClass ? langClass.replace('language-', '') : '';
}

/**
 * HTML转Markdown（简化版）
 */
function _htmlToMarkdown(html) {
  let result = html;

  // 移除不需要的标签
  result = result.replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '');
  result = result.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');

  // 转换标题
  result = result.replace(/<h1>/g, '# ').replace(/<\/h1>/g, '\n\n');
  result = result.replace(/<h2>/g, '## ').replace(/<\/h2>/g, '\n\n');
  result = result.replace(/<h3>/g, '### ').replace(/<\/h3>/g, '\n\n');
  result = result.replace(/<h4>/g, '#### ').replace(/<\/h4>/g, '\n\n');

  // 转换列表（简化版）
  result = result.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n');
  result = result.replace(/<ul>/g, '').replace(/<\/ul>/g, '\n');
  result = result.replace(/<ol>/g, '').replace(/<\/ol>/g, '\n');

  // 转换格式标签
  result = result.replace(/<strong>/g, '**').replace(/<\/strong>/g, '**');
  result = result.replace(/<em>/g, '*').replace(/<\/em>/g, '*');
  result = result.replace(/<code>/g, '`').replace(/<\/code>/g, '`');

  // 转换段落和换行
  result = result.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');
  result = result.replace(/<br\s*\/?>/g, '\n');
  result = result.replace(/<hr[^>]*>/g, '---\n\n');

  // HTML实体解码
  result = result.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  result = result.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

  return result.trim();
}

// ===== 导出配置 =====

/**
 * 所有平台配置
 */
export const SELECTORS = {
  deepseek: deepseekConfig,
  yuanbao: yuanbaoConfig,
  chatgpt: chatgptConfig,
  doubao: doubaoConfig,
  gemini: geminiConfig
};

/**
 * 根据URL获取平台配置
 * @param {string} url - 页面URL
 * @returns {Object|null} 平台配置
 */
export function getPlatformConfig(url) {
  for (const [platformKey, config] of Object.entries(SELECTORS)) {
    for (const pattern of config.urlPatterns) {
      if (url.includes(pattern)) {
        return {
          key: platformKey,
          ...config
        };
      }
    }
  }
  return null;
}

/**
 * 从页面提取统一数据结构
 * @param {string} url - 页面URL
 * @returns {Object} 统一数据结构
 */
export function extractUnifiedData(url) {
  const platformConfig = getPlatformConfig(url);

  if (!platformConfig) {
    throw new Error('不支持的网站');
  }

  return platformConfig.extractor(document, platformConfig.selectors);
}
