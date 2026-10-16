# Accessibility and data export

## E.3: accessibility

The app uses native links, buttons, labels, tables, selects and disclosure controls.
There are no custom keyboard widgets, media players, CAPTCHA, drag-only actions,
automatic redirects or timed forms. The document language is English.

| WCAG 2.1 A/AA area | Implementation |
| --- | --- |
| 1.1.1, 1.3.1 | Decorative symbols are hidden from assistive technology. Tables have captions, row/column headers and sort state. The map has a labelled region, destination buttons and equivalent text directions. |
| 1.3.2, 1.3.5 | DOM reading order follows the visible page. Account fields have appropriate autocomplete values. |
| 1.4.1, 1.4.3, 1.4.11 | Error and selection messages are not colour-only. Text, form borders and focus indicators use contrasting colours; palette contrast has regression tests. |
| 1.4.4, 1.4.10, 1.4.12 | Flexible layouts support enlarged text and spacing. Long navigation links wrap. Data tables scroll in their own labelled, focusable region instead of widening the whole page. |
| 2.1.1, 2.1.2, 2.5.1 | Controls work with the keyboard. A list is an alternative to map markers; route selection never requires a dragging gesture. No keyboard trap is introduced. |
| 2.4.1–2.4.7 | Skip link, page-specific document titles, visible focus, descriptive control names, main landmark, headings, main navigation and a footer site map. SPA navigation moves focus to main content. |
| 3.1.1, 3.2.1–3.2.4 | English language, consistent navigation and explicit submit buttons; selecting or focusing a field does not unexpectedly navigate away. |
| 3.3.1–3.3.3, 4.1.2, 4.1.3 | Required fields and instructions, descriptive validation messages, associated feedback, focus on form feedback, and status/alert announcements. Errors preserve user input. |

The decorative map is supplemented by the full destination list and road-route
steps. OpenStreetMap/OSRM are external services, not a substitute for textual
controls. Generated PDF accessibility varies by the browser's print-to-PDF engine;
the HTML report and CSV remain available alternatives.

### Checks

1. Run `npm test` for palette contrast and export regression tests.
2. Run `npm run dev`, open `/tests/accessibility.html` on that local server,
   choose each page and click **Check WCAG 2.1 A/AA**. This uses the development
   dependency `axe-core`; it is not part of the production bundle. Account-only
   pages require an existing test login on the same origin. Never send a real
   email just to run accessibility checks.
3. Test sign-in, registration validation, saved items, email validation, directory
   tables, map results and directions. Re-run after loading results or errors.
4. Use only Tab, Shift+Tab, Enter, Space and arrow keys. Check the skip link,
   navigation, forms, table sort/pagination, map alternative buttons and site map.
5. Try a narrow frame, **Toggle 200% text**, and **Toggle text spacing** separately
   and together. These apply 200% font size and the WCAG text-spacing values. Also
   check real browser zoom and forced-colour/reduced-motion preferences.

Automated checks do not prove full WCAG conformance. Review reported incomplete
items manually (for example decorative symbols or clipped table cells), and
check the actual visual layout. A full screen-reader/browser combination audit
has not been performed; do not describe the app as independently certified.

### 2026-10-16逐条核对记录

范围是当前网页的学习、账户（登录/注册）、目录/地图、收藏、邮件页面，
以及拒绝访问状态、打印报告；旧管理员列表仅做源码结构检查，没有创建或提升真实管理员。
“通过”表示下列证据支持本项目自检通过，不代表外部认证或任意浏览器/辅助技术组合的保证。
“不适用”是说明触发条件不存在，不是把缺失功能标为通过。没有把 AAA 或 WCAG 2.2 新条目混入评分。

