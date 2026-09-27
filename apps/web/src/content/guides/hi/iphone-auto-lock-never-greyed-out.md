---
title: "iPhone ऑटो-लॉक में Never ग्रे क्यों है — AwakeTab"
description: "Low Power Mode या ऑफ़िस/स्कूल का (MDM) प्रोफ़ाइल iPhone ऑटो-लॉक का Never विकल्प ग्रे कर देता है। वजह पहचानें, फिर ज़रूरत के समय Safari में AwakeTab चलाएँ।"
h1: "iPhone में Auto-Lock का Never विकल्प ग्रे क्यों हो जाता है"
ogTitle: "iPhone ऑटो-लॉक Never ग्रे क्यों है"
intent: "iphone ऑटो-लॉक never ग्रे क्यों है"
secondaryQueries: ["आईफोन ऑटो लॉक नेवर नहीं हो रहा", "iphone auto lock never option nahi aa raha", "ऑटो-लॉक कभी नहीं सेट नहीं हो रहा", "लो पावर मोड में ऑटो-लॉक 30 सेकंड", "आईफोन की स्क्रीन बंद न हो"]
preset: p30
mode: standard
locale: hi
reviewed: false
translationOf: "iphone-auto-lock-never-greyed-out"
lastVerified: 2026-09-09
browsers: []
os: []
crumb: "ऑटो-लॉक Never ग्रे"
lead: "आप Settings → Display & Brightness → Auto-Lock (सेटिंग्ज़ → डिस्प्ले और ब्राइटनेस → ऑटो-लॉक) खोलते हैं और Never वाला विकल्प फीका पड़ा है, दबता ही नहीं। ऐसा आम तौर पर Low Power Mode चालू होने पर होता है: बैटरी आइकन पीला दिखे तो समझिए वही चालू है, और iOS ऑटो-लॉक को 30 सेकंड कर देता है। दूसरी वजह ऑफ़िस या स्कूल का (MDM) प्रोफ़ाइल है, जो ऑटो-लॉक की सीमा तय कर सकता है। हल: Low Power Mode बंद करें, या प्रोफ़ाइल जाँचें। उसके बाद Safari 16.4+ में AwakeTab स्क्रीन को तब तक जगाए रख सकता है जब तक आप टैब न छोड़ें।"
steps:
  - title: "Low Power Mode बंद करें"
    short: "Low Power Mode बंद"
    path: "Settings › Battery"
    text: "Control Center खोलें और बैटरी वाले बटन से Low Power Mode बंद करें (या Settings → Battery में जाकर)।"
  - title: "Auto-Lock पर लौटें"
    short: "Auto-Lock में Never"
    path: "Settings › Display & Brightness › Auto-Lock"
    text: "Settings → Display & Brightness → Auto-Lock पर लौटें। Never अब चुना जा सकता है।"
  - title: "अब भी ग्रे है तो प्रोफ़ाइल देखें"
    short: "प्रोफ़ाइल देखें"
    path: "Settings › General › VPN & Device Management"
    text: "अगर अब भी ग्रे है, तो Settings → General → VPN & Device Management में प्रोफ़ाइल देखें; उसकी सीमा सिर्फ़ उसका एडमिन हटा सकता है।"
  - title: "या Safari में AwakeTab चलाएँ"
    short: "या AwakeTab चलाएँ"
    text: "अगर आप हमेशा के लिए Never नहीं चाहते, तो ऑटो-लॉक सामान्य रहने दें और जिस काम के लिए स्क्रीन जगानी है, उसके लिए Safari में AwakeTab चलाएँ।"
