/**
 * AI Chat Exporter - Background Service Worker
 * Refactored: Pipeline Pattern
 */

import { SELECTORS, getPlatformConfig } from './config/selectors.js';
import { markdownGenerator } from './utils/markdown-generator.js';
import { downloadManager } from './utils/download-manager.js';
import { sanitizeFilename } from './utils/sanitizer.js';

console.log('Background script loaded');

/**
 * Message listener
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);

  if (request.action === "download") {
    // 使用 Promise.race 实现超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out after 30 seconds'));
      }, 30000); // 30秒超时
    });
    
    const downloadPromise = handleDownload().then(() => {
      return { success: true };
    }).catch((error) => {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    });
    
    // 竞态：要么下载完成，要么超时
    Promise.race([downloadPromise, timeoutPromise])
      .then((result) => {
        console.log('Sending response:', result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error('Race error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  } else if (request.action === "saveFile") {
    handleSaveFile(request);
  } else if (request.action === "error") {
    handleError(request.message);
  }
});

/**
 * Handle download request
 * Main export flow
 */
async function handleDownload() {
  console.log('Starting download process...');

  // 1. Get current tab
  console.log('Step 1: Getting current tab...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('Cannot find current tab');
  }
  console.log('Current tab:', tab.url);

  // 2. Get platform configuration
  console.log('Step 2: Getting platform configuration...');
  const platformConfig = getPlatformConfig(tab.url);

  if (!platformConfig) {
    throw new Error('This extension only supports DeepSeek, YuanBao AI, ChatGPT, Doubao, and Gemini websites');
  }
  console.log('Platform detected:', platformConfig.name);

    // 3. Inject script to extract data
    console.log('Step 3: Injecting script to extract data...');
    
    // Use a simpler approach: pass the platform key and selectors, 
    // then include all extractor logic in the injected function
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (platformKey, selectors) => {
        console.log('Extractor executing for platform:', platformKey);
        
        // Helper functions
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

        function _extractSearch(answerBlock, selectors) {
          if (!selectors.search) return '';
          const search = answerBlock.querySelector(selectors.search);
          if (!search || !search.textContent.trim()) return '';
          const searchText = search.textContent.trim();
          if (!searchText.includes('网页')) return '';
          return searchText;
        }

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

        function _extractContent(answerBlock, selectors) {
          if (!selectors.markdownBlock) {
            return answerBlock.textContent.trim();
          }
          const markdownBlock = answerBlock.querySelector(selectors.markdownBlock);
          if (!markdownBlock) return '';
          
          function _htmlToMarkdown(html) {
            let result = html;
            result = result.replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '');
            result = result.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
            result = result.replace(/<h1>/g, '# ').replace(/<\/h1>/g, '\n\n');
            result = result.replace(/<h2>/g, '## ').replace(/<\/h2>/g, '\n\n');
            result = result.replace(/<h3>/g, '### ').replace(/<\/h3>/g, '\n\n');
            result = result.replace(/<h4>/g, '#### ').replace(/<\/h4>/g, '\n\n');
            result = result.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n');
            result = result.replace(/<ul>/g, '').replace(/<\/ul>/g, '\n');
            result = result.replace(/<ol>/g, '').replace(/<\/ol>/g, '\n');
            result = result.replace(/<strong>/g, '**').replace(/<\/strong>/g, '**');
            result = result.replace(/<em>/g, '*').replace(/<\/em>/g, '*');
            result = result.replace(/<code>/g, '`').replace(/<\/code>/g, '`');
            result = result.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');
            result = result.replace(/<br\s*\/?>/g, '\n');
            result = result.replace(/<hr[^>]*>/g, '---\n\n');
            result = result.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            result = result.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
            return result.trim();
          }
          
          let content = '';
          markdownBlock.childNodes.forEach(node => {
            if (node.classList?.contains(selectors.codeBlock?.replace(/\./g, '')?.split(' ').pop())) {
              return;
            }
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

        function _extractCodeBlocks(answerBlock, selectors) {
          if (!selectors.codeBlock) return [];
          const codeBlocks = [];
          if (selectors.codeLanguage) {
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
            const codeElements = answerBlock.querySelectorAll('pre');
            codeElements.forEach(codeElement => {
              const codeText = codeElement.textContent.trim();
              const codeEl = codeElement.querySelector('code');
              const language = codeEl ? (() => {
                const classList = Array.from(codeEl.classList);
                const langClass = classList.find(cls => cls.startsWith('language-'));
                return langClass ? langClass.replace('language-', '') : '';
              })() : '';
              if (codeText) {
                codeBlocks.push({ language, code: codeText });
              }
            });
          }
          return codeBlocks;
        }
        
        // Platform-specific extractors
        const extractors = {
          deepseek: (document, selectors) => {
            const conversations = [];
            const titleEl = document.querySelector(selectors.title);
            const title = titleEl?.textContent?.trim() || 'deepseek-chat';
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
            return { title, conversations };
          },
          
          yuanbao: (document, selectors) => {
            const conversations = [];
            const titleEl = document.querySelector(selectors.title);
            const title = titleEl?.textContent?.trim() || 'yuanbao-chat';
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
            return { title, conversations };
          },
          
          chatgpt: (document, selectors) => {
            const conversations = [];
            const questions = document.querySelectorAll(selectors.question);
            const answers = document.querySelectorAll(selectors.answer);
            const count = Math.min(questions.length, answers.length);
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
            return { title, conversations };
          },
          
          doubao: (document, selectors) => {
            const conversations = [];
            const questions = document.querySelectorAll(selectors.question);
            const answers = document.querySelectorAll(selectors.answer);
            const count = Math.min(questions.length, answers.length);
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
            return { title, conversations };
          },
          
          gemini: (document, selectors) => {
            const conversations = [];
            const titleEl = document.querySelector(selectors.title);
            const title = titleEl?.textContent?.trim() || 'gemini-chat';
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
            return { title, conversations };
          }
        };
        
        // Execute the appropriate extractor
        const extractor = extractors[platformKey];
        if (!extractor) {
          throw new Error('Unsupported platform: ' + platformKey);
        }
        
        const data = extractor(document, selectors);
        console.log('Extraction successful:', data);
        return data;
      },
      args: [platformConfig.key, platformConfig.selectors]
    });

    if (!result || !result.result) {
      throw new Error('Cannot extract conversation data');
    }

    const unifiedData = result.result;
    console.log('Unified data:', unifiedData);

    // 4. Check if there is conversation content
    if (!unifiedData.conversations || unifiedData.conversations.length === 0) {
      throw new Error(`No ${platformConfig.name} conversation found, please make sure the current page is a chat page`);
    }
    console.log('Found conversations:', unifiedData.conversations.length);

    // 5. Generate Markdown
    console.log('Step 5: Generating Markdown...');
    const markdown = markdownGenerator.generate(unifiedData);
    console.log('Markdown generated, length:', markdown.length);

    // 6. Download file
    console.log('Step 6: Downloading file...');
    const filename = sanitizeFilename(unifiedData.title);
    console.log('Filename:', filename);
    downloadManager.downloadMarkdown(markdown, filename);

    console.log('Download process completed successfully!');
}


/**
 * Handle save file request
 * @param {Object} request - Request object
 * @param {string} request.url - File DataURL
 * @param {string} request.filename - Filename
 */
function handleSaveFile(request) {
  chrome.downloads.download({
    url: request.url,
    filename: request.filename,
    saveAs: false
  });
}

/**
 * Display error notification
 * @param {string} message - Error message
 */
function handleError(message) {
  console.error('AI Chat Exporter Error:', message);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon48.png',
    title: 'Export Failed',
    message: message
  });
}

/**
 * Extension installation event
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI Chat Exporter installed');
  } else if (details.reason === 'update') {
    console.log('AI Chat Exporter updated to', chrome.runtime.getManifest().version);
  }
});
