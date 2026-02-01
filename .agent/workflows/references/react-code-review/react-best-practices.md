# React 最佳实践代码审查指南

## 组件结构与组织

### 组件设计
- **单一职责原则**: 每个组件应该只有一个明确的目的
- **组合优于继承**: 优先使用组件组合而不是类继承
- **避免 Props 钻取**: 避免通过多层传递 props(使用 Context API 或状态管理)
- **组件大小**: 保持组件专注且小巧(通常在 200-300 行以内)

### 文件组织
```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      Button.module.css
      index.ts
```

### 命名约定
- **组件**: 大驼峰命名法(例如: `UserProfile`, `NavigationBar`)
- **文件**: 与组件名匹配(`UserProfile.tsx`)
- **Props 接口**: `组件名Props`(例如: `UserProfileProps`)
- **Hooks**: 小驼峰命名,使用 `use` 前缀(例如: `useUserData`)
- **事件处理器**: `handle` 前缀(例如: `handleClick`, `handleSubmit`)
- **布尔值 props**: 使用 `is`、`has`、`should` 前缀(例如: `isLoading`, `hasError`, `shouldShow`)

## TypeScript 最佳实践

### 类型安全
- **始终明确定义 prop 类型**,使用 interface 或 type
- **优先使用 interface** 定义组件 props(更适合扩展且错误信息更清晰)
- **使用 type** 定义联合类型、交叉类型和工具类型
- **避免 `any`**: 如果类型确实未知,使用 `unknown`

```typescript
// 好的做法
interface UserCardProps {
  name: string;
  age: number;
  email?: string; // 可选属性
  onEdit: (id: string) => void;
}

// 应避免
const UserCard = (props: any) => { ... }
```

### 类型注解
- **函数组件**: 明确标注 props 类型
- **State**: 当初始值明显时,让 TypeScript 推断类型
- **事件处理器**: 使用具体的事件类型(`React.MouseEvent`, `React.ChangeEvent`)
- **Children**: 使用 `React.ReactNode` 作为 children prop 的类型

```typescript
// 好的做法
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

// 更好的 state 类型定义
const [user, setUser] = useState<User | null>(null);
```

### 泛型组件
- 为可复用、类型安全的组件使用泛型
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <>{items.map(renderItem)}</>;
}
```

## Hooks 最佳实践

### Hooks 规则
- **在顶层调用 hooks**: 永远不要在条件、循环或嵌套函数中调用
- **只在 React 函数中调用 hooks**: 仅在组件或自定义 hooks 中使用
- **自定义 hooks 命名**: 始终以 `use` 前缀开头

### useState
- **函数式更新**: 当新状态依赖于之前的状态时使用
- **状态初始化**: 对昂贵的计算使用惰性初始化
- **状态结构**: 将相关状态放在一起,分离不相关的状态

```typescript
// 好的做法 - 函数式更新
setCount(prevCount => prevCount + 1);

// 好的做法 - 惰性初始化
const [data, setData] = useState(() => computeExpensiveValue());

// 不好的做法 - 直接依赖当前状态
setCount(count + 1); // 在异步上下文中可能过时
```

### useEffect
- **依赖数组**: 始终包含 effect 内部使用的所有依赖项
- **清理函数**: 为订阅、定时器、事件监听器返回清理函数
- **避免对象/数组依赖**: 可能导致无限循环,使用单独的属性
- **空依赖数组 `[]`**: 仅用于挂载/卸载时的 effects
- **无依赖数组**: effect 在每次渲染后运行(很少需要)

```typescript
// 好的做法
useEffect(() => {
  const timer = setTimeout(() => {
    console.log(count);
  }, 1000);

  return () => clearTimeout(timer); // 清理
}, [count]); // 包含所有依赖项

// 不好的做法 - 缺少依赖项
useEffect(() => {
  console.log(count);
}, []); // count 不在依赖数组中

// 不好的做法 - 对象依赖(导致无限循环)
useEffect(() => {
  fetchData(config);
}, [config]); // config 每次渲染都会重新创建
```

### useMemo 和 useCallback
- **不要过度使用**: 过早优化会损害可读性
- **useMemo**: 用于昂贵的计算,而非简单操作
- **useCallback**: 当传递回调给被记忆化的子组件时使用
- **包含所有依赖项**: 与 useEffect 相同的规则

```typescript
// 好的 useMemo 使用 - 昂贵的计算
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// 好的 useCallback 使用 - 传递给被记忆化的子组件
const handleClick = useCallback((id: string) => {
  updateItem(id);
}, [updateItem]);

// 不好的做法 - 不必要的记忆化
const sum = useMemo(() => a + b, [a, b]); // 太简单,不需要记忆化
```

### 自定义 Hooks
- **提取可复用逻辑**: 在组件间共享状态逻辑
- **返回值**: 返回数组用于位置解构(如 useState)或对象用于命名解构
- **处理清理**: 在自定义 hooks 的 useEffect 中包含清理逻辑
- **类型参数**: 需要时使 hooks 泛型化

```typescript
// 好的自定义 hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

## 性能优化

### 记忆化
- **React.memo**: 包装频繁接收相同 props 的组件
- **记忆化子组件**: 仅当重渲染昂贵且频繁时使用
- **Props 比较**: 必要时提供自定义比较函数

```typescript
// 好的做法
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // 昂贵的渲染逻辑
  return <div>{/* ... */}</div>;
});

// 使用自定义比较
const MemoizedComponent = React.memo(
  Component,
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id;
  }
);
```

