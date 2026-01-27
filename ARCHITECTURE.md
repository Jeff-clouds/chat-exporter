# 项目架构说明

## 🏗️ 架构设计

本项目采用**管道模式**（Pipeline Pattern），将选择器配置与处理逻辑完全分离。

### 核心理念

```
平台特定选择器
    ↓
标准化数据转换
    ↓
统一数据结构（平台无关）
    ↓
统一处理流程（Markdown生成 + 下载）
```

---

## 📁 目录结构

```
AI chat exporter temp/
├── src/                          # 源代码目录
│   ├── config/                    # 配置文件
│   │   └── selectors.js           # 所有平台选择器配置和提取函数
│   │
│   ├── extractors/                # 提取器模块
│   │   └── content-extractors.js  # 通用内容提取函数库（IIFE格式，注入页面）
│   │
│   ├── utils/                     # 工具函数
│   │   ├── sanitizer.js           # 文件名和内容清理工具
│   │   ├── download-manager.js    # 文件下载管理器
│   │   └── markdown-generator.js  # Markdown生成器
│   │
│   ├── lib/                       # 第三方库
│   │   ├── turndown.js            # HTML转Markdown库
│   │   └── turndown-plugin-gfm.js # GFM支持插件
│   │
│   └── background.js              # 主入口（Service Worker）
│
├── images/                        # 图标资源
├── popup.html                     # 弹窗页面
├── popup.js                       # 弹窗逻辑
├── manifest.json                  # 扩展配置
├── ARCHITECTURE.md               # 本文档
├── README.md                      # 项目说明
└── old/                          # 旧版本代码备份
```

---

## 🎯 选择器配置与提取逻辑

### 1. 提取层级结构 (Hierarchy)

为了提高提取的准确性和稳定性，系统采用**嵌套提取模式**，并支持自动降级。

**层级关系：**
```
Conversation Item (对话容器)
    ├── Question (问)
    └── Answer (答)
          ├── Thinking (思考过程 - 可选)
          ├── Search (搜索来源 - 可选)
          ├── CodeBlocks (代码块 - 可选)
          └── Content (正式回答)
```

### 2. 字段可空性与降级策略 (Nullability & Fallback)

*   **完全可空**：配置中的所有选择器字段（包括 `conversation`、`thinking`、`search`）均可为 `null`。
*   **自动降级**：
    *   如果 `conversation` 选择器未配置 (null) 或未找到元素，系统将自动**降级为扁平模式** (Flat Mode)，分别查找所有的 Question 和 Answer 并按索引匹配。
    *   如果 `thinking` 或 `search` 未配置，则跳过对应内容的提取，不影响主内容的获取。

### 3. 选择器鲁棒性排序 (Robustness Ranking)

在配置选择器时，应遵循以下优先级，以应对网站改版：

1.  **`data-testid` / `data-id`** (最稳定，专为测试设计)
2.  **`aria-label`** (较稳定，无障碍属性)
3.  **`role`** 属性
4.  **语义化类名** (如 `.message-content`, `.user-query`)
5.  **标签层级** (如 `article > h3`)
6.  **混淆类名** (最不稳定，如 `.css-1a2b3c`，尽量避免)

### 4. 示例配置

```javascript
const platformConfig = {
  // ...
  selectors: {
    conversation: '[data-testid="conversation-item"]', // 优先使用嵌套模式
    question: '[data-testid="user-message"]',
    answer: '[data-testid="model-response"]',
    thinking: '.thinking-process', // 可选，若无则设为 null
    search: null, // 不提取搜索源
    // ...
  }
};
```

---

## 🔧 模块说明

### 1. `config/selectors.js` - 平台配置

**职责：** 定义每个平台的选择器与功能开关，并提供统一的数据提取入口 `extractUnifiedData(url)`

**包含内容：**
- 每个平台的URL匹配规则
- DOM选择器配置
- 平台能力开关（思考、搜索、代码块等）
- 统一提取管道（按平台配置提取并转换为 Markdown 文本）

**关键特性：**
- ✅ 选择器与处理逻辑分离
- ✅ 添加新平台只需添加配置
- ✅ 辅助函数统一处理常见逻辑

**示例：**
```javascript
const deepseekConfig = {
  name: 'DeepSeek',
  urlPatterns: ['deepseek.com', 'deepseek.ai'],
  selectors: { /* 选择器 */ },
  extractor: (doc, sel) => { /* 提取逻辑 */ }
};
```

