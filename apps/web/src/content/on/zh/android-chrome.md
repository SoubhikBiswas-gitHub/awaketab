---
title: "安卓手机 Chrome 保持屏幕常亮 — AwakeTab"
description: "安卓版 Chrome 84 及以上可在可见标签页中持有原生唤醒锁；离开 Chrome 即失效，省电模式可能调暗屏幕，部分厂商的休眠设置会在你离开后结束标签页。"
h1: "在安卓手机的 Chrome 里让屏幕保持常亮"
intent: "安卓 chrome 屏幕常亮"
secondaryQueries: ["安卓 屏幕常亮", "android 屏幕常亮 网页", "手机屏幕 不熄灭", "chrome 防止屏幕休眠", "安卓 屏幕超时 永不"]
preset: p30
mode: standard
locale: zh
reviewed: false
translationOf: "android-chrome"
lastVerified: 2026-09-09
browsers: ["chrome"]
os: ["android"]
lead: "安卓手机上的 Chrome 从 84 版起就支持屏幕唤醒锁（Wake Lock）。用 Chrome 打开 AwakeTab，默认时长 30 分钟，点按开始，状态标签显示“屏幕保持常亮”后，手机就不会按“屏幕超时”的设定熄屏。需要注意三件事：离开 Chrome 锁就会被收回；省电模式可能缩短熄屏时间或调暗屏幕；某些品牌的“休眠应用”设置还可能在你离开后把标签页结束掉。"
crumb: "安卓 Chrome"
facts:
  - label: "Chrome"
    value: "84 及以上"
  - label: "Samsung Internet"
    value: "14 及以上"
  - label: "Firefox"
    value: "126 及以上"
  - label: "Opera"
    value: "70 及以上"
steps:
  - title: "在 Chrome 中打开 awaketab.com"
    path: "Chrome › awaketab.com"
    text: "确保地址是 HTTPS。"
    shot: "安卓版 Chrome 中打开的 AwakeTab"
  - title: "选时长"
    text: "30 分钟、1 小时，或“∞”（直到我停止）。"
    shot: "时长选项"
  - title: "点按开始，看状态标签"
    text: "只有它显示“屏幕保持常亮”，屏幕常亮才是真的。如果显示“已被阻止 — 这样解决”，按提示处理原因即可，不必反复点按。"
    shot: "点按开始后的状态标签"
matrix:
  label: "安卓浏览器支持情况（2026年9月9日的支持矩阵）"
  cols: ["环境", "结果", "说明"]
  rows:
    - what: "Chrome 84 及以上"
      result: works
      label: "支持"
      text: "状态标签显示“屏幕保持常亮”后，手机就不会按“屏幕超时”的设定熄屏。"
    - what: "Samsung Internet 14、Firefox 126、Opera 70 及以上"
      result: works
      label: "支持"
      text: "在安卓上都支持原生唤醒锁。"
    - what: "离开 Chrome"
      result: pauses
      label: "暂停"
      text: "离开 Chrome 锁就会被收回。"
    - what: "更旧的 Firefox"
      result: fallback
      label: "视频备用方案"
      text: "可以在你点按后使用视频备用方案，状态显示“通过视频备用方案常亮”，但更耗电。"
rows:
  blockers:
    - title: "看状态标签"
      text: "如果不是“屏幕保持常亮”，说明锁根本没有拿到，或已经被收回。"
    - title: "看地址栏"
      text: "必须是 HTTPS 地址；从其他网站嵌入的页面可能没有获得唤醒锁权限，直接打开 awaketab.com 即可。"
    - title: "看是否切走过"
      text: "按过电源键、切到其他应用或标签页后，锁会被收回，回到本页等状态恢复即可。"
    - title: "看 Chrome 版本"
      text: "在 Chrome 的“设置 → 关于 Chrome”中确认版本不低于 84。"
    - title: "看厂商设置"
      text: "如果离开后回来页面被重新加载，检查电池优化或休眠应用列表。"
faq:
  - q: "切到其他 App 或按电源键锁屏后，还会保持常亮吗？"
    a: "不会。标签页一旦不可见，Chrome 就会收回唤醒锁，状态标签显示“已暂停 — 标签页已隐藏”，计时也会停下。回到 Chrome 中的这个标签页，等状态重新变为“屏幕保持常亮”后才会继续。"
  - q: "开着省电模式还能用吗？"
    a: "能用。根据浏览器文档和源代码（2026年9月26日核对），Chrome 没有因为省电模式而拒绝唤醒锁的机制。不过省电模式可能缩短熄屏时间或调暗屏幕。如果状态标签显示“已被阻止 — 这样解决”，原因会写在提示里，例如嵌入页面未获授权；不解决原因而反复点按，只会得到同样的结果。"
  - q: "离开一会儿再回来，标签页被重新加载了，是怎么回事？"
    a: "部分厂商在系统里加入了“休眠应用”“深度休眠”或后台管理之类的列表，可能在你离开后直接结束 Chrome 的标签页。如果经常遇到，可以在这些设置里把 Chrome 移出休眠列表。具体名称因品牌和系统版本而异。"
  - q: "三星浏览器或安卓版 Firefox 可以用吗？"
    a: "可以。Samsung Internet 14 及以上、Firefox 126 及以上都支持原生屏幕唤醒锁（以 2026年9月9日的支持矩阵为准）。三星的“休眠应用”设置可能在你离开后关闭浏览器，但不影响正在显示的标签页；更旧的 Firefox 需要点按后使用视频备用方案。"
honestLimit: "离开 Chrome（切换应用、切换标签页或锁屏）会让唤醒锁被收回；部分厂商的“休眠应用”类设置还可能在你离开后直接结束这个标签页；省电模式可能调暗屏幕。"
related:
  - "/on/samsung-internet"
  - "/guides/android-screen-timeout-one-app"
  - "/on/firefox"
  - "/for/cooking"
  - "/for/reading"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 三步用起来

::steps

::ad

## 其他安卓浏览器

完整列表见[浏览器支持一览表](/zh/learn/browser-support-matrix)。

::matrix

## 屏幕还是熄了？按这个顺序排查

::rows blockers

## 省电模式与厂商的后台管理

Chrome 没有因为省电模式而拒绝屏幕唤醒锁的机制，安卓原生的省电模式最多会缩短熄屏时间或调暗屏幕。另外，不少厂商在系统里加入了自己的电池优化功能，名称五花八门，例如“休眠应用”“深度休眠”“应用启动管理”等。它们可能在你切走之后把 Chrome 的标签页结束，回来时页面需要重新加载。经常遇到这种情况时，可以把 Chrome 从这些列表中移除。

## 系统自带的屏幕超时设置

路径通常是“设置 → 显示（Pixel 上是与 Display & touch 对应的菜单）→ 屏幕超时”，各品牌叫法略有不同，也可能叫“休眠”或“自动锁屏”。如果只想在某一个应用里常亮，而不是全局改成很长的超时，可以保留原来的超时设置，只在需要时打开 AwakeTab：它只在标签页可见时生效，用完关掉即可，不必事后再把系统设置改回来。

## 分屏与多窗口

安卓平板或支持分屏的手机上，可以把 AwakeTab 和导航、菜谱或文档并排放置。只要 AwakeTab 在屏幕上可见，锁就保持有效；它被完全遮住或退到后台，就会暂停。在厨房里的具体用法可参考[做饭时屏幕常亮](/zh/for/cooking)。

## 电量提醒

屏幕亮着就会耗电，长时间使用请接上充电器。Chromium 系浏览器可以设置一个电量阈值，低于该值时自动停止会话。
