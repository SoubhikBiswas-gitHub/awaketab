---
title: "做饭看菜谱时屏幕常亮 — AwakeTab"
description: "照着菜谱做饭，屏幕总在关键时刻变暗？AwakeTab 在浏览器里让屏幕保持常亮，无需安装；前提是它的标签页留在屏幕上，切到别的应用就会暂停。"
h1: "做饭看菜谱时，让手机屏幕保持常亮"
intent: "做饭时屏幕常亮"
secondaryQueries: ["看菜谱 屏幕 不熄灭", "做饭 手机屏幕常亮", "平板 菜谱 防止屏幕休眠", "厨房 屏幕常亮 网页"]
preset: pinf
mode: cook
locale: zh
reviewed: false
translationOf: "cooking"
lastVerified: 2026-09-09
browsers: []
os: []
crumb: "做饭"
lead: "照着手机或平板上的菜谱做饭，屏幕常常在你揉面、切菜的时候变暗、锁屏，只好用沾着油的手指去解锁。打开本页内嵌的 AwakeTab 工具，时长已默认设为“∞”（直到我停止），点按开始，等状态标签显示“屏幕保持常亮”，屏幕就不会再自动变暗或锁定。它依靠浏览器自带的 Wake Lock（屏幕唤醒锁）API，不用装 App，也不用注册账号。唯一的前提是：AwakeTab 的标签页必须一直留在屏幕上。"
figures:
  - frame: phone
    label: "手机截图"
    alt: "手机浏览器中的 AwakeTab 做饭模式"
    caption: "手机上的 AwakeTab 做饭模式。"
  - frame: desktop
    label: "电脑截图"
    alt: "菜谱和 AwakeTab 在两个并排的窗口里"
    caption: "菜谱和 AwakeTab 在两个并排的窗口里。"
rows:
  placement:
    - title: "平板"
      text: "用安卓分屏或 iPad 的窗口化应用（iPadOS 18 及更早版本为“分屏浏览”）把菜谱和 AwakeTab 并排显示，两边都在屏幕上，锁就一直有效。"
    - title: "手机"
      text: "在同一个浏览器里切换到菜谱标签页，AwakeTab 就被隐藏了，常亮随之暂停。iPhone 一次只有一个应用在前台，AwakeTab 无法让另一个 App 里的菜谱保持常亮。最稳妥的做法是让 AwakeTab 作为你唯一看的页面，菜谱放在另一台设备上或提前记下来。"
    - title: "电脑"
      text: "把菜谱和 AwakeTab 放在两个并排的窗口里。注意，合上笔记本盖子会让电脑进入睡眠，这一点任何网页都改变不了。"
pills:
  - state: held
    text: "只有浏览器真正持有锁时，才会显示运行中的计时器和这个状态。"
  - state: fallback
    text: "正在使用视频备用方案时显示，同样会显示运行中的计时器。"
  - state: lost
    text: "锅里还在炖着，你却切去看了一眼消息？回来时你会看到这个状态，计时也停在原处。这不是故障，而是浏览器的规则。"
  - state: denied
    text: "嵌入页面的 Permissions-Policy 禁用了 `screen-wake-lock`、Safari 还没有收到你的点按，或 Firefox 在未充电且电量不高于 5% 时，都会让请求被拒绝或锁被收回；省电模式不在其中。被拒绝时，先按提示解决原因，反复点按“开始”只会得到同样的结果。"
faq:
  - q: "我切到菜谱 App 或回个微信消息，屏幕还会保持常亮吗？"
    a: "不会。只要切换到其他应用，或 AwakeTab 所在的标签页被隐藏，浏览器就会收回屏幕唤醒锁，状态标签显示“已暂停 — 标签页已隐藏”。回到这个标签页，等它重新显示“屏幕保持常亮”或“通过视频备用方案常亮”即可。"
  - q: "菜谱在另一个网页或 App 里，怎样和 AwakeTab 同时显示？"
    a: "在安卓平板上用分屏，在 iPad 上用 iPadOS 26 的窗口化应用（iPadOS 18 及更早版本为“分屏浏览”），把 AwakeTab 和菜谱并排放；在电脑上开第二个窗口并排摆放。iPhone 则做不到这一点。关键是 AwakeTab 必须一直在屏幕上可见，被完全遮住或退到后台都会让常亮暂停。"
  - q: "手机开着低电量模式或省电模式，还能让屏幕常亮吗？"
    a: "Chrome 和 Safari 都没有因为省电模式而拒绝唤醒锁的机制。不过 iPhone 的低电量模式会把自动锁定固定为 30 秒，在这种状态下 Safari 的唤醒锁能否让屏幕保持常亮，我们还没有记录到真机结果。安卓的省电模式可能会缩短熄屏时间或调暗屏幕。"
  - q: "哪些浏览器可以用？"
    a: "原生屏幕唤醒锁支持 Chrome 84+、Edge 84+、Firefox 126+、Safari 16.4+ 和 Samsung Internet 14+。更旧的 Firefox 可以在点按后改用视频备用方案。以上版本以 2026年9月9日的支持矩阵为准。"
honestLimit: "只有当 AwakeTab 标签页显示在屏幕上时才有效；在手机上打开其他应用（包括菜谱 App 或聊天软件）会让浏览器收回唤醒锁，直到你回到这个标签页为止。"
related:
  - "/for/reading"
  - "/for/workouts"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/guides/iphone-auto-lock-never-greyed-out"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 在厨房里怎么摆放

::rows placement

::figures

::ad

## 状态标签说的都是真话

AwakeTab 在安全（HTTPS）且可见的页面中调用 `navigator.wakeLock.request('screen')`。状态标签共有七种状态。AwakeTab 绝不会假装屏幕仍然常亮。

::pills

## 手机和平板的自动锁屏设置

- **iPhone**：设置 → 显示与亮度 → 自动锁定。开启低电量模式后，“永不”会变灰，详见[自动锁定“永不”变灰怎么办](/zh/guides/iphone-auto-lock-never-greyed-out)。
- **安卓**：设置 → 显示（Pixel 上是与“Display & touch”对应的菜单）→ 屏幕超时（不同品牌名称略有差异）。部分厂商还有“休眠应用”之类的列表，可能在你离开后结束浏览器标签页。

## 支持哪些浏览器

根据 2026年9月9日的支持矩阵，原生唤醒锁的最低版本是 Chrome 84、Edge 84、Firefox 126、Safari 16.4 和 Samsung Internet 14；添加到 iOS 主屏幕的 App 需要 iOS 18.4。更旧的 Firefox 可以在你点按之后启动视频备用方案，但它比原生唤醒锁更耗电。

::limit

## 电量与安全

屏幕一直亮着会耗电，长时间炖汤、烘焙时最好插上电源，并把手机放在远离灶台热源和水槽的地方。AwakeTab 只负责让屏幕亮着，不能替你看火，也不要把无人看管的手机当作安全监控。如果选的是固定时长而不是“∞”，时间到时会弹出“时间到。要继续吗？”，从那里延长即可。