---

### 2. `utils/sanitizer.js` - 清理工具

**职责：** 文件名和内容清理

**主要函数：**
- `sanitizeFilename()` - 清理文件名，移除非法字符
- `decodeHtmlEntities()` - HTML实体解码
- `cleanupNewlines()` - 清理多余换行
- `stripHtmlTags()` - 移除HTML标签

---

### 3. `utils/download-manager.js` - 下载管理器

**职责：** 统一文件下载逻辑

**主要类：**
- `DownloadManager` - 下载管理器类
  - `downloadMarkdown()` - 下载Markdown文件
  - `downloadText()` - 下载文本文件
  - `_downloadBlob()` - 下载Blob对象（私有方法）

---

### 4. `utils/markdown-generator.js` - Markdown生成器

**职责：** 将统一数据结构转换为Markdown

**主要类：**
- `MarkdownGenerator` - Markdown生成器类
  - `generate()` - 生成完整Markdown
  - `_addTitle()` - 添加标题
  - `_addConversation()` - 添加对话
  - `_addSection()` - 添加章节
  - `_addCodeBlock()` - 添加代码块

**数据流：**
```
统一数据结构
    ↓
MarkdownGenerator.generate()
    ↓
Markdown字符串
```

---

### 5. `extractors/` 与 `lib/` - 可选/遗留模块

当前的核心提取与转换流程已集中在 `selectors.js` 内部；`extractors/` 与 `lib/` 可作为历史实现或备用方案保留。

---

### 7. `src/background.js` - 主入口

**职责：** 协调各个模块，处理用户请求

**主要流程：**
```javascript
handleDownload() {
  1. 获取当前标签页
  2. 根据URL获取平台配置
  3. 注入脚本并动态导入 selectors.js，调用 extractUnifiedData(url)
  4. 生成Markdown
  5. 下载文件
}
```

---

## 🔄 数据流

### 完整流程

```
用户点击"Export Chat"
    ↓
popup.js 发送消息
    ↓
background.js 接收消息
    ↓
获取当前标签页URL
    ↓
匹配平台配置 (getPlatformConfig)
    ↓
注入脚本 (executeScript)
    ↓
动态导入 selectors.js 并执行 extractUnifiedData(url)
    ↓
统一数据结构 {
  title: string,
  url: string,
  platform: string,
  conversations: [{
    question: string,
    answer: {
      thinking?: string,
      search?: string,
      content: string,
      codeBlocks?: Array<{language, code}>
    }
  }]
}
    ↓
MarkdownGenerator.generate()
    ↓
DownloadManager.downloadMarkdown()
    ↓
文件保存到本地
```

---

## 📊 统一数据结构

### 对话数据
```typescript
interface UnifiedConversation {
  title: string;                              // 对话标题
  conversations: Conversation[];              // 对话列表
}

interface Conversation {
  question: string;                           // 用户问题
  answer: Answer;                             // AI回答
}

interface Answer {
  thinking?: string;                          // 思考过程（可选）
  search?: string;                            // 搜索结果（可选）
  content: string;                            // 回答内容
  codeBlocks?: CodeBlock[];                   // 代码块（可选）
}

interface CodeBlock {
  language: string;                           // 编程语言
  code: string;                               // 代码内容
}
```

---

## 🚀 添加新平台

### 步骤

1. **在 `selectors.js` 中添加平台配置并加入 `SELECTORS`**

```javascript
const newPlatformConfig = {
  name: 'New Platform',
  urlPatterns: ['newplatform.com'],
  selectors: {
    title: '.title-selector',
    question: '.question-selector',
    answer: '.answer-selector',
    markdownBlock: '.markdown-content',  // 可选
    // 可选：需要在HTML转Markdown前移除的元素
    cleanupSelectors: [
      '.reference-badge',  // 引用标注
      '.video-card',       // 视频卡片
      'sup'                // 上标
    ]
  },
  extractor: (document, selectors) => {
    // 提取逻辑
    const conversations = [];

    const title = document.querySelector(selectors.title)?.textContent || 'chat';
    const questions = document.querySelectorAll(selectors.question);
    const answers = document.querySelectorAll(selectors.answer);

    const count = Math.min(questions.length, answers.length);

    for (let i = 0; i < count; i++) {
      conversations.push({
        question: questions[i].textContent.trim(),
        answer: {
          // 使用 ContentExtractors 提取内容
          content: ContentExtractors.extractContent(answers[i], selectors)
          // 根据平台特性添加thinking、search、codeBlocks等
        }
      });
    }

    return { title, conversations };
  }
};
```

