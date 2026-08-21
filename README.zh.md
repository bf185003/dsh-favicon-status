# @deepseek-ai/dsh-client-ui-favicon-status

[English](README.md) | 中文

浏览器页签状态指示器：根据会话列表投影绘制文档 favicon，让被其他页签遮挡的 dsh web 页签依然能看出任务是执行完毕、等待用户确认，还是正在执行。

## 安装

```sh
dsh plugin --profile web add git+https://github.com/bf185003/dsh-favicon-status.git
```

安装后需要重启 `dsh web`：新增插件会改变 profile 的 bundle roster，运行中的服务器只在重启后才会加载。本插件仅存在于浏览器端；node 半区只是为了插件出现在 Loader 树中。

## 行为

favicon 会变成一段分段圆环，各状态色块按会话数量比例分配，沿用 GUI 的标准状态语义（即侧边栏 StateDot 的调色板）：蓝色表示正在执行的会话，琥珀色表示等待用户（审批 / 计划评审 / 提问），绿色表示已结束的会话。文档原始 favicon 图形（鲸鱼）在加载完成后绘制在圆环中心孔内，让页签保持自己的身份标识。只要有会话在执行，圆环就绕一个固定的尾部缺口（至少 30°）顺时针旋转——即使只有单色圆环，缺口这个锚点也能让 16px 下的旋转清晰可见；没有会话执行时圆环是完整的圆——缺口只为表现旋转而存在，静止的完成或等待圆环不需要锚点。多状态混合时圆环按比例分段（例如一个完成、一个执行中就是一半绿一半蓝），分段顺序固定为"执行中、待确认、已完成"，保证混合状态可读而非错乱。当没有任何会话处于这三种状态时，恢复原始 favicon。

每个会话的状态优先级与侧边栏一致：待确认交互优先于运行中，运行中优先于"已完成"状态。绿色覆盖两类：侧边栏的"后台完成"提醒（未选中且未打开、却在后台执行完毕的会话，打开即清除），以及监视器刚观测到的"运行→空闲"过渡——即使产品因用户正在观看而从未置位提醒，页签也会在配置的 `doneVisibleMs` 窗口内（默认 30 秒）显示绿色，随后回落。窗口对每次观测到的过渡都会置位，因此打开已结束的会话（会清除产品提醒）不会让绿色提前消失。子代理目录行也会进入列表投影并携带各自的运行位，因此委派出去的工作同样会让页签变色。

动画基于时间（`Date.now()` 对旋转周期取模）：每个定时器 tick 都按墙钟时间对应的角度重绘，所以后台页签被节流时，每个被允许的 tick 仍会推进旋转。定时器在至少有一个会话运行或有完成窗口未关闭时保持运行，两者皆无即停；fiber 卸载时恢复原始 favicon（HMR 安全）。圆环绘制在 64px canvas 上，浏览器缩放到 16px 页签栏时缺口与色块边界依然清晰。

颜色、旋转周期与完成可见窗口都是经过校验的 [Config](src/client/index.ts) 字段，可在部署的 cordis.yml 中覆盖。

## 开发

源码位于 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) monorepo 的 `packages/client/ui-favicon-status`；本仓库发布的是在那里构建好的包，因此 `lib/` 内含构建产物与浏览器 bundle。重建时在 monorepo 中运行 `pnpm --filter @deepseek-ai/dsh-client-ui-favicon-status run bundle`，并把生成的 `lib/` 同步回这里。

## Model Experience

None, as this package paints a browser chrome element from the sessions list projection and touches no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **后台页签节流会令旋转变粗**。浏览器会节流隐藏页签里的 `setInterval`（Chrome 降为 1Hz，约 5 分钟链式定时器后进入每分钟一次的深度节流），所以页签在后台时旋转按步进而非平滑推进；基于时间的相位保证了方向与节奏正确。浏览器不支持动画 SVG favicon，这也是动画必须由 JS 驱动的原因。
- **指示器反映的是会话列表摘要而非逐任务细节**。它聚合的是侧边栏圆点使用的同一组 `running` / `pendingInteraction` / `completed` 字段，外加监视器本地的"刚完成"过渡窗口；后台任务行与工作流阶段不会单独呈现。
- **完成窗口是页签独有的提醒**。`doneVisibleMs` 会在"运行→空闲"过渡后短暂显示绿色，即使侧边栏从未置位其后台完成提醒（用户正在观看）；侧边栏自身保持原有语义。
- **仅处理一个 favicon link**。监视器替换文档中第一个 `rel~="icon"` 链接（缺失时创建一个），卸载时恢复；多图标清单与 `apple-touch-icon` 不在处理范围内。
