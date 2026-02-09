/**
 * AI Chat Exporter - Background Service Worker
 * Refactored: Pipeline Pattern
 */

import { getPlatformConfig } from './config/selectors.js';
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
    throw new Error('Unsupported website');
  }
  console.log('Platform detected:', platformConfig.name);

  // 3. Inject script to extract data
  console.log('Step 3: Injecting script to extract data...');

  // Inject Turndown libraries first
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['src/lib/turndown.js', 'src/lib/turndown-plugin-gfm.js']
  });

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (url) => {
      const moduleUrl = chrome.runtime.getURL('src/config/selectors.js');
      const { extractUnifiedData } = await import(moduleUrl);
      return extractUnifiedData(url);
    },
    args: [tab.url]
  });

  if (!result || !result.result) {
    throw new Error('Cannot extract conversation data');
  }

  const unifiedData = result.result;
  unifiedData.url = tab.url;
  unifiedData.platform = platformConfig.name;

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
