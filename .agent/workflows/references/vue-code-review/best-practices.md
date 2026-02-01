# Vue 3 代码审查最佳实践

## 目录

1. [组件命名与组织](#组件命名与组织)
2. [Composition API 使用规范](#composition-api-使用规范)
3. [TypeScript 类型定义](#typescript-类型定义)
4. [模板编写规范](#模板编写规范)
5. [响应式数据处理](#响应式数据处理)
6. [性能优化](#性能优化)
7. [代码组织与复用](#代码组织与复用)
8. [安全性检查](#安全性检查)

---

## 组件命名与组织

### ✅ 推荐做法

#### 1. 组件文件命名使用 PascalCase
```
// 推荐
components/
  UserProfile.vue
  ProductList.vue
  ShoppingCart.vue
```

#### 2. 组件名称使用多个单词
```vue
<!-- 推荐 -->
<script setup>
defineOptions({
  name: 'UserProfile'
})
</script>

<!-- 避免 -->
<script setup>
defineOptions({
  name: 'User'  // 单个单词，可能与 HTML 元素冲突
})
</script>
```

#### 3. 基础组件使用统一前缀
```
components/
  BaseButton.vue
  BaseInput.vue
  BaseCard.vue
```

#### 4. 单例组件使用 The 前缀
```
components/
  TheHeader.vue
  TheSidebar.vue
  TheFooter.vue
```

### ❌ 应避免

- 使用 kebab-case 命名组件文件
- 组件名只有一个单词
- 无意义的通用名称（如 Component.vue、Item.vue）

---

## Composition API 使用规范

### ✅ 推荐做法

#### 1. 优先使用 `<script setup>` 语法
```vue
<!-- 推荐 -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<!-- 避免使用传统 setup() 函数（除非有特殊需求） -->
<script lang="ts">
import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    return {
      count,
      doubled
    }
  }
}
</script>
```

#### 2. 响应式变量定义在顶层
```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// 推荐：在顶层定义响应式数据
const count = ref(0)
const user = reactive({
  name: '',
  age: 0
})

function loadData() {
  // 避免：不要在函数内部定义响应式数据
  // const localRef = ref(0) // ❌
}
</script>
```

#### 3. 按功能组织代码，而非按选项
```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ✅ 推荐：相关逻辑放在一起
// --- 用户相关逻辑 ---
const user = ref({ name: '', email: '' })
const userDisplayName = computed(() => user.value.name || '匿名用户')
watch(() => user.value.email, (newEmail) => {
  validateEmail(newEmail)
})

// --- 商品相关逻辑 ---
const products = ref([])
const totalPrice = computed(() =>
  products.value.reduce((sum, p) => sum + p.price, 0)
)

// ❌ 避免：按类型分散逻辑
// const user = ref({})
// const products = ref([])
// const userDisplayName = computed(...)
// const totalPrice = computed(...)
// watch(() => user.value.email, ...)
</script>
```

#### 4. 使用组合式函数（Composables）提取复用逻辑
```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  return {
    count,
    doubled,
    increment,
    decrement
  }
}

// 组件中使用
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

const { count, doubled, increment } = useCounter(10)
</script>
```

### ❌ 应避免

- 在循环或条件语句中定义响应式数据
- 过度使用 Options API（在 Vue 3 项目中）
- 组件内代码超过 300 行而不拆分逻辑

---

## TypeScript 类型定义

### ✅ 推荐做法

#### 1. 使用类型化的 Props 定义
```vue
<script setup lang="ts">
// 推荐：使用接口定义 Props
interface Props {
  title: string
  count?: number
  items: Array<{ id: number; name: string }>
  status: 'pending' | 'success' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'pending'
})
</script>
```

#### 2. 类型化的 Emits 定义
```vue
<script setup lang="ts">
// 推荐：明确定义事件类型
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: { name: string; email: string }): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

// 或使用更简洁的语法
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': [data: { name: string; email: string }]
  'delete': [id: number]
}>()
</script>
```

#### 3. Ref 和 Reactive 的类型标注
```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// 推荐：明确类型
interface User {
  id: number
  name: string
  email: string
}

const user = ref<User | null>(null)
const users = ref<User[]>([])

const form = reactive<{
  username: string
  password: string
}>({
  username: '',
  password: ''
})

// 避免：any 类型
const data = ref<any>(null) // ❌
</script>
```

#### 4. Computed 的类型推断
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
  id: number
  name: string
  price: number
}

const products = ref<Product[]>([])

// 推荐：利用类型推断
const totalPrice = computed(() =>
  products.value.reduce((sum, p) => sum + p.price, 0)
) // 自动推断为 ComputedRef<number>

// 如果需要，可以显式标注
const expensiveProducts = computed<Product[]>(() =>
  products.value.filter(p => p.price > 1000)
)
</script>
```

### ❌ 应避免

- 使用 `any` 类型
- Props 不定义类型
- 使用 `String`、`Number`、`Boolean`（应使用小写的原始类型）
- 忽略事件参数的类型定义

---

## 模板编写规范

### ✅ 推荐做法

#### 1. 使用正确的指令简写
```vue
<!-- 推荐 -->
<template>
  <div :class="className" @click="handleClick">
    <input v-model="text" />
  </div>
</template>

<!-- 避免：混用完整和简写形式 -->
<template>
  <div v-bind:class="className" @click="handleClick">  <!-- 混用 -->
    <input v-model="text" />
  </div>
</template>
```

#### 2. 多个特性分行书写
```vue
<!-- 推荐：特性超过 2-3 个时分行 -->
<template>
  <MyComponent
    :title="pageTitle"
    :items="productList"
    :loading="isLoading"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<!-- 避免：所有特性挤在一行 -->
<template>
  <MyComponent :title="pageTitle" :items="productList" :loading="isLoading" @update="handleUpdate" />
</template>
```

#### 3. 组件标签闭合规范
```vue
<template>
  <!-- 推荐：无内容时自闭合 -->
  <BaseInput />

  <!-- 有内容时使用完整标签 -->
  <BaseCard>
    <p>内容</p>
  </BaseCard>

  <!-- 避免：HTML 元素自闭合 -->
  <div />  <!-- ❌ -->
  <img />  <!-- HTML 元素可以 -->
</template>
```

#### 4. v-for 必须使用 key
```vue
<template>
  <!-- 推荐 -->
  <div
    v-for="item in items"
    :key="item.id"
  >
    {{ item.name }}
  </div>

  <!-- 避免：使用 index 作为 key（列表会重排时） -->
  <div
    v-for="(item, index) in items"
    :key="index"
  >
    {{ item.name }}
  </div>
</template>
```

#### 5. 避免 v-if 与 v-for 同时使用
```vue
<!-- 推荐：使用 computed 过滤 -->
<script setup lang="ts">
import { computed } from 'vue'

const activeUsers = computed(() =>
  users.value.filter(u => u.isActive)
)
</script>

<template>
  <div
    v-for="user in activeUsers"
    :key="user.id"
  >
    {{ user.name }}
  </div>
</template>

<!-- 避免：v-if 和 v-for 在同一元素上 -->
<template>
  <div
    v-for="user in users"
    v-if="user.isActive"
    :key="user.id"
  >
    {{ user.name }}
  </div>
</template>
```

#### 6. 使用语义化的模板表达式
```vue
<!-- 推荐：复杂逻辑使用 computed -->
<script setup lang="ts">
const fullName = computed(() =>
  `${user.value.firstName} ${user.value.lastName}`
)
</script>

<template>
  <div>{{ fullName }}</div>
</template>

<!-- 避免：模板中写复杂表达式 -->
<template>
  <div>{{ user.firstName + ' ' + user.lastName }}</div>
</template>
```

### ❌ 应避免

- v-for 不使用 key
- v-if 和 v-for 在同一元素上
- 模板表达式超过三元运算符的复杂度
- 使用 index 作为动态列表的 key

---

## 响应式数据处理

### ✅ 推荐做法

#### 1. 正确使用 ref 和 reactive
```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// 推荐：基本类型使用 ref
const count = ref(0)
const name = ref('')
const isActive = ref(false)

// 推荐：对象使用 reactive（保持响应性）
const user = reactive({
  name: '',
  age: 0,
  profile: {
    bio: ''
  }
})

// 访问值
console.log(count.value)  // ref 需要 .value
console.log(user.name)    // reactive 直接访问

// 避免：对象使用 ref 后解构
const state = ref({ count: 0, name: '' })
const { count, name } = state.value  // ❌ 失去响应性
</script>
```

#### 2. 使用 toRefs 保持响应性
```vue
<script setup lang="ts">
import { reactive, toRefs } from 'vue'

const state = reactive({
  count: 0,
  name: ''
})

// 推荐：使用 toRefs 解构
const { count, name } = toRefs(state)

// 现在可以安全使用
console.log(count.value)  // 保持响应性
</script>
```

#### 3. 非响应式数据使用 markRaw
```vue
<script setup lang="ts">
import { ref, markRaw } from 'vue'

// 推荐：大对象或第三方库实例标记为非响应式
const map = ref(markRaw(new Map()))
const chart = ref(markRaw(new ECharts()))

// 避免：不必要的响应式包装
const hugeData = ref(largeObject)  // ❌ 性能浪费
</script>
```

#### 4. 使用 shallowRef 和 shallowReactive
```vue
<script setup lang="ts">
import { shallowRef, shallowReactive } from 'vue'

// 推荐：只需要根级别响应的大对象
const state = shallowReactive({
  count: 0,
  nested: {
    // 这层不会是响应式的
    value: 1
  }
})

// 大数组或频繁替换的数据
const largeList = shallowRef([])
</script>
```

### ❌ 应避免

- 解构 reactive 对象而不使用 toRefs
- 直接修改 props（应使用 emit）
- 对不需要响应式的大型数据使用 reactive/ref
- 在模板中使用 `.value`（Vue 会自动解包）

---

## 性能优化

### ✅ 推荐做法

#### 1. 使用 v-once 渲染静态内容
```vue
<template>
  <!-- 推荐：静态内容使用 v-once -->
  <div v-once>
    <h1>{{ staticTitle }}</h1>
    <p>此内容永不改变</p>
  </div>
</template>
```

#### 2. 使用 v-memo 优化列表渲染
```vue
<template>
  <!-- 推荐：大列表使用 v-memo -->
  <div
    v-for="item in longList"
    :key="item.id"
    v-memo="[item.id, item.selected]"
  >
    {{ item.name }}
  </div>
</template>
```

#### 3. 组件懒加载
```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 推荐：异步组件
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)

// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue')
  }
]
</script>
```

#### 4. 使用 KeepAlive 缓存组件
```vue
<template>
  <!-- 推荐：缓存频繁切换的组件 -->
  <KeepAlive :max="10">
    <component :is="currentView" />
  </KeepAlive>

  <!-- 配合路由使用 -->
  <RouterView v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
```

#### 5. 虚拟列表处理大数据
```vue
<script setup lang="ts">
// 推荐：使用虚拟滚动库（如 vue-virtual-scroller）
import { RecycleScroller } from 'vue-virtual-scroller'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
})))
</script>

