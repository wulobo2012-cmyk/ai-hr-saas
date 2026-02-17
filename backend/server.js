import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

// ⚠️⚠️⚠️ 请把下面引号里的内容换成你的 Dify API 密钥！
const DIFY_API_KEY = 'app-K8NZclsVZ62aXtRe24xdm0UN'; 

// 允许你的 React 前端访问这个服务器
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
    const { doc, type } = req.body;

    console.log('收到诊断请求:', type);

    try {
        // 向 Dify 发送请求
        // 如果你是私有化部署(Docker)，请把 https://api.dify.ai/v1 改成 http://localhost/v1
        const response = await fetch('https://api.dify.ai/v1/workflows/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "inputs": {
                    "salary_doc": doc,
                    "company_type": type
                },
                "response_mode": "blocking",
                "user": "user-123" // 随便填一个用户ID
            })
        });

        const data = await response.json();
        console.log('Dify 返回结果:', data);

        // 如果 Dify 返回了错误
        if (data.status === 404 || data.code) {
             return res.status(500).json({ result: "API 调用失败，请检查密钥或网络。" });
        }

        // 提取 Dify 返回的最终文本 (Workflow 的输出通常在 data.data.outputs.text)
        // 注意：根据你的 Dify 版本，这里可能是 data.data.outputs.text 或 data.answer
        const finalResult = data.data.outputs.text || "未获取到结果，请检查 Dify 输出节点配置。";

        res.json({ result: finalResult });

    } catch (error) {
        console.error('服务器出错:', error);
        res.status(500).json({ result: "服务器内部错误" });
    }
});

app.listen(port, () => {
    console.log(`中转服务器正在运行: http://localhost:${port}`);
});