2. **更新 `manifest.json` 的 host_permissions**

```javascript
export const SELECTORS = {
  deepseek: deepseekConfig,
  yuanbao: yuanbaoConfig,
  chatgpt: chatgptConfig,
  doubao: doubaoConfig,
  newplatform: newPlatformConfig  // 添加这行
};
```

```json
"host_permissions": [
  "https://*.newplatform.com/*"
]
```

### 工作量
- ✅ 只需维护 `selectors.js` 的平台配置与选择器
- ✅ 不需要修改 `background.js` / `popup.html` / `markdown-generator.js`
- ✅ 自动享受统一的提取、Markdown 生成与下载能力

---

## 🎯 设计原则

### 1. 单一职责原则（SRP）
每个模块只负责一件事：
- `selectors.js` - 选择器配置
- `markdown-generator.js` - Markdown生成
- `download-manager.js` - 文件下载
- `sanitizer.js` - 清理工具

### 2. 开闭原则（OCP）
- ✅ 对扩展开放：添加新平台只需配置
- ✅ 对修改关闭：处理逻辑不需要修改

### 3. 依赖倒置原则（DIP）
- 处理逻辑依赖抽象的统一数据结构
- 不依赖具体的DOM结构

### 4. 关注点分离（SoC）
- ✅ 选择器配置与处理逻辑分离
- ✅ 平台特定逻辑与通用逻辑分离

---

## 📈 性能优化

### 已实现
- ✅ 按需导入模块
- ✅ 减少重复DOM查询
- ✅ 字符串操作优化

### 未来优化
- [ ] 缓存查询结果
- [ ] 延迟加载非必要模块
- [ ] Web Worker处理大文件

---

## 🔒 安全性

### 数据处理
- ✅ 所有处理在本地完成
- ✅ 不上传用户数据
- ✅ 文件名清理防止路径遍历

### 权限管理
- ✅ 只申请必要的权限
- ✅ 最小化host_permissions

---

## 🧪 测试

### 单元测试（建议）
- [ ] `sanitizer.js` 函数测试
- [ ] `markdown-generator.js` 生成测试
- [ ] 选择器配置验证

### 集成测试（建议）
- [ ] 各平台完整导出流程
- [ ] 错误处理验证
- [ ] 边界条件测试

---

## 📝 维护指南

### 修改处理逻辑
1. 找到对应的工具模块
2. 修改函数实现
3. 所有平台自动生效

### 更新选择器
1. 打开 `selectors.js`
2. 找到对应平台配置
3. 修改 selectors 或 extractor

### 添加新功能
1. 如果是平台相关：修改 `selectors.js` 和对应 extractor
2. 如果是通用功能：添加到 `utils/` 模块

---

## 🎓 对比：旧架构 vs 新架构

### 旧架构（V1）
```
background.js (681行)
├── 每个平台独立的capture函数
├── 大量重复的HTML转换代码
├── 每个平台重复的文件保存逻辑
└── 硬编码的选择器
```

**问题：**
- ❌ 代码重复率高（~45%）
- ❌ 添加新平台需要~250行代码
- ❌ 修改处理逻辑需要改多处
- ❌ 难以维护和测试

### 新架构（V2）
```
src/
├── config/selectors.js (~320行)        # 平台配置
├── extractors/content-extractors.js (~240行)  # 通用提取函数
├── utils/                              # 工具模块
│   ├── sanitizer.js (~80行)
│   ├── download-manager.js (~80行)
│   └── markdown-generator.js (~170行)
└── background.js (~300行)              # 主入口
```

**优势：**
- ✅ 代码重复率 <10%
- ✅ 添加新平台只需~80行
- ✅ 修改处理逻辑只需一处
- ✅ 模块化，易于测试

---

## 🔗 相关文档
- [README](./README.md) - 项目使用说明
- [隐私政策](./privacy-policy.md) - 隐私和权限说明

---

**文档版本**: 2.0
**更新日期**: 2026-01-27
