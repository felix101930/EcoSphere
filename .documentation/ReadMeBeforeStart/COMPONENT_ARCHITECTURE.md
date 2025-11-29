# EcoSphere Component Architecture

## 🎯 组件化原则

### 为什么需要组件化？

**避免God Mode（上帝模式）：**
- ❌ 一个组件包含所有逻辑（300+ 行代码）
- ❌ 难以维护和测试
- ❌ 无法复用
- ❌ 团队协作困难

**组件化的好处：**
- ✅ 单一职责，易于理解
- ✅ 可复用，减少重复代码
- ✅ 易于测试
- ✅ 团队可以并行开发
- ✅ 易于维护和扩展

---

## 📐 组件化原则（必须遵守）

### 1. 单一职责原则 (Single Responsibility)
每个组件只负责一个功能。

**❌ 错误示例：**
```jsx
// UserManagementPage.jsx - 包含所有逻辑（God Mode）
const UserManagementPage = () => {
  // 300+ lines of code
  // - User table rendering
  // - Dialog rendering
  // - Form rendering
  // - All business logic
  // - All state management
};
```

**✅ 正确示例：**
```jsx
// UserManagementPage.jsx - 只负责组合组件
const UserManagementPage = () => {
  return (
    <>
      <AlertMessage {...alertProps} />
      <UserTable {...tableProps} />
      <UserDialog {...dialogProps} />
    </>
  );
};
```

### 2. 可复用性 (Reusability)
组件应该可以在多个地方使用。

**✅ 可复用组件示例：**
```jsx
// AlertMessage.jsx - 可以在任何页面使用
<AlertMessage show={true} message="Success!" severity="success" />

// 在UserManagementPage使用
<AlertMessage {...alertProps} />

// 在CarbonFootprintPage也可以使用
<AlertMessage {...alertProps} />
```

### 3. 小而精 (Small and Focused)
单个组件不超过 **150 行代码**。

**组件大小指南：**
- 🟢 **< 50 行** - 理想大小
- 🟡 **50-150 行** - 可接受
- 🔴 **> 150 行** - 需要拆分

### 4. 清晰命名 (Clear Naming)
组件名称清楚表达功能。

**✅ 好的命名：**
- `UserTable` - 显示用户表格
- `UserDialog` - 用户对话框
- `AlertMessage` - 提示消息
- `Sidebar` - 侧边栏

**❌ 不好的命名：**
- `Component1` - 不知道做什么
- `UserStuff` - 太模糊
- `Data` - 太通用

### 5. Container/Presentation 模式
分离数据逻辑和UI展示。

**Container Components（容器组件）：**
- 位于 `pages/` 目录
- 负责数据获取和状态管理
- 负责业务逻辑
- 组合子组件

**Presentation Components（展示组件）：**
- 位于 `components/` 目录
- 只负责UI展示
- 通过props接收数据
- 无状态或只有UI状态

---

## 🏗️ 项目结构标准

```
src/
├── components/              # 可复用展示组件
│   ├── Common/             # 通用组件
│   │   ├── AlertMessage.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   ├── UserManagement/     # 用户管理组件
│   │   ├── UserTable.jsx
│   │   ├── UserTableRow.jsx
│   │   ├── UserDialog.jsx
│   │   └── UserForm.jsx
│   ├── CarbonFootprint/    # 碳足迹组件
│   │   ├── CarbonChart.jsx
│   │   ├── BillEntryForm.jsx
│   │   └── ModeSelector.jsx
│   └── Layout/             # 布局组件
│       ├── Sidebar.jsx
│       ├── Header.jsx
│       └── Footer.jsx
├── pages/                  # 容器组件（页面）
│   ├── LoginPage.jsx
│   ├── UserManagementPage.jsx
│   ├── DashboardPage.jsx
│   └── CarbonFootprintPage.jsx
├── contexts/               # React Context（状态管理）
│   ├── AuthContext.jsx
│   └── UIContext.jsx
├── services/               # 业务逻辑服务
│   ├── UserService.js
│   ├── CarbonFootprintService.js
│   └── DashboardService.js
├── models/                 # 类图对应的类
│   ├── User.js
│   ├── Admin.js
│   ├── TeamMember.js
│   └── AccessControl.js
├── data/                   # Mock数据
│   ├── users.json
│   └── sensorData.json
└── utils/                  # 工具函数
    ├── dateUtils.js
    └── validators.js
```

