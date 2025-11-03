# 辉仔 AI 聊天助手

一个专为 UniApp WebView 环境设计的智能 AI 聊天应用，支持语音输入和实时对话功能。

## 🚀 项目特性

- **AI 智能对话**: 基于流式 API 的实时 AI 对话体验
- **语音输入**: 支持长按录音和语音识别功能
- **UniApp 集成**: 专为 UniApp WebView 环境优化
- **响应式设计**: 适配移动端和桌面端
- **实时流式响应**: 支持思考过程和推理内容展示
- **现代化 UI**: 基于 Tailwind CSS 和 Radix UI 组件

## 🛠️ 技术栈

### 核心框架
- **Next.js 15.2.3** - React 全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript

### UI 组件
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Radix UI** - 无障碍的 UI 组件库
- **Ant Design X** - AI 聊天组件
- **Lucide React** - 图标库

### 功能特性
- **语音识别** - 浏览器原生 Web Speech API
- **流式处理** - 实时数据流处理
- **UniApp 通信** - 与原生应用数据交互
- **环境检测** - 自动检测运行环境

## 📦 安装和运行

### 环境要求
- Node.js 18+ 
- Bun 或 npm/yarn

### 安装依赖
```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 环境配置
创建 `.env.local` 文件并配置以下环境变量：

```env
# 服务端环境变量
NODE_ENV=development
NEXT_API_BASE_URL=your_api_base_url

# 客户端环境变量
NEXT_PUBLIC_API_CHAT_URL=your_chat_api_url
```

### 开发模式
```bash
# 使用 Bun
bun dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

### 构建和部署
```bash
# 构建项目
bun run build

# 启动生产服务器
bun run start

# 预览构建结果
bun run preview
```

## 🎯 主要功能

### 1. AI 聊天对话
- 支持实时流式响应
- 显示 AI 思考过程
- 支持多轮对话
- 消息历史管理

### 2. 语音输入
- 长按录音功能
- 实时语音识别
- 移动端优化
- 录音状态可视化

### 3. UniApp 集成
- WebView 数据通信
- 环境自动检测
- 原生功能调用
- 权限管理

### 4. 响应式设计
- 移动端优先设计
- 桌面端适配
- 触摸手势支持
- 屏幕方向适配

## 📱 使用说明

### 基本对话
1. 在输入框中输入问题
2. 按回车键或点击发送按钮
3. 等待 AI 响应

### 语音输入
1. 点击麦克风图标切换到语音模式
2. 长按"按住说话"按钮开始录音
3. 松开按钮结束录音并发送

### UniApp 环境
- 应用会自动检测是否在 UniApp 环境中运行
- 支持与原生应用的数据交互
- 自动处理权限请求

## 🔧 开发指南

### 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── components/         # 页面组件
│   │   ├── AIChatContent/  # AI 聊天组件
│   │   └── WebViewMessage.tsx
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 首页
├── components/            # 共享组件
│   └── ui/               # UI 组件库
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
├── styles/               # 样式文件
└── types/                # 类型定义
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 使用 Tailwind CSS 进行样式编写
- 组件采用函数式编程

### 调试功能
在开发模式下，应用会显示 UniApp 调试信息面板，帮助开发者调试数据通信。

## 🚀 部署

### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 其他平台
- **Netlify**: 支持静态部署
- **Docker**: 支持容器化部署
- **自建服务器**: 支持 Node.js 环境

## 📄 许可证

本项目采用私有许可证，仅供内部使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📞 支持

如有问题，请联系开发团队。