| WCAG 2.1 | 级别 | 本次结论 | 项目证据与判断 |
| --- | --- | --- | --- |
| 1.1.1 | A | 通过 | 地图目的地、起点、距离及步骤均有文字等效；装饰符号不承担独立含义。 |
| 1.2.1 | A | 不适用 | 网页没有录播纯音频或纯视频。提交演示视频不是站内播放器。 |
| 1.2.2 | A | 不适用 | 网页没有需要字幕的录播媒体。 |
| 1.2.3 | A | 不适用 | 网页没有录播同步媒体。 |
| 1.2.4 | AA | 不适用 | 网页没有直播媒体。 |
| 1.2.5 | AA | 不适用 | 网页没有需要口述影像的录播视频。 |
| 1.3.1 | A | 通过 | 原生表单标签、标题/地标、表格caption及行列标题；实际DOM关联检查无失效引用。 |
| 1.3.2 | A | 通过 | DOM顺序与视觉流程一致；没有正数tabindex改变阅读顺序。 |
| 1.3.3 | A | 通过 | 操作以明确名称说明；路线信息不只用紫线/绿点传达。 |
| 1.3.4 | AA | 通过 | 实测320×800与800×320；没有方向锁定，两种方向均可滚动访问表单。 |
| 1.3.5 | AA | 通过 | 姓名、登录邮箱及密码字段使用name/username/current-password/new-password自动填充标记。 |
| 1.4.1 | A | 通过 | 当前页增加下划线，收藏有Saved文字，排序有箭头及aria-sort，错误有文字；地图选点同时提供文字状态。 |
| 1.4.2 | A | 不适用 | 没有自动播放音频。 |
| 1.4.3 | AA | 通过 | axe检查与调色板数值测试覆盖正文、按钮、表单提示、序号和导航；普通文字达到4.5:1。 |
| 1.4.4 | AA | 通过 | 每个主要页面及注册表单分别测试200%文字；修复评分控件引起的卡片溢出。 |
| 1.4.5 | AA | 通过 | 标题、说明及控件均为真实文本；地图底图中的地名属于地图本身，不用图片代替表单或正文。 |
| 1.4.10 | AA | 通过 | 真实320px浏览器与窄iframe检查；可用宽305px时整页scrollWidth为305，数据表仅在自身区域横向滚动。 |
| 1.4.11 | AA | 通过 | 输入及按钮边界、焦点颜色数值测试达到3:1；底图信息另有完整文字操作途径，不只依赖底图颜色。 |
| 1.4.12 | AA | 通过 | 各页面独立测试规定行高、段距、字距、词距，再与200%文字组合；页面无整体横向溢出。 |
| 1.4.13 | AA | 不适用 | 删除自定义地图悬停提示，信息保留在列表和路线文字中；没有其他自定义悬停弹层，浏览器原生title提示属例外。 |
| 2.1.1 | A | 通过 | 实际键盘导航/搜索/排序/分页/CSV导出及地图替代按钮；所有业务动作有原生按钮、输入或选择框。 |
| 2.1.2 | A | 通过 | 没有模态焦点陷阱；Tab/Shift+Tab可离开表单、表格和地图，原生选择框可用标准键退出。 |
| 2.1.4 | A | 通过 | 没有全局单字符业务快捷键；Leaflet的加减缩放键只在地图聚焦时启用，已核对其键盘处理源码。 |
| 2.2.1 | A | 不适用 | 没有用户填写/阅读限时；API超时不会清空未提交表单，不是要求用户限时输入。 |
| 2.2.2 | A | 不适用 | 没有定时轮播、滚动新闻或持续自动更新内容；跨标签同步由用户的保存/退出触发。 |
| 2.3.1 | A | 通过 | 页面没有闪烁内容或闪光动画。 |
| 2.4.1 | A | 通过 | 实测跳过导航后焦点到main-content且不改变路由；放大时隐藏链接不会露出遮挡页头。 |
| 2.4.2 | A | 通过 | 各路由有不同document.title，打印报告也有独立标题。 |
| 2.4.3 | A | 通过 | 路由跳转聚焦正文，错误聚焦反馈，DOM顺序自然；无正数tabindex。 |
| 2.4.4 | A | 通过 | 导航、站点地图、移除/收藏及评分链接名称可区分目标；新报告标签有明确说明。 |
| 2.4.5 | AA | 通过 | 主导航及页脚站点地图提供两种查找页面的入口。 |
| 2.4.6 | AA | 通过 | 各页主标题、段落标题、每列表格筛选及表单标签说明具体用途。 |
| 2.4.7 | AA | 通过 | 键盘焦点轮廓实际可见，深色页头使用白色焦点，其余区域深色焦点。 |
| 2.5.1 | A | 通过 | 地点按钮、起点选择和缩放按钮提供非拖拽/非多点替代方式。 |
| 2.5.2 | A | 通过 | 业务操作使用原生click/submit而非按下即执行；地图平移不提交用户数据。 |
| 2.5.3 | A | 通过 | 自定义可访问名称包含可见按钮/链接文字；地图＋/－有Zoom in/out名称，属于符号含义匹配。 |
| 2.5.4 | A | 不适用 | 没有摇动、倾斜或摄像头动作触发的功能。 |
| 3.1.1 | A | 通过 | 主HTML及打印报告均声明lang=en。 |
| 3.1.2 | AA | 不适用 | 应用说明均为英文；人名、地点和代码标识属于名称/技术术语例外。 |
| 3.2.1 | A | 通过 | 聚焦控件不会自动切页或提交。 |
| 3.2.2 | A | 通过 | 输入仅筛选结果，导航和网络提交均由明确操作触发；没有输入即跳转。 |
| 3.2.3 | AA | 通过 | 公共导航及页脚入口顺序一致；登录后增加账户功能不打乱已有相对顺序。 |
| 3.2.4 | AA | 通过 | 两张表复用同一个组件，重置、排序、分页及导出的名称和行为一致。 |
| 3.3.1 | A | 通过 | 登录/注册/搜索/评分/邮件错误均有文字；实测空注册焦点位于account-feedback。 |
| 3.3.2 | A | 通过 | 字段有标签和required语义，注册密码、附件类型/大小有说明。 |
| 3.3.3 | AA | 通过 | 错误提供范围/格式/重试提示；认证错误不暴露账号是否存在。 |
| 3.3.4 | AA | 通过 | 收藏可撤回、评分可修改；注册/邮件发送前可检查表单，验证失败保留输入，无付款或删除账户操作。 |
| 4.1.1 | A | 通过 | 实际DOM未发现重复ID；Vue构建成功。当前WCAG2.1修订对HTML解析条目有特别说明，语义问题仍按4.1.2检查。 |
| 4.1.2 | A | 通过 | 原生控件、可访问性树、按下状态和表格排序状态均可读取，ARIA关联无失效引用。 |
| 4.1.3 | AA | 通过 | 搜索/分页/路线/保存结果使用status或live区域，错误使用alert；不只改变视觉颜色。 |

