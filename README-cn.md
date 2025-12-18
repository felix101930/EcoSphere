## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd Capstone
```

### 2. 安装依赖

#### 安装后端依赖

```bash
cd ecosphere-backend
npm install
cd ..
```

#### 安装前端依赖

```bash
cd ecosphere-frontend
npm install
cd ..
```

### 3. 配置数据库连接

编辑 `ecosphere-backend/.env` 文件，配置你的 SQL Server 数据库：

```env
# SQL Server Configuration
DB_SERVER=localhost          # 数据库服务器地址
DB_DATABASE=TestSlimDB       # 数据库名称

# 如果使用 SQL Server 认证，取消注释并填写：
# DB_USER=your_username
# DB_PASSWORD=your_password

# 如果使用 Windows 认证（默认），不需要设置用户名和密码
```

**重要说明**：
- 默认使用 **Windows 认证**（不需要用户名密码）
- 如果你的数据库使用 SQL Server 认证，需要设置 `DB_USER` 和 `DB_PASSWORD`
- 确保 SQL Server 正在运行并且可以访问
- 数据库表名格式：`SaitSolarLab_<sensor_id>`（例如：`SaitSolarLab_20004_TL2`）

**测试数据库连接**：
```bash
# 在命令行测试连接
sqlcmd -S localhost -E -d TestSlimDB -Q "SELECT TOP 5 * FROM SaitSolarLab_20004_TL2"
```

### 4. 更新数据

**在项目根目录**，双击运行：

```
update-electricity-data.bat
```

这会将电力数据更新到当前时间。

### 5. 启动应用

**在项目根目录**，双击运行：

```
start.bat
```

这会自动启动后端和前端服务器。

### 6. 访问应用

在浏览器中打开: **http://localhost:5174**

**登录凭据**：
- 邮箱：`super.admin@edu.sait.ca`
- 密码：`abcd1234`

---

## 本地运行（推荐）

### 为什么推荐本地运行？

✅ **优点**:

- 数据实时更新（每天运行一次 `update-electricity-data.bat`）
- 无需等待 Vercel 部署
- 开发和测试更方便
- 完全控制数据和配置

❌ **Vercel 的问题**:

- 数据不会自动更新
- 每次更新数据需要重新部署
- 部署时间较长
- 不适合频繁更新的数据

### 日常使用流程

#### 每天第一次使用

1. **更新数据**（双击运行）:

   ```
   update-electricity-data.bat
   ```

   - 这会添加从昨天到现在的新数据
   - 如果数据已是最新，会提示"Data is already up to date!"
2. **启动应用**（双击运行）:

   ```
   start.bat
   ```

   - 自动启动后端（端口 3001）
   - 自动启动前端（端口 5174）
   - 自动打开浏览器
3. **使用应用**:

   - 打开 http://localhost:5174
   - 使用测试账号登录
   - 开始使用各项功能

#### 停止应用

- 关闭两个命令行窗口
- 或在窗口中按 `Ctrl + C`

---

## Vercel部署（不推荐）

⚠️ **警告**: 不推荐使用 Vercel 部署，因为数据需要手动同步且不会自动更新。

如果确实需要部署到 Vercel，请按以下步骤操作：

### 部署前准备

1. **更新数据**（双击运行）:

   ```
   update-electricity-data.bat
   ```
2. **同步数据到后端**（双击运行）:

   ```
   sync-mock-data.bat
   ```

   - 这会将 mock-data/ 的文件复制到 ecosphere-backend/data/
   - Vercel 部署时会使用 backend/data/ 的文件
3. **提交到 Git**:

   ```bash
   git add .
   git commit -m "Update data for deployment"
   git push
   ```
4. **等待 Vercel 自动部署**

   - 登录 Vercel 查看部署状态
   - 部署完成后访问 Vercel 提供的 URL

### 更新 Vercel 上的数据

每次需要更新数据时，都要重复上述步骤：

1. 运行 `update-electricity-data.bat`
2. 运行 `sync-mock-data.bat`
3. Git commit 和 push
4. 等待 Vercel 重新部署

**这就是为什么不推荐使用 Vercel！**

---

## 测试账号

### Admin 账号（管理员）

- **邮箱**: `admin.admin@edu.sait.ca`
- **密码**: `abcd1234`
- **权限**:
  - 用户管理（添加、编辑、删除用户）
  - 查看登录日志
  - 所有 Dashboard 功能
  - 碳足迹计算器
  - 报告生成和历史

### TeamMember 账号（团队成员）

- 需要通过 Admin 账号创建
- 可以分配以下权限：
  - Electricity Dashboard
  - Water Dashboard
  - Thermal Dashboard
  - 3D Model
  - Carbon Footprint Calculator

**创建 TeamMember 的步骤**:

1. 用 Admin 账号登录
2. 进入 User Management 页面
3. 点击 "Add User" 按钮
4. 填写用户信息
5. 选择 Role 为 "Team Member"
6. 勾选需要的权限
7. 点击 "Add" 保存

---

## 功能说明

### 1. 用户管理（User Management）

**Admin 专用功能**

- **添加用户**: 创建新的 Admin 或 TeamMember
- **编辑用户**: 修改用户信息和权限
- **删除用户**: 删除不需要的用户
- **登录日志**: 查看所有用户的登录历史

### 2. 碳足迹计算器（Carbon Footprint Calculator）

**所有用户可用（需要权限）**

#### 三种视图

1. **Real-time View（实时视图）**

   - 显示今天的电力消耗和碳足迹
   - 每小时更新一次
2. **Daily View（每日视图）**

   - 选择日期范围查看
   - 显示每天的数据
3. **Long-term View（长期视图）**

   - 显示最近12个月的数据
   - 按月聚合

#### Custom Calculation（自定义计算）

- 手动输入电费账单数据
- 支持多个月份
- 临时计算，不保存到数据库
- 适合快速估算

#### 报告功能

1. **Export Report（导出报告）**

   - 生成包含所有视图的 PDF 报告
   - 自动保存报告记录
   - 包含 GBTAC 标题和生成时间
2. **Report Log（报告历史）**

   - 查看所有历史报告
   - 预览报告内容
   - 重新下载 PDF
   - 删除不需要的报告

### 3. 数据源

- **Electricity Maps API**: 实时碳强度数据（Alberta, Calgary）
- **Mock 数据**: 电力消耗数据（2024-01-01 至今）
- **自动更新**: 运行 `update-electricity-data.bat` 更新数据

---

## 故障排除

### 问题1: Node.js 未安装

**错误信息**: `'node' is not recognized as an internal or external command`

**解决方案**:

1. 下载并安装 Node.js: https://nodejs.org/
2. 重启命令行窗口
3. 验证安装: `node --version`

---

### 问题2: 端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:

**方法1: 关闭占用端口的程序**

```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程（替换 PID 为实际的进程ID）
taskkill /PID <PID> /F
```

**方法2: 修改端口**

- 编辑 `ecosphere-backend/.env`
- 修改 `PORT=3001` 为其他端口

---

### 问题3: 前端无法连接后端

**错误信息**: `Network Error` 或 `Failed to fetch`

**解决方案**:

1. 确保后端服务器正在运行（http://localhost:3001）
2. 检查 `ecosphere-frontend/.env` 中的 API URL
3. 检查防火墙设置

---

### 问题4: 依赖安装失败

**错误信息**: `npm ERR!` 或 `ENOENT`

**解决方案**:

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

### 问题5: 数据更新失败

**错误信息**: `electricity.json not found`

**解决方案**:

1. 确保在项目根目录运行 `update-electricity-data.bat`
2. 检查 `mock-data/electricity.json` 是否存在
3. 如果文件损坏，从 Git 恢复

---

### 问题6: 启动脚本无法运行

**错误信息**: 双击 `.bat` 文件后闪退

**解决方案**:

1. 右键点击 `.bat` 文件
2. 选择"以管理员身份运行"
3. 或在命令行中运行查看错误信息

---

### 问题7: 数据库连接失败

**错误信息**: `Cannot open database` 或 `Login failed`

**解决方案**:

**步骤1: 检查 SQL Server 是否运行**
```bash
# 检查 SQL Server 服务状态
sc query MSSQLSERVER
```

**步骤2: 测试数据库连接**
```bash
# 使用 Windows 认证测试
sqlcmd -S localhost -E -d TestSlimDB -Q "SELECT @@VERSION"

