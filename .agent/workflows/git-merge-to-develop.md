---
name: git-merge-to-develop
description: Git 分支合并到 develop 自动化助手。用于自动执行团队规范的 Git 合并流程，包括同步 develop 分支、合并代码、检测冲突、提醒 AI 代码审查。当用户需要：(1) 将功能分支合并到 develop 前同步最新代码，(2) 执行标准的合并流程，(3) 处理合并后的 AI 代码审查时使用。建议使用 IDE Git 工具可视化完成。
---

# Git 合并到 Develop 助手

## 核心流程

自动执行团队协作准则手册 2.4 节第 2 步的标准合并流程。

## 功能

### 1. 同步 develop 并合并

在提交 Pull Request 前，必须先同步 develop 分支并合并到当前功能分支。

**触发示例：**
```
"帮我同步 develop 分支"
"我要合并最新的 develop 代码"
"准备提交 PR，同步一下 develop"
```

**执行流程：**

0. **检测当前分支**
   ```bash
   git branch --show-current
   ```
   记录当前分支名，用于后续步骤

1. **切换到 develop 分支**
   ```bash
   git checkout develop
   ```

2. **拉取最新的 develop 分支**
   ```bash
   git pull origin develop
   ```

3. **切换回个人功能分支**
   ```bash
   git checkout <当前分支名>  # 使用步骤 0 检测到的分支名
   ```

4. **将 develop 合并到个人分支**
   ```bash
   git merge develop
   ```

5. **检测冲突**
   - 如果没有冲突：提示"合并成功，无冲突"
   - 如果有冲突：提示"检测到冲突，需要手动解决"

### 2. 冲突解决指引

当检测到冲突时，提供解决指引。

**冲突解决步骤：**

1. **使用 IDE Git 工具解决冲突**
   - 推荐使用 VSCode/Cursor 的 Git 冲突解决工具
   - 可视化对比冲突内容

2. **手动解决冲突**
   - 打开冲突文件
   - 编辑冲突标记（`<<<<<<<`、`=======`、`>>>>>>>`）
   - 保留正确的代码

3. **标记冲突已解决**
   ```bash
   git add .
   git commit -m "merge: 解决与 develop 的冲突"
   ```

4. **AI 辅助冲突解决**（可选）
   - 使用 AI 分析冲突原因
   - 参考团队协作准则手册 6.2 节
   - 在飞书项目群内与相关责任人沟通

### 3. 合并后 AI 代码审查（强制要求）

合并完成后，**必须**再次进行 AI 代码审查。

**审查时机：**
- 同步 develop 分支并解决冲突后
- 提交 Pull Request 之前

**审查流程：**

```
"请对合并后的代码进行全面审查"
"检查合并过程是否引入了问题"
```

**审查重点：**
- ✅ 合并过程中是否引入新的问题
- ✅ 冲突解决是否正确
- ✅ 代码是否仍符合最佳实践
- ✅ 是否有安全漏洞或性能问题

**审查验收标准**（参考 4.3 节）：
- [ ] AI 代码审查已完成
- [ ] 安全问题已全部修复
- [ ] 严重性能问题已修复
- [ ] 主要建议已处理
- [ ] 代码无 Lint 错误，无编译错误
- [ ] 功能完整，本地测试通过
- [ ] 已截图保存 AI 审查报告

## 完整工作流

**场景：功能开发完成，准备提交 PR**

```
第 1 步：同步 develop 分支
→ 执行合并流程（步骤 1-4）

第 2 步：解决冲突（如果有）
→ 使用 IDE Git 工具或手动解决
→ git add . && git commit -m "merge: 解决与 develop 的冲突"

第 3 步：再次进行 AI 代码审查（必须！）
→ 使用 Claude Code + 对应技术栈的 Skill
→ 确保合并过程没有引入问题

第 4 步：推送功能分支
→ git push origin feature/user-login

第 5 步：创建 Pull Request
→ 在 GitLab 创建 Merge Request
```

## 使用场景

**场景 1：无冲突合并**
```
开发者："帮我同步 develop 分支"
→ 自动执行步骤 1-4
→ 检测到无冲突
→ 提示："✅ 合并成功，无冲突。请进行 AI 代码审查后再提交 PR"
```

**场景 2：有冲突合并**
```
开发者："帮我同步 develop 分支"
→ 自动执行步骤 1-4
→ 检测到冲突
→ 提示："⚠️ 检测到冲突，请使用 IDE Git 工具解决冲突"
→ 提供冲突解决指引
```

**场景 3：冲突解决后审查**
```
开发者："冲突已解决，帮我审查合并后的代码"
→ 进行 AI 代码审查
→ 输出审查报告
→ 提示是否可以提交 PR
```

## 重要提示

1. **强烈建议使用 IDE Git 工具**
   - 所有 Git 操作建议用 IDE 自带的 Git 工具可视化完成
   - VSCode/Cursor 的 Git 功能更直观，减少错误

2. **必须再次 AI 审查**
   - 合并后的代码可能引入新问题
   - 必须确保合并过程没有破坏原有功能

3. **冲突解决需沟通**
   - 严禁未经沟通擅自修改他人负责的模块
   - 使用 AI 识别冲突归属方
   - 在飞书项目群内与相关责任人协商

4. **合并时机**
   - 功能开发完成后
   - 提交 Pull Request 之前
   - Code Review 通过后立即合并到 develop（不得延迟）

5. **相关 Skills 协作**
   - **使用本 Skill 前**：必须先使用对应技术栈的代码审查 Skill 确保代码质量
     - 后端：`nestjs-code-review`
     - React 前端：`react-code-review`
     - Vue 前端：`vue-code-review`
   - **合并后有冲突**：解决冲突后必须再次使用代码审查 Skill

## Git 命令参考

**基本合并流程：**
```bash
# 0. 检测当前分支（记录当前分支名）
git branch --show-current

# 1. 切换到 develop 分支
git checkout develop

# 2. 拉取最新的 develop 分支
git pull origin develop

# 3. 切换回个人功能分支（替换为步骤 0 检测到的分支名）
git checkout <当前分支名>

# 4. 将 develop 合并到个人分支
git merge develop

# 5. 如果有冲突，解决后提交
git add .
git commit -m "merge: 解决与 develop 的冲突"
```

**查看当前分支：**
```bash
git branch
```

**查看冲突文件：**
```bash
git status
```

**取消合并（如果需要）：**
```bash
git merge --abort
```
