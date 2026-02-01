---
name: wechat-isv-auth-media
description: 微信第三方平台 (ISV) 授权与媒体库管理。涵盖 Component Access Token 维护、公众号扫码授权、永久素材上传等。当需要处理微信授权失效、图片上传失败或配置新的第三方应用时使用。
---

# 微信 ISV 授权与媒体管理工作流

## 1. 第三方平台令牌维护 (Component Token)

**执行流程：**
1. **推送接收**: 监听微信每 10 分钟推送的 `component_verify_ticket`。
2. **生成令牌**: 使用 `ticket`, `app_id`, `app_secret` 获取 `component_access_token`。
3. **缓存策略**: 存入 Redis 或数据库以供分布式使用。

---

## 2. 代公众号授权 (Authorizer)

**执行步骤：**
1. **接口**: `/api/wechat/auth/url` 生成预授权链接。
2. **扫码**: 管理员扫码授权。
3. **存储**: 后端保存 `authorizer_refresh_token` 到 `Tenant` 实体的 `wechatConfig` 字段。

---

## 3. 图片与图文素材管理

**核心任务：**
- **永久素材**: `POST /cgi-bin/material/add_material`。
- **图文草稿**: `POST /cgi-bin/draft/add`。
- **图片域名转换**: 在前端提交前，调用后端接口将 `blob:` 链接转换为微信托管的永久链接。

**检查清单 (Checklist):**
- [ ] 后端是否启用了 `wechat-image-proxy` 处理防盗链图片？
- [ ] 授权权限集是否包含“图文消息管理”和“素材管理”？
- [ ] **安全**: 是否针对 `Authorizer Access Token` 实施了过期自动续期逻辑？

---

## 相关 Skills 协作
- **API 规范**: 参考 `.agent/workflows/nestjs-code-review.md` 中的 HTTP 请求最佳实践。
- **前端渲染**: 参考 `.agent/workflows/vue-code-review.md` 中的 `v-html` 安全净化。

## 参考文献 (References)
- **文档**: `docs/微信授权续期解决方案.md`
- **文档**: `docs/微信公众号配置指南.md`
- **代码**: `content-backend/src/wechat/`
- **官方**: [微信开放平台 - 第三方平台文档](https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/product/introduction.html)
