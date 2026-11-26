# 项目上下文

## 目标与用户
为 iPhone Chrome 的 Antigravity remote 网页做最小可回滚验证。
本轮只验证 Quantumult X（QX）是否能修改目标 HTTPS 文档响应的静态 HTML title。
成功标记是 `QX 测试成功`；并不表示完整汉化或布局优化已经实现。

## 仓库与基线
- 业务仓库：https://github.com/txytwist/antigravity-mobile-enhancer
- 默认分支：main；初始化基线：`f1eb4425c14061389be332bf1d7f633221795b1b`。
- 框架来源：txytwist/ai-dev-handoff 的 main，固定提交 `afb5ac592d6590feee1981889765f1198214d500`。
- 实际读取框架 AGENTS.md、START_HERE.md、CHATGPT_SETUP.md、templates/AGENTS.md、templates/PROJECT_CONTEXT.md、scripts/init_repo_skills.py、docs/cloud-skills.md 及两份完整 SKILL.md。
- NEXT_TASK 初始模板实际在初始化脚本内，不存在 templates/NEXT_TASK.md。
- 已运行框架初始化脚本；AGENTS.md 与模板逐字节一致，完整复制 .agents/skills/（含 manifest 和第三方许可）。

## 权威记录
每次接手读取 AGENTS.md、NEXT_TASK.md、当前 Issue/PR 及评论，再读取本文件和相关代码。
批准任务：https://github.com/txytwist/antigravity-mobile-enhancer/issues/1 。
日常状态仅维护 NEXT_TASK.md，详细证据留在 PR。

## 范围与约束
- 只修改精确 `https://antigravity.google.com/remote` 的 GET HTML 文档静态标题；保守排除查询串、尾斜杠、子路径和其他域名。
- 如存在 Sec-Fetch-Dest，必须为 document；缺失时按精确 URL + GET + text/html 判定候选文档。
- 不修改请求、API、认证、任务内容、CSP 或安全头，不注入外部代码。
- 不收集、不记录、不上传正文或个人信息；不提交账号、Token、个人配置和日志。
- 用户于本对话追加批准诊断版：仅允许 QX 本地 console.log 记录 scriptTriggered、htmlReceived、titleReplaced 三个布尔状态；不记录 URL、请求/响应头、正文、原标题或错误详情。
- MITM 仅目标主机，不扩大解密范围；测试结束移除目标主机。
- 只在独立功能分支工作。合并、部署和发布由用户单独决定。
- 不新增或替换根项目许可。第三方许可只适用于各自 Skill 文件。

## Skill 决定与证据
用户未禁用 caveman 或 ponytail；本会话完整读取并按文件指令执行。
caveman 用于简洁中文沟通；ponytail 用于限定改动范围、采用无依赖实现并完成适用测试。
原生发现已通过当前机器 codex-cli 0.172.0-alpha.2 的 app-server skills/list 验证，两个均 enabled=true、scope=repo，无解析错误；不等于本会话原生模型路由已验证。
网页新会话自动激活、原生模型路由和跨会话状态持久化未测；没有安装上游 hooks、代理、遥测或全局配置。

## 验证与限制
`node --test tests/antigravity-test.test.cjs`、`node --check scripts/antigravity-test.js`、`git diff --check`。
Skill 按 manifest SHA256 校验。静态 HTML 扫描不是完整浏览器解析器；未识别的结构可能原样放行。
实机标题可见性、实际解密/响应改写、登录、任务及禁用规则恢复均需用户验证。
静态标题不可见时先报告，不添加运行时注入或绕过 CSP。

## 当前状态
以 NEXT_TASK.md 为准。任务单已有 APPROVED 授权；用户接受后才记录 ACCEPTED。
