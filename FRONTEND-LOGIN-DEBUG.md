# 🔍 前端登录问题排查指南

## 当前状态

✅ 后端API正常运行：`https://ecosphere-backend.vercel.app`
❓ 前端页面能打开，但无法登录

---

## 快速诊断步骤

### 步骤1：检查浏览器控制台错误

1. 打开前端页面
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 尝试登录
5. 查看是否有错误信息

**常见错误**：

#### 错误A：CORS错误
```
Access to fetch at 'https://ecosphere-backend.vercel.app/api/auth/login' 
from origin 'https://ecosphere-frontend.vercel.app' has been blocked by CORS policy
```

**解决方案**：
- ✅ 已更新后端CORS配置
- 需要重新部署后端

#### 错误B：Network Error
```
POST https://ecosphere-backend.vercel.app/api/auth/login net::ERR_FAILED
```

**解决方案**：
- 检查后端是否正常运行
- 检查前端环境变量是否正确

#### 错误C：404 Not Found
```
POST https://ecosphere-backend.vercel.app/api/auth/login 404 (Not Found)
```

**解决方案**：
- 检查API路径是否正确
- 确认后端路由已正确配置

---

### 步骤2：检查Network请求

1. 在开发者工具中切换到 **Network** 标签
2. 尝试登录
3. 查找 `login` 请求
4. 点击查看详情

**检查项**：

- **Request URL**: 应该是 `https://ecosphere-backend.vercel.app/api/auth/login`
- **Request Method**: 应该是 `POST`
- **Status Code**: 
  - `200` = 成功
  - `404` = 路径错误
  - `500` = 服务器错误
  - `CORS error` = CORS配置问题

---

### 步骤3：手动测试后端API

在浏览器控制台运行以下代码：

```javascript
// 测试登录API
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
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

**预期结果**：
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

## 解决方案

### 方案1：更新CORS配置（最常见）

**问题**：后端CORS没有允许前端域名

**解决步骤**：

1. ✅ 已更新 `ecosphere-backend/server.js` 的CORS配置
2. 提交并推送代码：
   ```bash
   git add ecosphere-backend/server.js
   git commit -m "Update CORS configuration for Vercel frontend"
   git push
   ```
3. 等待Vercel自动重新部署后端（约1-2分钟）
4. 刷新前端页面并重试登录

---

### 方案2：检查前端环境变量

**问题**：前端没有正确配置后端URL

**解决步骤**：

1. 进入Vercel Dashboard
2. 选择前端项目 `ecosphere-frontend`
3. 点击 **Settings** → **Environment Variables**
4. 检查是否有：
   ```
   Name: VITE_API_BASE_URL
   Value: https://ecosphere-backend.vercel.app/api
   ```
5. 如果没有或不正确，添加/修改后点击 **Save**
6. 重新部署前端：
   - 点击 **Deployments** 标签
   - 点击最新部署右侧的 **...** 
   - 选择 **Redeploy**

---

### 方案3：检查前端代码

**问题**：前端代码可能没有正确使用环境变量

检查 `ecosphere-frontend/src/services/UserService.js`：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

应该输出：`https://ecosphere-backend.vercel.app/api`

---

## 完整部署检查清单

### 后端检查 ✅

- [x] 后端已部署到Vercel
- [x] 根路径返回欢迎信息
- [x] `/api/health` 返回正常状态
- [x] CORS配置已更新
- [ ] 需要重新部署后端（如果刚更新了CORS）

### 前端检查 ❓

- [ ] 前端已部署到Vercel
- [ ] 环境变量 `VITE_API_BASE_URL` 已设置
- [ ] 环境变量值正确：`https://ecosphere-backend.vercel.app/api`
- [ ] 前端已重新部署（环境变量更改后）

---

## 测试步骤

### 1. 测试后端API（直接访问）

在浏览器访问：
```
https://ecosphere-backend.vercel.app/api/users
```

应该看到用户列表。

### 2. 测试前端环境变量

在前端页面的浏览器控制台输入：
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

应该输出：`https://ecosphere-backend.vercel.app/api`

### 3. 测试登录

使用测试账号：
- Email: `admin.admin@edu.sait.ca`
- Password: `abcd1234`

---

## 需要提供的信息

如果问题仍未解决，请提供：

1. **前端Vercel URL**：`https://your-frontend.vercel.app`
2. **浏览器控制台的错误信息**（截图或文字）
3. **Network标签中login请求的详情**（截图）
4. **前端环境变量的值**（在Vercel Dashboard中查看）

---

## 下一步行动

### 立即执行：

1. **重新部署后端**（因为更新了CORS配置）：
   ```bash
   git add .
   git commit -m "Fix CORS configuration for frontend"
   git push
   ```

2. **等待部署完成**（1-2分钟）

3. **刷新前端页面并重试登录**

4. **如果还是不行，检查浏览器控制台的错误信息**

---

**让我知道你看到了什么错误信息，我会帮你解决！** 🔧
