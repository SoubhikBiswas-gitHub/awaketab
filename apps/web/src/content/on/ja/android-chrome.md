---
title: "AndroidのChromeで画面を消さない — AwakeTab"
description: "Android版Chrome 84以降なら、表示中のタブで画面を保てます。Chromeを離れるとロックは外れ、省電力の設定で画面が暗くなることはあります。"
h1: "AndroidのChromeで画面をつけたままにする"
intent: "android 画面 消えない chrome"
secondaryQueries: ["android 画面 つけっぱなし", "スマホ 画面 消えない ようにする", "chrome 画面 スリープさせない", "android 画面消灯 させない"]
preset: p30
mode: standard
locale: ja
reviewed: false
translationOf: "android-chrome"
lastVerified: 2026-09-09
browsers: ["chrome"]
os: ["android"]
lead: "AndroidのChromeは、バージョン84から画面のWake Lock（スリープ防止）に対応しています。AwakeTabをChromeで開いて開始をタップすれば、タブが表示されている間は「画面消灯」の時間を過ぎても画面は消えません。専用アプリのインストールは不要です。ただし、Chromeから離れるとロックは解除されます。さらに一部のメーカーでは、独自の省電力設定が、離れたあとのChromeを閉じてしまうことがあります。"
crumb: "AndroidのChrome"
toc:
  バッテリーセーバーとメーカー独自の省電力: "バッテリーセーバー"
  設定の画面消灯との関係: "「画面消灯」との関係"
facts:
  - label: "Chrome"
    value: "84以降"
  - label: "Samsung Internet"
    value: "14以降"
  - label: "Firefox"
    value: "126以降"
  - label: "専用アプリ"
    value: "インストール不要"
steps:
  - title: "ChromeでAwakeTabを開きます"
    text: "このページでは30分が選ばれています。時間を決めずに使うなら「∞」、終わる時刻が決まっているなら「時刻を指定…」を選びます。"
    shot: "Android版ChromeでAwakeTabを開いた画面"
  - title: "開始をタップします"
    text: "表示が「画面オン中」に変わるのを確認します。"
    shot: "開始をタップしたあとの表示"
  - title: "用事が済むまでChromeを前面に表示しておきます"
    text: "別のアプリに切り替えると「一時停止 — タブが非表示」に変わります。これは故障ではなく、ブラウザが正しくロックを返した印です。Chromeに戻れば自動で取り直します。"
    shot: "別のアプリから戻ったときの表示"
matrix:
  label: "Androidの対応状況（2026年9月9日時点の対応表）"
  cols: ["環境", "結果", "知っておくこと"]
  rows:
    - what: "Chrome 84以降、タブを表示中"
      result: works
      label: "対応"
      text: "タブが表示されている間は画面が消えません。"
    - what: "Samsung Internet 14以降"
      result: works
      label: "対応"
      text: "Galaxy標準のSamsung Internetは14以降でネイティブに対応しています。"
    - what: "Firefox 126以降、Opera 70以降"
      result: works
      label: "対応"
      text: "Android上でネイティブに対応しています。"
    - what: "別のアプリに切り替えたとき"
      result: pauses
      label: "一時停止"
      text: "Chromeから離れるとロックは解除されます。Chromeに戻れば自動で取り直します。"
    - what: "古いブラウザ"
      result: fallback
      label: "動画の代替方式"
      text: "タップして同意すると動画の代替方式に切り替わります。"
rows:
  blockers:
    - title: "バッテリーセーバー"
      text: "ブラウザの資料とソースコード（2026年9月26日に確認）によると、Chromeにはバッテリーセーバーを理由にロック要求を断る仕組みはありません。ただしバッテリーセーバーは、消灯までの時間を短くしたり画面を暗くしたりすることがあります。"
    - title: "ブロックされたとき"
      text: "「ブロック中 — 解決方法はこちら」と出るのは、埋め込まれたページで許可されていない場合などで、表示に原因が示されます。同じ理由のまま何度タップしても結果は変わりません。"
    - title: "メーカー独自の「使用していないアプリをスリープ」"
      text: "Galaxyなど一部の機種にある設定です。Chromeがこのリストに入っていると、アプリを離れたあとにタブが終了させられることがあります。長時間使うなら、Chromeをこのリストから外しておくと安心です。"
faq:
  - q: "別のアプリを見てから戻ると、タイマーが止まっていたのはなぜですか？"
    a: "Chromeが背面に回るとロックは解除され、タイマーも一時停止するためです。すぐ戻れば自動で取り直しますが、長く離れていると「停止しました — タブが長く非表示のままでした。戻ったら再度開始してください。」と表示されます。"
  - q: "Galaxyでも使えますか？"
    a: "使えます。Chromeは84以降、Galaxy標準のSamsung Internetは14以降でネイティブに対応しています。ただし、使っていないアプリをスリープさせるGalaxyの設定は、画面を離れたあとのブラウザを閉じることがあります。表示中のタブには影響しません。"
  - q: "「画面消灯」の時間を長くする必要はありますか？"
    a: "ありません。AwakeTabのタブが表示されている間は、設定の画面消灯の時間を過ぎても画面はついたままです。停止するかタブを閉じれば、元の設定どおりに戻ります。"
  - q: "古いFirefox for Androidでも使えますか？"
    a: "Firefox 126より前のバージョンはネイティブのWake Lockに対応していません。「タップで代替方式を使用」と表示されたらタップしてください。無音の小さな動画で画面を保ちますが、電池の消費は増えます。"
honestLimit: "Chromeから別のアプリに移るとロックは解除されます。離れている間は、メーカー独自の「アプリをスリープ」設定がChromeを閉じることがあります。バッテリーセーバーは画面を暗くしたり消灯を早めたりすることがあります。"
related:
  - "/on/samsung-internet"
  - "/on/firefox"
  - "/for/cooking"
  - "/learn/browser-support-matrix"
  - "/vs/nosleep-js"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 使い方

::steps

30分たつと延長するかどうかをたずねる画面が出ます。画面をつけっぱなしにすると電池を使うので、長時間なら充電しながら使いましょう。料理の手順を見ながら使うなら[料理中に画面が消えないようにする方法](/ja/for/cooking)も参考にしてください。

::ad

## 対応ブラウザと代替方式

ほかのブラウザとの比較は[Wake Lock対応ブラウザ一覧](/ja/learn/browser-support-matrix)をご覧ください。

::matrix

## バッテリーセーバーとメーカー独自の省電力

::rows blockers

## 設定の「画面消灯」との関係

「設定」→「ディスプレイ」（Pixelでは「Display & touch」にあたる項目）→「画面消灯」（機種によっては「画面のタイムアウト」）の時間は変えなくてかまいません。ロックが保持されている間はこの時間が無視され、停止すると元の時間に戻ります。端末全体の設定を触らずに、必要なときだけ画面を保てるのがブラウザで使う利点です。
