# AI Chat Exporter

<div align="center">

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/ai-chat-exporter/eplnkdnnbmmijjadnabdefmjnjgapigm)
[![Edge Add-ons](https://img.shields.io/badge/Edge_Add--ons-0078D7?style=for-the-badge&logo=microsoft-edge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/ai-chat-exporter/kjhchmmjjffhhgaoocijicockllaoaah)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

**Export AI chat conversations with one click, preserving format and context.**

[English README](README_EN.md) | [中文文档](README.md)

</div>

## 📖 Introduction

**AI Chat Exporter** is a powerful Chrome extension designed to save and archive AI conversations. It exports your chats with AI into beautifully formatted Markdown files, perfectly preserving code block highlighting, mathematical formulas, tables, and AI's thinking process.

Whether you are a developer, researcher, or student, this tool helps you easily build a personal knowledge base and permanently save fleeting AI inspirations.

## ✨ Key Features

- **Multi-Platform Support**: Perfectly adapts to DeepSeek, Tencent YuanBao, ChatGPT, Doubao, Gemini, and other mainstream AI platforms.
- **Perfect Format Preservation**: Based on `Turndown` + `GFM` engine, accurately converting HTML to Markdown.
  - ✅ **Code Blocks**: Preserves language tags and supports nested code.
  - ✅ **Tables**: Perfectly supports Markdown table format.
  - ✅ **Math Formulas**: Preserves original LaTeX format.
  - ✅ **Task Lists**: Supports `[ ]` and `[x]` syntax.
- **Deep Content Extraction**:
  - 🧠 **Thinking Process**: Completely preserves the reasoning chain of models like DeepSeek/YuanBao.
  - 🔍 **Search Sources**: Preserves reference links from web searches.
- **Privacy & Security**: All processing is done **locally in the browser**, never uploading any data to servers.
- **Clear Structure**: Automatically generates a standardized directory structure of `# Question` / `## Answer` for easy reading and indexing.

## 🚀 Supported Platforms

| Platform | URL | Supported Content |
|----------|-----|-------------------|
| **DeepSeek** | deepseek.com | Chat, Thinking Process (R1), Code, Search Results |
| **Tencent YuanBao** | yuanbao.tencent.com | Chat, Deep Thinking, References, Cards |
| **ChatGPT** | chatgpt.com | Chat, Code Blocks, Complex Nested Structures |
| **Doubao** | doubao.com | Chat, Search Sources |
| **Gemini** | gemini.google.com | Chat, Draft Content |

## 📥 Installation

### Option 1: Store Installation (Recommended)

- **Chrome Users**: [Download from Chrome Web Store](https://chromewebstore.google.com/detail/ai-chat-exporter/eplnkdnnbmmijjadnabdefmjnjgapigm)
- **Edge Users**: [Download from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ai-chat-exporter/kjhchmmjjffhhgaoocijicockllaoaah)

### Option 2: Manual Installation (Developer Mode)

If you want to try the latest development features:

1. Clone this repository:
   ```bash
   git clone https://github.com/Jeff-clouds/chat-exporter.git
   ```
2. Install dependencies and build (ensure Node.js is installed):
   ```bash
   npm install
   # Copy library files to src/lib
   # You may need to manually copy if no build script exists
   cp node_modules/turndown/dist/turndown.js src/lib/
   cp node_modules/turndown-plugin-gfm/dist/turndown-plugin-gfm.js src/lib/
   ```

3. Open Chrome/Edge browser, go to Extensions page (`chrome://extensions/` or `edge://extensions/`).
4. Enable **"Developer mode"** in the top right corner.
5. Click **"Load unpacked"** and select the project folder.

## 💡 Usage

1. Open any supported AI chat page (e.g., [chatgpt.com](https://chatgpt.com)).
2. Click the **AI Chat Exporter** icon in the browser toolbar.
3. Wait for the extension to automatically identify the current platform.
4. Click the **"Export Chat"** button.
5. Wait a moment, and the Markdown file will automatically download to your local device.

## 🛠️ Development & Contribution

Issues and Pull Requests are welcome!

### Project Structure
- `src/background.js`: Core logic, handling script injection, content extraction, and Markdown conversion.
- `src/config/selectors.js`: DOM selector configurations for each platform.
- `src/utils/`: Utility functions (Markdown generation, download management, etc.).
- `src/lib/`: Third-party dependencies (Turndown).

## 📄 Privacy Policy

**AI Chat Exporter** promises:
- **No Data Collection**: We do not collect any of your chat content, personal information, or browsing history.
- **Offline Operation**: The extension does not connect to any third-party servers except for update checks.
- **Local Storage**: All exported files are saved directly to your computer.

## ⚖️ License

This project is open-sourced under the [ISC License](LICENSE).

---

<div align="center">
If this project helps you, please give us a ⭐ Star on GitHub!
</div>
