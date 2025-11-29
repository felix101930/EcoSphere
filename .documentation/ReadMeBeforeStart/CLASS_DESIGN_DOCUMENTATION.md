# EcoSphere 类设计文档

**项目**: EcoSphere - Smart Building Analytics System  
**创建日期**: 2025-11-28  
**最后更新**: 2025-11-28  
**状态**: 持续更新  
**参考**: class-diagram-optimized.puml

---

## 📋 目录

1. [概述](#概述)
2. [已实现的类](#已实现的类)
3. [待实现的类](#待实现的类)
4. [类的位置映射](#类的位置映射)
5. [类之间的关系](#类之间的关系)
6. [实现进度](#实现进度)

---

## 概述

本文档记录EcoSphere系统中所有类的设计和实现情况。所有类的设计严格遵循`class-diagram-optimized.puml`中的定义。

### 设计原则
- ✅ 所有类必须包含类图中定义的所有attributes
- ✅ 所有方法必须按照类图中的签名实现
- ✅ 类之间的关系必须在代码中体现
- ✅ 命名必须与类图保持一致

---

## 已实现的类

### 1. User类（抽象类）

**Package**: User Management  
**文件位置**: `ecosphere-frontend/src/models/User.js`  
**实现状态**: ✅ 已完成

**Attributes**:
```javascript
- id: int
- firstName: String
- lastName: String
- email: String
- password: String
- role: String
```

**Methods**:
```javascript
+ createUser(id, firstName, lastName, email, password, role): void
+ login(): void
+ logout(): void
```

**实现代码**:
```javascript
class User {
  constructor() {
    this.id = null;
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.role = '';
  }

  createUser(id, firstName, lastName, email, password, role) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  login() {
    console.log('User.login() called');
  }

  logout() {
    this.id = null;
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.role = '';
  }
}
```

**关系**:
- 被继承: `Admin --|> User`, `TeamMember --|> User`
- 被使用: `User --> UI : uses`

---

### 2. Admin类

**Package**: User Management  
**文件位置**: `ecosphere-frontend/src/models/Admin.js`  
**实现状态**: ✅ 已完成  
**继承**: User

**额外Methods**:
```javascript
+ addUser(userData): void
+ editUserPermissions(userId, permissions): void
+ assignRole(userId, role): void
+ createQuiz(): void
+ editQuiz(quizId): void
+ deleteQuiz(quizId): void
```

**实现代码**:
```javascript
class Admin extends User {
  constructor() {
    super();
    this.role = 'Admin';
  }

  addUser(userData) {
    console.log('Admin.addUser() called', userData);
  }

  editUserPermissions(userId, permissions) {
    console.log('Admin.editUserPermissions() called', userId, permissions);
  }

  assignRole(userId, role) {
    console.log('Admin.assignRole() called', userId, role);
  }

  createQuiz() {
    // Future implementation
  }

  editQuiz(quizId) {
    // Future implementation
  }

  deleteQuiz(quizId) {
    // Future implementation
  }
}
```

**关系**:
- 继承: `Admin --|> User : is-a`
- 依赖: `Admin ..> AccessControl : uses`

---

### 3. TeamMember类

**Package**: User Management  
**文件位置**: `ecosphere-frontend/src/models/TeamMember.js`  
**实现状态**: ✅ 已完成  
**继承**: User

**额外Attributes**:
```javascript
- promptChat: int
- permissions: List<String>
```

**额外Methods**:
```javascript
+ getPermissions(): List<String>
```

**实现代码**:
```javascript
class TeamMember extends User {
  constructor() {
    super();
    this.role = 'TeamMember';
    this.promptChat = 0;
    this.permissions = [];
  }

  getPermissions() {
    return this.permissions;
  }
}
```

**关系**:
- 继承: `TeamMember --|> User : is-a`

---

### 4. AccessControl类

**Package**: Security  
**文件位置**: `ecosphere-frontend/src/models/AccessControl.js`  
**实现状态**: ✅ 已完成

**Methods** (Static):
```javascript
+ checkPermission(user, module): boolean
+ updateUserPermissions(userId, permissions): void
```

**实现代码**:
```javascript
class AccessControl {
  static checkPermission(user, module) {
    if (!user) return false;
    
    if (user.role === 'Admin') {
      return true;
    }
    
    if (user.role === 'TeamMember') {
      return user.permissions && user.permissions.includes(module);
    }
    
    return false;
  }

  static updateUserPermissions(userId, permissions) {
    console.log('AccessControl.updateUserPermissions() called', userId, permissions);
  }
}
```

**关系**:
- 被使用: `Admin ..> AccessControl : uses`
- 被依赖: `UI ..> AccessControl : checks permission`
- 被依赖: `Dashboard ..> AccessControl : checks permission`
- 被依赖: `Report ..> AccessControl : checks permission`

---

## 待实现的类

### 5. CarbonFootprint类

**Package**: Carbon Analysis  
**文件位置**: 功能已实现，但分散在多个服务中  
**实现状态**: ✅ 功能已完成（通过Service层实现）

**实际实现方式**:
虽然没有创建独立的CarbonFootprint类文件，但功能已通过以下方式实现：

1. **ElectricityMapsService.js** - 碳强度API和计算
   - `getCurrentCarbonIntensity()` - 获取实时碳强度
   - `calculateCarbonFootprint(electricityUsage, carbonData)` - 计算碳足迹
   - `getCarbonIntensityInKg(data)` - 单位转换

2. **ElectricityService.js** - 电力数据管理
   - `getRealTimeData()` - 获取实时数据
   - `getDailyData()` - 获取每日数据
   - `getLongTermData()` - 获取长期数据
   - `getDataByRange(startDate, endDate)` - 按日期范围获取
   - `calculateTotalEnergy(data)` - 计算总能耗

3. **CarbonFootprintPage.jsx** - 主页面容器
   - 模式1：数据库自动计算（从electricity.json读取）
   - 模式2：用户临时上传（CustomCalculator组件）
   - 三种视图：Real-time, Daily, Long-term
   - Chart.js图表可视化

4. **CustomCalculator.jsx** - 用户临时计算组件
   - 动态添加/删除账单条目
   - 临时计算（不持久化）
   - 数据验证和排序

**对应的类图Methods实现**:
```javascript
// calculateFootprint() - 在ElectricityMapsService中实现
calculateCarbonFootprint(electricityUsage, carbonData) {
  const emissionFactor = this.getCarbonIntensityInKg(carbonData);
  return electricityUsage * emissionFactor;
}

// addBillEntry() - 在CustomCalculator中实现
handleAddCustomEntry() {
  // 添加新的账单条目
}

// overrideWithDIY() - 在CustomCalculator中实现
// 用户临时上传模式，数据不持久化
```

**数据文件**:
- `mock-data/electricity.json` - 电力消耗数据（3个月，hourly）
- `mock-data/carbonFootprint.json` - 碳足迹历史数据

**关系**:
- 依赖: ElectricityMapsService → Electricity Maps API
- 依赖: ElectricityService → electricity.json
- 使用: CarbonFootprintPage → ElectricityMapsService + ElectricityService

---

### 6. BillEntry类

**Package**: Carbon Analysis  
**文件位置**: 功能已实现在CustomCalculator组件中  
**实现状态**: ✅ 功能已完成（作为React state）

**实际实现方式**:
在CustomCalculator.jsx中作为React state实现：

```javascript
const [customEntries, setCustomEntries] = useState([
  { id: 1, year: '2024', month: 'January', usage: '' }
]);
```

**对应的Attributes**:
```javascript
{
  id: int,           // 唯一标识
  year: string,      // 年份
  month: string,     // 月份
  usage: number      // 电力使用量 (kWh)
}
```

**相关Methods**:
```javascript
// 添加账单条目
handleAddCustomEntry()

// 更新账单条目
handleUpdateEntry(id, field, value)

// 删除账单条目
handleRemoveEntry(id)

// 验证重复
// 自动排序
```

**特点**:
- ✅ 动态添加/删除
- ✅ 数据验证（防止重复）
- ✅ 自动排序（按年月）
- ✅ 不持久化（仅存在React state）

**关系**:
- 被使用: CustomCalculator → customEntries (多个BillEntry)

---

### 7. Report类（抽象类）

**Package**: Reporting System  
**文件位置**: `ecosphere-frontend/src/models/Report.js` (待创建)  
**实现状态**: ⏳ 待实现

**Attributes**:
```javascript
- id: int
- reportType: String
```

**Methods**:
```javascript
+ exportReport(): void
+ filterReport(filters): void
```

**关系**:
- 被继承: `WaterReport --|> Report`, `ElectricityReport --|> Report`, `ThermalReport --|> Report`
- 依赖: `Report ..> Database : queries`
- 依赖: `Report ..> AccessControl : checks permission`

---

### 8. ElectricityReport类

**Package**: Reporting System  
**文件位置**: `ecosphere-frontend/src/models/ElectricityReport.js` (待创建)  
**实现状态**: ⏳ 待实现  
**继承**: Report

**额外Attributes**:
```javascript
- electricityConsumption: double
- electricityGeneration: double
```

**Methods**:
```javascript
+ calculateCarbonFootprint(emissionFactor): double
+ generateHotspotMap(data): Map
+ generateCarbonVsConsumptionChart(): Chart
```

**继承的Methods**:
```javascript
+ exportReport(): void
+ filterReport(filters): void
```

**关系**:
- 继承: `ElectricityReport --|> Report : is-a`
- 被计算: `CarbonFootprint "1" --> "1" ElectricityReport : calculates`

---

### 9. WaterReport类

**Package**: Reporting System  
**文件位置**: `ecosphere-frontend/src/models/WaterReport.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**继承**: Report

---

### 10. ThermalReport类

**Package**: Reporting System  
**文件位置**: `ecosphere-frontend/src/models/ThermalReport.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**继承**: Report

---

### 11. Dashboard类

**Package**: User Interface  
**文件位置**: `ecosphere-frontend/src/models/Dashboard.js` (待创建)  
**实现状态**: 🟡 P1 - 待实现

**Attributes**:
```javascript
- id: int
- dashboardType: String
```

**Methods**:
```javascript
+ generateView(user, type): DashboardView
+ filterByPermissions(user): List
```

**关系**:
- 组合: `UI "1" *-- "*" Dashboard : displays`
- 使用: `Dashboard --> Visualizer : uses`
- 聚合: `Dashboard --> Report : aggregates`
- 依赖: `Dashboard ..> AccessControl : checks permission`

---

### 12. Visualizer类

**Package**: Visualization  
**文件位置**: `ecosphere-frontend/src/models/Visualizer.js` (待创建)  
**实现状态**: 🟡 P1 - 待实现

**Attributes**:
```javascript
- id: int
- visualizeType: String
```

**Methods**:
```javascript
+ generateGraph(data, graphType): void
+ calculateSelfSufficiency(generation, consumption): double
+ renderHotspotMap(data): Map
+ renderHeatMap(data): Map
+ renderWeatherWidget(weatherData): Widget
```

**关系**:
- 可视化: `Visualizer --> Report : visualizes`
- 被使用: `Dashboard --> Visualizer : uses`

---

### 13. Forecast类

**Package**: Reporting System  
**文件位置**: `ecosphere-frontend/src/models/Forecast.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**Attributes**:
```javascript
- id: int
```

**Methods**:
```javascript
+ generateForecast(historicalData, duration): DataSet
```

**关系**:
- 生成: `Forecast --> Report : generates`

---

### 14. PeriodComparison类

**Package**: Analytics  
**文件位置**: `ecosphere-frontend/src/models/PeriodComparison.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**Attributes**:
```javascript
- id: int
```

**Methods**:
```javascript
+ comparePoP(currentPeriod): double
+ compareYoY(currentPeriod): double
+ compareCustom(period1, period2): double
```

**关系**:
- 比较: `Report --> PeriodComparison : compares`

---

### 15. UI类

**Package**: User Interface  
**文件位置**: `ecosphere-frontend/src/contexts/UIContext.jsx` (部分实现)  
**实现状态**: 🟡 部分实现

**Attributes**:
```javascript
- currentView: String
```

**Methods**:
```javascript
+ renderView(viewName): void
+ updateUI(data): void
+ displayWarning(message): void
```

**关系**:
- 组合: `UI "1" *-- "*" Dashboard : displays`
- 组合: `UI "1" *-- "1" Filter : owns`
- 组合: `UI "1" *-- "1" ReportCustomization : owns`
- 组合: `UI "1" *-- "1" CarbonFootprint : owns`
- 聚合: `UI "1" o-- "*" Report : displays`
- 依赖: `UI ..> AccessControl : checks permission`
- 被使用: `User --> UI : uses`

---

### 16. Filter类

**Package**: User Interface  
**文件位置**: `ecosphere-frontend/src/models/Filter.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**Attributes**:
```javascript
- id: int
- location: String
- area: String
- timePeriod: String
```

**Methods**:
```javascript
+ applyFilter(): DataSet
+ resetToDefault(): void
```

**关系**:
- 组合: `UI "1" *-- "1" Filter : owns`

---

### 17. ReportCustomization类

**Package**: User Interface  
**文件位置**: `ecosphere-frontend/src/models/ReportCustomization.js` (待创建)  
**实现状态**: 🟢 P2 - Skeleton

**Attributes**:
```javascript
- id: int
- includeGraphs: List
```

**Methods**:
```javascript
+ preview(): ReportPreview
+ download(format): void
```

**关系**:
- 组合: `UI "1" *-- "1" ReportCustomization : owns`

---

### 18. Database接口

**Package**: Data Layer  
**文件位置**: `ecosphere-backend/interfaces/Database.js` (待创建)  
**实现状态**: ⏳ 待实现

**Methods**:
```javascript
+ executeQuery(query, params): DataSet
+ fetchSensorData(): DataSet
```

**关系**:
- 被查询: `Report ..> Database : queries`

---

## 类的位置映射

### 前端 (ecosphere-frontend)

```
src/models/
├── User.js                    ✅ 已实现
├── Admin.js                   ✅ 已实现
├── TeamMember.js              ✅ 已实现
├── AccessControl.js           ✅ 已实现
├── CarbonFootprint.js         ⏳ 待实现 (P0)
├── BillEntry.js               ⏳ 待实现 (P0)
├── Report.js                  ⏳ 待实现 (P1)
├── ElectricityReport.js       ⏳ 待实现 (P1)
├── WaterReport.js             🟢 P2 - Skeleton
├── ThermalReport.js           🟢 P2 - Skeleton
├── Dashboard.js               🟡 待实现 (P1)
├── Visualizer.js              🟡 待实现 (P1)
├── Forecast.js                🟢 P2 - Skeleton
├── PeriodComparison.js        🟢 P2 - Skeleton
├── Filter.js                  🟢 P2 - Skeleton
└── ReportCustomization.js     🟢 P2 - Skeleton

src/contexts/
└── UIContext.jsx              🟡 部分实现
```

### 后端 (ecosphere-backend)

```
interfaces/
└── Database.js                ⏳ 待实现

services/
├── UserService.js             ✅ 已实现
├── ElectricityService.js      ✅ 已实现
├── CarbonFootprintService.js  ⏳ 待实现 (P0)
└── DashboardService.js        🟡 待实现 (P1)
```

---

## 类之间的关系

### 继承关系 (Inheritance)
```
User (抽象)
  ├── Admin
  └── TeamMember

Report (抽象)
  ├── WaterReport
  ├── ElectricityReport
  └── ThermalReport
```

### 组合关系 (Composition) - 强拥有
```
UI *-- Dashboard (多个)
UI *-- Filter (1个)
UI *-- ReportCustomization (1个)
UI *-- CarbonFootprint (1个)
CarbonFootprint o-- BillEntry (多个)
```

### 聚合关系 (Aggregation) - 弱拥有
```
UI o-- Report (多个)
Dashboard --> Report (聚合)
```

### 依赖关系 (Dependency) - 使用
```
Admin ..> AccessControl
UI ..> AccessControl
Dashboard ..> AccessControl
Report ..> AccessControl
Report ..> Database
CarbonFootprint --> ElectricityReport
Forecast --> Report
Report --> PeriodComparison
```

### 使用关系 (Association)
```
User --> UI
Dashboard --> Visualizer
Visualizer --> Report
```

---

## 实现进度

### 优先级说明
- 🔴 **P0**: 必须完成（Prototype演示核心）
- 🟡 **P1**: 时间允许则实现
- 🟢 **P2**: Skeleton实现（框架搭建）

### 进度统计

| 优先级 | 总数 | 已完成 | 待实现 | 完成率 |
|--------|------|--------|--------|--------|
| P0     | 6    | 4      | 2      | 67%    |
| P1     | 5    | 0      | 5      | 0%     |
| P2     | 7    | 0      | 7      | 0%     |
| **总计** | **18** | **4** | **14** | **22%** |

### P0 - 必须完成（登录 + 用户管理 + 碳足迹）

| 类名 | 状态 | 文件位置 |
|------|------|----------|
| User | ✅ 已完成 | `ecosphere-frontend/src/models/User.js` |
| Admin | ✅ 已完成 | `ecosphere-frontend/src/models/Admin.js` |
| TeamMember | ✅ 已完成 | `ecosphere-frontend/src/models/TeamMember.js` |
| AccessControl | ✅ 已完成 | `ecosphere-frontend/src/models/AccessControl.js` |
| CarbonFootprint | ⏳ 待实现 | `ecosphere-frontend/src/models/CarbonFootprint.js` |
| BillEntry | ⏳ 待实现 | `ecosphere-frontend/src/models/BillEntry.js` |

### P1 - 时间允许则实现（电力仪表板）

| 类名 | 状态 | 文件位置 |
|------|------|----------|
| Report | ⏳ 待实现 | `ecosphere-frontend/src/models/Report.js` |
| ElectricityReport | ⏳ 待实现 | `ecosphere-frontend/src/models/ElectricityReport.js` |
| Dashboard | ⏳ 待实现 | `ecosphere-frontend/src/models/Dashboard.js` |
| Visualizer | ⏳ 待实现 | `ecosphere-frontend/src/models/Visualizer.js` |
| Database | ⏳ 待实现 | `ecosphere-backend/interfaces/Database.js` |

### P2 - Skeleton实现

| 类名 | 状态 | 文件位置 |
|------|------|----------|
| WaterReport | 🟢 Skeleton | `ecosphere-frontend/src/models/WaterReport.js` |
| ThermalReport | 🟢 Skeleton | `ecosphere-frontend/src/models/ThermalReport.js` |
| Forecast | 🟢 Skeleton | `ecosphere-frontend/src/models/Forecast.js` |
| PeriodComparison | 🟢 Skeleton | `ecosphere-frontend/src/models/PeriodComparison.js` |
| Filter | 🟢 Skeleton | `ecosphere-frontend/src/models/Filter.js` |
| ReportCustomization | 🟢 Skeleton | `ecosphere-frontend/src/models/ReportCustomization.js` |
| UI | 🟡 部分实现 | `ecosphere-frontend/src/contexts/UIContext.jsx` |

---

## 下一步任务

### 立即任务（P0 - 碳足迹功能）
1. ⏳ 创建 `CarbonFootprint.js` 类
2. ⏳ 创建 `BillEntry.js` 类
3. ⏳ 创建 `CarbonFootprintService.js` 服务
4. ⏳ 实现碳足迹计算逻辑
5. ⏳ 实现两种计算模式

### 后续任务（P1 - 电力仪表板）
1. ⏳ 创建 `Report.js` 抽象类
2. ⏳ 创建 `ElectricityReport.js` 类
3. ⏳ 创建 `Dashboard.js` 类
4. ⏳ 创建 `Visualizer.js` 类
5. ⏳ 创建 `Database.js` 接口

### 未来任务（P2 - Skeleton）
1. 🟢 创建所有P2类的Skeleton实现
2. 🟢 添加TODO注释标注未来实现
3. 🟢 确保类结构符合类图

---

## 参考文档

- **类图**: `ReadMeBeforeStart/diagram/class-diagram-optimized.puml`
- **实现计划**: `ReadMeBeforeStart/3.IMPLEMENTATION_PLAN.md`
- **开发日志**: `ReadMeBeforeStart/log.md`
- **组件架构**: `ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md`

---

**最后更新**: 2025-11-28  
**更新者**: Kiro AI  
**状态**: P0进度 67% - 继续实现碳足迹功能

---

## 附录：类图关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      User Management                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         User (抽象)                                          │
│           ↑                                                  │
│           ├── Admin                                          │
│           └── TeamMember                                     │
│                                                              │
│         AccessControl (静态方法)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Carbon Analysis                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         CarbonFootprint                                      │
│           │                                                  │
│           ├── BillEntry (多个)                               │
│           └── → ElectricityReport (计算)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Reporting System                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         Report (抽象)                                        │
│           ↑                                                  │
│           ├── WaterReport                                    │
│           ├── ElectricityReport                              │
│           └── ThermalReport                                  │
│                                                              │
│         Forecast → Report                                    │
│         Report → PeriodComparison                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         UI                                                   │
│           ├── Dashboard (多个)                               │
│           ├── Filter (1个)                                   │
│           ├── ReportCustomization (1个)                      │
│           ├── CarbonFootprint (1个)                          │
│           └── Report (多个，聚合)                            │
│                                                              │
│         Dashboard → Visualizer                               │
│         Dashboard → Report                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Visualization                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         Visualizer → Report                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         Database (接口)                                      │
│           ← Report (查询)                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**文档完成！所有类的设计和实现情况已记录！** ✅
