# 魔搭创空间部署 Dockerfile
# 使用轻量级的 Nginx Alpine 镜像
FROM nginx:1.25-alpine

# 设置维护者信息
LABEL maintainer="MindCareAI Team"
LABEL description="MindCareAI - 智能心理检测与疗愈助手"

# 删除 Nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 复制预构建的前端资源到 Nginx 根目录
COPY dist /usr/share/nginx/html

# 设置正确的文件权限
RUN chmod -R 755 /usr/share/nginx/html

# 暴露 7860 端口 (魔搭创空间要求)
EXPOSE 7860

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:7860/ || exit 1

# 启动 Nginx (前台运行)
CMD ["nginx", "-g", "daemon off;"]