# 使用 SQL Server 认证测试
sqlcmd -S localhost -U your_username -P your_password -d TestSlimDB -Q "SELECT @@VERSION"
```

**步骤3: 检查数据库配置**
- 打开 `ecosphere-backend/.env`
- 确认 `DB_SERVER` 和 `DB_DATABASE` 正确
- 如果使用 SQL Server 认证，确认 `DB_USER` 和 `DB_PASSWORD` 正确

**步骤4: 检查数据库表**
```bash
# 列出所有表
sqlcmd -S localhost -E -d TestSlimDB -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"

# 检查传感器表是否存在
sqlcmd -S localhost -E -d TestSlimDB -Q "SELECT TOP 5 * FROM SaitSolarLab_20004_TL2"
```

**常见问题**:
- **数据库名称不对**: 确认你的数据库名称是 `TestSlimDB`
- **表名不对**: 传感器表格式必须是 `SaitSolarLab_<sensor_id>`
- **端口问题**: 如果 SQL Server 使用非默认端口，在 `.env` 中设置 `DB_SERVER=localhost,1434`
- **防火墙**: 确保防火墙允许 SQL Server 连接

**测试 API 端点**:
```bash
# 启动后端后，测试传感器数据 API
curl http://localhost:3001/api/db/sensor/20004_TL2?limit=5
```

---

## 📝 版本信息

- **版本**: Prototype Phase 3
- **最后更新**: 2025-12-02
- **状态**: 开发中

---

## ⚠️ 重要说明

1. **这是 Prototype 阶段**

   - 使用 Mock 数据（JSON 文件）
   - 未来会连接真实的 SQL Server 数据库
2. **数据安全**

   - 不要在生产环境使用
   - 测试账号密码仅用于演示
3. **性能优化**

   - 电力数据文件较大（~1.7 MB）
   - 首次加载可能需要几秒钟
