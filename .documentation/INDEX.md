# EcoSphere 项目文档索引

**最后更新**: 2025-11-28  
**文档版本**: 1.0

---

## 📚 文档导航

### 🚀 快速开始

| 文档 | 描述 | 适合人群 |
|------|------|----------|
| [项目启动指南](../README.md) | 如何启动前端和后端服务器 | 所有人 |
| [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md) | 如何测试登录和用户管理功能 | 测试人员、新成员 |
| [开发日志](ReadMeBeforeStart/log.md) | 项目开发历史和决策记录 | 开发人员 |

---

## 📖 项目文档（ReadMeBeforeStart/）

### 核心文档

| 文档 | 描述 | 重要性 |
|------|------|--------|
| [1.EcoSphereIntroduction.md](ReadMeBeforeStart/1.EcoSphereIntroduction.md) | 项目背景、目标、技术栈、WBS | ⭐⭐⭐⭐⭐ |
| [2.Phase3_extracted.md](ReadMeBeforeStart/2.Phase3_extracted.md) | Phase 3要求和交付物 | ⭐⭐⭐⭐⭐ |
| [3.IMPLEMENTATION_PLAN.md](ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md) | 详细实现计划（270+任务） | ⭐⭐⭐⭐⭐ |

### 架构文档

| 文档 | 描述 | 适合人群 |
|------|------|----------|
| [API_ARCHITECTURE.md](ReadMeBeforeStart/API_ARCHITECTURE.md) | API架构、前后端通信、完整调用链 | 开发人员 |
| [CLASS_DESIGN_DOCUMENTATION.md](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) | 所有类的设计和实现情况 | 开发人员 |
| [CLASS_IMPLEMENTATION_STATUS.md](ReadMeBeforeStart/CLASS_IMPLEMENTATION_STATUS.md) | 类实现进度报告 | 项目经理、开发人员 |
| [COMPONENT_ARCHITECTURE.md](ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md) | 组件化原则和最佳实践 | 前端开发人员 |

### 开发文档

| 文档 | 描述 | 适合人群 |
|------|------|----------|
| [log.md](ReadMeBeforeStart/log.md) | 开发日志（3000+行） | 所有人 |
| [TESTING_GUIDE.md](ReadMeBeforeStart/TESTING_GUIDE.md) | 测试指南 | 测试人员 |

---

## 🎨 设计资源（FigmaScreenshot/）

### UI设计稿

| 文件 | 描述 |
|------|------|
| [loginpage.png](FigmaScreenshot/loginpage.png) | 登录页面设计 |
| [admin-usermanagement-1.png](FigmaScreenshot/admin-usermanagement-1.png) | Admin用户管理页面（列表） |
| [admin-usermanagement-2.png](FigmaScreenshot/admin-usermanagement-2.png) | Admin用户管理页面（表单） |
| [teammember-carbonfootprintcalculator-1.png](FigmaScreenshot/teammember-carbonfootprintcalculator-1.png) | 碳足迹计算器（Real-time View） |
| [teammember-carbonfootprintcalculator-2.png](FigmaScreenshot/teammember-carbonfootprintcalculator-2.png) | 碳足迹计算器（Daily View） |
| [teammember-carbonfootprintcalculator-3.png](FigmaScreenshot/teammember-carbonfootprintcalculator-3.png) | 碳足迹计算器（Custom Calculation） |

### 设计资源

| 文件夹 | 描述 |
|--------|------|
| [image/](FigmaScreenshot/image/) | Logo和图标资源 |

---

## 📋 项目README文档（project-readmes/）

### 各模块README

| 文档 | 原始位置 | 描述 |
|------|----------|------|
| [ROOT-README.md](project-readmes/ROOT-README.md) | `/README.md` | 项目根目录README |
| [MOCK-DATA-README.md](project-readmes/MOCK-DATA-README.md) | `/mock-data/README.md` | Mock数据说明 |
| [FRONTEND-README.md](project-readmes/FRONTEND-README.md) | `/ecosphere-frontend/README.md` | 前端项目README |
| [FRONTEND-MODELS-README.md](project-readmes/FRONTEND-MODELS-README.md) | `/ecosphere-frontend/src/models/README.md` | 前端模型说明 |

---

## 🗂️ UML图表（ReadMeBeforeStart/diagram/）

### 类图和数据库设计

| 文件 | 描述 | 重要性 |
|------|------|--------|
| [class-diagram-optimized.puml](ReadMeBeforeStart/diagram/class-diagram-optimized.puml) | 类图（最重要） | ⭐⭐⭐⭐⭐ |
| [erd-diagram.puml](ReadMeBeforeStart/diagram/erd-diagram.puml) | 数据库ERD图 | ⭐⭐⭐⭐⭐ |

### 用例和序列图

| 文件 | 描述 |
|------|------|
| [usecase-diagram.puml](ReadMeBeforeStart/diagram/usecase-diagram.puml) | 用例图 |
| [seq-electricity-dashboard.puml](ReadMeBeforeStart/diagram/seq-electricity-dashboard.puml) | 电力仪表板序列图 |

### 活动图和部署图

| 文件 | 描述 |
|------|------|
| [activity-electricity-dashboard.puml](ReadMeBeforeStart/diagram/activity-electricity-dashboard.puml) | 电力仪表板活动图 |
| [deployment-diagram.puml](ReadMeBeforeStart/diagram/deployment-diagram.puml) | 部署图 |

