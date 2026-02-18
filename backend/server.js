const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // 确保安装了 node-fetch，如果没有可以用原生 fetch (Node 18+)

const app = express();
// 关键修改1：允许所有来源访问 (解决 CORS 问题)
app.use(cors());
app.use(express.json());

// 关键修改2：使用 Render 分配的端口，如果没有则用 3000
const PORT = process.env.PORT || 3000;

app.post('/api/analyze', async (req, res) => {
    const { doc, type } = req.body;
    
    // 检查是否有 Dify 密钥
    const API_KEY = process.env.DIFY_API_KEY;
    if (!API_KEY) {
        console.error("缺少 DIFY_API_KEY");
        return res.status(500).json({ error: "服务器配置错误：缺少 API Key" });
    }

    try {
        const response = await fetch('https://api.dify.ai/v1/workflows/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    doc_content: doc,
                    doc_type: type
                },
                response_mode: "blocking",
                user: "user-123"
            })
        });

        const data = await response.json();
        console.log("Dify 返回结果:", data); // 在 Render 日志里能看到
        
        // 确保返回正确的数据结构
        if (data.data && data.data.outputs) {
             res.json(data.data.outputs);
        } else {
             res.json({ result: "AI 处理完成，但未返回预期格式。" });
        }

    } catch (error) {
        console.error("服务器报错:", error);
        res.status(500).json({ error: "服务器内部错误" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});