合计50项：39项在上述范围内自检通过，11项因触发条件不存在而不适用。
自动检查中的incomplete没有被直接算成通过：装饰符号不承担信息，序号的实际前景/背景
通过数值对比度测试；窄屏中被表格滚动区域裁切的单元格仍可滚动读取；地图缩放符号有明确名称。
独立读屏软件和所有浏览器组合没有穷尽测试，PDF文件的标签结构也未验证，不宣称通用认证。

### Marking rubric交叉核对

本次重新读取Ed完整rubric，不能把最低功能存在等同于每项Exceeds。
rubric还规定高档递进依赖前档表现；最终等级、D/HD批准及面试表现由老师判定。

| 项目 | 实现与验收依据 | 明确边界 |
| --- | --- | --- |
| D.1 | Firebase认证、错误处理、刷新恢复及退出，auth服务与回归测试 | 不要求为了外部认证再添加社交登录或多因素认证；浏览器收藏不是云数据库。 |
| D.2 | 真实Resend API和TXT附件收件已验证，服务端验证令牌/附件/收件人 | 测试发件服务只允许原授权邮箱；任意新注册邮箱不能发信，本次没有重新发真实邮件。 |
| D.3 | 两张独立表，所有显示列搜索/排序，12条按10+2分页，键盘再次验证 | 不需要为满足这些功能引入复杂表格框架。 |
| D.4 | Firebase公网HTTPS前端与两支云函数、同源路径，部署脚本验收 | 邮件仍受上述测试邮箱限制，不能称为向所有新用户开放的正式邮件服务。 |
| E.1 | 独立searchPlaces真实云函数，前端调用与服务端过滤/错误处理 | 使用虚构示例目录，不声称Firestore CRUD。 |
| E.2 | 地区/类别地点搜索及OSRM真实道路路线、时间/距离/步骤 | 虚构设施及公开地区中心坐标；没有GPS、实时交通，不额外假报这些功能。 |
| E.3 | 上述50项适用性及代码、浏览器、对比度/结构检查 | 是项目自检，不承诺独立认证或直接获得Exceeds。 |
| E.4 | 两表全筛选/排序CSV，转义与公式防护；打印报告有保存PDF入口 | CSV实际下载已验；浏览器打印PDF不是直接生成PDF，PDF文件结构未验证。 |
| F.1 | 未实现 | 不把已有基础功能重复计算为四项创新。 |
| 面试/交付 | 代码历史、源码包与演示指导已经准备 | 仍须本人视频、完整模板、分享权限、正式提交和Week12面试；未取得D档批准不能算已获批。 |

Overview中的课程扣分条件需另外核对实际情况：A0/eFolio完成度不由本代码证明；
私有仓库需要tutor真正能访问，不只是邀请已发出；Git需至少3次代码提交且不能全部落在截止前48小时。
这些条件、视频权限及面试均不能由技术测试通过替代。

官方要求与评分表：
- https://edstem.org/au/courses/36218/lessons/115260/slides/792249
- https://edstem.org/au/courses/36218/lessons/115267/slides/792270

## E.4: export

Both directory tables provide **CSV** and **Print / PDF** controls. Exports use
`matchingRows`: every matching row in the selected sort order, not the ten-row
page slice. No-result exports are disabled. Each table's filters remain independent.

- CSV: `createCsv` quotes cells, escapes quotes, preserves commas/newlines, adds
  an Excel-friendly UTF-8 BOM and prevents spreadsheet formula interpretation.
  `downloadCsv` uses a browser Blob, then releases the temporary URL.
- PDF: `createPrintReport` builds an escaped HTML report in a new tab with table
  headings and print styles. Click **Print / Save as PDF**, then select the
  browser's **Save as PDF** destination. This is browser printing, not an automatic
  PDF file download. Popup blockers receive a visible error and retry instruction.
- Only public fictional directory fields are exported, not account information,
  authentication tokens, saved-item storage or server configuration.

Try all 12 entries, a four-result category filter, ascending/descending sorting,
no results, and the second table separately. Open the downloaded CSV and compare
its row count and order. Cancel printing if you do not want a PDF file.

References:
- https://www.w3.org/TR/WCAG21/
- https://www.w3.org/WAI/WCAG21/quickref/
- https://github.com/dequelabs/axe-core