---

## 🎯 按角色查找文档

### 新加入的团队成员

**必读文档**（按顺序）：
1. [项目启动指南](../README.md) - 如何启动项目
2. [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md) - 如何测试功能
3. [开发日志](ReadMeBeforeStart/log.md) - 了解项目历史
4. [组件架构](ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md) - 了解代码组织

### 前端开发人员

**推荐文档**：
1. [组件架构](ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md) - 组件化原则
2. [API架构](ReadMeBeforeStart/API_ARCHITECTURE.md) - 前后端通信
3. [前端模型说明](project-readmes/FRONTEND-MODELS-README.md) - 模型使用
4. [类设计文档](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) - 类图实现

### 后端开发人员

**推荐文档**：
1. [API架构](ReadMeBeforeStart/API_ARCHITECTURE.md) - API设计
2. [类设计文档](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) - 类图实现
3. [ERD图](ReadMeBeforeStart/diagram/erd-diagram.puml) - 数据库设计
4. [Mock数据说明](project-readmes/MOCK-DATA-README.md) - 临时数据

### 测试人员

**推荐文档**：
1. [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md) - 测试步骤
2. [项目启动指南](../README.md) - 启动项目
3. [用例图](ReadMeBeforeStart/diagram/usecase-diagram.puml) - 功能用例

### 项目经理

**推荐文档**：
1. [实现计划](ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md) - 详细任务
2. [类实现状态](ReadMeBeforeStart/CLASS_IMPLEMENTATION_STATUS.md) - 进度报告
3. [开发日志](ReadMeBeforeStart/log.md) - 开发历史
4. [项目介绍](ReadMeBeforeStart/1.EcoSphereIntroduction.md) - 项目背景

### UI/UX设计师

**推荐文档**：
1. [Figma设计稿](FigmaScreenshot/) - 所有设计
2. [组件架构](ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md) - 组件设计
3. [开发日志](ReadMeBeforeStart/log.md) - 设计决策

---

## 🔍 按主题查找文档

### 登录和用户管理

- [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md) - 测试登录功能
- [API架构](ReadMeBeforeStart/API_ARCHITECTURE.md) - 用户API
- [类设计](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) - User/Admin/TeamMember类

### 碳足迹追踪

- [Figma设计](FigmaScreenshot/teammember-carbonfootprintcalculator-1.png) - UI设计
- [实现计划](ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md) - 实现任务
- [类设计](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) - CarbonFootprint类

### 权限管理

- [类设计](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md) - AccessControl类
- [开发日志](ReadMeBeforeStart/log.md) - 权限系统实现

### 数据库设计

- [ERD图](ReadMeBeforeStart/diagram/erd-diagram.puml) - 数据库设计
- [Mock数据](project-readmes/MOCK-DATA-README.md) - 临时数据
- [实现计划](ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md) - 数据库表

### 前后端通信

- [API架构](ReadMeBeforeStart/API_ARCHITECTURE.md) - 完整API文档
- [序列图](ReadMeBeforeStart/diagram/seq-electricity-dashboard.puml) - 调用流程

---

## 📊 文档统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心文档 | 3 | 项目介绍、Phase 3要求、实现计划 |
| 架构文档 | 4 | API、类设计、组件架构、实现状态 |
| 开发文档 | 2 | 开发日志、测试指南 |
| UML图表 | 6 | 类图、ERD、用例、序列、活动、部署 |
| 设计稿 | 6 | 登录、用户管理、碳足迹计算器 |
| README | 4 | 根目录、Mock数据、前端、前端模型 |
| **总计** | **25** | **所有文档** |

---

## 🔗 外部资源

### SAIT官方资源

- [SAIT Web Style Guide](https://www.sait.ca/knowledge-base/brand-and-styling/web-styleguide) - 设计规范
- [SAIT Brand Guidelines](https://www.sait.ca/about-sait/who-we-are/brand) - 品牌指南

### 技术文档

- [React Documentation](https://react.dev/) - React官方文档
- [Material-UI](https://mui.com/) - MUI组件库
- [Chart.js](https://www.chartjs.org/) - 图表库
- [Express.js](https://expressjs.com/) - 后端框架

---

## 📝 文档更新记录

| 日期 | 更新内容 | 更新者 |
|------|----------|--------|
| 2025-11-28 | 创建文档索引，整理所有文档到.documentation文件夹 | Kiro AI |

---

## 💡 使用建议

### 第一次使用项目

1. 阅读 [项目启动指南](../README.md)
2. 阅读 [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md)
3. 浏览 [开发日志](ReadMeBeforeStart/log.md) 了解项目历史

### 开始开发

1. 阅读 [组件架构](ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md)
2. 阅读 [API架构](ReadMeBeforeStart/API_ARCHITECTURE.md)
3. 查看 [类设计文档](ReadMeBeforeStart/CLASS_DESIGN_DOCUMENTATION.md)

### 准备演示

1. 阅读 [测试指南](ReadMeBeforeStart/TESTING_GUIDE.md)
2. 查看 [Figma设计稿](FigmaScreenshot/)
3. 阅读 [实现计划](ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md)

---

## 🆘 需要帮助？

如果找不到需要的文档，请：

1. 使用文件搜索功能（Ctrl+F）搜索关键词
2. 查看 [开发日志](ReadMeBeforeStart/log.md) 的目录
3. 联系项目团队成员

---

**文档索引创建完成！** ✅
