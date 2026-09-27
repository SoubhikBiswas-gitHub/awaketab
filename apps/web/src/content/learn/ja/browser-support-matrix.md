---
title: "Wake Lock対応ブラウザ一覧 — AwakeTab"
description: "Chrome・Edge 84、Firefox 126、Safari 16.4以降などが対応（2026年9月26日に資料で確認）。古い版は代替方式で動きます。"
h1: "Wake Lock（画面スリープ防止）対応ブラウザ一覧"
intent: "wake lock 対応ブラウザ"
secondaryQueries: ["screen wake lock api 対応", "wake lock safari 対応 バージョン", "wake lock firefox 対応", "スリープ 防止 ブラウザ"]
preset: p15
mode: standard
locale: ja
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-09
browsers: []
os: []
lead: "2026年9月26日に資料で確認した時点で、画面のWake Lock（Screen Wake Lock API）にネイティブ対応している最低バージョンは、Chrome 84、Edge 84、Firefox 126、Safari 16.4、Samsung Internet 14、Opera 70です。iPhoneのホーム画面に追加したウェブアプリでは、iOS 18.4以降が必要です。Firefox 125以前などの古いバージョンでは、タップして同意すると動画の代替方式に切り替わります。資料で確認できない組み合わせは、この表に載せていません。"
crumb: "対応ブラウザ一覧"
rows:
  refusals:
    - title: "ページがHTTPSで開かれていること"
    - title: "タブが画面に表示されていること"
    - title: "埋め込み先が`screen-wake-lock`を許可していること（Permissions-Policy）"
    - title: "Safariでは、先に一度タップしていること"
    - title: "Firefoxでは、電池残量が5%を超えているか充電中であること"
faq:
  - q: "対応ブラウザなら、タブを裏に回しても画面は保たれますか？"
    a: "保たれません。どのブラウザでも、タブが非表示になったりアプリを切り替えたりするとロックは解除されます。AwakeTabは「一時停止 — タブが非表示」と表示し、タブに戻ると自動で取り直します。"
  - q: "表に載っていないブラウザではどうなりますか？"
    a: "資料とソースコードで確認できていない組み合わせは、対応とは書いていません。実際にロックが取れたかどうかは、AwakeTabの表示で確かめてください。「画面オン中」と出ればネイティブで保持しています。"
  - q: "Firefox 125以前では使えませんか？"
    a: "ネイティブのロックはFirefox 126からです。それより前のバージョンでは、タップして同意すると無音の小さな動画で画面を保つ代替方式が動きます。ネイティブより電力を多く使います。"
  - q: "iPhoneのホーム画面に追加した場合の条件は？"
    a: "ホーム画面に追加したウェブアプリでWake Lockが使えるのはiOS 18.4以降です。それより前のiOSでは、Safari 16.4以降のタブでAwakeTabを開いてください。"
honestLimit: "この表は、ブラウザの資料とソースコードを2026年9月26日に確認した内容です。表より古いバージョンは動画の代替方式になります。実機での記録はまだなく、確認できない組み合わせは対応と書いていません。"
related:
  - "/learn/how-we-tested"
  - "/learn/screen-wake-lock-api-guide"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/ios-home-screen"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 対応表（2026年9月26日時点）

| ブラウザ・環境 | 最低バージョン | 方式 | 対応OS | 注意点 |
|---|---|---|---|---|
| Chrome | 84 | ネイティブ | Windows、macOS、Linux、Android、ChromeOS | タブの表示が必要。省電力機能による拒否の仕組みはない |
| Edge | 84 | ネイティブ | Windows、macOS、Linux、Android | タブの表示が必要 |
| Firefox | 126 | ネイティブ | Windows、macOS、Linux、Android | 電池残量5%以下で充電していないと拒否・解除。それより前の版は、操作後に動画の代替方式 |
| Safari | 16.4 | ネイティブ | macOS、iOS、iPadOS | 最初にタップが必要。タブの表示が必要。iPhoneの低電力モードは自動ロックを30秒にする |
| Samsung Internet | 14 | ネイティブ | Android | タブの表示が必要。離れたあとにアプリが閉じられることがある |
| Opera | 70 | ネイティブ | Windows、macOS、Linux、Android | Chromiumベース。タブの表示が必要 |
| iOSホーム画面アプリ | 18.4 | ネイティブ | iOS | それより前はSafariのタブで使う |
| 動画の代替方式 | — | 代替 | — | ユーザーの操作が必要。ネイティブより電力を使う |

## 表の読み方

「最低バージョン」は、そのバージョン以降でネイティブのロックが使えるという意味です。ネイティブの場合、AwakeTabは「画面オン中」と表示します。代替方式で動いているときは「動画の代替方式で画面オン中」と、区別して表示します。

どのブラウザでも、次の条件がそろわないとロックは取れません。

::rows refusals

条件を満たさない場合、表示は「ブロック中 — 解決方法はこちら」または「一時停止 — タブが非表示」になります。HTTPSでないページではWake Lock自体が使えないため「タップで代替方式を使用」と出ます。どの場合も、うその「画面オン中」は出しません。端末ごとの詳しい手順は、[iPhoneのSafari](/ja/on/iphone-safari)と[AndroidのChrome](/ja/on/android-chrome)のページにまとめています。

::ad

## 開発者向けメモ

AwakeTabは安全な接続で表示されているページから`navigator.wakeLock.request('screen')`を呼び出します。状態は準備完了・開始中・保持中・一時停止・ブロック中・非対応・代替方式の7つで、タイマーが進むのは保持中と代替方式のときだけです。

## 確認の方法について

各行は、ブラウザの資料とソースコード（2026年9月26日に確認）にもとづいています。実機での記録はまだありません。ブラウザの更新で挙動が変わることがあるため、行の内容はその日付に限って有効だと考えてください。表にないブラウザやバージョンについては、対応しているともいないとも主張しません。実機での結果は、記録でき次第「how we tested」のページ（英語）で公開します。

::limit inline
