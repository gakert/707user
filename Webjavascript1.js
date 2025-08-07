let lastSentData = '';
let responseReceived = false;

function updateStatus(message, isSuccess) {
    const statusBar = document.getElementById('statusBar');
    statusBar.textContent = message;
    statusBar.className = isSuccess ? 'status-bar status-success' : 'status-bar status-error';
    statusBar.style.display = 'block';
}

function checkForResponse(sentData, attempts = 0) {
    if (attempts >= 10) {
        updateStatus('等待回传超时！', false);
        return;
    }

    fetch('http://localhost:8080', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Request-Type': 'check-response'
        }
    })
    .then(response => response.text())  // 先获取原始文本
    .then(text => {
        console.log("Raw check-response:", text); // 打印原始响应
        try {
            const data = JSON.parse(text);
            if (data.status === 'echo' && data.data === sentData) {
                document.getElementById('outputQt').textContent = data.data;
                updateStatus('指令接收成功，数据验证一致！', true);
                responseReceived = true;
            } else if (!responseReceived) {
                setTimeout(() => checkForResponse(sentData, attempts + 1), 200);
            }
        } catch (e) {
            console.error("JSON 解析失败:", e, "原始内容:", text);
            if (!responseReceived) {
                setTimeout(() => checkForResponse(sentData, attempts + 1), 200);
            }
        }
    })
    .catch(error => {
        console.error("请求失败:", error);
        if (!responseReceived) {
            setTimeout(() => checkForResponse(sentData, attempts + 1), 200);
        }
    });
}

function submitForm() {
    const dataInput = document.getElementById('dataInput');
    const output = document.getElementById('output');
    const data = dataInput.value.trim();
    
    if (!data) {
        updateStatus('请输入数据', false);
        return;
    }

    output.textContent = data;
    lastSentData = data;
    responseReceived = false;

    // 显示发送状态
    updateStatus('发送数据中...', true);

     fetch('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data })
    })
    .then(response => response.text())
    .then(text => {
    // 尝试从响应中提取最后一个合法的 JSON 部分
    const lastJsonStart = text.lastIndexOf('{');
    const lastJsonEnd = text.lastIndexOf('}') + 1;
    const jsonStr = text.slice(lastJsonStart, lastJsonEnd);

    try {
        const data = JSON.parse(jsonStr);
        if (data.status === 'echo') {
            document.getElementById('outputQt').textContent = data.data;
            updateStatus('数据回传成功！', true);
        }
    } catch (e) {
        console.error("JSON 解析失败:", e, "原始内容:", text);
        updateStatus('回传数据格式错误', false);
    }
})
}