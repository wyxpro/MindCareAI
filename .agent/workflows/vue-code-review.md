---
name: vue-code-review
description: Vue 3 前端代码审查与架构设计专家。包含完整的最佳实践知识库,当用户明确要求进行代码审查(code review)、代码检查、代码质量分析,或需要进行架构设计、代码架构规划、系统设计时使用此技能,且对象是 Vue 3 相关的前端代码(.vue 文件、TypeScript/JavaScript 文件、组件代码等)。支持全面的代码质量检查和架构设计指导,包括组件设计、Composition API 使用、TypeScript 类型定义、性能优化、安全性等方面。
---

# Vue 3 前端代码审查

## 概述

本技能为 Vue 3 前端开发者提供专业的代码审查服务,基于 Vue 3 官方风格指南和社区最佳实践,帮助识别代码中的问题、改进代码质量、提升应用性能。

## 何时使用此技能

- 用户明确要求对 Vue 3 代码进行审查、代码评审或代码检查
- 用户要求检查代码质量、性能优化或安全性问题
- 用户询问代码是否符合 Vue 3 最佳实践
- 用户请求组件设计或重构建议
- 用户需要进行 Vue 3 项目架构设计或规划
- 用户询问如何设计组件结构、状态管理架构或组合式函数架构
- 用户需要基于最佳实践的 Vue 3 前端架构设计建议和指导

## 架构设计时的 .gitignore 配置

当进行项目架构设计时，应为用户生成符合 Vue 3 技术栈的 .gitignore 文件：

```gitignore
node_modules/
dist/
.output/
.nuxt/
.env
.env.*
*.log
coverage/
.idea/
.vscode/
*.swp
.DS_Store
```

## 代码审查流程

当用户请求进行 Vue 代码审查时,按照以下步骤执行:

### 第 1 步:理解审查范围

首先确认用户需要审查的代码范围:

- **单个组件**: 审查特定的 .vue 文件
- **多个文件**: 审查一组相关的组件或模块
- **整个项目**: 对项目进行全面审查
- **特定方面**: 只关注性能、安全性或特定最佳实践

询问用户提供代码或文件路径。如果用户已经提供了代码片段或文件,直接进入下一步。

### 第 2 步:加载最佳实践参考

在开始审查之前,加载完整的最佳实践文档:

```bash
# 读取最佳实践参考文档
cat references/vue-code-review/best-practices.md
```

这份文档包含了以下审查维度的详细标准:
- 组件命名与组织
- Composition API 使用规范
- TypeScript 类型定义
- 模板编写规范
- 响应式数据处理
- 性能优化
- 代码组织与复用
- 安全性检查

### 第 3 步:执行系统化审查

按照以下维度对代码进行审查,每个维度都参考 `references/vue-code-review/best-practices.md` 中的详细标准:

#### 0. 代码编译和 Lint 检查

在开始详细审查之前,首先执行编译和 lint 检查:

**检查项:**
- [ ] 运行 `npm run build` 或 `yarn build` 检查编译是否通过
- [ ] 是否有 TypeScript 类型错误?
- [ ] 是否有 Vue 模板编译错误?
- [ ] 是否有未使用的导入或变量?
- [ ] 运行 `npm run lint` 或 `yarn lint` 检查代码规范
- [ ] 是否有 ESLint 错误或警告?
- [ ] 代码格式是否符合 Prettier 配置?

**检查流程**:
1. 在项目根目录运行构建命令
2. 记录所有编译错误和警告
3. 运行 lint 命令
4. 记录所有 lint 问题
5. 在审查报告中优先列出这些问题

**示例命令**:
```bash
# 检查编译
npm run build
# 或
vite build

# 检查 lint
npm run lint
# 或
eslint . --ext .vue,.js,.ts
```

#### 1. 组件结构审查

**检查项:**
- [ ] 组件文件命名是否使用 PascalCase
- [ ] 组件名称是否使用多个单词(避免与 HTML 元素冲突)
- [ ] 基础组件、单例组件是否使用正确的前缀
- [ ] 组件代码长度是否合理(建议 < 500 行)

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup>
defineOptions({
  name: 'User'  // 单个单词
})
</script>

