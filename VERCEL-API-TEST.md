# 🧪 Vercel API 测试指南

## 后端API测试

你的后端已成功部署到：`https://ecosphere-backend.vercel.app`

## ✅ 测试端点

### 1. 根路径（欢迎信息）
```
GET https://ecosphere-backend.vercel.app/
```

**预期响应**：
```json
{
  "name": "EcoSphere Backend API",
  "version": "1.0.0",
  "status": "running",
  "environment": "production",
  "message": "Welcome to EcoSphere Backend API",
  "endpoints": {
    "health": "/api/health",
    "users": "/api/users",
    "auth": "/api/auth/login",
    "electricity": "/api/electricity/*"
  }
}
```

---

### 2. 健康检查
```
GET https://ecosphere-backend.vercel.app/api/health
```

**预期响应**：
```json
{
  "status": "ok",
  "message": "EcoSphere Backend is running",
  "environment": "production",
  "version": "1.0.0",
  "routes": {
    "users": "loaded",
    "electricity": "loaded"
  }
}
```

---

### 3. 获取所有用户
```
GET https://ecosphere-backend.vercel.app/api/users
```

**预期响应**：
```json
{
  "users": [
    {
      "id": 1,
      "firstName": "Super",
      "lastName": "Admin",
      "email": "admin.admin@edu.sait.ca",
      "role": "Admin"
    },
    ...
  ]
}
```

---

### 4. 用户登录
```
POST https://ecosphere-backend.vercel.app/api/auth/login
Content-Type: application/json

{
  "email": "admin.admin@edu.sait.ca",
  "password": "abcd1234"
}
```

**预期响应**：
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstName": "Super",
    "lastName": "Admin",
    "email": "admin.admin@edu.sait.ca",
    "role": "Admin"
  }
}
```

---

### 5. 电力数据 - 实时数据
```
GET https://ecosphere-backend.vercel.app/api/electricity/realtime
```

**预期响应**：
```json
[
  {
    "seq": 1,
    "ts": "2024-11-29 00:00:00",
    "value": 2500.5,
    "unit": "W"
  },
  ...
]
```

---

### 6. 电力数据 - 日期范围
```
GET https://ecosphere-backend.vercel.app/api/electricity/range?startDate=2024-11-19&endDate=2024-11-29
```

**预期响应**：
```json
[
  {
    "seq": 1,
    "ts": "2024-11-19 00:00:00",
    "value": 2500.5,
    "unit": "W"
  },
  ...
]
```

---

## 🔧 使用浏览器测试

### 方法1：直接在浏览器地址栏输入

对于GET请求，直接访问：
- https://ecosphere-backend.vercel.app/
- https://ecosphere-backend.vercel.app/api/health
- https://ecosphere-backend.vercel.app/api/users

### 方法2：使用浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 切换到 "Console" 标签
3. 输入以下代码测试POST请求：

```javascript
// 测试登录
fetch('https://ecosphere-backend.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin.admin@edu.sait.ca',
    password: 'abcd1234'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🛠️ 使用Postman测试

1. 下载并安装 [Postman](https://www.postman.com/downloads/)
2. 创建新请求
3. 输入URL和选择方法（GET/POST）
4. 对于POST请求，在Body标签选择"raw"和"JSON"
5. 点击Send

---

## ⚠️ 常见问题

### 问题1：CORS错误

如果前端无法访问后端API，需要更新CORS配置。

在 `ecosphere-backend/server.js` 中修改：

```javascript
app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://ecosphere-frontend.vercel.app',  // 你的前端URL
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 问题2：404错误

确保URL路径正确：
- ✅ `/api/health` - 正确
- ❌ `/health` - 错误（缺少/api前缀）

### 问题3：500错误

查看Vercel的Function Logs：
1. 进入Vercel Dashboard
2. 选择你的项目
3. 点击 "Functions" 标签
4. 查看错误日志

---

## 📝 测试检查清单

部署成功后，测试以下端点：

- [ ] `GET /` - 欢迎信息
- [ ] `GET /api/health` - 健康检查
- [ ] `GET /api/users` - 获取用户列表
- [ ] `POST /api/auth/login` - 用户登录
- [ ] `GET /api/electricity/realtime` - 实时电力数据
- [ ] `GET /api/electricity/range?startDate=2024-11-19&endDate=2024-11-29` - 日期范围数据

---

## 🎯 下一步

如果所有API测试通过：

1. **更新前端环境变量**：
   ```
   VITE_API_BASE_URL=https://ecosphere-backend.vercel.app/api
   ```

2. **部署前端**

3. **测试完整应用**

---

## 📚 相关文档

- [Vercel部署指南](DEPLOYMENT-VERCEL-CN.md)
- [API文档](如果有的话)

---

**祝测试顺利！** 🚀