<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div>{{ item.name }}</div>
    </template>
  </RecycleScroller>
</template>
```

#### 6. 计算属性 vs 方法
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)

// 推荐：纯计算使用 computed（有缓存）
const doubled = computed(() => count.value * 2)

// 方法：需要每次执行时使用
function getRandomValue() {
  return Math.random() * count.value
}
</script>

<template>
  <!-- computed 会缓存 -->
  <div>{{ doubled }}</div>

  <!-- 方法每次重新计算 -->
  <div>{{ getRandomValue() }}</div>
</template>
```

#### 7. 防抖和节流
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

const searchText = ref('')

// 推荐：搜索使用防抖
const debouncedSearch = useDebounceFn((value: string) => {
  // 执行搜索
}, 300)

// 滚动事件使用节流
const throttledScroll = useThrottleFn(() => {
  // 处理滚动
}, 100)
</script>
```

### ❌ 应避免

- 在 computed 中执行副作用（API 调用、DOM 操作）
- 不必要的深度监听
- 不加限制地渲染大列表
- 过度使用 watch（优先使用 computed）

---

## 代码组织与复用

### ✅ 推荐做法

#### 1. 组合式函数命名约定
```typescript
// composables/useUserData.ts
// 推荐：use 开头，清晰的功能描述
export function useUserData() {
  const user = ref(null)

  async function fetchUser(id: number) {
    // ...
  }

  return {
    user,
    fetchUser
  }
}