---

## 📦 组件分类

### 1. Common Components（通用组件）
可以在整个应用中使用的基础组件。

**示例：**
- `AlertMessage` - 提示消息
- `ConfirmDialog` - 确认对话框
- `LoadingSpinner` - 加载动画
- `ErrorBoundary` - 错误边界

**特点：**
- 高度可复用
- 无业务逻辑
- 通过props配置

### 2. Feature Components（功能组件）
特定功能模块的组件。

**示例：**
- `UserManagement/` - 用户管理相关
- `CarbonFootprint/` - 碳足迹相关
- `Dashboard/` - 仪表板相关

**特点：**
- 针对特定功能
- 可能包含一些业务逻辑
- 在功能模块内复用

### 3. Layout Components（布局组件）
应用的布局结构组件。

**示例：**
- `Sidebar` - 侧边栏
- `Header` - 页头
- `Footer` - 页脚

**特点：**
- 定义应用结构
- 在多个页面使用
- 通常包含导航逻辑

### 4. Page Components（页面组件）
顶层容器组件，对应路由。

**示例：**
- `UserManagementPage`
- `DashboardPage`
- `CarbonFootprintPage`

**特点：**
- 容器组件
- 负责数据获取
- 组合子组件
- 对应路由

---

## 🔍 实际案例：UserManagement

### 重构前（God Mode）❌

```jsx
// UserManagementPage.jsx - 300+ lines
const UserManagementPage = () => {
  // State
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  // ... 10+ state variables

  // Functions
  const loadUsers = () => { /* ... */ };
  const handleAdd = () => { /* ... */ };
  const handleEdit = () => { /* ... */ };
  const handleDelete = () => { /* ... */ };
  // ... 10+ functions

  return (
    <Container>
      {/* Alert rendering - 20 lines */}
      {alert.show && <Alert>...</Alert>}
      
      {/* Table rendering - 100 lines */}
      <Table>
        <TableHead>...</TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow>
              {/* 50 lines of table row logic */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Dialog rendering - 100 lines */}
      <Dialog>
        {/* Form fields - 80 lines */}
      </Dialog>
    </Container>
  );
};
```

**问题：**
- 300+ 行代码在一个文件
- 难以理解和维护
- 无法复用任何部分
- 测试困难

---

### 重构后（组件化）✅

#### 1. Container Component（容器组件）
```jsx
// pages/UserManagementPage.jsx - 180 lines
const UserManagementPage = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState({});
  
  // Data operations
  const loadUsers = () => { /* ... */ };
  const handleSubmit = () => { /* ... */ };
  const handleDelete = () => { /* ... */ };
  
  // Render - Just compose components
  return (
    <Container>
      <AlertMessage {...alertProps} />
      <UserTable {...tableProps} />
      <UserDialog {...dialogProps} />
    </Container>
  );
};
```

#### 2. Presentation Components（展示组件）

**UserTable.jsx - 40 lines**
```jsx
const UserTable = ({ users, onEdit, onDelete, currentUserId }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>...</TableHead>
        <TableBody>
          {users.map(user => (
            <UserTableRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              isCurrentUser={user.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

**UserTableRow.jsx - 45 lines**
```jsx
const UserTableRow = ({ user, onEdit, onDelete, isCurrentUser }) => {
  return (
    <TableRow>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.firstName}</TableCell>
      {/* ... */}
      <TableCell>
        <IconButton onClick={() => onEdit(user)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(user.id)} disabled={isCurrentUser}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};
