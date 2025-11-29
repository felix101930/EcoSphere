# 🔧 快速修复 - 404错误

## 当前状态
✅ CORS问题已解决
❌ 后端返回404错误

## 可能的原因

### 1. Vercel后端还没有完全部署好
等待1-2分钟，然后刷新页面重试。

### 2. 检查后端是否正常

在浏览器访问：
```
https://ecosphere-backend.vercel.app/api/health
```

应该看到：
```json
{
  "status": "ok",
  "message": "EcoSphere Backend is running",
  ...
}
```

### 3. 测试登录API

在浏览器控制台（F12）运行：
```javascript
fetch('https://ecosphere-backend.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'admin.admin@edu.sait.ca', 
    password: 'abcd1234' 
  })
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

## 预期结果

### 如果成功：
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstName": "Super",
    "lastName": "Admin",
    ...
  }
}
```

### 如果404：
```json
{
  "error": "Route not found"
}
```

## 解决方案

### 方案A：重新部署后端

1. 在Vercel Dashboard中找到 `ecosphere-backend` 项目
2. 点击 `Deployments` 标签
3. 点击最新部署右侧的 `...` → `Redeploy`

### 方案B：检查Vercel日志

1. 在Vercel Dashboard中找到 `ecosphere-backend` 项目
2. 点击 `Functions` 标签
3. 查看是否有错误日志

### 方案C：检查vercel.json配置

确保 `ecosphere-backend/vercel.json` 内容正确：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## 快速检查清单

- [ ] 后端已推送到Git
- [ ] Vercel已自动部署后端
- [ ] `/api/health` 返回正常
- [ ] 前端环境变量已设置
- [ ] 前端已重新部署
- [ ] 等待了2-3分钟让部署完成

## 如果还是不行

告诉我：
1. `/api/health` 的返回结果
2. 登录测试的完整错误信息
3. Vercel Functions日志中的错误（如果有）