stepsDone: "चारों कदम पूरे हो गए।"
toolNote: "इस गाइड पर अवधि 30 मिनट पहले से चुनी है। टूल चालू होने पर जब पिल “स्क्रीन ऑन है” दिखाए, तभी फोन को रख दें।"
faq:
  - q: "Auto-Lock में Never दबा ही नहीं पा रहा, ठीक कैसे करूँ?"
    a: "ज़्यादातर वजह Low Power Mode होती है। Control Center में बैटरी वाला बटन दबाकर या Settings → Battery में जाकर Low Power Mode बंद करें, फिर Settings → Display & Brightness → Auto-Lock खोलें। Never फिर भी ग्रे हो, तो ऑफ़िस या स्कूल का प्रोफ़ाइल इसे सीमित कर रहा है; उसे सिर्फ़ उसका एडमिन बदल सकता है।"
  - q: "Low Power Mode चालू रखते हुए क्या AwakeTab स्क्रीन ऑन रख सकता है?"
    a: "पक्का नहीं कह सकते। Safari में Low Power Mode के लिए लॉक मना करने वाली कोई जाँच नहीं है, पर Low Power Mode ऑटो-लॉक को 30 सेकंड कर देता है। उस हालत में Safari का लॉक स्क्रीन को जगाए रखता है या नहीं, इसका डिवाइस परीक्षण हमने अभी दर्ज नहीं किया है; नतीजा /learn/how-we-tested पर आएगा।"
  - q: "Safari से दूसरे ऐप पर गया तो क्या स्क्रीन जगी रहेगी?"
    a: "नहीं। ऐप बदलते ही Safari का टैब छिप जाता है और लॉक छूट जाता है; पिल “रुका हुआ — टैब छिपा है” दिखाता है। Safari पर लौटें, तब लॉक फिर माँगा जाता है।"
  - q: "Never चुनने के बजाय AwakeTab क्यों इस्तेमाल करूँ?"
    a: "Never हमेशा के लिए लगा रह जाता है और भूलने पर बैटरी खत्म करता है। AwakeTab सिर्फ़ उतने समय के लिए स्क्रीन जगाता है जितना आप चुनें, और टैब छोड़ते ही अपने-आप हट जाता है। इसके लिए Safari 16.4 या नया चाहिए।"
honestLimit: "Low Power Mode ऑटो-लॉक के Never (कभी नहीं) विकल्प को ग्रे करके 30 सेकंड तय कर देता है। उस हालत में Safari का वेक लॉक स्क्रीन जगाए रखता है या नहीं, इसका डिवाइस परीक्षण अभी दर्ज नहीं है।"
related:
  - "/on/iphone-safari"
  - "/learn/low-power-mode-and-wake-locks"
  - "/on/ios-home-screen"
  - "/for/downloads"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## दो मिनट में ठीक करें

::steps

::ad

## AwakeTab यहाँ क्या कर सकता है और क्या नहीं

AwakeTab Safari से `navigator.wakeLock.request('screen')` माँगता है — सिर्फ़ सुरक्षित (HTTPS) और दिखते पेज से। पिल सात हालतों में से किसी एक में रहता है, और टाइमर व “स्क्रीन ऑन है” केवल held या fallback में दिखते हैं।

Safari लॉक तभी मना करता है जब टैब छिपा हो, पहले आपका टैप न मिला हो, या कोई Permissions-Policy रोक रही हो; Low Power Mode के लिए उसमें कोई जाँच नहीं है। पर Low Power Mode में स्क्रीन सचमुच जगी रहती है या नहीं, इसका डिवाइस परीक्षण हमने अभी दर्ज नहीं किया है। AwakeTab सच छिपाता नहीं: लॉक न मिले तो पिल denied या lost पर जाएगा, नकली held पर नहीं।

लॉक तब भी छूटता है जब आप Safari से दूसरे ऐप पर जाएँ, होम स्क्रीन पर लौटें या कोई दूसरा टैब खोलें। वापस आने पर लॉक फिर से माँगा जाता है।

## वर्ज़न की शर्तें

9 सितंबर 2026 की हमारी सपोर्ट मैट्रिक्स के अनुसार iPhone पर Safari 16.4 से नेटिव वेक लॉक मिलता है। अगर आपने AwakeTab को होम स्क्रीन पर ऐप की तरह जोड़ा है, तो उस इंस्टॉल किए गए वेब ऐप को iOS 18.4 चाहिए; पुराने iOS पर Safari टैब में ही चलाएँ। iPhone की पूरी जानकारी [iPhone Safari गाइड](/hi/on/iphone-safari) में है।

## कब Never ही सही है, कब नहीं

Never चुनना आसान है, पर वह भूल जाने पर रात भर स्क्रीन जलाकर बैटरी खत्म कर देता है। AwakeTab सिर्फ़ चुने हुए समय तक चलता है — 30 मिनट पूरे होने पर “समय पूरा हुआ। और चलाएँ?” पूछता है, जहाँ से आप +15 मिनट या +30 मिनट जोड़ सकते हैं। और अगर आप टैब छोड़ दें, तो वह अपने-आप हट जाता है।

## सावधानी

iPhone को बिना देखरेख के बच्चे या मरीज़ पर नज़र रखने वाला उपकरण न बनाएँ — AwakeTab कोई सुरक्षा उपकरण नहीं है। लंबे सेशन में चार्जर लगाएँ। OLED वाले iPhone पर घंटों स्थिर तस्वीर रहना बर्न-इन का कारण बन सकता है; नाइट मोड का पिक्सेल शिफ़्ट मदद करता है, पर पूरी गारंटी नहीं देता। और Never या AwakeTab, दोनों में से कोई भी Teams या Slack को आपके “Available” होने का संकेत नहीं देता — AwakeTab कोई इनपुट नहीं भेजता।