<!-- ✅ 建议改进 -->
<script setup>
defineOptions({
  name: 'UserProfile'  // 使用多个单词
})
</script>
```

#### 2. Composition API 使用审查

**检查项:**
- [ ] 是否使用 `<script setup>` 语法(Vue 3 推荐)
- [ ] 响应式变量是否定义在顶层(不在循环或条件中)
- [ ] 代码是否按功能组织而非按选项类型
- [ ] 复杂逻辑是否提取为组合式函数(composables)
- [ ] 是否避免在 setup 中返回不必要的数据

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script lang="ts">
export default {
  setup() {
    const count = ref(0)
    const doubled = ref(0)

    watch(count, (val) => {
      doubled.value = val * 2  // 应使用 computed
    })

    return { count, doubled }
  }
}
</script>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

#### 3. TypeScript 类型定义审查

**检查项:**
- [ ] Props 是否有明确的类型定义
- [ ] Emits 是否有类型标注
- [ ] ref/reactive 是否有适当的类型标注
- [ ] 是否避免使用 any 类型
- [ ] 是否使用正确的原始类型(string 而非 String)

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup lang="ts">
const props = defineProps(['title', 'count'])  // 无类型
const emit = defineEmits(['update'])  // 无类型

const data = ref<any>(null)  // 使用 any
</script>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

interface User {
  id: number
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  'update': [user: User]
}>()

const data = ref<User | null>(null)
</script>
```

#### 4. 模板编写审查

**检查项:**
- [ ] v-for 是否正确使用 key
- [ ] 是否避免 v-if 和 v-for 在同一元素上
- [ ] 指令是否使用统一的简写形式(: @ #)
- [ ] 多个属性是否合理分行
- [ ] 组件标签闭合是否规范
- [ ] 模板表达式是否简洁(复杂逻辑应使用 computed)

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<template>
  <div v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.firstName + ' ' + user.lastName }}
  </div>
</template>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
const activeUsers = computed(() =>
  users.value.filter(u => u.isActive)
)

const getFullName = (user: User) =>
  `${user.firstName} ${user.lastName}`
</script>

<template>
  <div
    v-for="user in activeUsers"
    :key="user.id"
  >
    {{ getFullName(user) }}
  </div>
</template>
```

#### 5. 响应式数据处理审查

**检查项:**
- [ ] ref 和 reactive 是否使用恰当
- [ ] 是否正确处理响应性丢失(使用 toRefs)
- [ ] 大对象是否使用 markRaw 或 shallowRef
- [ ] 是否避免直接修改 props
- [ ] computed 是否保持纯函数(无副作用)

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// 直接修改 props
function increment() {
  props.count++  // ❌
}

// 响应性丢失
const state = reactive({ x: 1, y: 2 })
const { x, y } = state  // ❌ 丢失响应性
</script>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
import { toRefs } from 'vue'

const props = defineProps<{ count: number }>()
const emit = defineEmits<{ 'update:count': [value: number] }>()

// 通过 emit 更新
function increment() {
  emit('update:count', props.count + 1)
}

// 保持响应性
const state = reactive({ x: 1, y: 2 })
const { x, y } = toRefs(state)  // ✅
</script>
```

#### 6. 性能优化审查

**检查项:**
- [ ] 大列表是否使用虚拟滚动
- [ ] 静态内容是否使用 v-once
- [ ] 重复渲染的列表项是否使用 v-memo
- [ ] 大组件是否使用懒加载
- [ ] 是否合理使用 KeepAlive 缓存组件
- [ ] 计算属性 vs 方法的使用是否合理
- [ ] 频繁触发的事件是否使用防抖/节流
- [ ] 是否避免不必要的深度监听

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup lang="ts">
// 10000 条数据直接渲染
const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
})))

// 每次都重新计算
function getTotal() {
  return items.value.reduce((sum, item) => sum + item.price, 0)
}
</script>

<template>
  <div v-for="item in items" :key="item.id">
    {{ item.name }} - Total: {{ getTotal() }}
  </div>
</template>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  price: Math.random() * 100
})))

// 使用 computed 缓存
const total = computed(() =>
  items.value.reduce((sum, item) => sum + item.price, 0)
)
</script>

