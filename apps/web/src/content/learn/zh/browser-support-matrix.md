---
title: "屏幕唤醒锁浏览器支持一览 — AwakeTab"
description: "Chrome 与 Edge 84、Firefox 126、Safari 16.4 起原生支持屏幕唤醒锁，其余浏览器见表；更低版本只能改用视频备用方案。"
h1: "Wake Lock（屏幕唤醒锁）浏览器支持一览表"
intent: "屏幕唤醒锁 浏览器支持"
secondaryQueries: ["wake lock 浏览器兼容性", "screen wake lock api 支持", "哪些浏览器支持屏幕常亮", "safari wake lock 版本", "firefox wake lock 支持"]
preset: p15
mode: standard
locale: zh
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "表里显示“支持”，是不是切到后台也能保持常亮？"
    a: "不是。所有浏览器都遵循同一条规则：标签页被隐藏、窗口最小化或手机切换到其他应用后，唤醒锁就会被收回，状态显示“已暂停 — 标签页已隐藏”。“支持”只表示标签页可见时浏览器能给出原生锁。"
  - q: "我的浏览器版本比表里的低，还能用吗？"
    a: "可以尝试视频备用方案：点按“开始”后，AwakeTab 会播放一段极小的视频来保持屏幕常亮，状态显示“通过视频备用方案常亮”。它必须由你亲手点按才能启动，而且比原生唤醒锁更耗电。"
  - q: "为什么表里没有我用的浏览器？"
    a: "我们只列出能在浏览器文档和源代码中核实的浏览器和环境，没有核实过的组合不作任何承诺。表中没有的浏览器，请以状态标签的实际显示为准：只有它显示“屏幕保持常亮”，锁才是真的。"
  - q: "iPhone 上添加到主屏幕的 AwakeTab 需要什么版本？"
    a: "主屏幕 App 需要 iOS 18.4 或更高版本才能使用原生唤醒锁。更早的版本请直接在 Safari 16.4 或更高版本中打开 AwakeTab。"
honestLimit: "此表依据 2026年9月26日核对的浏览器文档和源代码，尚无真机测试记录；低于这些版本的浏览器会改用视频备用方案；没有核实过的组合不作承诺。"
related:
  - "/learn/how-we-tested"
  - "/learn/screen-wake-lock-api-guide"
  - "/on/ios-home-screen"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/for/kiosk"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 一句话答案

根据 2026年9月26日核对的浏览器文档和源代码，支持原生屏幕唤醒锁（Screen Wake Lock API）的最低版本是：Chrome 84、Edge 84、Firefox 126、Safari 16.4、Samsung Internet 14、Opera 70；添加到 iOS 主屏幕的 App 需要 iOS 18.4。低于这些版本的 Firefox 等浏览器会改用视频备用方案。下表的数据全部来自 AwakeTab 的支持矩阵文件，没有核实过的组合一律不写。

## 支持矩阵

| 浏览器 | 最低版本 | 机制 | 平台 | 备注 |
|---|---|---|---|---|
| Chrome | 84 | 原生 | Windows、macOS、Linux、Android、ChromeOS | 标签页必须保持可见；没有因省电模式而拒绝的机制 |
| Edge | 84 | 原生 | Windows、macOS、Linux、Android | 标签页必须保持可见 |
| Firefox | 126 | 原生 | Windows、macOS、Linux、Android | 未充电且电量不高于 5% 时拒绝或收回锁；更早的版本在用户点按后使用视频备用方案 |
| Safari | 16.4 | 原生 | macOS、iOS、iPadOS | 需要先点按一次；标签页必须保持可见；iPhone 低电量模式会把自动锁定固定为 30 秒 |
| Samsung Internet | 14 | 原生 | Android | 标签页必须保持可见；离开后“休眠应用”设置可能关闭浏览器 |
| Opera | 70 | 原生 | Windows、macOS、Linux、Android | 基于 Chromium；标签页必须保持可见 |

| 环境 | 最低版本 | 机制 | 备注 |
|---|---|---|---|
| iOS 主屏幕 App | 18.4 | 原生 | 更早的版本请在 Safari 中使用 AwakeTab |
| 视频备用方案 | — | 备用 | 需要用户点按启动，耗电高于原生唤醒锁 |

## 怎么读这张表

“原生”表示浏览器直接提供屏幕唤醒锁，AwakeTab 调用 `navigator.wakeLock.request('screen')` 即可获得。但即使版本达标，以下情况仍会导致请求被拒绝或锁被收回：标签页被隐藏、嵌入页面的 Permissions-Policy 禁用了 `screen-wake-lock`、Safari 还没有收到你的点按、Firefox 在未充电且电量不高于 5% 时。这时状态标签会显示“已被阻止 — 这样解决”或“已暂停 — 标签页已隐藏”。页面不是 HTTPS 时则根本没有唤醒锁，状态会显示“点按使用备用方案”。无论哪种情况，都绝不会显示假的常亮。

## 各操作系统备注

- **Windows**：熄屏时间在“设置 → 系统 → 电源和电池”中设置；24H2 起“节电模式”改名为“Energy saver”，它可能调暗屏幕，但不会拒绝唤醒锁。详见 [Windows 11 屏幕常亮](/zh/on/windows-11)。
- **macOS**：相关设置在“系统设置 → 锁定屏幕 / 节能”中；屏幕保持常亮期间 Mac 也不会空闲休眠，但合上盖子仍会睡眠（接通电源和外接显示器的合盖模式除外）。
- **iPhone**：设置 → 显示与亮度 → 自动锁定；低电量模式会让“永不”变灰。
- **Android**：设置 → 显示（Pixel 上是与 Display & touch 对应的菜单）→ 屏幕超时；部分厂商还有“休眠应用”列表，可能结束后台标签页。
- **Linux**：Chrome 和 Firefox 会通过 D-Bus 请求桌面不要休眠（GNOME SessionManager 或 freedesktop ScreenSaver 接口），能否生效取决于所用的桌面环境。

## 数据的时效

浏览器更新很快，这张表只对 2026年9月26日核对的资料负责，每一行都与该日期绑定。真机测试结果还没有记录，记录后会发布在[我们如何测试](/learn/how-we-tested)。如果你的浏览器不在表中，最可靠的判断方式是打开 AwakeTab，点按开始后看状态标签：显示“屏幕保持常亮”，就说明浏览器确实持有了锁；想在 iPhone 上使用，可参考 [iPhone Safari 屏幕常亮](/zh/on/iphone-safari)。
