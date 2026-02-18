import { useState, useEffect } from 'react'
import { supabase } from './supabase' 
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>🔐 请先登录</h1>
        <p className="subtitle">电商薪酬智能诊断系统 (SaaS版)</p>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }} 
            providers={[]} 
            localization={{
              variables: {
                sign_in: { email_label: '邮箱', password_label: '密码', button_label: '登录' },
                sign_up: { email_label: '邮箱', password_label: '设置密码', button_label: '注册' }
              }
            }}
          />
        </div>
      </div>
    )
  }

  return <MainApp session={session} />
}

function MainApp({ session }) {
  const [doc, setDoc] = useState('')
  const [type, setType] = useState('淘宝/天猫')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])
  
  // 👇 新增：记录今天用了几次
  const [todayUsage, setTodayUsage] = useState(0)
  const MAX_LIMIT = 3 // 每天限制 3 次

  useEffect(() => {
    fetchHistory()
    checkUsage() // 一进来就查查今天用了几次
  }, [])

  // 👇 新增：检查今日使用量
  const checkUsage = async () => {
    // 获取过去 24 小时的时间点
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from('history')
      .select('*', { count: 'exact', head: true }) // 只数数，不拿数据
      .gte('created_at', oneDayAgo) // 筛选条件：创建时间 >= 24小时前
    
    if (error) console.error('查询额度失败', error)
    else setTodayUsage(count || 0)
  }

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.log('拉取历史失败:', error)
    else setHistory(data || [])
  }

  const handleAnalyze = async () => {
    // 1. 先检查额度
    if (todayUsage >= MAX_LIMIT) {
      alert('🚫 今日免费额度已用完！请明天再来，或升级 VIP 会员。')
      return
    }

    if (!doc) {
      alert('请先粘贴薪酬方案！')
      return
    }

    setLoading(true)
    setResult('正在连接大脑进行分析，请稍候...')

    try {
      const response = await fetch('https://ai-hr-backend-witv.onrender.com/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc, type }),
      })
      const data = await response.json()
      
      let aiResult = ''
      if (!response.ok) {
        aiResult = `**出错啦**：${data.result || '未知错误'}`
      } else {
        aiResult = data.result
      }
      setResult(aiResult)

      if (response.ok) {
        const { error } = await supabase.from('history').insert({
          company_type: type,
          input_doc: doc,
          result: aiResult
        })
        if (!error) {
          fetchHistory() 
          checkUsage() // ⭐️ 用完一次，记得重新数一下，更新界面
        } else {
          console.error('保存失败:', error)
        }
      }
      
    } catch (error) {
      console.error(error)
      setResult('**发生错误**：无法连接到服务器。请检查 backend 是否运行。')
    } finally {
      setLoading(false)
    }
  }

  // 计算剩余次数
  const remaining = Math.max(0, MAX_LIMIT - todayUsage)

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>💰 电商薪酬智能诊断系统</h1>
          <p style={{color: '#666', fontSize: '14px'}}>
            当前用户: {session.user.email} 
            {/* 👇 新增：显示 VIP 标记 */}
            <span style={{marginLeft: '10px', background: '#f1c40f', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px'}}>
              免费版
            </span>
          </p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          style={{ width: 'auto', padding: '8px 16px', background: '#95a5a6', fontSize: '14px' }}
        >
          退出
        </button>
      </div>
      
      <div className="card">
        {/* 👇 新增：额度提示条 */}
        <div style={{ 
          background: remaining > 0 ? '#e8f8f5' : '#fdedec', 
          color: remaining > 0 ? '#27ae60' : '#c0392b',
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          border: '1px solid',
          borderColor: remaining > 0 ? '#d1f2eb' : '#fadbd8',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>📅 今日免费额度：<strong>{todayUsage} / {MAX_LIMIT}</strong></span>
          <span>{remaining > 0 ? `还剩 ${remaining} 次` : '🚫 次数耗尽'}</span>
        </div>

        <div className="form-group">
          <label>1. 选择电商平台</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="淘宝/天猫">淘宝 / 天猫</option>
            <option value="京东">京东</option>
            <option value="抖音电商">抖音电商</option>
            <option value="拼多多">拼多多</option>
          </select>
        </div>

        <div className="form-group">
          <label>2. 粘贴薪酬方案</label>
          <textarea 
            rows="5" 
            placeholder="例如：运营专员底薪6000，提成2%..."
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
          />
        </div>

        {/* 👇 按钮逻辑：没次数了就禁用按钮 */}
        <button 
          onClick={handleAnalyze} 
          disabled={loading || remaining === 0}
          style={{ 
            backgroundColor: remaining === 0 ? '#95a5a6' : '#3498db',
            cursor: remaining === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'AI 正在思考中...' : remaining === 0 ? '今日次数已用完 (明天再来)' : '开始深度诊断 🚀'}
        </button>
      </div>

      {result && (
        <div className="result-box">
          <h3>📊 本次诊断结果</h3>
          <div className="markdown-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '40px', paddingBottom: '50px' }}>
          <h2 style={{ borderLeft: '5px solid #3498db', paddingLeft: '10px', color: '#2c3e50' }}>🕒 历史诊断记录</h2>
          {history.map((item) => (
            <div key={item.id} className="card" style={{ marginTop: '15px', background: '#f8f9fa', border: '1px solid #eee' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', marginBottom: '10px'}}>
                <span>📅 {new Date(item.created_at).toLocaleString()}</span>
                <span style={{fontWeight: 'bold', color: '#2980b9'}}>{item.company_type}</span>
              </div>
              <details>
                <summary style={{cursor: 'pointer', color: '#3498db', fontWeight: 'bold'}}>点击查看详情</summary>
                <div className="markdown-content" style={{marginTop: '15px', borderTop: '1px dashed #ddd', paddingTop: '10px'}}>
                  <p style={{background: '#eee', padding: '5px'}}><strong>输入方案：</strong>{item.input_doc}</p>
                  <ReactMarkdown>{item.result}</ReactMarkdown>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