// composables/useLocalStorage.ts
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // ...
}
```

#### 2. 目录结构组织
```
src/
├── components/
│   ├── base/           # 基础组件
│   ├── common/         # 通用业务组件
│   └── features/       # 功能组件
├── composables/        # 组合式函数
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
├── stores/             # Pinia stores
└── views/              # 页面组件
```

#### 3. Props 验证
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  status: 'success' | 'error' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'success'
})

// 运行时验证（可选）
defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0
  }
})
</script>
```

#### 4. 事件命名规范
```vue
<script setup lang="ts">
// 推荐：使用 kebab-case
const emit = defineEmits<{
  'update-user': [user: User]
  'delete-item': [id: number]
  'form-submit': [data: FormData]
}>()

// 避免：驼峰命名在 HTML 中不友好
// 'updateUser', 'deleteItem' ❌
</script>

<template>
  <!-- 使用时 -->
  <MyComponent
    @update-user="handleUpdate"
    @delete-item="handleDelete"
  />
</template>
```

### ❌ 应避免

- 组件超过 500 行代码
- 深层组件嵌套（超过 3 层考虑重构）
- 重复的逻辑不提取为 composable
- 无意义的组件拆分（过度工程化）

---

## 安全性检查

### ✅ 推荐做法

#### 1. 避免 XSS 攻击
```vue
<template>
  <!-- 推荐：默认会转义 -->
  <div>{{ userInput }}</div>

  <!-- 危险：v-html 要谨慎使用 -->
  <div v-html="sanitizedHtml"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const userInput = ref('')

// 如必须使用 v-html，先消毒
const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(rawHtml.value)
)
</script>
```

