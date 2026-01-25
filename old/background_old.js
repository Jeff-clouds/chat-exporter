/**
 * AI Chat Exporter - Background Service Worker
 * 重构版本：管道模式
 */

import { SELECTORS, getPlatformConfig } from './config/selectors.js';
import { markdownGenerator } from './utils/markdown-generator.js';
import { downloadManager } from './utils/download-manager.js';
import { sanitizeFilename } from './utils/sanitizer.js';

/**
 * 消息监听器
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download") {
    handleDownload();
    return true;
  } else if (request.action === "saveFile") {
    handleSaveFile(request);
  } else if (request.action === "error") {
    handleError(request.message);
  }
});

/**
 * 处理下载请求
 * 主导出流程
 */
async function handleDownload() {
  try {
    // 1. 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('无法找到当前标签页');
    }

    // 2. 获取平台配置
    const platformConfig = getPlatformConfig(tab.url);

    if (!platformConfig) {
      throw new Error('此插件仅支持 DeepSeek、元宝AI、ChatGPT 和豆包网站');
    }

    // 3. 注入脚本提取数据
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (extractorString, selectors) => {
        // 动态执行提取器函数
        const extractor = eval('(' + extractorString + ')');
        return extractor(document, selectors);
      },
      args: [platformConfig.extractor.toString(), platformConfig.selectors]
    });

    if (!result || !result.result) {
      throw new Error('无法提取对话数据');
    }

    const unifiedData = result.result;

    // 4. 检查是否有对话内容
    if (!unifiedData.conversations || unifiedData.conversations.length === 0) {
      throw new Error(`未找到${platformConfig.name}对话内容，请确保当前页面是对话页面`);
    }

    // 5. 生成Markdown
    const markdown = markdownGenerator.generate(unifiedData);

    // 6. 下载文件
    const filename = sanitizeFilename(unifiedData.title);
    downloadManager.downloadMarkdown(markdown, filename);

  } catch (error) {
    handleError(error.message);
  }
}

/**
 * 处理保存文件请求
 * @param {Object} request - 请求对象
 * @param {string} request.url - 文件DataURL
 * @param {string} request.filename - 文件名
 */
function handleSaveFile(request) {
  chrome.downloads.download({
    url: request.url,
    filename: request.filename,
    saveAs: false
  });
}

/**
 * 显示错误通知
 * @param {string} message - 错误消息
 */
function handleError(message) {
  console.error('AI Chat Exporter Error:', message);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon48.png',
    title: '导出失败',
    message: message
  });
}

/**
 * 插件安装事件
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI Chat Exporter 已安装');
  } else if (details.reason === 'update') {
    console.log('AI Chat Exporter 已更新到', chrome.runtime.getManifest().version);
  }
});
