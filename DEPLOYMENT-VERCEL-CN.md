# 🚀 Vercel 部署指南（简化版）

## 快速开始

### 第一步：部署后端

1. **访问** [vercel.com](https://vercel.com) 并登录（用GitHub账号）

2. **点击** "Add New" → "Project"

3. **导入你的Git仓库**

4. **配置后端项目**：
   - Project Name: `ecosphere-backend`
   - Framework: Other
   - Root Directory: `ecosphere-backend`
   - Build Command: 留空
   - Output Directory: 留空

5. **点击 Deploy**

6. **记录后端URL**（例如：`https://ecosphere-backend.vercel.app`）

---

### 第二步：部署前端

1. **再次点击** "Add New" → "Project"

2. **选择同一个Git仓库**

3. **配置前端项目**：
   - Project Name: `ecosphere-frontend`
   - Framework: Vite
   - Root Directory: `ecosphere-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **添加环境变量**：
   - 点击 "Environment Variables"
   - Name: `VITE_API_BASE_URL`
   - Value: `https://ecosphere-backend.vercel.app/api` （用你的后端URL）

5. **点击 Deploy**

6. **完成！** 访问你的前端URL即可使用应用

---

## 重要提示

### ⚠️ CORS配置

部署后如果遇到CORS错误，需要修改 `ecosphere-backend/server.js`：

```javascript
app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://ecosphere-frontend.vercel.app',  // 改成你的前端URL
  ],
  credentials: true
}));
```

修改后需要重新部署后端。

### 📁 Mock数据问题

✅ **已解决！** 项目已配置好Mock数据路径：

- **本地开发**：使用 `mock-data/` 目录
- **Vercel部署**：使用 `ecosphere-backend/data/` 目录

**如果你更新了mock数据**，部署前需要同步：

```bash
# Windows用户：运行同步脚本
sync-mock-data.bat

# 或手动复制
Copy-Item "mock-data\*.json" "ecosphere-backend\data\"
```

**重要**：`ecosphere-backend/data/` 目录必须提交到Git，Vercel才能访问这些文件！

---

## 测试部署

部署完成后测试：

1. **后端健康检查**：
   访问 `https://你的后端URL/api/health`
   应该看到：`{"status":"ok",...}`

2. **前端登录**：
   访问你的前端URL
   使用测试账号登录：
   - Email: `admin.admin@edu.sait.ca`
   - Password: `abcd1234`

3. **功能测试**：
   - 用户管理
   - 碳足迹计算
   - 图表显示

---

## 常见问题

### 问题1：前端无法连接后端

**检查**：
- 前端环境变量 `VITE_API_BASE_URL` 是否正确
- 后端CORS配置是否包含前端URL
- 在Vercel Dashboard重新部署前端

### 问题2：后端API返回404

**检查**：
- `vercel.json` 文件是否在 `ecosphere-backend/` 目录下
- `server.js` 是否导出了 `module.exports = app`

### 问题3：环境变量不生效

**解决**：
1. 在Vercel Dashboard → Settings → Environment Variables 检查
2. 确认变量名有 `VITE_` 前缀（前端）
3. 保存后重新部署

---

## 更新部署

代码修改后，只需：

```bash
git add .
git commit -m "Update code"
git push
```

Vercel会自动重新部署！

---

## 需要帮助？

查看完整指南：`DEPLOYMENT-VERCEL.md`

或查看Vercel的部署日志找到错误信息。

---

**祝部署成功！** 🎉