#### 2. 环境变量安全
```typescript
// 推荐：使用环境变量，不在代码中硬编码
const API_URL = import.meta.env.VITE_API_URL

// 避免：敏感信息硬编码
const API_KEY = 'sk-1234567890abcdef'  // ❌
```

#### 3. API 请求验证
```typescript
// 推荐：验证响应数据
async function fetchUser(id: number) {
  try {
    const response = await api.get(`/users/${id}`)

    // 验证数据结构
    if (!response.data || typeof response.data.id !== 'number') {
      throw new Error('Invalid user data')
    }

    return response.data
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error
  }
}
```

#### 4. 输入验证
```vue
<script setup lang="ts">
import { z } from 'zod'

// 推荐：使用验证库
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  username: z.string().min(3).max(20)
})

function validateUser(data: unknown) {
  return userSchema.safeParse(data)
}
</script>
```

### ❌ 应避免

- 未经消毒直接使用 v-html
- 在客户端代码中存储敏感信息
- 信任来自用户或外部 API 的数据
- 使用 eval() 或 Function() 构造器

---

## 常见反模式

### ❌ 不要修改 Props
```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// 错误
props.count++  // ❌

// 正确：使用本地状态
const localCount = ref(props.count)
localCount.value++

// 或通过 emit 通知父组件
const emit = defineEmits<{ 'update:count': [value: number] }>()
emit('update:count', props.count + 1)
</script>
```

### ❌ 不要在 computed 中修改状态
```vue
<script setup lang="ts">
const count = ref(0)

// 错误：computed 应该是纯函数
const doubled = computed(() => {
  count.value++  // ❌ 副作用
  return count.value * 2
})

// 正确：使用 watch 处理副作用
const doubled = computed(() => count.value * 2)

watch(count, (newValue) => {
  // 在这里处理副作用
})
</script>
```

### ❌ 不要在 watch 中递归触发
```vue
<script setup lang="ts">
const count = ref(0)

// 错误：可能导致无限循环
watch(count, () => {
  count.value++  // ❌
})

// 正确：确保有退出条件
watch(count, (newValue) => {
  if (newValue < 10) {
    count.value++
  }
})
</script>
```