### 代码分割
- **懒加载**: 使用 `React.lazy` 进行基于路由的代码分割
- **Suspense**: 用 Suspense 边界包装懒加载组件
- **错误边界**: 优雅地处理加载错误

```typescript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 列表优化
- **Keys**: 始终使用稳定、唯一的 key(避免使用索引)
- **虚拟化**: 对长列表使用虚拟化(react-window, react-virtualized)

```typescript
// 好的做法
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}

// 不好的做法
{users.map((user, index) => (
  <UserCard key={index} user={user} />
))}
```

## 安全最佳实践

### XSS 防护
- **JSX 自动转义**: 信任 React 对动态内容的默认转义
- **dangerouslySetInnerHTML**: 除非绝对必要,否则避免使用
- **清理**: 在使用 dangerouslySetInnerHTML 之前,始终用 DOMPurify 清理 HTML
- **URL 验证**: 在使用前验证和清理 URL

```typescript
// 不好的做法 - XSS 漏洞
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// 好的做法 - 清理后的 HTML
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />

// 更好的做法 - 完全避免使用 dangerouslySetInnerHTML
<div>{userInput}</div> // React 自动转义
```

### 输入验证
- **验证所有用户输入**: 客户端和服务器端都要验证
- **清理数据**: 在存储或显示之前
- **使用表单库**: 利用 React Hook Form 等库配合验证模式

### 安全依赖
- **定期更新**: 保持依赖项更新
- **审计包**: 定期运行 `npm audit`
- **最小化依赖**: 仅包含必要的包

## 状态管理

### 何时使用不同的解决方案
- **本地状态(useState)**: 组件特定的状态
- **Context API**: 避免应用范围状态的 props 钻取(主题、认证)
- **状态管理库**: 复杂的状态逻辑(Redux、Zustand、Jotai)

### Context 最佳实践
- **拆分 contexts**: 按关注点分离 contexts 以避免不必要的重渲染
- **记忆化 context 值**: 防止不必要的重渲染
- **配合 useMemo 使用**: 优化 context 值的创建

```typescript
// 好的做法 - 记忆化的 context 值
const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## 错误处理

### 错误边界
- **创建错误边界**: 捕获渲染错误
- **战略性放置**: 在组件树的适当层级放置
- **降级 UI**: 提供有意义的错误消息

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 异步错误处理
- **Try-catch**: 包装异步操作
- **加载状态**: 显示加载指示器
- **错误状态**: 向用户显示错误消息

## 代码质量

### Prop 类型
- **必需 vs 可选**: 明确标注必需的 props
- **默认 props**: 使用默认参数值
- **解构**: 解构 props 以提高清晰度

```typescript
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

function Button({
  label,
  variant = 'primary',
  onClick
}: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### 条件渲染
- **逻辑与(&&)**: 用于显示/隐藏元素
- **三元运算符**: 用于在两个元素之间选择
- **提前返回**: 用于复杂条件

```typescript
// 好的做法
{isLoading && <Spinner />}
{user ? <Profile user={user} /> : <Login />}

// 不好的做法 - 假值可能导致 bug
{count && <div>{count} 项</div>} // count 为 0 时不显示

// 更好的做法
{count > 0 && <div>{count} 项</div>}
```

### 事件处理器
- **阻止默认行为**: 需要时使用
- **停止传播**: 需要时使用
- **内联 vs 定义**: 复杂逻辑使用定义的处理器

```typescript
// 好的做法 - 简单内联
<button onClick={() => setOpen(true)}>打开</button>

// 好的做法 - 复杂逻辑在处理器中
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // 复杂的验证和提交逻辑
};
```

### 测试
- **单元测试**: 隔离测试组件
- **集成测试**: 测试组件交互
- **可访问性测试**: 确保组件可访问
- **覆盖率**: 追求有意义的测试覆盖率(不仅仅是数字)

## 可访问性(a11y)

### 语义化 HTML
- **使用语义化元素**: `<button>`、`<nav>`、`<main>` 等
- **ARIA 标签**: 当语义化 HTML 不够时添加
- **键盘导航**: 确保所有交互元素可通过键盘访问

```typescript
// 好的做法
<button onClick={handleClick}>提交</button>

// 不好的做法
<div onClick={handleClick}>提交</div>

// 需要时使用 ARIA
<button aria-label="关闭对话框" onClick={onClose}>
  <CloseIcon />
</button>
```

### 表单
- **标签**: 将标签与输入关联
- **错误消息**: 提供清晰、可访问的错误消息
- **焦点管理**: 适当管理焦点

## 现代 React 模式(2024-2025)

### 服务器组件(React 18+)
- 理解服务器组件和客户端组件的区别
- 默认使用服务器组件,需要时使用客户端组件
- 使用 'use client' 指令标记客户端组件

### 并发特性
- **useTransition**: 用于非紧急状态更新
- **useDeferredValue**: 用于延迟昂贵的计算
- **Suspense**: 用于异步数据获取和代码分割

### 复合组件
- 构建灵活、可组合的组件 API
- 在复合组件之间共享隐式状态

```typescript
// 复合组件模式示例
<Tabs>
  <TabList>
    <Tab>标签 1</Tab>
    <Tab>标签 2</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>内容 1</TabPanel>
    <TabPanel>内容 2</TabPanel>
  </TabPanels>
</Tabs>
```
