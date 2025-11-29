# API架构文档

**项目**: EcoSphere  
**创建日期**: 2025-11-28  
**架构模式**: RESTful API + 前后端分离

---

## 📋 目录

1. [架构概览](#架构概览)
2. [API调用链](#api调用链)
3. [前端Service层](#前端service层)
4. [后端API层](#后端api层)
5. [完整示例](#完整示例)
6. [API端点列表](#api端点列表)

---

## 架构概览

### 完整的数据流

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Frontend)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. UI Component (React)                                    │
│     └── UserManagementPage.jsx                              │
│         ↓                                                    │
│  2. Service Layer (API调用)                                 │
│     └── UserService.js                                      │
│         ↓ HTTP Request                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    HTTP/JSON
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                         后端 (Backend)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  3. Routes (API端点定义)                                     │
│     └── userRoutes.js                                       │
│         ↓                                                    │
│  4. Controller (请求处理)                                    │
│     └── userController.js                                   │
│         ↓                                                    │
│  5. Service (业务逻辑)                                       │
│     └── userService.js                                      │
│         ↓                                                    │
│  6. Model (数据模型)                                         │
│     └── User.js                                             │
│         ↓                                                    │
│  7. Data Storage                                            │
│     └── users.json (Mock数据)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API调用链

### 示例：创建用户

#### 1. 前端UI组件调用

**文件**: `ecosphere-frontend/src/pages/UserManagementPage.jsx`

```javascript
// 用户点击"添加用户"按钮
const handleSubmit = async () => {
  try {
    // 调用Service层
    const newUser = await UserService.addUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'TeamMember',
      permissions: ['electricity']
    });
    
    console.log('User created:', newUser);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};
```

#### 2. 前端Service层

**文件**: `ecosphere-frontend/src/services/UserService.js`

```javascript
class UserService {
  async addUser(userData) {
    // 发送HTTP POST请求到后端
    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to add user');
    }
    
    return await response.json();
  }
}
```

#### 3. 后端Route层

**文件**: `ecosphere-backend/routes/userRoutes.js`

```javascript
const router = express.Router();

// 定义API端点
router.post('/users', UserController.createUser);
```

#### 4. 后端Controller层

**文件**: `ecosphere-backend/controllers/userController.js`

```javascript
class UserController {
  static async createUser(req, res) {
    try {
      // 获取请求数据
      const { firstName, lastName, email, password, role, permissions } = req.body;
      
      // 验证
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // 调用Service层
      const newUser = await UserService.createUser({
        firstName,
        lastName,
        email,
        password,
        role,
        permissions
      });
      
      // 返回结果
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
}
```

#### 5. 后端Service层

**文件**: `ecosphere-backend/services/userService.js`

```javascript
class UserService {
  static async createUser(userData) {
    // 读取现有数据
    const data = await FileHelper.readJSON('users.json');
    
    // 检查邮箱是否已存在
    const existingUser = data.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    // 创建新用户
    const newUser = {
      id: data.nextId,
      ...userData
    };
    
    data.users.push(newUser);
    data.nextId++;
    
    // 保存到文件
    await FileHelper.writeJSON('users.json', data);
    
    return newUser;
  }
}
```

#### 6. 后端Model层

**文件**: `ecosphere-backend/models/User.js`

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

  // 业务逻辑方法
  createUser(id, firstName, lastName, email, password, role) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
  }
}
```

---

## 前端Service层

### 位置

```
ecosphere-frontend/src/services/
├── UserService.js           # 用户相关API调用
├── ElectricityService.js    # 电力数据API调用
└── ElectricityMapsService.js # 外部API调用
```

### UserService.js - 完整API

```javascript
const API_BASE_URL = 'http://localhost:3001/api';

class UserService {
  // GET /api/users
  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    return await response.json();
  }

  // GET /api/users/:id
  async getUserById(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return await response.json();
  }

  // POST /api/users
  async addUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  // PUT /api/users/:id
  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  // DELETE /api/users/:id
  async deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  // POST /api/auth/login
  async authenticate(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  }
}
```

---

## 后端API层

### 位置

```
ecosphere-backend/
├── routes/              # API端点定义
│   ├── userRoutes.js
│   └── electricityRoutes.js
├── controllers/         # 请求处理
│   ├── userController.js
│   └── electricityController.js
├── services/            # 业务逻辑
│   ├── userService.js
│   └── electricityService.js
└── models/              # 数据模型
    ├── User.js
    ├── Admin.js
    └── ...
```

### 层次职责

| 层 | 文件 | 职责 |
|---|------|------|
| **Routes** | `userRoutes.js` | 定义API端点，路由到Controller |
| **Controller** | `userController.js` | 处理HTTP请求/响应，验证输入 |
| **Service** | `userService.js` | 业务逻辑，数据操作 |
| **Model** | `User.js` | 数据模型，业务规则 |

---

## 完整示例

### 用户登录流程

#### 前端代码

```javascript
// 1. UI组件
// LoginPage.jsx
const handleLogin = async () => {
  try {
    const user = await UserService.authenticate(email, password);
    if (user) {
      // 登录成功
      navigate('/dashboard');
    }
  } catch (error) {
    setError('Login failed');
  }
};

// 2. Service层
// UserService.js
async authenticate(email, password) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
}
```

#### 后端代码

```javascript
// 3. Route层
// userRoutes.js
router.post('/auth/login', UserController.login);

// 4. Controller层
// userController.js
static async login(req, res) {
  const { email, password } = req.body;
  const user = await UserService.authenticate(email, password);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

// 5. Service层
// userService.js
static async authenticate(email, password) {
  const data = await FileHelper.readJSON('users.json');
  const user = data.users.find(u => 
    u.email === email && u.password === password
  );
  return user;
}
```

---

## API端点列表

### 用户管理API

| 方法 | 端点 | 描述 | 前端调用 |
|------|------|------|----------|
| GET | `/api/users` | 获取所有用户 | `UserService.getAllUsers()` |
| GET | `/api/users/:id` | 获取单个用户 | `UserService.getUserById(id)` |
| POST | `/api/users` | 创建新用户 | `UserService.addUser(data)` |
| PUT | `/api/users/:id` | 更新用户 | `UserService.updateUser(id, data)` |
| DELETE | `/api/users/:id` | 删除用户 | `UserService.deleteUser(id)` |
| POST | `/api/auth/login` | 用户登录 | `UserService.authenticate(email, pwd)` |

### 电力数据API

| 方法 | 端点 | 描述 | 前端调用 |
|------|------|------|----------|
| GET | `/api/electricity/realtime` | 获取实时数据 | `ElectricityService.getRealTimeData()` |
| GET | `/api/electricity/daily?days=10` | 获取每日数据 | `ElectricityService.getDailyData(10)` |
| GET | `/api/electricity/longterm` | 获取长期数据 | `ElectricityService.getLongTermData()` |
| GET | `/api/electricity/range?startDate=...&endDate=...` | 获取范围数据 | `ElectricityService.getDataByRange(start, end)` |
| GET | `/api/electricity/metadata` | 获取元数据 | `ElectricityService.getMetadata()` |

---

## 配置

### 前端配置

**文件**: `ecosphere-frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 后端配置

**文件**: `ecosphere-backend/.env`

```env
PORT=3001
NODE_ENV=development
```

### 启动命令

```bash
# 后端
cd ecosphere-backend
npm start
# 运行在 http://localhost:3001

# 前端
cd ecosphere-frontend
npm run dev
# 运行在 http://localhost:5174
```

---

## 关键要点

### ✅ API的作用

1. **前后端通信桥梁**
   - 前端通过HTTP请求调用后端
   - 后端通过JSON响应返回数据

2. **职责分离**
   - 前端：UI展示 + API调用
   - 后端：业务逻辑 + 数据操作

3. **安全性**
   - 所有验证在后端
   - 前端无法绕过后端检查

### 📍 API在哪里

**前端API调用**：
- 位置：`ecosphere-frontend/src/services/`
- 作用：封装HTTP请求

**后端API端点**：
- 位置：`ecosphere-backend/routes/`
- 作用：定义API路由

**后端API处理**：
- 位置：`ecosphere-backend/controllers/`
- 作用：处理请求和响应

---

## 总结

```
前端                    API                     后端
Component  →  Service  →  HTTP  →  Route  →  Controller  →  Service  →  Model  →  Data
   ↑                                                                                  ↓
   └──────────────────────  JSON Response  ←──────────────────────────────────────────┘
```

**API就是前后端之间的桥梁！**

- ✅ 前端通过Service调用API
- ✅ 后端通过Route定义API
- ✅ Controller处理API请求
- ✅ Service执行业务逻辑
- ✅ Model封装数据模型

