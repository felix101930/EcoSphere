# EcoSphere - Smart Building Analytics System

## 📁 项目结构

```
Capstone/
├── ecosphere-frontend/     # 前端应用 (Vite + React)
├── ecosphere-backend/      # 后端API (Node.js + Express)
├── mock-data/              # Mock数据 (临时 - Prototype阶段)
│   ├── users.json          # 用户数据
│   ├── electricity.json    # 电力消耗数据
│   └── carbonFootprint.json # 碳足迹数据
├── .documentation/         # 📚 所有项目文档（统一管理）
│   ├── INDEX.md            # 📖 文档索引（从这里开始）
│   ├── ReadMeBeforeStart/  # 项目文档
│   ├── FigmaScreenshot/    # 设计稿
│   └── project-readmes/    # 各模块README
└── README.md               # 本文件
```

⚠️ **重要**: `mock-data/` 文件夹是临时的，仅用于Prototype阶段。生产环境将使用SQL Server数据库。

📚 **查找文档**: 所有文档已整理到 `.documentation/` 文件夹，请查看 [文档索引](.documentation/INDEX.md)

---

## 🚀 如何启动应用

### 前提条件

- Node.js 18.x 或更高版本
- npm 或 yarn

---

## 📝 启动步骤

### 1️⃣ 首先启动后端服务器

打开第一个终端窗口：

```bash
cd ecosphere-backend
npm start
```

**后端服务器将运行在**: http://localhost:3001

**看到以下信息表示启动成功**:

```
Server is running on http://localhost:3001
```

---

### 2️⃣ 然后启动前端应用

打开第二个终端窗口：

```bash
cd ecosphere-frontend
npm run dev
```

**前端应用将运行在**: http://localhost:5174

**看到以下信息表示启动成功**:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
```

---

## 🌐 访问应用

在浏览器中打开: **http://localhost:5174**

---

## 🔑 测试账号

### Admin账号（管理员）

- **邮箱**: `admin.admin@edu.sait.ca`
- **密码**: `abcd1234`
- **权限**: 所有功能

### TeamMember账号（团队成员）

- 需要通过Admin账号在用户管理页面创建
- 可以分配不同的权限

---

## ⚠️ 重要提示

1. **必须先启动后端，再启动前端**
2. **两个服务器必须同时运行**
3. 如果端口被占用，请先关闭占用端口的程序

---

## 🛑 停止应用

在各自的终端窗口中按 `Ctrl + C` 停止服务器

---

## 📦 首次安装依赖

如果是第一次运行项目，需要先安装依赖：

### 安装后端依赖

```bash
cd ecosphere-backend
npm install
```

### 安装前端依赖

```bash
cd ecosphere-frontend
npm install
```

---

## 🔧 故障排除

### 问题1: 端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:

- 关闭占用3001端口的程序
- 或修改 `ecosphere-backend/server.js` 中的端口号

### 问题2: 前端无法连接后端

**错误信息**: `Network Error` 或 `Failed to fetch`

**解决方案**:

- 确保后端服务器正在运行
- 检查后端是否运行在 http://localhost:3001

### 问题3: 依赖安装失败

**解决方案**:

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

## 📚 更多信息

**所有项目文档已整理到 `.documentation/` 文件夹**

- 📖 **文档索引**: [.documentation/INDEX.md](.documentation/INDEX.md) - 查找所有文档
- 📝 **开发日志**: [.documentation/ReadMeBeforeStart/log.md](.documentation/ReadMeBeforeStart/log.md)
- 📋 **实现计划**: [.documentation/ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md](.documentation/ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md)
- 🧪 **测试指南**: [.documentation/ReadMeBeforeStart/TESTING_GUIDE.md](.documentation/ReadMeBeforeStart/TESTING_GUIDE.md)

---
