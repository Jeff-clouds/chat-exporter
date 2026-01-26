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
    question: '._9663006',
    answer: '._4f9bf79._43c05b5',
    thinking: '.ds-think-content, ._74c0879',
    search: '.a6d716f5.db5991dd',
    markdownBlock: '.ds-markdown',
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

      // DeepSeek特殊处理：移除思考过程，只保留回答
      // 克隆节点以避免修改原始DOM
      const answerClone = answerBlock.cloneNode(true);
      
      // 移除思考过程
      if (selectors.thinking) {
        const thinkingEls = answerClone.querySelectorAll(selectors.thinking);
        thinkingEls.forEach(el => el.remove());
      }
      
      let content = '';
      if (selectors.markdownBlock) {
        // 在清理后的克隆节点中查找 markdown
        const markdowns = Array.from(answerClone.querySelectorAll(selectors.markdownBlock));
        if (markdowns.length > 0) {
          content = markdowns.map(md => _processMarkdownBlock(md, selectors)).join('\n\n');
        } else {
          // 如果没有找到 markdown 块，尝试直接提取文本
          content = answerClone.textContent.trim();
        }
      } else {
        content = answerClone.textContent.trim();
      }

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          thinking: _extractThinking(answerBlock, selectors),
          search: _extractSearch(answerBlock, selectors),
          content: content,
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
    answer: '.response-container',
    markdownBlock: '.markdown' // 添加 markdownBlock 选择器，通常 Gemini 的内容在 markdown 类中
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
      
      // 使用 _extractContent 处理 HTML 到 Markdown 的转换
      // 之前是直接 textContent.trim() 导致丢失格式
      let content = '';
      
      // 尝试查找 markdown 容器
      // Gemini 的结构通常是 .response-container -> .markdown
      // 如果找不到，尝试直接转换 answerBlock 的 HTML
      if (selectors.markdownBlock && answerBlock.querySelector(selectors.markdownBlock)) {
         content = _extractContent(answerBlock, selectors);
      } else {
         // 如果没有特定的 markdown 容器，直接转换整个回答块的 HTML
         // 这里我们临时构造一个 selector 对象或者直接调用转换函数
         // 但为了复用 _htmlToMarkdown，我们需要获取 innerHTML
         content = _htmlToMarkdown(answerBlock.innerHTML);
      }

      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          content: content
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

  return _processMarkdownBlock(markdownBlock, selectors);
}

/**
 * 处理Markdown块元素
 */
function _processMarkdownBlock(markdownBlock, selectors) {
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
 * HTML转Markdown（简化版，使用Turndown思想）
 */
function _htmlToMarkdown(html) {
  if (!html) return '';
  
  // 创建临时DOM元素来解析HTML，这样更安全也更准确
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // 递归处理节点
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    let content = '';
    // 处理子节点
    node.childNodes.forEach(child => {
      content += processNode(child);
    });

    // 根据标签类型应用Markdown格式
    const tagName = node.tagName.toLowerCase();
    
    switch (tagName) {
      // 标题
      case 'h1': return `# ${content}\n\n`;
      case 'h2': return `## ${content}\n\n`;
      case 'h3': return `### ${content}\n\n`;
      case 'h4': return `#### ${content}\n\n`;
      case 'h5': return `##### ${content}\n\n`;
      case 'h6': return `###### ${content}\n\n`;
      
      // 段落和换行
      case 'p': return `${content}\n\n`;
      case 'br': return '\n';
      case 'hr': return '---\n\n';
      case 'div': return `${content}\n`; // div通常用于布局，但也可能包含文本
      
      // 强调
      case 'strong':
      case 'b': return `**${content}**`;
      case 'em':
      case 'i': return `*${content}*`;
      
      // 代码
      case 'code': 
        // 避免在pre中的code再次被包裹
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          return content;
        }
        return `\`${content}\``;
      case 'pre':
        // 尝试提取语言
        const langClass = node.querySelector('code')?.className || '';
        const langMatch = langClass.match(/language-(\w+)/);
        const lang = langMatch ? langMatch[1] : '';
        return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n\n`;
        
      // 列表
      case 'ul': return `${content}\n`;
      case 'ol': return `${content}\n`;
      case 'li':
        // 简单的列表处理，不处理嵌套深度
        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : 'ul';
        const prefix = parentTag === 'ol' ? '1. ' : '- ';
        return `${prefix}${content}\n`;
        
      // 链接
      case 'a':
        const href = node.getAttribute('href');
        return href ? `[${content}](${href})` : content;
        
      // 引用
      case 'blockquote': return `> ${content.trim().replace(/\n/g, '\n> ')}\n\n`;
      
      // 表格 (简化处理)
      case 'table': return `\n${content}\n`;
      case 'tr': return `| ${content.trim()} |\n`;
      case 'th':
      case 'td': return `${content.trim()} |`;
      // 表头分隔线需要在完整表格处理中生成，这里简化处理可能不够完美
      
      // 默认直接返回内容
      default: return content;
    }
  }

  // 开始处理
  let markdown = processNode(body);
  
  // 后处理：清理多余换行
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  
  // HTML实体解码
  markdown = markdown
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');

  return markdown;
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
