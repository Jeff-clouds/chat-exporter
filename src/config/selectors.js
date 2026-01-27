/**
 * 平台选择器配置
 * 
 * 【硬性要求】新增平台只需修改本文件 + manifest.json
 * 
 * 每个平台只需定义：
 * - name: 平台名称
 * - urlPatterns: URL匹配规则
 * - selectors: DOM选择器
 * - features: 可选的功能开关
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

  // 功能开关
  features: {
    hasThinking: true,
    hasSearch: true,
    hasCodeBlocks: true,
    removeThinkingBeforeContent: true,
    searchKeyword: '网页'
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
    codeBlock: '.hyc-common-markdown__code pre.hyc-common-markdown__code-lan',
    codeLanguage: '.hyc-common-markdown__code__hd__l',
    cleanupSelectors: [
      '.hyc-common-markdown__sup',
      'sup',
      '[class*="video"]',
      '[class*="card-box"]'
    ]
  },

  features: {
    hasThinking: true,
    hasSearch: true,
    hasCodeBlocks: true,
    searchWithLinks: true  // 元宝特殊：搜索结果带链接
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
    markdownBlock: '.markdown.prose'
  },

  features: {
    hasCodeBlocks: true,
    titleFromFirstQuestion: true  // 用第一个问题作为标题
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

  features: {
    hasSearch: true,
    searchAsText: true,  // 搜索结果直接取文本
    titleFromFirstQuestion: true,
    useTextContent: true  // 直接用 textContent 而不是 extractContent
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
    markdownBlock: '.markdown'
  },

  features: {
    // Gemini 最简单，只需要基本的内容提取
  }
};

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

export function extractUnifiedData(url) {
  const platformConfig = getPlatformConfig(url);

  if (!platformConfig) {
    throw new Error('Unsupported website');
  }

  const { key: platformKey, name, selectors, features = {} } = platformConfig;
  const conversations = [];

  const questions = document.querySelectorAll(selectors.question);
  const answers = document.querySelectorAll(selectors.answer);
  const count = Math.min(questions.length, answers.length);

  let title = `${platformKey}-chat`;
  if (selectors.title) {
    const titleEl = document.querySelector(selectors.title);
    title = titleEl?.textContent?.trim() || title;
  } else if (features.titleFromFirstQuestion) {
    title = questions[0]?.textContent?.trim().substring(0, 50) || title;
  }

  for (let i = 0; i < count; i++) {
    const question = questions[i]?.textContent?.trim() || '';
    const answerBlock = answers[i];

    const answer = {};

    if (features.hasThinking && selectors.thinking) {
      answer.thinking = _extractThinking(answerBlock, selectors);
    }

    if (features.hasSearch && selectors.search) {
      if (features.searchWithLinks) {
        answer.search = _extractSearchWithLinks(answerBlock, selectors);
      } else if (features.searchAsText) {
        answer.search = answerBlock.querySelector(selectors.search)?.textContent?.trim() || '';
      } else {
        answer.search = _extractSearch(answerBlock, selectors, features);
      }
    }

    let contentBlock = answerBlock;
    if (features.removeThinkingBeforeContent && selectors.thinking) {
      const clone = answerBlock.cloneNode(true);
      clone.querySelectorAll(selectors.thinking).forEach(el => el.remove());
      contentBlock = clone;
    }

    if (features.useTextContent) {
      answer.content = contentBlock.textContent.trim();
    } else {
      answer.content = _extractContent(contentBlock, selectors);
    }

    if (features.hasCodeBlocks && selectors.codeBlock) {
      answer.codeBlocks = _extractCodeBlocks(contentBlock, selectors);
    }

    conversations.push({ question, answer });
  }

  return { title, conversations, platform: name, url };
}

function _extractThinking(answerBlock, selectors) {
  const thinking = answerBlock.querySelector(selectors.thinking);
  if (!thinking) return '';
  const paragraphs = thinking.querySelectorAll('p');
  if (paragraphs.length === 0) return thinking.textContent.trim();
  return Array.from(paragraphs).map(p => p.textContent.trim()).filter(Boolean).join('\n');
}

function _extractSearch(answerBlock, selectors, features) {
  const search = answerBlock.querySelector(selectors.search);
  if (!search) return '';
  const searchText = search.textContent.trim();
  if (!searchText) return '';
  if (features.searchKeyword && !searchText.includes(features.searchKeyword)) return '';
  return searchText;
}

function _extractSearchWithLinks(answerBlock, selectors) {
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

  return content.trim();
}

function _extractContent(answerBlock, selectors) {
  if (!selectors.markdownBlock) {
    return answerBlock.textContent.trim();
  }

  const markdownBlocks = Array.from(answerBlock.querySelectorAll(selectors.markdownBlock));
  if (markdownBlocks.length === 0) return '';

  const parts = markdownBlocks
    .map(block => _processMarkdownBlock(block, selectors))
    .filter(Boolean);

  return parts.join('\n\n').trim();
}

function _processMarkdownBlock(markdownBlock, selectors) {
  const cleanupSelectors = selectors.cleanupSelectors || [];
  const block = markdownBlock.cloneNode(true);

  cleanupSelectors.forEach(sel => {
    block.querySelectorAll(sel).forEach(el => el.remove());
  });

  if (selectors.codeBlock) {
    block.querySelectorAll(selectors.codeBlock).forEach(el => el.remove());
  }

  let content = '';

  block.childNodes.forEach(node => {
    const html = node.outerHTML || node.textContent;
    if (html) {
      content += _htmlToMarkdown(html);
      content += '\n';
    }
  });

  return content.trim();
}

function _extractCodeBlocks(answerBlock, selectors) {
  const codeBlocks = [];
  const codeElements = answerBlock.querySelectorAll(selectors.codeBlock);

  codeElements.forEach(codeElement => {
    let language = '';
    if (selectors.codeLanguage) {
      const languageEl =
        codeElement.querySelector(selectors.codeLanguage) ||
        codeElement.closest('*')?.querySelector(selectors.codeLanguage) ||
        answerBlock.querySelector(selectors.codeLanguage);
      language = languageEl ? languageEl.textContent.trim() : '';
    }

    const code =
      codeElement.querySelector('pre')?.textContent ||
      codeElement.querySelector('code')?.textContent ||
      codeElement.textContent;

    if (code && code.trim()) {
      codeBlocks.push({ language, code: code.trim() });
    }
  });

  return codeBlocks;
}

function _htmlToMarkdown(html) {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    let content = '';
    node.childNodes.forEach(child => {
      content += processNode(child);
    });

    const tagName = node.tagName.toLowerCase();

    switch (tagName) {
      case 'h1': return `# ${content}\n\n`;
      case 'h2': return `## ${content}\n\n`;
      case 'h3': return `### ${content}\n\n`;
      case 'h4': return `#### ${content}\n\n`;
      case 'h5': return `##### ${content}\n\n`;
      case 'h6': return `###### ${content}\n\n`;

      case 'p': return `${content}\n\n`;
      case 'br': return '\n';
      case 'hr': return '---\n\n';
      case 'div': return `${content}\n`;

      case 'strong':
      case 'b': return `**${content}**`;
      case 'em':
      case 'i': return `*${content}*`;

      case 'code':
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          return content;
        }
        return `\`${content}\``;

      case 'pre': {
        const langClass = node.querySelector('code')?.className || '';
        const langMatch = langClass.match(/language-(\w+)/);
        const lang = langMatch ? langMatch[1] : '';
        return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n\n`;
      }

      case 'ul': return `${content}\n`;
      case 'ol': return `${content}\n`;
      case 'li': {
        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : 'ul';
        const prefix = parentTag === 'ol' ? '1. ' : '- ';
        return `${prefix}${content}\n`;
      }

      case 'a': {
        const href = node.getAttribute('href');
        return href ? `[${content}](${href})` : content;
      }

      case 'blockquote':
        return `> ${content.trim().replace(/\n/g, '\n> ')}\n\n`;

      default:
        return content;
    }
  }

  let markdown = processNode(body);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  markdown = markdown
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');

  return markdown;
}
