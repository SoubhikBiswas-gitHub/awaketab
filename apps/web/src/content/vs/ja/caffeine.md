---
title: "Caffeineの代替をインストール不要で — AwakeTab"
description: "Caffeineは電源アサーションを使い、何も表示せずにMacを起こします。AwakeTabは標準APIのタブで、表示中だけ有効です。用途で選びましょう。"
h1: "CaffeineとAwakeTabを比較：インストール不要の代替"
ogTitle: "CaffeineとAwakeTabを比較"
intent: "caffeine 代替 オンライン"
secondaryQueries: ["caffeine mac 代わり", "mac スリープ 防止 アプリなし", "スリープ 防止 ブラウザ", "caffeine 代わり ブラウザ"]
preset: pinf
mode: standard
locale: ja
reviewed: false
translationOf: "caffeine"
lastVerified: 2026-09-09
browsers: []
os: []
crumb: "Caffeine"
lead: "macOS用のCaffeineは、macOSに電源アサーションを出すことで、ウィンドウを何も表示していなくてもシステムを起こし続けます。キー入力は送りません（F15キーを押すのはWindows用のZhorn Caffeineです）。AwakeTabは、ブラウザ標準のScreen Wake Lock API（画面のスリープ防止）を使う、表示中のタブです。ウィンドウを隠したまま動かしたい場合は、Caffeineのようなネイティブアプリを選んでください。ふたを閉じたときの挙動はmacOSが決めます。追加のアプリを入れずに、状態を正直に示す表示で画面を保ちたいならAwakeTabが向いています。"
compare:
  label: "AwakeTabとCaffeineの比較（2026年9月9日時点）"
  what: "項目"
  cols:
    - name: "AwakeTab"
      us: true
    - name: "Caffeine"
  rows:
    - what: "仕組み"
      cells: ["Screen Wake Lock API（入力は送らない）", "macOSの電源アサーション（入力は送らない）"]
    - what: "何も表示していないとき"
      cells: ["動作しない（一時停止）", "動作する"]
    - what: "インストール"
      cells: ["不要（ブラウザで開くだけ）", "必要（macOSアプリ）"]
    - what: "対応環境"
      cells: ["Safari 16.4+、Chrome 84+、Edge 84+、Firefox 126+ など", "macOS"]
    - what: "状態の表示"
      cells: ["保持中・一時停止・ブロック中などを区別して表示", "メニューバーのアイコン"]
picks:
  them:
    - title: "ウィンドウを隠したまま使いたいとき"
      text: "AwakeTabはタブが隠れるとロックを手放します。常に裏で動かしたいならネイティブアプリです。"
    - title: "画面ではなく本体を起こしておきたいとき"
      text: "ウェイクロックが守るのはディスプレイです。画面がついている間は本体もアイドルスリープしませんが、画面を消したまま本体だけを起こしておくことはできません。"
  us:
    - title: "アプリを入れられない、入れたくないとき"
      text: "会社のPCや借りたMacでも、ブラウザで開くだけです。"
    - title: "Mac以外でも使いたいとき"
      text: "同じページがWindows、iPhone、Androidでも動きます。"
    - title: "状態をはっきり知りたいとき"
      text: "ブラウザが実際にロックを保持している間だけ「画面オン中」と表示し、ブラウザに断られれば「ブロック中 — 解決方法はこちら」と理由を出します。"
faq:
  - q: "AwakeTabはキー入力をシミュレートしますか？"
    a: "しません。AwakeTabはブラウザ標準のScreen Wake Lock APIだけを使い、キーやマウスの操作は一切送りません。そのため、TeamsやSlackの在席表示を保つこともできません。Mac版のCaffeineもキーは押さず、macOSの電源アサーションを使います。"
  - q: "ウィンドウを隠したまま画面を保ちたい場合は？"
    a: "その用途ではCaffeineのようなネイティブアプリの方が向いています。AwakeTabはタブが隠れた時点でロックを解除し、「一時停止 — タブが非表示」と表示します。タブに戻ると自動で取り直します。"
  - q: "メニューバーから手軽にオンにできますか？"
    a: "AwakeTabはブラウザのタブで動くので、メニューバーのアイコンはありません。代わりに、ヘッダーからインストールしてDockに置くことができます。起動したら開始を押すかスペースキーを押すだけです。"
  - q: "会社のMacでアプリを入れられない場合は？"
    a: "AwakeTabはインストール不要で、対応ブラウザ（Safari 16.4以降、Chrome 84以降、Firefox 126以降など）で開くだけで使えます。ただし表示中のタブが必要です。画面がついている間は本体もアイドルスリープしませんが、画面を消したまま本体だけを起こすことはできません。"
honestLimit: "CaffeineはmacOSの電源アサーションを使い、何も表示されていなくても働きます。AwakeTabは表示中のタブが必要で、タブが隠れるとロックは解除されます。"
related:
  - "/on/macos"
  - "/vs/caffeinate-command"
  - "/vs/amphetamine"
  - "/for/cooking"
  - "/guides/lock-screen-vs-sleep"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## 比較表（2026年9月9日時点）

::compare

::ad

## Caffeineの方が向いている場面

::picks them

## AwakeTabの方が向いている場面

::picks us

Macでの詳しい挙動は[Macのディスプレイをスリープさせない方法](/ja/on/macos)で説明しています。

## どちらにも共通する注意

ふたを閉じたときのスリープはmacOSが決めるもので、AwakeTabのタブは一切関与できません。AwakeTabは入力をまねしないので、TeamsやSlackの在席表示は保てません。これは設計上の選択です。Safariでまだタップしていないなどの理由でブラウザがロックを拒否した場合も、AwakeTabはそのまま拒否されたと表示します。見た目だけ「オン」にすることはありません。どちらを選ぶにしても、画面をつけっぱなしにすると電力を使うので、長時間なら電源につないでおきましょう。
