# 中哈政务商务服务中心官网

中国企业出海哈萨克斯坦一站式服务官网（静态单页）。

## 技术说明

- 单页静态站点：`index.html` + 编译后的 Tailwind 静态 CSS（`styles.css`），无运行时外部依赖。
- 已做国内无障碍处理：系统字体栈（不依赖 Google Fonts）、Yandex 地图（不依赖 Google Maps）、图片自托管。
- 联系表单使用 FormSubmit（`formsubmit.co`）无服务端方案，提交到 `wang13689993888@outlook.com`。

## 部署（Hostinger Node.js + Git 自动部署）

启动命令：`npm start`（即 `node server.js`，读取 `PORT` 环境变量）。
详见部署文档或 Hostinger hPanel 的 Git 自动部署配置。

## 目录

```
index.html          主页面
styles.css          编译后的 Tailwind 静态样式
server.js           静态服务器（零依赖）
img/*.svg           占位图（待替换为实拍图）
```