```

**UserDialog.jsx - 30 lines**
```jsx
const UserDialog = ({ open, onClose, onSubmit, formData, onChange, isEditMode }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditMode ? 'Edit User' : 'Add User'}</DialogTitle>
      <DialogContent>
        <UserForm formData={formData} onChange={onChange} isEditMode={isEditMode} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};
```

**UserForm.jsx - 60 lines**
```jsx
const UserForm = ({ formData, onChange, isEditMode }) => {
  return (
    <Box>
      <TextField name="firstName" value={formData.firstName} onChange={onChange} />
      <TextField name="lastName" value={formData.lastName} onChange={onChange} />
      <TextField name="email" value={formData.email} onChange={onChange} />
      <TextField name="password" value={formData.password} onChange={onChange} />
      <Select name="role" value={formData.role} onChange={onChange}>
        <MenuItem value="Admin">Admin</MenuItem>
        <MenuItem value="TeamMember">Team Member</MenuItem>
      </Select>
    </Box>
  );
};
```

**AlertMessage.jsx - 15 lines**
```jsx
const AlertMessage = ({ show, message, severity }) => {
  if (!show) return null;
  return <Alert severity={severity}>{message}</Alert>;
};
```

---

### 重构效果对比

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 单文件代码行数 | 300+ | 最大180 |
| 组件数量 | 1 | 6 |
| 可复用组件 | 0 | 5 |
| 可测试性 | 困难 | 容易 |
| 可维护性 | 低 | 高 |
| 团队协作 | 困难 | 容易 |

---

## ✅ 组件化检查清单

在创建或修改组件时，检查以下项：

### 单一职责
- [ ] 组件只做一件事
- [ ] 组件名称清楚表达功能
- [ ] 没有混合多个职责

### 大小控制
- [ ] 组件代码不超过150行
- [ ] 如果超过，考虑拆分

### 可复用性
- [ ] 组件可以在其他地方使用
- [ ] 通过props配置，不硬编码
- [ ] 没有紧耦合的依赖

### 清晰接口
- [ ] Props定义清晰
- [ ] 有PropTypes或TypeScript类型
- [ ] 有必要的注释

### 测试友好
- [ ] 可以独立测试
- [ ] 没有隐藏的副作用
- [ ] 输入输出明确

---

## 🚀 下一步组件化任务

### CarbonFootprint功能（即将开发）

**需要创建的组件：**

```
components/CarbonFootprint/
├── CarbonChart.jsx           # Chart.js图表组件
├── ModeSelector.jsx          # 模式切换组件
├── DatabaseModeView.jsx      # 模式1：数据库自动计算
├── UploadModeView.jsx        # 模式2：用户临时上传
├── BillEntryForm.jsx         # 账单输入表单
└── FootprintSummary.jsx      # 碳足迹摘要

pages/
└── CarbonFootprintPage.jsx   # 容器组件
```

**每个组件职责：**
- `CarbonFootprintPage` - 容器，管理状态和模式切换
- `CarbonChart` - 展示Chart.js图表
- `ModeSelector` - Tab切换组件
- `DatabaseModeView` - 显示数据库数据和图表
- `UploadModeView` - 显示上传表单和临时计算结果
- `BillEntryForm` - 账单输入表单（年、月、用电量）
- `FootprintSummary` - 显示计算结果摘要

---

## 📚 参考资源

### React组件化最佳实践
- [React Component Patterns](https://reactpatterns.com/)
- [Container/Presentation Pattern](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
- [Component Composition](https://reactjs.org/docs/composition-vs-inheritance.html)

### 代码质量
- 单个组件不超过150行
- 函数不超过30行
- 嵌套不超过3层

---

**最后更新**: 2025-11-28  
**状态**: UserManagement已完成组件化重构 ✅  
**下一步**: CarbonFootprint功能组件化开发
