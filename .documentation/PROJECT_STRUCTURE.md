# EcoSphere 项目结构说明

**最后更新**: 2025-11-28  
**版本**: 1.0

---

## 📁 完整项目结构

```
Capstone/                           # 项目根目录
│
├── .documentation/                 # 📚 所有项目文档（统一管理）
│   ├── README.md                   # 文档中心说明
│   ├── INDEX.md                    # 📖 文档索引（从这里开始）
│   ├── PROJECT_STRUCTURE.md        # 📄 本文件
│   │
│   ├── ReadMeBeforeStart/          # 项目核心文档
│   │   ├── 1.EcoSphereIntroduction.md
│   │   ├── 2.Phase3_extracted.md
│   │   ├── 3.IMPLEMENTATION_PLAN.md
│   │   ├── API_ARCHITECTURE.md
│   │   ├── CLASS_DESIGN_DOCUMENTATION.md
│   │   ├── CLASS_IMPLEMENTATION_STATUS.md
│   │   ├── COMPONENT_ARCHITECTURE.md
│   │   ├── log.md
│   │   ├── TESTING_GUIDE.md
│   │   └── diagram/                # UML图表
│   │       ├── class-diagram-optimized.puml
│   │       ├── erd-diagram.puml
│   │       ├── usecase-diagram.puml
│   │       ├── seq-electricity-dashboard.puml
│   │       ├── activity-electricity-dashboard.puml
│   │       └── deployment-diagram.puml
│   │
│   ├── FigmaScreenshot/            # UI设计稿
│   │   ├── loginpage.png
│   │   ├── admin-usermanagement-1.png
│   │   ├── admin-usermanagement-2.png
│   │   ├── teammember-carbonfootprintcalculator-1.png
│   │   ├── teammember-carbonfootprintcalculator-2.png
│   │   ├── teammember-carbonfootprintcalculator-3.png
│   │   └── image/                  # Logo和图标
│   │
│   └── project-readmes/            # 各模块README
│       ├── ROOT-README.md
│       ├── MOCK-DATA-README.md
│       ├── FRONTEND-README.md
│       └── FRONTEND-MODELS-README.md
│
├── ecosphere-frontend/             # 前端应用 (Vite + React)
│   ├── src/
│   │   ├── assets/                 # 静态资源
│   │   │   ├── loginbackground.jpg
│   │   │   ├── sait-logo_vert.svg
│   │   │   └── sait-logo_horz.svg
│   │   │
│   │   ├── components/             # React组件
│   │   │   ├── Common/             # 通用组件
│   │   │   │   ├── AlertMessage.jsx
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── Layout/             # 布局组件
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── AIChatbot.jsx
│   │   │   ├── UserManagement/     # 用户管理组件
│   │   │   │   ├── UserTable.jsx
│   │   │   │   ├── UserTableRow.jsx
│   │   │   │   ├── UserDialog.jsx
│   │   │   │   └── UserForm.jsx
│   │   │   └── CarbonFootprint/    # 碳足迹组件
│   │   │       └── CustomCalculator.jsx
│   │   │
│   │   ├── pages/                  # 页面组件
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UserManagementPage.jsx
│   │   │   ├── CarbonFootprintPage.jsx
│   │   │   └── ComingSoonPage.jsx
│   │   │
│   │   ├── contexts/               # React Context
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/                  # 自定义Hooks
│   │   │   └── useAuth.js
│   │   │
│   │   ├── services/               # API服务
│   │   │   ├── UserService.js
│   │   │   ├── ElectricityService.js
│   │   │   └── ElectricityMapsService.js
│   │   │
│   │   ├── models/                 # 数据模型（工具类）
│   │   │   ├── README.md
│   │   │   ├── User.js
│   │   │   ├── Admin.js
│   │   │   ├── TeamMember.js
│   │   │   ├── AccessControl.js
│   │   │   ├── CarbonFootprint.js
│   │   │   ├── BillEntry.js
│   │   │   ├── Report.js
│   │   │   └── ElectricityReport.js
│   │   │
│   │   ├── App.jsx                 # 主应用组件
│   │   ├── main.jsx                # 入口文件
│   │   └── index.css               # 全局样式
│   │
│   ├── public/                     # 公共资源
│   ├── .env                        # 环境变量
│   ├── .env.example                # 环境变量示例
│   ├── package.json                # 依赖配置
│   ├── vite.config.js              # Vite配置
│   └── README.md                   # 前端README
│
├── ecosphere-backend/              # 后端API (Node.js + Express)
│   ├── config/                     # 配置文件
│   │   └── config.js
│   │
│   ├── routes/                     # API路由
│   │   ├── userRoutes.js
│   │   └── electricityRoutes.js
│   │
│   ├── controllers/                # 控制器
│   │   ├── userController.js
│   │   └── electricityController.js
│   │
│   ├── services/                   # 业务逻辑
│   │   ├── userService.js
│   │   └── electricityService.js
│   │
│   ├── models/                     # 数据模型（完整类）
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── TeamMember.js
│   │   ├── AccessControl.js
│   │   ├── CarbonFootprint.js
│   │   ├── BillEntry.js
│   │   ├── Report.js
│   │   └── ElectricityReport.js
│   │
│   ├── utils/                      # 工具函数
│   │   └── fileHelper.js
│   │
│   ├── server.js                   # 服务器入口
│   ├── .env                        # 环境变量
│   └── package.json                # 依赖配置
│
├── mock-data/                      # Mock数据（临时 - Prototype阶段）
│   ├── README.md                   # Mock数据说明
│   ├── users.json                  # 用户数据
│   ├── electricity.json            # 电力数据
│   ├── carbonFootprint.json        # 碳足迹数据
│   └── generate-electricity-data.js # 数据生成脚本
│
├── image/                          # 项目图片资源
│   └── README/                     # README图片
│
├── .gitignore                      # Git忽略配置
└── README.md                       # 项目主README
```