<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div>{{ item.name }} - Total: {{ total }}</div>
    </template>
  </RecycleScroller>
</template>
```

#### 7. 代码组织与复用审查

**检查项:**
- [ ] 组合式函数是否使用 use 前缀命名
- [ ] 重复逻辑是否提取为 composable
- [ ] Props 是否有验证
- [ ] 事件命名是否使用 kebab-case
- [ ] 目录结构是否清晰合理
- [ ] 组件是否过度拆分或不足拆分

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup lang="ts">
// 重复的逻辑未提取
const user1 = ref(null)
async function fetchUser1(id: number) {
  const res = await api.get(`/users/${id}`)
  user1.value = res.data
}

const user2 = ref(null)
async function fetchUser2(id: number) {
  const res = await api.get(`/users/${id}`)
  user2.value = res.data
}
</script>

<!-- ✅ 建议改进 -->
// composables/useUser.ts
export function useUser() {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchUser(id: number) {
    loading.value = true
    try {
      const res = await api.get(`/users/${id}`)
      user.value = res.data
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { user, loading, error, fetchUser }
}

// 组件中使用
<script setup lang="ts">
const { user: user1, fetchUser: fetchUser1 } = useUser()
const { user: user2, fetchUser: fetchUser2 } = useUser()
</script>
```

#### 8. 安全性审查

**检查项:**
- [ ] 是否谨慎使用 v-html(需要消毒处理)
- [ ] 敏感信息是否使用环境变量
- [ ] API 响应数据是否进行验证
- [ ] 用户输入是否进行验证
- [ ] 是否避免使用 eval 或 Function 构造器

**示例问题与建议:**

```vue
<!-- ❌ 问题代码 -->
<script setup lang="ts">
const API_KEY = 'sk-1234567890'  // 硬编码敏感信息

const userHtml = ref('')

// 直接使用用户输入的 HTML
function setContent(html: string) {
  userHtml.value = html  // XSS 风险
}
</script>

<template>
  <div v-html="userHtml"></div>  <!-- 未消毒 -->
</template>

<!-- ✅ 建议改进 -->
<script setup lang="ts">
import DOMPurify from 'dompurify'

// 使用环境变量
const API_KEY = import.meta.env.VITE_API_KEY

const userHtml = ref('')

// 消毒处理
const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(userHtml.value)
)
</script>

<template>
  <div v-html="sanitizedHtml"></div>
</template>
```

### 第 4 步:生成审查报告

完成审查后,生成结构化的审查报告,包含:

#### 报告格式

```markdown
# Vue 3 代码审查报告

## 📋 审查摘要

- **审查时间**: [时间]
- **审查范围**: [文件名或范围]
- **总体评分**: ⭐⭐⭐⭐☆ (4/5)
- **发现问题数**: X 个(严重 Y 个,一般 Z 个,建议 W 个)

## 🚨 严重问题 (必须修复)

### 1. [问题标题]

**位置**: `ComponentName.vue:行号`

**问题描述**:
[详细说明问题]

**当前代码**:
```vue
[有问题的代码片段]
```

**建议修改**:
```vue
[修改后的代码]
```

**影响**: [说明不修复可能导致的问题]

## ⚠️ 一般问题 (建议修复)

[同上格式]

## 💡 优化建议 (可选)

[同上格式]

## ✅ 做得好的地方

- [列举代码中的优点]

## 📚 相关资源

- [Vue 3 官方文档链接]
- [相关最佳实践参考]
```

### 第 5 步:提供改进建议

在报告之后,提供可执行的改进建议:

1. **优先级排序**: 按严重程度对问题排序
2. **具体步骤**: 提供修复问题的具体步骤
3. **代码示例**: 给出完整的修改后代码
4. **解释原因**: 说明为什么要这样修改
5. **最佳实践**: 链接到相关的最佳实践文档

## 审查检查清单

使用以下检查清单确保审查的全面性:

### 编译和 Lint
- [ ] 代码编译成功
- [ ] 无 TypeScript 类型错误
- [ ] 无 Vue 模板错误
- [ ] ESLint 检查通过
- [ ] 代码格式规范

