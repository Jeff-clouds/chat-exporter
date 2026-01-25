document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    const downloadButton = document.getElementById('download');
    if (downloadButton) {
        console.log('Download button found');
        downloadButton.addEventListener('click', async () => {
            console.log('Button clicked');
            try {
                // 获取当前标签页
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) {
                    console.error('No active tab found');
                    alert('无法找到当前标签页，请重试。');
                    return;
                }

                // 检查是否为支持的网站
                const supportedSites = ['deepseek.com', 'deepseek.ai', 'yuanbao.tencent.com', 'chatgpt.com', 'doubao.com'];
                const isSupported = supportedSites.some(site => tab.url.includes(site));

                if (!isSupported) {
                    alert('此插件仅支持 DeepSeek、元宝AI、ChatGPT 和豆包网站。\n请先打开对应的对话页面。');
                    return;
                }

                // 显示加载状态
                downloadButton.textContent = '导出中...';
                downloadButton.disabled = true;

                chrome.runtime.sendMessage({ action: "download" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        alert('导出失败：' + chrome.runtime.lastError.message);
                        resetButton();
                        return;
                    }
                    console.log('Message sent successfully', response);
                    resetButton();
                });

                // 3秒后重置按钮（防止长时间无响应）
                setTimeout(() => {
                    resetButton();
                }, 3000);
            } catch (error) {
                console.error('Error in click handler:', error);
                alert('导出过程中发生错误：' + error.message);
                resetButton();
            }
        });
    } else {
        console.error("Download button not found!");
    }
});

function resetButton() {
    const downloadButton = document.getElementById('download');
    if (downloadButton) {
        downloadButton.textContent = 'Export Chat';
        downloadButton.disabled = false;
    }
}