---

## 📂 文件夹说明

### `.documentation/` - 文档中心 📚

**用途**: 所有项目文档的统一存放位置

**包含内容**:
- 项目介绍和背景
- 技术架构文档
- 开发日志和测试指南
- UML图表
- UI设计稿
- 各模块README

**重要文件**:
- `INDEX.md` - 文档索引，从这里开始查找文档
- `README.md` - 文档中心说明

---

### `ecosphere-frontend/` - 前端应用 ⚛️

**技术栈**: Vite + React + Material-UI + Chart.js

**核心文件夹**:

#### `src/components/` - React组件
- **Common/** - 可复用的通用组件
- **Layout/** - 布局组件（Sidebar, Header等）
- **UserManagement/** - 用户管理相关组件
- **CarbonFootprint/** - 碳足迹相关组件

#### `src/pages/` - 页面组件
- 每个页面对应一个路由
- 容器组件，负责数据和逻辑

#### `src/services/` - API服务
- 封装所有API调用
- 与后端通信的唯一入口

#### `src/models/` - 数据模型
- 工具类和辅助函数
- 不包含状态管理

#### `src/contexts/` - React Context
- 全局状态管理
- 认证状态等

---

### `ecosphere-backend/` - 后端API 🚀

**技术栈**: Node.js + Express

**分层架构**:

```
Routes → Controllers → Services → Models → Data
```

#### `routes/` - API路由
- 定义API端点
- 路由到对应的Controller

#### `controllers/` - 控制器
- 处理HTTP请求和响应
- 验证输入
- 调用Service层

#### `services/` - 业务逻辑
- 核心业务逻辑
- 数据操作
- 调用Model层

#### `models/` - 数据模型
- 完整的类定义
- 符合类图设计

#### `utils/` - 工具函数
- 文件操作
- 通用工具

---

### `mock-data/` - Mock数据 📊

**用途**: Prototype阶段的临时数据存储

**重要**: 
- ⚠️ 这是临时方案
- 🔄 未来将替换为SQL Server数据库
- 📝 详细说明见 `mock-data/README.md`

**包含数据**:
- `users.json` - 用户数据
- `electricity.json` - 电力消耗数据（3个月）
- `carbonFootprint.json` - 碳足迹历史数据

---

## 🎯 关键路径

### 启动项目
1. 后端: `ecosphere-backend/server.js`
2. 前端: `ecosphere-frontend/src/main.jsx`

### 查找文档
1. 文档索引: `.documentation/INDEX.md`
2. 项目说明: `README.md`

### 开发功能
1. 前端组件: `ecosphere-frontend/src/components/`
2. 前端页面: `ecosphere-frontend/src/pages/`
3. 后端API: `ecosphere-backend/routes/`

### 测试功能
1. 测试指南: `.documentation/ReadMeBeforeStart/TESTING_GUIDE.md`
2. Mock数据: `mock-data/`

---

## 📊 代码统计

### 前端
- **组件**: 15+ 个
- **页面**: 5 个
- **服务**: 3 个
- **模型**: 8 个

### 后端
- **路由**: 2 个
- **控制器**: 2 个
- **服务**: 2 个
- **模型**: 8 个

### 文档
- **核心文档**: 9 个
- **UML图表**: 6 个
- **设计稿**: 6 个
- **README**: 5 个

---

## 🔍 快速查找

### 我要找...

**登录功能**:
- 前端: `ecosphere-frontend/src/pages/LoginPage.jsx`
- 后端: `ecosphere-backend/routes/userRoutes.js`
- 测试: `.documentation/ReadMeBeforeStart/TESTING_GUIDE.md`

**用户管理功能**:
- 前端: `ecosphere-frontend/src/pages/UserManagementPage.jsx`
- 组件: `ecosphere-frontend/src/components/UserManagement/`
- 后端: `ecosphere-backend/controllers/userController.js`

**碳足迹功能**:
- 前端: `ecosphere-frontend/src/pages/CarbonFootprintPage.jsx`
- 组件: `ecosphere-frontend/src/components/CarbonFootprint/`
- 服务: `ecosphere-frontend/src/services/ElectricityService.js`

**API文档**:
- 架构: `.documentation/ReadMeBeforeStart/API_ARCHITECTURE.md`
- 路由: `ecosphere-backend/routes/`

**类设计**:
- 文档: `.documentation/ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md`
- 前端: `ecosphere-frontend/src/models/`
- 后端: `ecosphere-backend/models/`

---

## 💡 开发建议

### 添加新功能

1. **前端**:
   - 在 `src/components/` 创建组件
   - 在 `src/pages/` 创建页面
   - 在 `src/services/` 添加API调用

2. **后端**:
   - 在 `routes/` 定义路由
   - 在 `controllers/` 处理请求
   - 在 `services/` 实现逻辑

### 查找代码

1. 使用编辑器的搜索功能（Ctrl+Shift+F）
2. 查看文件夹结构
3. 阅读相关文档

### 理解架构

1. 阅读 `.documentation/ReadMeBeforeStart/API_ARCHITECTURE.md`
2. 阅读 `.documentation/ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md`
3. 查看 UML 图表

---

## 🔄 项目演进

### Prototype阶段（当前）
- ✅ Mock数据
- ✅ 基础功能
- ✅ 前后端分离

### 未来开发（Week 1-15）
- 🔄 SQL Server数据库
- 🔄 完整功能
- 🔄 高级特性

---

**项目结构说明完成！** ✅
