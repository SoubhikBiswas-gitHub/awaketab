---
title: "Mac 浏览器里防止显示器休眠 — AwakeTab"
description: "Mac 上的 Safari 16.4+、Chrome 84+、Firefox 126+ 都能让显示器常亮，这期间 Mac 也不会空闲休眠；但合上盖子仍会睡眠。"
h1: "在 Mac 浏览器里防止显示器休眠"
intent: "mac 防止屏幕休眠"
secondaryQueries: ["mac 屏幕常亮", "macbook 不熄屏", "mac 显示器 不休眠 网页", "mac 保持屏幕唤醒", "safari 屏幕常亮"]
preset: p60
mode: standard
locale: zh
reviewed: false
translationOf: "macos"
lastVerified: 2026-09-09
browsers: ["chrome", "safari", "firefox"]
os: ["macos"]
lead: "在 Mac 上，Safari 16.4 及以上、Chrome 84 及以上和 Firefox 126 及以上版本都支持屏幕唤醒锁（Wake Lock），AwakeTab 可以借此让**显示器**保持常亮。打开本页工具，预设时长 1 小时，点按开始，状态标签显示“屏幕保持常亮”即表示浏览器已经持有锁。在这期间，Mac 也不会进入空闲休眠；但合上盖子仍会睡眠。"
crumb: "Mac"
toc:
  显示器休眠与系统睡眠的关系: "显示器休眠与系统睡眠"
  哪些场景适合在-mac-上用-awaketab: "哪些场景适合"
facts:
  - label: "Safari"
    value: "16.4 及以上"
  - label: "Chrome"
    value: "84 及以上"
  - label: "Firefox"
    value: "126 及以上"
  - label: "Edge"
    value: "84 及以上"
matrix:
  label: "Mac 浏览器支持情况（2026年9月9日的支持矩阵）"
  cols: ["浏览器", "结果", "说明"]
  rows:
    - what: "Safari 16.4 及以上"
      result: works
      label: "支持"
      text: "第一次需要你点按一下才能启动，不支持悬浮窗口。"
    - what: "Chrome 84 及以上"
      result: works
      label: "支持"
      text: "116 及以上可以使用“悬浮窗口”，让小计时器浮在其他窗口之上保持可见（Edge 116+ 和 Firefox 151+ 也支持）。"
    - what: "Edge 84 及以上"
      result: works
      label: "支持"
      text: "在 macOS 上同样支持。"
    - what: "Firefox 126 及以上"
      result: works
      label: "支持"
      text: "126 起支持原生唤醒锁。"
    - what: "更旧的 Firefox"
      result: fallback
      label: "视频备用方案"
      text: "需要点按后改用视频备用方案，状态显示“通过视频备用方案常亮”，耗电更多。"
rows:
  blockers:
    - title: "被阻止时"
      text: "显示“已被阻止 — 这样解决”时，点开会看到具体原因，例如 Safari 还没有收到你的点按。"
    - title: "暂停时"
      text: "显示“已暂停 — 标签页已隐藏”，说明窗口被最小化或切到了别的空间。"
    - title: "地址"
      text: "还要确认地址是 HTTPS，并且不是被嵌入在其他网站里的页面。"
faq:
  - q: "我想让 Mac 整夜不睡眠跑任务，用 AwakeTab 够吗？"
    a: "要看情况。按照 Apple 的 IOKit 文档，显示器被保持常亮期间，Mac 也不会进入空闲休眠；但前提是 AwakeTab 的标签页整夜可见。想在熄屏状态下让整机保持唤醒，请使用 caffeinate 等原生工具，可参考 Caffeine 与 AwakeTab 的对比页面。"
  - q: "合上 MacBook 盖子，AwakeTab 还能让它不睡吗？"
    a: "不能。合上盖子会让 Mac 进入睡眠（接通电源和外接显示器的合盖模式除外），任何网页或浏览器扩展都改变不了。需要合盖使用时，只能依靠系统设置、外接显示器或原生工具。"
  - q: "切到另一个全屏 App 或最小化 Safari 窗口，还会常亮吗？"
    a: "不会。窗口最小化、切换到其他桌面空间里的全屏 App，或切到别的标签页，都会让浏览器收回唤醒锁，状态显示“已暂停 — 标签页已隐藏”。回到这个标签页后，状态恢复为“屏幕保持常亮”才会继续计时。"
  - q: "屏幕亮着，Slack 或 Teams 会显示我在线吗？"
    a: "不会。Slack、Teams 和 Zoom 的在线状态看的是键盘和鼠标的空闲时间，而不是显示器。AwakeTab 从不模拟输入，所以不会替你保持“在线”。"
honestLimit: "只在标签页可见时让显示器保持常亮，这期间 Mac 也不会空闲休眠；合上盖子仍会进入睡眠（接通电源和外接显示器的合盖模式除外）。"
related:
  - "/vs/caffeine"
  - "/vs/caffeinate-command"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/downloads"
  - "/learn/does-a-wake-lock-keep-teams-green"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 三种浏览器的差别

::matrix

::ad

## 显示器还是熄了？

先看状态标签。

::rows blockers

## 显示器休眠与系统睡眠的关系

macOS 会分别处理“关闭显示器”和“让电脑进入睡眠”。屏幕唤醒锁直接作用于前者，但根据浏览器文档和源代码（2026年9月26日核对），Chrome 会持有“禁止显示器休眠”的电源断言，而 Apple 的 IOKit 文档说明，这期间 Mac 不会空闲休眠。可以在终端运行 `pmset -g assertions` 自行确认。如果你想在熄屏状态下让下载、渲染或远程任务整夜跑完，请改用系统设置或原生工具，参见 [Caffeine 与 AwakeTab 对比](/zh/vs/caffeine)。

## 相关系统设置

显示器的关闭时间在“系统设置 → 锁定屏幕”中调整，电源相关选项在“节能”（MacBook 上为“电池”）中。开启低电量模式后，系统可能缩短这些时限。如果你只是偶尔需要屏幕多亮一会儿，比如对照文档写代码、看监控面板或演示，用 AwakeTab 就不必来回修改这些设置。

## 保持可见是前提

无论用哪个浏览器，AwakeTab 的标签页都必须可见。在 Mac 上最常见的“意外暂停”是：切到另一个全屏 App、把窗口最小化到程序坞，或者在同一窗口里点开了别的标签页。遇到这种情况，状态会如实显示“已暂停 — 标签页已隐藏”，计时也停止，而不是继续假装常亮。

## 哪些场景适合在 Mac 上用 AwakeTab

- 对照文档写代码、看长篇资料，手不碰触控板也不想屏幕变暗。
- 在副屏上挂着监控面板、直播或日程表，需要一直看得见。
- 演示或录屏时，不希望屏幕中途变暗。

这些场景的共同点是：你本来就要看着这个屏幕，标签页自然可见。反过来，如果需要 Mac 在无人值守时继续工作，那是系统休眠的问题，应交给系统设置或原生工具处理。

## 电量与屏幕保护

MacBook 用电池时亮屏会明显耗电，长时间使用请接上电源。如果你要让一块屏幕长时间显示同一画面，也要注意外接 OLED 显示器的烧屏风险：夜间模式的像素微移能减轻，但不能完全消除。
