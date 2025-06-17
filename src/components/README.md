# NextJS + UniApp WebView 数据通信演示

## 📱 UniApp WebView 数据通信

### 在uni-app x中发送数据

#### 方法一：使用 `receiveAppData` 函数

```typescript
// uni-app x 端代码
const webviewContext = uni.createWebviewContext('wv1', this);

const appData = {
  userId: '12345',
  userName: '张三',
  message: 'Hello from UniApp!',
  timestamp: Date.now(),
};

const jsonData = JSON.stringify(appData);
webviewContext.evalJS(`
  window.receiveAppData(${jsonData});
`);
```

#### 方法二：使用 `handleAppMessage` 函数

```typescript
webviewContext.evalJS(`
  if (typeof window.handleAppMessage === 'function') {
    window.handleAppMessage(${jsonData});
  }
`);
```

#### 方法三：设置全局变量并触发事件

```typescript
webviewContext.evalJS(`
  window.userInfo = ${jsonData};
  window.dispatchEvent(new CustomEvent('appDataUpdated', {
    detail: { key: 'userInfo', value: ${jsonData} }
  }));
`);
```

### 在Next.js中接收数据

#### 使用 `useUniAppData` Hook

```tsx
import { useUniAppData, type UniAppData } from '@/hooks/useUniAppData';

const MyComponent = () => {
  const { checkUniAppEnvironment, getEnvironmentInfo } = useUniAppData((data: UniAppData) => {
    console.log('收到数据:', data);
    // 处理接收到的数据
  });

  return <div>{/* 你的组件内容 */}</div>;
};
```

#### 使用 `UniMessage` 组件

```tsx
import UniMessage from '@/app/components/UniMessage';

const App = () => {
  const handleDataReceived = (data: UniAppData) => {
    // 处理数据
    console.log('接收到数据:', data);
  };

  return (
    <div>
      {/* 你的应用内容 */}

      {/* 添加UniMessage组件 */}
      <UniMessage onDataReceived={handleDataReceived} showDebugInfo={process.env.NODE_ENV === 'development'} />
    </div>
  );
};
```

## 🔧 功能特性

- ✅ **多种接收方式**：支持 `receiveAppData`、`handleAppMessage` 和自定义事件
- ✅ **类型安全**：完整的TypeScript类型定义
- ✅ **错误处理**：安全的数据解析和错误捕获
- ✅ **环境检测**：自动检测是否在uni-app环境中运行
- ✅ **临时数据处理**：处理组件挂载前接收到的数据
- ✅ **调试支持**：开发环境下的调试面板和日志

## 📝 API 文档

### `useUniAppData(callback?)`

自定义Hook，用于处理uni-app数据接收。

**参数：**

- `callback?: (data: UniAppData) => void` - 接收数据时的回调函数

**返回值：**

```typescript
{
  registerReceiveFunction: (functionName?: string) => void;
  triggerReceive: (data: UniAppData, functionName?: string) => void;
  checkUniAppEnvironment: () => boolean;
  getEnvironmentInfo: () => object;
  processTempData: () => void;
}
```

### `UniMessage` 组件

用于接收和显示uni-app数据的组件。

**Props：**

```typescript
interface UniMessageProps {
  onDataReceived?: (data: UniAppData) => void;
  showDebugInfo?: boolean;
}
```

## 🛠️ 技术栈

- **Next.js 14+** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Ant Design** - UI组件库

## 📋 注意事项

1. **数据序列化**：复杂对象需要使用 `JSON.stringify()` 转换为字符串
2. **特殊字符处理**：如果数据中包含引号或特殊字符，需要适当转义
3. **数据大小限制**：避免传递过大的数据，可能影响性能
4. **错误处理**：建议在webview端添加try-catch来处理可能的解析错误

## 🚀 部署

### 构建项目

```bash
npm run build
# 或者
bun run build
```

### 启动生产服务器

```bash
npm start
# 或者
bun start
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License
