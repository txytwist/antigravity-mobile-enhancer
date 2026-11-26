# Antigravity Mobile Enhancer

V0.1 仅验证 Quantumult X（QX）能否修改 iPhone Chrome 中
`https://antigravity.google.com/remote` 的静态 HTML 标题。
测试成功标记：`QX 测试成功`。尚未进行 iPhone 实机验证。

## 当前范围

脚本只处理精确 URL 的 GET、`text/html` 响应，替换普通 HTML head 内第一个完整 title 的文本。
如请求带有 `Sec-Fetch-Dest`，只接受 `document`；该头缺失时依据精确 URL、GET 和 HTML 类型筛选。
查询串、尾斜杠、子路径、其他域名、非 HTML、无标题、缺失正文和异常均原样放行。
重复执行结果稳定；成功时仅返回 `{body: ...}`，其余情况返回空对象放行，不返回或修改响应头。

不做完整汉化和布局优化，不注入网页脚本或外部代码，不修改 API、请求、认证、CSP、安全头或任务内容。
诊断版只向 QX 本地日志写入以下三项布尔状态，不持久存储到偏好设置、不发起网络请求、不上传数据。
这是普通静态 HTML 的最小扫描，并非完整 HTML 解析器；不保证适配畸形或复杂嵌套标记。

## 诊断版：只记录三项状态

刷新目标页面后，在 QX 的脚本日志中查找这一行（实际值取决于响应）：

```json
{"scriptTriggered":true,"htmlReceived":true,"titleReplaced":true}
```

- `scriptTriggered`：出现日志即说明脚本已触发；执行中的脚本只能报告 true。没有日志也可能是日志未显示或写入失败，不能据此确认未触发。
- `htmlReceived`：收到 `Content-Type: text/html` 且正文是非空字符串。只依据响应类型和正文存在性判断，不记录它们的具体值，也不保证浏览器实际渲染成功。
- `titleReplaced`：本次确实修改标题并生成了要交给 QX 的响应正文。无 title、不满足目标条件、标题已经是测试标记或处理异常时为 false。它不表示 Chrome 已显示新标题。

每次执行仅输出一条 JSON，只有这三个布尔字段；不输出 URL、请求/响应头、正文、原标题、任务、账号或错误详情。日志失败不妨碍响应完成。不使用通知或上传服务。

已有测试规则时，唯一需要更改的是将规则末尾脚本地址换成本页新的固定 Raw 地址；不要同时保留两条测试规则。诊断结束可禁用该规则，停止新增状态日志；旧版固定地址仍指向无日志版。

## 固定版本测试脚本

本分支脚本提交：`f4bd20d531bbfe3b138e442fde6a50bedb7594bd`。

[打开固定提交的 Raw 测试脚本](https://raw.githubusercontent.com/txytwist/antigravity-mobile-enhancer/f4bd20d531bbfe3b138e442fde6a50bedb7594bd/scripts/antigravity-test.js)

使用提交 SHA 固定版本，不使用随 main 或分支更新而变化的链接。
Raw 地址只是向 QX 提供脚本，不是在网页内加载外部代码。

## QX 配置参考

以下是局部配置参考，**不是完整个人配置**，不要覆盖现有配置或提交个人配置。
规则类型必须是 `script-response-body`（响应正文脚本）。
在现有 `[rewrite_local]` 段添加这一条：

```ini
[rewrite_local]
^https://antigravity\.google\.com/remote$ url script-response-body https://raw.githubusercontent.com/txytwist/antigravity-mobile-enhancer/f4bd20d531bbfe3b138e442fde6a50bedb7594bd/scripts/antigravity-test.js
```

若当前 QX 版本要求本地脚本，先将同一固定 Raw 文件保存为 QX 的
`On My iPhone - Quantumult X - Scripts/antigravity-test.js`
或 `iCloud Drive - Quantumult X - Scripts/antigravity-test.js`，规则最后一项换成 `antigravity-test.js`。
不要改成请求脚本或响应头脚本；不要扩大 URL 正则匹配范围。

MITM（由 QX 解密 HTTPS）仅配置目标主机：

```ini
[mitm]
hostname = antigravity.google.com
```

上面仅说明本测试的主机范围；在已有配置中只核对目标项，保持其他配置不动。
不得添加 `*.google.com`、其他 Google 域名或关闭证书验证。
已配置目标域名且页面可打开，只能说明可访问，不能证明已解密或改写。
必须确认 QX 的响应重写与目标 MITM 已启用、相关 CA 已在设备中受信任；具体界面随版本变化，未实测按钮名称。

**MITM 可以接触该主机的敏感明文，包括登录相关数据和任务内容。**
即使脚本只修改 `/remote`，主机级 MITM 仍覆盖该主机的其他 HTTPS 路径。
脚本不记录、不上传这些数据；不扩大解密范围，不把 CA、p12、口令、账号、Token、个人配置或抓包日志提交到公开仓库。
测试结束移除本次目标主机。

## 实机验收（尚未执行）

1. 在 iPhone Chrome 打开精确目标地址并刷新，在标签页列表查看标题是否出现 `QX 测试成功`。
2. 确认登录状态与日常任务操作正常；不要将敏感内容或日志公开。
3. 禁用本条重写规则，再刷新，确认标题和页面行为恢复。

Chrome 的缓存、页面运行时更新标题、QX 版本和网页结构都可能影响可见结果。
静态标题不可观察时，先报告“未观察到”，不要判定注入成功，也不要绕过 CSP、追加运行时脚本或扩大 MITM。
本地 Node 测试不证明设备已经执行脚本。

## 回滚

禁用或删除本条 `[rewrite_local]` 规则，移除本次 MITM 的 `antigravity.google.com` 项，刷新目标页面。
如下载过本地脚本，可删除该脚本。不要删除其他规则或他人用途的证书；仅为本次创建的证书可在测试结束后移除。
若禁用规则后未恢复，先报告阻塞，不增加权限或放宽匹配。

## 开发验证

无需 npm 包，使用 Node 内置测试模块：

```sh
node --test tests/antigravity-test.test.cjs
node --check scripts/antigravity-test.js
git diff --check
```

9 项自动测试覆盖目标 HTML 修改、其他 URL/路径、非文档请求、非 HTML、缺失正文/标题、异常放行、重复执行稳定，以及标题以外的内容与响应头保持不变；另验证诊断字段精确为三个布尔值、异常不泄露数据和日志失败仍完成响应。
实机解密、标题可见性、登录、任务及禁用规则恢复均未测。

## 官方 API 核对与交接

2026-11-26 已读取 QX 官方仓库：

- [sample-rewrite-with-script.js](https://github.com/crossutility/Quantumult-X/blob/master/sample-rewrite-with-script.js)：确认 `console.log` 写入 QX 本地日志、`$request.url`、`$request.method`、`$response.headers`、`$response.body`、`$done` 和 `{body: modifiedBody}` 返回格式。
- [sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)：确认 `[rewrite_local]`、`url script-response-body`、本地 Scripts 目录、`[mitm] hostname` 格式和主机级解密边界。

规范见 AGENTS.md；项目范围见 PROJECT_CONTEXT.md；当前验证、未测项与唯一步骤见 NEXT_TASK.md。
本项目根许可尚未由所有者选定；本次不添加或更改根许可。
`.agents/skills/` 的 caveman 和 ponytail 保留固定版本 manifest 及各自第三方许可，不代表上游背书。