### 组件层面
- [ ] 组件命名规范
- [ ] 文件组织结构
- [ ] 组件职责单一
- [ ] 代码长度合理

### 代码质量
- [ ] TypeScript 类型完整
- [ ] 无 any 类型滥用
- [ ] Props/Emits 定义清晰
- [ ] 变量命名语义化

### Vue 3 特性
- [ ] 使用 Composition API
- [ ] 响应式数据处理正确
- [ ] 生命周期钩子使用恰当
- [ ] 组合式函数复用逻辑

### 性能
- [ ] 列表渲染优化
- [ ] 组件懒加载
- [ ] 计算属性缓存
- [ ] 事件防抖节流

### 安全性
- [ ] XSS 防护
- [ ] 输入验证
- [ ] 环境变量使用
- [ ] API 数据验证

### 可维护性
- [ ] 代码注释充分
- [ ] 逻辑清晰易懂
- [ ] 易于测试
- [ ] 符合团队规范

### .gitignore 配置检查
- [ ] 是否存在 .gitignore 文件
- [ ] 是否包含 `node_modules/`
- [ ] 是否包含 `dist/`
- [ ] 是否包含 `.nuxt/`（Nuxt 项目）
- [ ] 是否包含 `.env` 及其变体
- [ ] 是否包含 IDE 配置（`.idea/`, `.vscode/`）
- [ ] 是否包含 `coverage/`

**如果修改了 .gitignore**，需清理 git 缓存：
```bash
git rm -r --cached .
git add .
git commit -m "chore: update .gitignore"
```

## 特殊场景处理

### 审查遗留代码(Options API)

如果用户提供的是 Options API 代码,除了常规审查外,还应:

1. **评估迁移可行性**: 说明是否建议迁移到 Composition API
2. **提供迁移示例**: 展示如何将 Options API 重写为 Composition API
3. **渐进式改进**: 如果不适合完全迁移,提供局部改进建议

### 审查第三方组件库使用

检查:
- 组件库版本是否与 Vue 3 兼容
- 是否按需引入(tree-shaking)
- 自定义主题是否规范
- 是否过度依赖组件库

### 审查状态管理(Pinia/Vuex)

检查:
- Store 定义是否清晰
- 是否避免过度使用全局状态
- Actions/Mutations 是否合理
- 是否正确使用 TypeScript 类型

## 使用示例

### 示例 1: 单组件审查

**用户**: "帮我审查一下这个用户列表组件的代码"

**执行步骤**:
1. 运行 `npm run build` 和 `npm run lint` 检查基础代码质量
2. 读取 `references/vue-code-review/best-practices.md`
3. 分析组件代码
4. 按所有维度系统化审查(包括编译和 lint)
5. 生成详细报告,包含编译和 lint 结果
6. 提供具体改进建议

### 示例 2: 性能专项审查

**用户**: "这个页面加载很慢,帮我做性能审查"

**执行步骤**:
1. 运行构建命令检查构建产物大小
2. 重点关注性能优化维度
3. 检查列表渲染、组件加载、计算属性等
4. 使用性能分析工具建议
5. 提供性能优化方案

### 示例 3: 安全性审查

**用户**: "审查一下这段代码有没有安全问题"

**执行步骤**:
1. 运行 lint 检查基础安全问题
2. 重点检查 XSS、注入等安全问题
3. 审查用户输入处理
4. 检查敏感信息泄露
5. 提供安全加固建议

## 参考文档

完整的最佳实践标准存储在 `references/vue-code-review/best-practices.md` 中,包含:

- 组件命名与组织详细规范
- Composition API 使用的各种场景
- TypeScript 类型定义完整指南
- 模板编写的所有规则
- 响应式数据处理技巧
- 性能优化具体方法
- 代码复用模式
- 安全性检查要点
- 常见反模式

在进行代码审查时,**务必先读取此文档**作为审查依据。

## 输出要求

1. **使用中文**: 所有审查报告和建议使用中文
2. **具体明确**: 指出具体的问题位置和修改方案
3. **提供代码**: 给出完整的改进代码示例
4. **解释原因**: 说明为什么需要改进
5. **优先级**: 区分严重问题、一般问题和优化建议
6. **可执行**: 建议应该具体可执行,不是泛泛而谈
