/** Tailwind 编译配置（与 index.html 内联的 tailwind.config 保持一致） */
module.exports = {
  corePlugins: { preflight: true },
  content: ['./index.html'],
  // JS 里动态添加的 Tailwind 工具类（form 状态提示的 mt-4），源码扫描不到，需白名单
  safelist: ['mt-4'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'PingFang SC', 'Microsoft YaHei',
          'Inter', 'Noto Sans SC', 'sans-serif',
        ],
      },
    },
  },
};
