// V2.9.300: StrategyEngine v3 — River价值表 + Turn防禦 + GG人群數據 + 多尺度sizing
// 升级自 V2.9.215
// 独立IIFE，不修改旧代码，通过 G._seEnabled 开关切换
var StrategyEngine=(function(){
'use strict';

// ====== 第一部分: GTO翻前频率表 (5-Max专用) ======
var _RFI={
  UTG1:{AA:1,KK:1,QQ:1,JJ:1,TT:1,"99":.9,"88":.8,"77":.7,"66":.6,"55":.5,"44":.4,"33":.3,"22":.3,AKs:1,AQs:1,AJs:1,ATs:.9,A9s:.7,A8s:.5,A7s:.4,A6s:.3,A5s:.6,A4s:.4,A3s:.3,A2s:.3,KQs:1,KJs:1,KTs:.7,K9s:.5,K8s:.3,K7s:.2,K6s:.1,K5s:.1,QJs:.9,QTs:.6,Q9s:.4,Q8s:.2,JTs:.9,J9s:.5,J8s:.2,T9s:.9,T8s:.3,"98s":.5,"87s":.5,"76s":.4,"65s":.3,"54s":.2,AKo:1,AQo:1,AJo:.7,ATo:.4,A9o:.2,KQo:.9,KJo:.6,KTo:.3,QJo:.5,JTo:.2},
  MP:{AA:1,KK:1,QQ:1,JJ:1,TT:1,"99":1,"88":.9,"77":.8,"66":.7,"55":.6,"44":.5,"33":.4,"22":.4,AKs:1,AQs:1,AJs:1,ATs:1,A9s:.9,A8s:.7,A7s:.5,A6s:.4,A5s:.8,A4s:.6,A3s:.4,A2s:.4,KQs:1,KJs:1,KTs:.9,K9s:.7,K8s:.5,K7s:.3,K6s:.2,K5s:.2,K4s:.1,QJs:1,QTs:.8,Q9s:.6,Q8s:.4,Q7s:.2,Q6s:.1,JTs:1,J9s:.7,J8s:.4,J7s:.2,T9s:1,T8s:.5,T7s:.3,"98s":.7,"97s":.3,"87s":.7,"86s":.3,"76s":.6,"75s":.3,"65s":.4,"54s":.4,"43s":.1,AKo:1,AQo:1,AJo:.9,ATo:.7,A9o:.5,A8o:.3,A7o:.1,KQo:1,KJo:.8,KTo:.6,K9o:.3,K8o:.1,QJo:.7,QTo:.5,Q9o:.2,JTo:.5,J9o:.2,T9o:.3},
  CO:{AA:1,KK:1,QQ:1,JJ:1,TT:1,"99":1,"88":1,"77":.9,"66":.8,"55":.7,"44":.6,"33":.5,"22":.5,AKs:1,AQs:1,AJs:1,ATs:1,A9s:1,A8s:.9,A7s:.8,A6s:.7,A5s:1,A4s:.8,A3s:.7,A2s:.7,KQs:1,KJs:1,KTs:1,K9s:.9,K8s:.7,K7s:.5,K6s:.4,K5s:.3,K4s:.2,K3s:.2,K2s:.1,QJs:1,QTs:.9,Q9s:.7,Q8s:.5,Q7s:.3,Q6s:.2,Q5s:.1,JTs:1,J9s:.8,J8s:.5,J7s:.3,J6s:.2,T9s:1,T8s:.7,T7s:.4,T6s:.2,"98s":.8,"97s":.5,"96s":.2,"87s":.8,"86s":.5,"76s":.7,"75s":.4,"65s":.6,"64s":.2,"54s":.5,"53s":.2,"43s":.3,AKo:1,AQo:1,AJo:1,ATo:.9,A9o:.7,A8o:.5,A7o:.3,A6o:.1,A3o:.1,A2o:.1,KQo:1,KJo:.9,KTo:.8,K9o:.5,K8o:.2,QJo:.8,QTo:.7,Q9o:.3,Q8o:.1,JTo:.7,J9o:.3,T9o:.4,"98o":.1},
  BTN:{AA:1,KK:1,QQ:1,JJ:1,TT:1,"99":1,"88":1,"77":1,"66":.9,"55":.8,"44":.7,"33":.6,"22":.6,AKs:1,AQs:1,AJs:1,ATs:1,A9s:1,A8s:1,A7s:1,A6s:.9,A5s:1,A4s:1,A3s:.9,A2s:.9,KQs:1,KJs:1,KTs:1,K9s:1,K8s:.9,K7s:.7,K6s:.5,K5s:.4,K4s:.3,K3s:.2,K2s:.2,QJs:1,QTs:1,Q9s:.9,Q8s:.6,Q7s:.4,Q6s:.3,Q5s:.2,Q4s:.1,Q3s:.1,JTs:1,J9s:.9,J8s:.7,J7s:.4,J6s:.3,J5s:.2,J4s:.1,T9s:1,T8s:.8,T7s:.5,T6s:.3,T5s:.2,T4s:.1,"98s":.9,"97s":.6,"96s":.3,"95s":.2,"87s":.9,"86s":.6,"85s":.3,"76s":.8,"75s":.5,"74s":.2,"65s":.7,"64s":.3,"54s":.6,"53s":.2,"43s":.3,AKo:1,AQo:1,AJo:1,ATo:1,A9o:.9,A8o:.7,A7o:.4,A6o:.2,A5o:.1,A3o:.2,A2o:.2,KQo:1,KJo:1,KTo:.9,K9o:.6,K8o:.3,K7o:.1,QJo:.9,QTo:.8,Q9o:.4,Q8o:.2,JTo:.8,J9o:.4,J8o:.2,T9o:.5,T8o:.2,"98o":.2},
  SB:{AA:1,KK:1,QQ:1,JJ:1,TT:1,"99":.9,"88":.8,"77":.7,"66":.5,"55":.4,"44":.3,"33":.2,"22":.2,AKs:1,AQs:1,AJs:1,ATs:1,A9s:.9,A8s:.7,A7s:.5,A6s:.4,A5s:1,A4s:.8,A3s:.6,A2s:.5,KQs:1,KJs:1,KTs:.9,K9s:.7,K8s:.5,K7s:.3,K6s:.2,K5s:.2,K4s:.1,QJs:.9,QTs:.7,Q9s:.5,Q8s:.3,JTs:.9,J9s:.6,J8s:.3,T9s:.8,T8s:.5,"98s":.7,"97s":.3,"87s":.6,"86s":.3,"76s":.5,"75s":.2,"65s":.4,"54s":.3,"43s":.1,AKo:1,AQo:1,AJo:.9,ATo:.7,A9o:.4,A8o:.2,KQo:.9,KJo:.7,KTo:.5,K9o:.2,QJo:.5,QTo:.3,JTo:.3}
};

var _3B={
  vs_UTG1:{
    from_MP:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.7},JJ:{a:'3b',f:.3},AKs:{a:'3b',f:.7},AKo:{a:'3b',f:.6},AQs:{a:'3b',f:.3},A5s:{a:'3b',f:.3},A4s:{a:'3b',f:.2},TT:{a:'c',f:.7},"99":{a:'c',f:.6},"88":{a:'c',f:.5},AQo:{a:'c',f:.5},AJs:{a:'c',f:.5},KQs:{a:'c',f:.4},QJs:{a:'c',f:.3},JTs:{a:'c',f:.3}},
    from_CO:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.7},JJ:{a:'3b',f:.4},AKs:{a:'3b',f:.7},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.4},A5s:{a:'3b',f:.4},A4s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},TT:{a:'c',f:.7},"99":{a:'c',f:.6},"88":{a:'c',f:.5},AQo:{a:'c',f:.5},AJs:{a:'c',f:.5},KQs:{a:'c',f:.5},QJs:{a:'c',f:.4},JTs:{a:'c',f:.4}},
    from_BTN:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.7},JJ:{a:'3b',f:.4},AKs:{a:'3b',f:.7},AKo:{a:'3b',f:.6},AQs:{a:'3b',f:.4},A5s:{a:'3b',f:.4},A4s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},TT:{a:'c',f:.8},"99":{a:'c',f:.7},"88":{a:'c',f:.6},"77":{a:'c',f:.5},AQo:{a:'c',f:.5},AJs:{a:'c',f:.5},ATs:{a:'c',f:.4},KQs:{a:'c',f:.5},KJs:{a:'c',f:.4},QJs:{a:'c',f:.4},JTs:{a:'c',f:.4},T9s:{a:'c',f:.3}},
    from_SB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.8},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},A5s:{a:'3b',f:.3}},
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.8},AKs:{a:'3b',f:.7},AKo:{a:'3b',f:.6},A5s:{a:'3b',f:.3},JJ:{a:'c',f:.8},TT:{a:'c',f:.7},"99":{a:'c',f:.6},"88":{a:'c',f:.5},AQs:{a:'c',f:.6},AQo:{a:'c',f:.5},AJs:{a:'c',f:.4},KQs:{a:'c',f:.4},QJs:{a:'c',f:.3},JTs:{a:'c',f:.3}}
  },
  vs_CO:{
    from_BTN:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.8},AQs:{a:'3b',f:.6},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.3},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.3},A2s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},QJs:{a:'3b',f:.1},"99":{a:'c',f:.9},"88":{a:'c',f:.8},"77":{a:'c',f:.7},"66":{a:'c',f:.5},"55":{a:'c',f:.4},"44":{a:'c',f:.3},"33":{a:'c',f:.2},"22":{a:'c',f:.2},ATs:{a:'c',f:.8},A9s:{a:'c',f:.7},A8s:{a:'c',f:.6},A7s:{a:'c',f:.5},A6s:{a:'c',f:.4},KJs:{a:'c',f:.7},KTs:{a:'c',f:.6},K9s:{a:'c',f:.5},JTs:{a:'c',f:.7},T9s:{a:'c',f:.7},"98s":{a:'c',f:.6},"87s":{a:'c',f:.5},"76s":{a:'c',f:.4},AJo:{a:'c',f:.5},KQo:{a:'c',f:.4}},
    from_SB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.8},TT:{a:'3b',f:.6},AKs:{a:'3b',f:.9},AKo:{a:'3b',f:.9},AQs:{a:'3b',f:.7},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.4},ATs:{a:'3b',f:.3},A5s:{a:'3b',f:.6},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.4},KQs:{a:'3b',f:.3},KJs:{a:'3b',f:.2},QJs:{a:'3b',f:.2},KQo:{a:'3b',f:.3},"99":{a:'c',f:.3},"88":{a:'c',f:.2},"77":{a:'c',f:.1}},
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},"99":{a:'3b',f:.3},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.5},AQo:{a:'3b',f:.3},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},"98s":{a:'3b',f:.2},"87s":{a:'3b',f:.2},AJs:{a:'c',f:.6},ATs:{a:'c',f:.7},KJs:{a:'c',f:.6},KTs:{a:'c',f:.5},QJs:{a:'c',f:.5},JTs:{a:'c',f:.6},J9s:{a:'c',f:.4},T9s:{a:'c',f:.6},"98s":{a:'c',f:.5},"87s":{a:'c',f:.4}}
  },
  vs_MP:{
    from_CO:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.8},JJ:{a:'3b',f:.5},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.5},A5s:{a:'3b',f:.4},TT:{a:'c',f:.8},"99":{a:'c',f:.7},AQo:{a:'c',f:.6},AJs:{a:'c',f:.6},KQs:{a:'c',f:.5}},
    from_BTN:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.8},AQs:{a:'3b',f:.6},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.3},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.4},"99":{a:'c',f:.9},"88":{a:'c',f:.8},"77":{a:'c',f:.7},ATs:{a:'c',f:.8},KJs:{a:'c',f:.7},KTs:{a:'c',f:.6},QJs:{a:'c',f:.5},JTs:{a:'c',f:.7},T9s:{a:'c',f:.7}},
    from_SB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.8},TT:{a:'3b',f:.6},AKs:{a:'3b',f:.9},AKo:{a:'3b',f:.9},AQs:{a:'3b',f:.7},AQo:{a:'3b',f:.5},A5s:{a:'3b',f:.6},A4s:{a:'3b',f:.5},KQs:{a:'3b',f:.3}},
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.5},AQo:{a:'3b',f:.3},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.4},KQs:{a:'3b',f:.3},"99":{a:'c',f:.8},"88":{a:'c',f:.7},"77":{a:'c',f:.6},AJs:{a:'c',f:.7},ATs:{a:'c',f:.8},KJs:{a:'c',f:.7},KTs:{a:'c',f:.6},QJs:{a:'c',f:.6},JTs:{a:'c',f:.7}}
  },
  vs_BTN:{
    from_SB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.8},TT:{a:'3b',f:.6},AKs:{a:'3b',f:.9},AKo:{a:'3b',f:.9},AQs:{a:'3b',f:.7},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.4},ATs:{a:'3b',f:.3},AJo:{a:'3b',f:.2},A5s:{a:'3b',f:.6},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.4},KQs:{a:'3b',f:.3},KJs:{a:'3b',f:.2},QJs:{a:'3b',f:.2},KQo:{a:'3b',f:.3}},
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},"99":{a:'3b',f:.3},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.5},AQo:{a:'3b',f:.3},AJs:{a:'3b',f:.2},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},K5s:{a:'3b',f:.2},K4s:{a:'3b',f:.2},"98s":{a:'3b',f:.3},"87s":{a:'3b',f:.2},ATs:{a:'c',f:.7},A9s:{a:'c',f:.6},A8s:{a:'c',f:.5},A7s:{a:'c',f:.4},A6s:{a:'c',f:.3},KJs:{a:'c',f:.6},KTs:{a:'c',f:.5},K9s:{a:'c',f:.4},QJs:{a:'c',f:.5},QTs:{a:'c',f:.4},JTs:{a:'c',f:.6},J9s:{a:'c',f:.4},T9s:{a:'c',f:.6},T8s:{a:'c',f:.4},"98s":{a:'c',f:.5},"87s":{a:'c',f:.4},"76s":{a:'c',f:.3},"65s":{a:'c',f:.3},"54s":{a:'c',f:.2},AJo:{a:'c',f:.3},KQo:{a:'c',f:.4},KJo:{a:'c',f:.3},QJo:{a:'c',f:.2}}},
  vs_SB:{
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.95},JJ:{a:'3b',f:.8},TT:{a:'3b',f:.6},"99":{a:'3b',f:.4},AKs:{a:'3b',f:.9},AKo:{a:'3b',f:.85},AQs:{a:'3b',f:.7},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.4},ATs:{a:'3b',f:.3},A5s:{a:'3b',f:.6},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.4},KQs:{a:'3b',f:.4},KJs:{a:'3b',f:.3},QJs:{a:'3b',f:.25},KQo:{a:'3b',f:.35},"88":{a:'c',f:.8},"77":{a:'c',f:.7},"66":{a:'c',f:.6},"55":{a:'c',f:.5},"44":{a:'c',f:.4},"33":{a:'c',f:.35},"22":{a:'c',f:.35},A9s:{a:'c',f:.7},A8s:{a:'c',f:.6},A7s:{a:'c',f:.5},A6s:{a:'c',f:.4},KTs:{a:'c',f:.6},K9s:{a:'c',f:.5},QTs:{a:'c',f:.5},Q9s:{a:'c',f:.4},JTs:{a:'c',f:.6},J9s:{a:'c',f:.4},T9s:{a:'c',f:.5},T8s:{a:'c',f:.4},"98s":{a:'c',f:.5},"87s":{a:'c',f:.4},"76s":{a:'c',f:.3},AJo:{a:'c',f:.4},KJo:{a:'c',f:.3},QJo:{a:'c',f:.25}},
    from_BTN:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.95},JJ:{a:'3b',f:.8},TT:{a:'3b',f:.6},AKs:{a:'3b',f:.9},AKo:{a:'3b',f:.85},AQs:{a:'3b',f:.7},AQo:{a:'3b',f:.5},AJs:{a:'3b',f:.4},A5s:{a:'3b',f:.6},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.4},KQs:{a:'3b',f:.4},KJs:{a:'3b',f:.3},KQo:{a:'3b',f:.35},"99":{a:'c',f:.85},"88":{a:'c',f:.8},"77":{a:'c',f:.7},"66":{a:'c',f:.6},"55":{a:'c',f:.5},A9s:{a:'c',f:.7},A8s:{a:'c',f:.6},ATs:{a:'c',f:.75},KTs:{a:'c',f:.6},K9s:{a:'c',f:.5},QJs:{a:'c',f:.55},QTs:{a:'c',f:.5},JTs:{a:'c',f:.65},J9s:{a:'c',f:.45},T9s:{a:'c',f:.55},T8s:{a:'c',f:.4},"98s":{a:'c',f:.5},"87s":{a:'c',f:.4},"76s":{a:'c',f:.3},AJo:{a:'c',f:.4},KJo:{a:'c',f:.3},QJo:{a:'c',f:.25},JTo:{a:'c',f:.3},T9o:{a:'c',f:.25}}
  }
};

var _F3B={
  UTG1:{AA:{a:'4b',f:1},KK:{a:'4b',f:1},QQ:{a:'4b',f:.6,s:{a:'c',f:.4}},AKs:{a:'4b',f:.5,s:{a:'c',f:.5}},AKo:{a:'4b',f:.5,s:{a:'c',f:.5}},JJ:{a:'c',f:.8},TT:{a:'c',f:.7},"99":{a:'c',f:.5},AQs:{a:'c',f:.5},AJs:{a:'c',f:.4},KQs:{a:'c',f:.3},QJs:{a:'c',f:.2},JTs:{a:'c',f:.2},A5s:{a:'4b',f:.2,s:{a:'f',f:.8}}},
  CO:{AA:{a:'4b',f:1},KK:{a:'4b',f:1},QQ:{a:'4b',f:.7,s:{a:'c',f:.3}},AKs:{a:'4b',f:.5,s:{a:'c',f:.5}},AKo:{a:'4b',f:.5,s:{a:'c',f:.5}},JJ:{a:'c',f:.8},TT:{a:'c',f:.7},"99":{a:'c',f:.5},AQs:{a:'c',f:.6},AJs:{a:'c',f:.4},KQs:{a:'c',f:.3},QJs:{a:'c',f:.3},JTs:{a:'c',f:.3},A5s:{a:'4b',f:.3,s:{a:'f',f:.7}},A4s:{a:'4b',f:.2,s:{a:'f',f:.8}},A2s:{a:'4b',f:.15,s:{a:'f',f:.85}}},
  BTN:{AA:{a:'4b',f:1},KK:{a:'4b',f:1},QQ:{a:'4b',f:.8,s:{a:'c',f:.2}},JJ:{a:'4b',f:.4,s:{a:'c',f:.6}},AKs:{a:'4b',f:.6,s:{a:'c',f:.4}},AKo:{a:'4b',f:.5,s:{a:'c',f:.5}},TT:{a:'c',f:.7},"99":{a:'c',f:.5},AQs:{a:'c',f:.6},AJs:{a:'c',f:.5},ATs:{a:'c',f:.4},KQs:{a:'c',f:.4},KJs:{a:'c',f:.3},QJs:{a:'c',f:.3},JTs:{a:'c',f:.3},T9s:{a:'c',f:.2},A5s:{a:'4b',f:.35,s:{a:'f',f:.65}},A4s:{a:'4b',f:.25,s:{a:'f',f:.75}},A3s:{a:'4b',f:.15,s:{a:'f',f:.85}},A2s:{a:'4b',f:.15,s:{a:'f',f:.85}}},
  SB:{AA:{a:'4b',f:1},KK:{a:'4b',f:1},QQ:{a:'4b',f:.8,s:{a:'c',f:.2}},JJ:{a:'4b',f:.5,s:{a:'c',f:.5}},AKs:{a:'4b',f:.6,s:{a:'c',f:.4}},AKo:{a:'4b',f:.5,s:{a:'c',f:.5}},TT:{a:'c',f:.6},"99":{a:'c',f:.4},AQs:{a:'c',f:.5},AJs:{a:'c',f:.3},KQs:{a:'c',f:.3},A5s:{a:'4b',f:.3,s:{a:'f',f:.7}},A4s:{a:'4b',f:.2,s:{a:'f',f:.8}}},
  BB:{AA:{a:'4b',f:1},KK:{a:'4b',f:1},QQ:{a:'4b',f:.7,s:{a:'c',f:.3}},JJ:{a:'4b',f:.3,s:{a:'c',f:.7}},AKs:{a:'4b',f:.5,s:{a:'c',f:.5}},AKo:{a:'4b',f:.4,s:{a:'c',f:.6}},TT:{a:'c',f:.8},"99":{a:'c',f:.6},AQs:{a:'c',f:.6},AJs:{a:'c',f:.5},ATs:{a:'c',f:.4},KQs:{a:'c',f:.4},A5s:{a:'4b',f:.25,s:{a:'f',f:.75}}}
};

// ====== 第二部分: 翻后策略表 ======
// 多尺度sizing: [freq, {dry_size, wet_size, paired_size}] 替代旧 [freq, small%]
var _CBET_IP={
  '0':{0:[1,{d:.30,w:.40,p:.35}],1:[1,{d:.30,w:.40,p:.35}],2:[1,{d:.30,w:.40,p:.35}],3:[1,{d:.30,w:.40,p:.35}],4:[.9,{d:.30,w:.40,p:.35}],5:[.7,{d:.30,w:.40,p:.35}],6:[.5,{d:.30,w:.40,p:.35}],8:[.8,{d:.30,w:.40,p:.35}],9:[.6,{d:.40,w:.55,p:.45}],10:[.5,{d:.40,w:.55,p:.45}],11:[.9,{d:.40,w:.55,p:.45}],13:[.4,{d:.30,w:.50,p:.35}],14:[.3,{d:.30,w:.50,p:.35}],15:[.3,{d:.30,w:.50,p:.35}]},
  '2':{0:[1,{d:.55,w:.70,p:.60}],1:[.85,{d:.55,w:.70,p:.60}],2:[.8,{d:.55,w:.70,p:.60}],3:[.7,{d:.55,w:.70,p:.60}],4:[.7,{d:.55,w:.70,p:.60}],5:[.4,{d:.55,w:.70,p:.60}],8:[.8,{d:.55,w:.70,p:.60}],9:[.6,{d:.55,w:.70,p:.60}],10:[.5,{d:.55,w:.70,p:.60}],11:[.9,{d:.55,w:.70,p:.60}],13:[.2,{d:.55,w:.70,p:.60}],15:[.1,{d:.55,w:.70,p:.60}]},
  '3':{0:[1,{d:.66,w:.80,p:.75}],1:[.9,{d:.66,w:.80,p:.75}],2:[.9,{d:.66,w:.80,p:.75}],3:[.5,{d:.66,w:.80,p:.75}],4:[.5,{d:.66,w:.80,p:.75}],11:[.8,{d:.66,w:.80,p:.75}],9:[.5,{d:.66,w:.80,p:.75}],13:[.15,{d:.66,w:.80,p:.75}],15:[.05,{d:.66,w:.80,p:.75}]},
  '4':{0:[1,{d:.50,w:.75,p:.60}],1:[.85,{d:.50,w:.75,p:.60}],4:[.6,{d:.50,w:.75,p:.60}],8:[.9,{d:.50,w:.75,p:.60}],9:[.5,{d:.50,w:.75,p:.60}],11:[.9,{d:.50,w:.75,p:.60}],13:[.2,{d:.50,w:.75,p:.60}],15:[.1,{d:.50,w:.75,p:.60}]},
  '5':{0:[1,{d:.25,w:.50,p:.30}],1:[.9,{d:.25,w:.50,p:.30}],3:[.9,{d:.25,w:.50,p:.30}],4:[.8,{d:.25,w:.50,p:.30}],9:[.5,{d:.25,w:.50,p:.30}],13:[.4,{d:.25,w:.50,p:.30}],15:[.25,{d:.25,w:.50,p:.30}]}
};

var _CBET_OOP={
  '0':{0:[1,{d:.30,w:.40,p:.35}],1:[.95,{d:.30,w:.40,p:.35}],3:[.9,{d:.30,w:.40,p:.35}],4:[.8,{d:.30,w:.40,p:.35}],8:[.6,{d:.30,w:.40,p:.35}],13:[.25,{d:.30,w:.40,p:.35}],15:[.2,{d:.30,w:.40,p:.35}]},
  '2':{0:[.9,{d:.55,w:.70,p:.60}],1:[.7,{d:.55,w:.70,p:.60}],2:[.6,{d:.55,w:.70,p:.60}],11:[.5,{d:.55,w:.70,p:.60}],9:[.3,{d:.55,w:.70,p:.60}],13:[.1,{d:.55,w:.70,p:.60}],15:[.05,{d:.55,w:.70,p:.60}]},
  '3':{0:[.9,{d:.66,w:.80,p:.75}],1:[.5,{d:.66,w:.80,p:.75}],2:[.5,{d:.66,w:.80,p:.75}],11:[.4,{d:.66,w:.80,p:.75}],15:[.03,{d:.66,w:.80,p:.75}]},
  '4':{0:[.9,{d:.50,w:.75,p:.60}],1:[.7,{d:.50,w:.75,p:.60}],4:[.5,{d:.50,w:.75,p:.60}],8:[.8,{d:.50,w:.75,p:.60}],9:[.4,{d:.50,w:.75,p:.60}],15:[.08,{d:.50,w:.75,p:.60}]},
  '5':{0:[1,{d:.25,w:.50,p:.30}],1:[.85,{d:.25,w:.50,p:.30}],3:[.85,{d:.25,w:.50,p:.30}],4:[.7,{d:.25,w:.50,p:.30}],9:[.4,{d:.25,w:.50,p:.30}],15:[.2,{d:.25,w:.50,p:.30}]}
};

var _CR={
  '2':{1:[.7,3],2:[.6,3],11:[.5,3.5],9:[.35,3.5],10:[.25,3.5],15:[.03,3]},
  '3':{1:[.7,3],2:[.65,3],11:[.5,3.5],9:[.3,3.5],10:[.25,3.5]},
  '0':{1:[.3,2.5],2:[.2,2.5],9:[.15,2.5],15:[.02,2.5]},
  '4':{1:[.5,3],8:[.5,3.5],9:[.3,3.5],11:[.5,3.5]}
};

// ★ V3.0 新增: Turn防御表 — OOP面对CBet后的继续范围
// 键: 纹理key, 值: {手牌类:[fold%, call%, raise%]}
var _TURN_DEFENSE={
  '0':{0:[.0,.5,.5],1:[.1,.5,.4],3:[.2,.5,.3],4:[.3,.5,.2],6:[.5,.4,.1],8:[.3,.3,.4],9:[.4,.4,.2],13:[.7,.2,.1],14:[.8,.15,.05],15:[.85,.1,.05]},
  '2':{0:[.0,.3,.7],1:[.1,.3,.6],2:[.15,.35,.5],3:[.3,.4,.3],4:[.4,.4,.2],8:[.2,.3,.5],9:[.35,.4,.25],11:[.15,.25,.6],13:[.6,.3,.1],14:[.75,.2,.05],15:[.8,.15,.05]},
  '3':{0:[.0,.4,.6],1:[.2,.4,.4],2:[.25,.4,.35],3:[.4,.4,.2],11:[.2,.3,.5],9:[.4,.4,.2],13:[.7,.25,.05],15:[.85,.1,.05]},
  '4':{0:[.0,.3,.7],1:[.15,.35,.5],4:[.4,.4,.2],8:[.15,.25,.6],9:[.3,.4,.3],11:[.1,.2,.7],13:[.6,.3,.1],15:[.8,.15,.05]},
  '5':{0:[.0,.6,.4],1:[.1,.55,.35],3:[.25,.5,.25],4:[.4,.45,.15],9:[.5,.4,.1],13:[.65,.3,.05],15:[.8,.15,.05]}
};

// ★ V3.0 新增: River价值下注表
// [频率, 尺寸倍数(×pot)] — 轻价值33%, 中价值66%, 重价值100%+
var _RIV_VALUE={
  '0':{0:[.95,.8],1:[.9,.75],2:[.85,.7],3:[.7,.6],4:[.65,.55],6:[.4,.4],9:[.3,.45],13:[.1,.33],15:[.05,.33]},
  '2':{0:[.9,.85],1:[.85,.8],2:[.8,.75],3:[.65,.65],4:[.55,.6],8:[.7,.7],9:[.45,.55],11:[.65,.65],13:[.15,.4],15:[.05,.33]},
  '3':{0:[.85,.9],1:[.8,.85],2:[.75,.8],3:[.55,.7],4:[.5,.65],11:[.6,.7],9:[.4,.6],13:[.1,.45],15:[.03,.33]},
  '4':{0:[.9,.85],1:[.85,.8],4:[.6,.65],8:[.75,.7],9:[.45,.6],11:[.7,.7],13:[.15,.45],15:[.05,.33]},
  '5':{0:[.9,.7],1:[.85,.65],3:[.7,.6],4:[.6,.55],9:[.4,.5],13:[.15,.4],15:[.05,.33]}
};

// ★ V3.0 新增: GG扑克各级别人群基准
var _GG_LEVEL_BASELINE={
  micro_nl2:{   // NL2-NL5
    vpip:36, pfr:18, threeBet:6, foldTo3Bet:35, cbetFlop:40, cbetTurn:32,
    foldToCBetFlop:55, foldToCBetTurn:50, callRiver:65, checkRaiseFlop:6,
    sd:{vpip:10,pfr:7,threeBet:3,foldTo3Bet:15,cbetFlop:12,cbetTurn:10,foldToCBetFlop:15,foldToCBetTurn:15,callRiver:18,checkRaiseFlop:4}
  },
  low_nl10:{    // NL10-NL25
    vpip:30, pfr:22, threeBet:8, foldTo3Bet:45, cbetFlop:48, cbetTurn:38,
    foldToCBetFlop:50, foldToCBetTurn:48, callRiver:55, checkRaiseFlop:8,
    sd:{vpip:9,pfr:7,threeBet:4,foldTo3Bet:13,cbetFlop:11,cbetTurn:10,foldToCBetFlop:14,foldToCBetTurn:14,callRiver:16,checkRaiseFlop:5}
  },
  mid_nl50:{   // NL50-NL100
    vpip:26, pfr:22, threeBet:9, foldTo3Bet:52, cbetFlop:52, cbetTurn:40,
    foldToCBetFlop:48, foldToCBetTurn:46, callRiver:48, checkRaiseFlop:10,
    sd:{vpip:8,pfr:6,threeBet:4,foldTo3Bet:12,cbetFlop:10,cbetTurn:11,foldToCBetFlop:13,foldToCBetTurn:14,callRiver:14,checkRaiseFlop:5}
  }
};

var _DB_TURN={
  '0':{0:[.8],1:[.7],3:[.6],4:[.5],8:[.6],9:[.4],15:[.15]},
  '2':{0:[.7],1:[.55],8:[.6],9:[.35],11:[.5],15:[.08]},
  '3':{0:[.6],1:[.4],11:[.35],15:[.03]},
  '4':{0:[.7],1:[.5],8:[.6],9:[.35],15:[.05]},
  '5':{0:[.8],1:[.7],3:[.6],4:[.5],9:[.35],15:[.15]}
};

var _RIV_BLUFF={.25:.2,.33:.25,.5:.33,.66:.4,.75:.43,1:.5,1.5:.6,2:.67};

// ====== 第三部分: 核心引擎 ======

function _pos5(p){var m={utg1:'UTG1',utg:'UTG1',mp:'MP',mp1:'MP',hj:'MP',co:'CO',btn:'BTN',sb:'SB',bb:'BB'};return m[p]||'BTN';}

function _bt2key(bt){
  if(!bt||bt.category==='preflop')return'0';
  var w=bt.wetness||0,c=bt.category||'dry';
  if(c==='paired'||c==='static')return'5';
  if(c==='wet')return bt.hasMonotone?'4':'2';
  if(c==='semi-wet')return bt.hasPaired?'5':'6';
  if(w<=1)return'0';
  return '1';
}

// V3.18: 新表(CBet/DB/River等)只有0/2/3/4/5键 — 把1/6映射到最接近的
function _bt2keyNewTable(btKey){
  if(btKey==='1')return'0';  // 中等干→干面表
  if(btKey==='6')return'2';  // 半湿对子→湿润表(注:'6'实际是semi-wet无paired)
  return btKey;
}

function _hc2key(hc){
  if(!hc)return 15;
  var n=hc.name;
  if(n==='NUTS')return 0;if(n==='STRONG')return 4;
  if(n==='MEDIUM')return 6;
  if(n==='DRAW')return hc.outs>=12?11:hc.outs>=8?9:hc.outs>=6?10:12;
  if(n==='AIR')return 15;
  return 6;
}

// ★ V3.0: GG级别自适应GTO基线
var _GTO_MICRO={vpip:.36,pfr:.18,threeBet:.06,foldTo3Bet:.35,cbetFlop:.40,cbetTurn:.32,foldToCBetFlop:.55,foldToCBetTurn:.50,callRiver:.65,checkRaiseFlop:.06};
var _GTO_SD_M  ={vpip:.10,pfr:.07,threeBet:.03,foldTo3Bet:.15,cbetFlop:.12,cbetTurn:.10,foldToCBetFlop:.15,foldToCBetTurn:.15,callRiver:.18,checkRaiseFlop:.04};

var _GTO={vpip:.28,pfr:.22,threeBet:.09,foldTo3Bet:.5,cbetFlop:.55,cbetTurn:.42,foldToCBetFlop:.47,foldToCBetTurn:.45,callRiver:.5,checkRaiseFlop:.1};
var _GTO_SD={vpip:.08,pfr:.06,threeBet:.04,foldTo3Bet:.12,cbetFlop:.1,cbetTurn:.12,foldToCBetFlop:.12,foldToCBetTurn:.15,callRiver:.15,checkRaiseFlop:.06};

// ★ V3.0: 根据级别选基线
function _getBaseline(){
  var lvl = G.ggLevel || 'micro_nl2';
  var bl = _GG_LEVEL_BASELINE[lvl];
  if(!bl) return {gto:_GTO, sd:_GTO_SD};
  // 归一化百分比到小数
  var gto={}, sd={};
  for(var k in bl){
    if(k==='sd') continue;
    gto[k] = (bl[k]||0) / 100;
  }
  for(var k2 in bl.sd||{}){
    sd[k2] = (bl.sd[k2]||5) / 100;
  }
  return {gto:gto, sd:sd};
}

function _oppDev(stat,actual,gto,sd){
  if(actual<0||!sd||sd===0)return 0;
  return(actual-gto)/sd;
}

function _quantExploitAdjust(freq, act, oppProfile, boardTexture){
  var adj={freq:freq, sizingMult:1.0, note:''};
  if(!oppProfile||oppProfile.confidence<0.15) return adj;
  var bl = _getBaseline();
  var gto=bl.gto, sd=bl.sd;

  var vpipDev = _oppDev('vpip', oppProfile.vpip, gto.vpip, sd.vpip);
  if(vpipDev>2 && act==='raise'){
    adj.freq = Math.max(0.1, freq*(1-vpipDev*0.1));
    adj.sizingMult = 1.0 + Math.min(vpipDev*0.05, 0.3);
    adj.note = 'vpip'+oppProfile.vpip+'→价值下注加大';
  }

  var pfrRatio = oppProfile.vpip>0 ? oppProfile.pfr/oppProfile.vpip : 0.5;
  if(pfrRatio>0.75 && act==='raise'){
    adj.freq = Math.min(0.95, freq*1.15);
    adj.sizingMult = 0.85;
    adj.note = 'vs激进(VPIP/PFR'+oppProfile.vpip+'/'+oppProfile.pfr+')→小尺寸';
  }

  var ftCBDev = _oppDev('foldToCBetFlop', oppProfile.foldToCBetFlop, gto.foldToCBetFlop, sd.foldToCBetFlop);
  if(ftCBDev>1 && act==='raise'){
    adj.freq = Math.min(0.95, freq*1.2);
    adj.sizingMult = Math.max(0.45, adj.sizingMult*0.7);
    adj.note = 'f2CB'+oppProfile.foldToCBetFlop+'→高频小尺寸';
  }

  return adj;
}

function _sprSizingAdjust(spr, baseSizing, scene){
  // V3.23: 修正单位混乱 — baseSizing是金额, spr倍率×pot才是金额
  var pot=G.pot||1;
  if(spr<2) return Math.min(baseSizing, pot*0.6);
  if(spr<5) return Math.min(baseSizing, pot*0.75);
  if(spr>12) return baseSizing*1.2;
  return baseSizing;
}

// ★ V3.0: 多尺度sizing选择
// V3.14: GG四档sizing快照 — 策略输出的任意比例映射到GG仅有的四档
function _snapToGGTiers(pct){
  // GG只有: 33% / 50% / 75% / 100% (及allin由执行层单独处理)
  if(pct>=0.875) return 1.0;
  if(pct>=0.625) return 0.75;
  if(pct>=0.415) return 0.5;
  return 0.33;
}

function _pickSizing(sizingObj, bTexture, spr){
  var pct;
  if(typeof sizingObj==='object' && sizingObj.d!==undefined){
    var cat=bTexture.category||'dry';
    var wet=bTexture.wetness||0;
    if(cat==='paired'||cat==='static') pct=sizingObj.p;
    else if(wet>=2) pct=sizingObj.w;
    else pct=sizingObj.d;
  } else {
    pct = sizingObj; // fallback to number
  }
  var adj=_sprSizingAdjust(spr, pct, 'cbet');
  // V3.14: 映射到GG四档
  var snapped=_snapToGGTiers(adj);
  if(snapped!==adj&&G._seEnabled){console.log('[SE] sizing '+Math.round(adj*100)+'%→GG档位'+Math.round(snapped*100)+'%');}
  return snapped;
}

function _pickRivSizing(handClass, eq, pot, spr){
  var btKey = _bt2keyNewTable(_bt2key(bTexture));
  var hcKey = _hc2keySafe(_hc2key(handClass),'_RIV');
  if(hcKey===null) return pot*0.45;
  var rv=_RIV_VALUE[btKey]&&_RIV_VALUE[btKey][hcKey];
  if(!rv) return pot*0.45;
  var sizingMult=rv[1];
  return _sprSizingAdjust(spr, pot*sizingMult, 'river_value');
}

// V3.0: Turn防御决策
function decideTurnDefense(k, spr, eq, oppProfile, bTexture, hClass){
  var street = getCurrentStreet();
  if(street!=='turn') return null;
  var didPFR=ActionLine.didPreflopRaise();
  if(didPFR) return null; // 不是被CBet后的一方
  var scene = G.scene||'check';
  if(scene!=='raise') return null; // 必须面对下注

  var btKey=_bt2keyNewTable(_bt2key(bTexture));
  var hcKey=_hc2keySafe(_hc2key(hClass),'_TURN_DEFENSE');
  if(hcKey===null) return null;
  var td=_TURN_DEFENSE[btKey]&&_TURN_DEFENSE[btKey][hcKey];
  if(!td) return null;

  var foldP=td[0], callP=td[1], raiseP=td[2];
  var pot=G.pot||1, bet=G.bet||0, stk=G.stk||100000;

  // 定量剥削调整
  var oppType=G.opp||'unknown';
  var cbetTDev = _oppDev('cbetTurn', oppProfile.cbetTurn, _GTO.cbetTurn, _GTO_SD.cbetTurn);
  if(cbetTDev>1.5){
    raiseP = Math.min(raiseP*1.3, 0.8);
    foldP = foldP * 0.7;
  }

  var rand=Math.random();
  if(rand<raiseP){
    var raiseSz=Math.round(bet*2.8);
    raiseSz=_sprSizingAdjust(spr, Math.min(raiseSz, stk), 'turn_raise');
    return{a:'raise', v:raiseSz, r:'GTO Turn raise('+Math.round(raiseP*100)+'%)', eq:eq, c:eq>=50?'h':'m', sizing:raiseSz, scene:'Turn反加', spr:spr, _se:true};
  }else if(rand<raiseP+callP){
    return{a:'call', r:'GTO Turn call('+Math.round(callP*100)+'%)', eq:eq, c:'m', scene:'Turn跟注', spr:spr, _se:true};
  }else{
    return _fold(eq, 'GTO Turn fold('+Math.round(foldP*100)+'%)', spr);
  }
}

// River价值下注决策
function decideRiverValue(k, spr, eq, oppProfile, bTexture, hClass){
  var street=getCurrentStreet();
  if(street!=='river') return null;
  var scene=G.scene||'check';
  if(scene!=='check') return null;
  var didPFR=ActionLine.didPreflopRaise();
  if(!didPFR) return null;

  var btKey=_bt2keyNewTable(_bt2key(bTexture));
  var hcKey=_hc2keySafe(_hc2key(hClass),'_RIV');
  if(hcKey===null) return null;
  var rv=_RIV_VALUE[btKey]&&_RIV_VALUE[btKey][hcKey];
  if(!rv) return null;

  var rvFreq=rv[0], rvMult=rv[1];
  var pot=G.pot||1, stk=G.stk||100000;

  if(Math.random()<rvFreq){
    // V3.14: GG四档快照 — 价值倍数也映射到GG支持的比例
    rvMult=_snapToGGTiers(rvMult);
    var rvSz=Math.round(pot*rvMult);
    rvSz=_sprSizingAdjust(spr, Math.min(rvSz, stk), 'river_value');
    return{a:'raise', v:rvSz, r:'GTO River价值('+Math.round(rvFreq*100)+'%) '+(rvMult*100).toFixed(0)+'%pot',
      eq:eq, c:'h', sizing:rvSz, scene:'River价值', spr:spr, _se:true, _seFreq:rvFreq};
  }

  // River不价值bet→check
  return{a:'check', r:'GTO River check('+Math.round((1-rvFreq)*100)+'%)', eq:eq, c:'m', scene:'River check', spr:spr, _se:true};
}

// Turn Double Barrel
function decideTurnDoubleBarrel(k, spr, eq, oppProfile, bTexture, hClass){
  var street=getCurrentStreet();
  if(street!=='turn') return null;
  if(!ActionLine.didPreflopRaise()) return null;
  if(!ActionLine.didCbetOnFlop()) return null;

  var btKey=_bt2key(bTexture);
  var hcKey=_hc2key(hClass);
  var dbTable=_DB_TURN[_bt2keyNewTable(btKey)];
  var _hcSafe2=_hc2keySafe(hcKey,'_DB');
  if(!dbTable||_hcSafe2===null||!dbTable[_hcSafe2]) return null;

  var dbFreq=dbTable[_hcSafe2][0];
  var pot=G.pot||1, stk=G.stk||100000;

  var adj=_quantExploitAdjust(dbFreq, 'raise', oppProfile, bTexture);
  dbFreq=adj.freq;

  if(Math.random()<dbFreq){
    var sizingPct = bTexture.wetness>=2?0.70:(bTexture.category==='paired'?0.50:bTexture.hasMonotone?0.65:0.55);
    sizingPct*=adj.sizingMult;
    // V3.14: GG四档快照
    sizingPct=_snapToGGTiers(sizingPct);
    var dbSz=Math.round(pot*sizingPct);
    dbSz=_sprSizingAdjust(spr, Math.min(dbSz, stk), 'double_barrel');
    return{a:'raise', v:dbSz, r:'GTO DB Turn('+Math.round(dbFreq*100)+'%) '+(sizingPct*100).toFixed(0)+'%',
      eq:eq, c:eq>=50?'h':'m', sizing:dbSz, scene:'DB Turn', spr:spr, _se:true, _seFreq:dbFreq, exploit:adj.note};
  }
  // V3.21: DB未命中→check兜底
  return{a:'check', r:'GTO Turn check(DB未中)', eq:eq, c:'m', scene:'check', spr:spr, _se:true};
}

// ====== 翻前决策 (保持V2.9.215) ======
function decidePreflop(k){
  // V3.9: 入参防护 — 识别失败时返回null让旧引擎/兜底接管
  if(!k||typeof k!=='string'||k.length<2){return null;}
  var p=G.pos||'btn', scene=G.scene||'check', stk=G.stk||100000, pot=G.pot||1, bet=G.bet||0;
  var spr=calcSPR(), eq=eQ(k);
  var profile=DRTA.getProfile(), oppType=G.opp||'unknown', p5=_pos5(p);

  // V3.24: 纳什push/fold — 短码(<15BB)时替代GTO策略
  if(spr<1.5){
    try{
      if(typeof NashPushFold!=='undefined'&&typeof NashPushFold.decide==='function'){
        var _nashEffBB=Math.round(1/Math.max(spr,0.02));
        if(_nashEffBB<=15){
          var _nashR=NashPushFold.decide(k,p,scene,spr,_nashEffBB,bet,pot);
          if(_nashR)return _nashR;
        }
      }
    }catch(e){}
  }

  var _specBonus=0;
  if(k.length===2&&k[0]===k[1]&&'23456'.indexOf(k[0])>=0)_specBonus+=8;
  if(k.indexOf('s')>=0&&k.length===3){var _sr=k.slice(0,2),_r1=RV[_sr[0]],_r2=RV[_sr[1]];if(_r1!==undefined&&_r2!==undefined){var _gap=Math.abs(_r1-_r2);if(_gap===1)_specBonus+=5;else if(_gap===2)_specBonus+=4;else _specBonus+=2;if(_sr[0]==='A')_specBonus+=3;}}
  if(k.indexOf('o')>=0&&k.length===3){var _sr2=k.slice(0,2),_r1b=RV[_sr2[0]],_r2b=RV[_sr2[1]];if(_r1b!==undefined&&_r2b!==undefined){if(Math.abs(_r1b-_r2b)===1&&_r2b<=9)_specBonus+=2;if(_sr2[0]==='A'&&_r2b<=9)_specBonus+=3;}}
  var _specSPRMult={ultra_short:.1,short:.3,med_short:.7,standard:1,deep:1.3}[SPRZone.getZone(spr)]||1;
  var _specPosMult={utg:.6,utg1:.7,mp:.8,mp1:.85,hj:.95,co:1.1,btn:1.2,sb:.9,bb:1}[p]||1;
  _specBonus=Math.round(_specBonus*_specSPRMult*_specPosMult);
  if(_specBonus>0)eq+=_specBonus;

  var posMod={utg:-6,utg1:-4.5,mp:-3,mp1:-1.5,hj:1,co:2,btn:6,sb:0,bb:1};
  eq+=(posMod[p]!==undefined?posMod[p]:0);
  if(BvBStrategy&&BvBStrategy.eqAdj)eq+=BvBStrategy.eqAdj();
  if(G.ante>0){var _ac=G.ante*(G.tt||6);var _ar=_ac/Math.max(pot,1);var _ab=Math.min(Math.round(_ar*12),5);if(_ab>0)eq+=_ab;}

  var tiltInfo=TiltDetector.detectTilt(profile);

  // 1: 开池
  if(scene==='check'||scene==='call'||scene==='open'){  // V3.26: 'open'=Straddle局开池场景
    var rfi=_RFI[p5];
    // V3.29b: BB check option — 无人加注时BB免费看牌
    if(p5==='BB'&&(scene==='check'||scene==='call'||scene==='open')&&bet===0){
      return{a:'check',r:'BB check option(无人加注免费看牌)',eq:eq,c:'m',scene:'看牌',spr:spr,_se:true,_seFreq:1};
    }
    if(!rfi)return null;var freq=rfi[k];
    // V3.29: limper调整 — 前面有人平跟时收紧范围(隔离加注质量更高)
    var _nLimpers=(G.limpers>0?G.limpers:0);
    if(_nLimpers>0){
      if(_nLimpers===1){freq=(freq===undefined?undefined:freq*0.85);}
      else{freq=(freq===undefined?undefined:freq*0.7);}
    }
    var adj=_quantExploitAdjust(freq||0,'raise',profile);freq=adj.freq>freq?adj.freq:(freq||0);
    if(freq===undefined||freq===0){if(oppType==='nit'||oppType==='tight')freq=0.05;else return _fold(eq,'不在'+p5+'RFI范围',spr);}
    if(Math.random()>freq)return _fold(eq,p5+' RFI '+Math.round(freq*100)+'%→弃牌',spr);
    var sz=_preflopSizing(p,pot,scene,spr);sz=_sprSizingAdjust(spr,sz,'open');
    var exploitR=applyExploit(eq,'raise',oppType,{bet:0,pot:pot});
    var weights=DRTA.getWeights?DRTA.getWeights(profile):{};
    return{a:'raise',v:sz,r:p5+' GTO RFI('+Math.round(freq*100)+'%) eq'+Math.round(eq),eq:exploitR.eq,c:eq>=60?'h':eq>=50?'m':'l',sizing:sz,scene:'开池',spr:spr,sprAdvice:getSPRAdvice(spr),exploit:adj.note||exploitR.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights},_se:true,_seFreq:freq};
  }

  // 2: 面对开池
  if(scene==='raise'){
    var raiserRole=G._raiserRole||'unknown',rP5=_pos5(raiserRole),vsKey='vs_'+rP5,fromKey='from_'+p5;
    var tb=_3B[vsKey];if(!tb)return null;var posTable=tb[fromKey];if(!posTable)return null;
    var entry=posTable[k];if(!entry)return _fold(eq,'vs '+rP5+' open不在3B范围',spr);
    var act=entry.a,f=entry.f;f=_adjFreq3bet(act,f,oppType,raiserRole,p);
    if(act==='3b'){var adj3=_quantExploitAdjust(f,'raise',profile);f=adj3.freq>f?Math.min(1,adj3.freq):f;}
    if(Math.random()>f){if(act==='3b'){act='c';f=_get3bAlt(k,posTable,'c')||0.3;}else if(act==='c')return _fold(eq,'vs '+rP5+' call频率'+Math.round(f*100)+'%未命中',spr);else return _fold(eq,'vs '+rP5+' fold',spr);}
    var actualBet=bet||pot*2.5;
    if(act==='3b'){var sz3=Math.round(actualBet*3);sz3=_sprSizingAdjust(spr,Math.min(sz3,stk),'3bet');var exploitR2=applyExploit(eq,'raise',oppType,{bet:actualBet,pot:pot,facing3bet:true});var weights2=DRTA.getWeights?DRTA.getWeights(profile):{};return{a:'raise',v:sz3,r:'GTO 3bet vs '+rP5+'('+Math.round(f*100)+'%)',eq:exploitR2.eq,c:'h',sizing:sz3,scene:'面对加注',spr:spr,sprAdvice:getSPRAdvice(spr),exploit:exploitR2.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights2},_se:true,_seFreq:f};}
    if(act==='c'){var exploitR3=applyExploit(eq,'call',oppType,{bet:actualBet,pot:pot});var weights3=DRTA.getWeights?DRTA.getWeights(profile):{};return{a:'call',r:'GTO call vs '+rP5+'('+Math.round(f*100)+'%)',eq:exploitR3.eq,c:eq>=50?'m':'l',scene:'面对加注',spr:spr,sprAdvice:getSPRAdvice(spr),evs:compareEVs(eq,pot,actualBet,0),exploit:exploitR3.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights3},_se:true,_seFreq:f};}
    return _fold(eq,'vs '+rP5+' fold',spr);
  }

  // 3: 面对3bet
  if(scene==='reraise'){
    var _f3bKey=p5==='MP'?'UTG1':p5;  // V3.31: MP位置用UTG1策略(5人桌早期位置)
    var f3b=_F3B[_f3bKey];if(!f3b)return null;var entry3=f3b[k];if(!entry3)return _fold(eq,k+' vs 3bet→fold',spr);
    var act3=entry3.a,f3=entry3.f;
    if(act3==='4b'&&Math.random()>f3){if(entry3.s){act3=entry3.s.a;f3=entry3.s.f;if(Math.random()>f3)return _fold(eq,k+' vs 3bet 4b未中→'+act3+'未中→fold',spr);}else return _fold(eq,k+' vs 3bet 4b'+Math.round(f3*100)+'%未中→fold',spr);}
    var actualBet3=bet||pot*3;
    if(act3==='4b'){var sz4=Math.round(actualBet3*2.5);sz4=_sprSizingAdjust(spr,Math.min(sz4,stk),'4bet');G._heroDid4bet=true;var exploitR4=applyExploit(eq,'raise',oppType,{bet:actualBet3,pot:pot,facing3bet:true});var weights4=DRTA.getWeights?DRTA.getWeights(profile):{};return{a:'raise',v:sz4,r:'GTO 4bet('+Math.round(f3*100)+'%)',eq:exploitR4.eq,c:'h',sizing:sz4,scene:'面对3bet',spr:spr,sprAdvice:getSPRAdvice(spr),evs:compareEVs(eq,pot,actualBet3,sz4),exploit:exploitR4.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights4},_se:true,_seFreq:f3};}
    if(act3==='c'){var exploitR5=applyExploit(eq,'call',oppType,{bet:actualBet3,pot:pot});var weights5=DRTA.getWeights?DRTA.getWeights(profile):{};return{a:'call',r:'GTO call 3bet('+Math.round(f3*100)+'%)',eq:exploitR5.eq,c:eq>=50?'m':'l',scene:'面对3bet',spr:spr,sprAdvice:getSPRAdvice(spr),evs:compareEVs(eq,pot,actualBet3,0),exploit:exploitR5.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights5},_se:true,_seFreq:f3};}
    return _fold(eq,'vs 3bet fold',spr);
  }

  // 4: 面对allin
  if(scene==='allin'){
    var allinBet=bet||pot,allinEq=eq+(posMod[p]!==undefined?posMod[p]:0);
    var callThresh=allinBet>0?Math.round(allinBet/(pot+allinBet*2)*100):50;callThresh=Math.max(callThresh,45);
    if(allinEq>=callThresh){var exploitA=applyExploit(allinEq,'call',G.opp,{bet:allinBet,pot:pot});return{a:'call',r:'GTO vs allin eq'+Math.round(allinEq)+'%>='+callThresh+'%',eq:exploitA.eq,c:allinEq>=65?'h':'m',scene:'面对allin',spr:spr,exploit:exploitA.exploit,_se:true};}
    return _fold(allinEq,'vs allin eq'+Math.round(allinEq)+'%<'+callThresh+'%',spr);
  }

  return null;
}

// ====== 翻后决策 ======
function decidePostflop(k){
  var h=G.hole||[],hole=h.filter(function(c){return c;});
  var comm=G.comm||[],bc=comm.filter(function(c){return c;});
  var pot=G.pot||1,bet=G.bet||0,stk=G.stk||100000;
  var spr=calcSPR();
  var ip=pA(G.pos)>=0.5;
  var scene=G.scene||'check';
  var street=getCurrentStreet();
  var bTexture=boardTexture(bc);
  var hClass=handClassify(hole,comm);
  var oppType=G.opp||'unknown';
  var profile=DRTA.getProfile();
  var eq;

  if(bc.length===5){var rs=riverExactEquity(hole,comm,getOppRange('postflop','cbet',bTexture.wetness>=2?'wet':'dry'));eq=rs.eq;}
  else{var mcI=bc.length===4?1200:1000;if(bet/(pot+bet)>=.66)mcI=Math.round(mcI*2);else if(bet/(pot+bet)>=.33)mcI=Math.round(mcI*1.3);var ms=mcVsRange(hole,comm,getOppRange('postflop','cbet',bTexture.wetness>=2?'wet':'dry'),Math.min(mcI,4000));eq=ms.eq;}
  _mcSimCache=null;

  var btKey=_bt2key(bTexture);
  var hcKey=_hc2key(hClass);
  var didPFR=ActionLine.didPreflopRaise();
  var weights=DRTA.getWeights?DRTA.getWeights(profile):{};

  // V3.28: 翻后面对allin — 权益阈值决策（与翻前同逻辑）
  if(scene==='allin'){
    var _aiBet=bet||pot;
    var _aiThresh=_aiBet>0?Math.round(_aiBet/(pot+_aiBet*2)*100):50;
    _aiThresh=Math.max(_aiThresh,40); // 翻后稍微放宽（有公共牌信息）
    if(eq>=_aiThresh){
      var _aiExploit=applyExploit(eq,'call',oppType,{bet:_aiBet,pot:pot});
      return{a:'call',r:'GTO 翻后vs allin eq'+Math.round(eq)+'%>='+_aiThresh+'%',eq:_aiExploit.eq,c:eq>=65?'h':'m',scene:'面对allin',spr:spr,_se:true};
    }
    return _fold(eq,'翻后vs allin eq'+Math.round(eq)+'%<'+_aiThresh+'%',spr);
  }

  // V3.12: 3bet底池/多人池检测 (旧引擎设置，我们丢失后补回)
  var _is3betPot=spr<10&&(ActionLine.didPreflopRaise()||G._faced3bet||G._heroDid4bet);
  G._is3betPot=_is3betPot;
  var _nActive=0;
  try{var _pl=G._lastPlayers||[];for(var _pi=0;_pi<_pl.length;_pi++){if(_pl[_pi]&&!_pl[_pi].folded&&_pl[_pi].active)_nActive++;}}catch(e){}
  if(_nActive<2)_nActive=2;
  var _isMultiway=_nActive>=3;
  G._isMultiway=_isMultiway;

  // ★ V3.1: StreetPlan多街计划 — 翻牌时生成计划，后续街检查
  var _planAdvice='';
  try{
    if(typeof StreetPlan!=='undefined'){
      if(street==='flop'&&didPFR&&scene==='check'){
        var flopPlan=StreetPlan.makePlan(hole,bc,G.pos,didPFR);
        if(flopPlan&&flopPlan.route)_planAdvice=' | 计划:'+flopPlan.route+(flopPlan.notes&&flopPlan.notes.length?('('+flopPlan.notes[0]+')'):'');
      }else if(street==='turn'&&bc.length===4){
        var newTurnCards=bc.slice(3,4);
        var planCheck=StreetPlan.checkPlan('turn',newTurnCards,bc);
        if(planCheck&&planCheck.adjustment)_planAdvice=' | 计划:'+planCheck.adjustment;
      }
    }
  }catch(e){}

  // ★ V3.1: RangeVsRange范围分析 — 翻牌时评估范围优势
  var _rangeAdvice='';
  try{
    if(typeof RangeVsRange!=='undefined'&&bc.length>=3&&didPFR&&scene==='check'){
      var myRangeName=G.pos==='btn'?'btn_open':'btn_open';
      var rrEq=RangeVsRange.calcRangeEquity(
        RangeVsRange.getRange(myRangeName),
        RangeVsRange.getRange('bb_call'),
        bc,
        120 // 手机端限制迭代数
      );
      if(rrEq&&rrEq.myEquity!==undefined){
        _rangeAdvice=' | 范围权益'+Math.round(rrEq.myEquity)+'%(坚果差'+rrEq.nutAdvantage+')';
      }
    }
  }catch(e){}

  // ★ V3.11: 完整EV枚举 — 优先于查表 (River/Turn用真实EV选行动)
  try{
    if(street==='river'&&didPFR&&scene==='check'&&typeof _riverFullEnumerateEV==='function'){
      var _evR=_riverFullEnumerateEV(k,hcKey,true,scene,bet,pot,btKey,ip,false,false,false,eq);
      if(_evR&&_evR.a){_evR.r=(_evR.r||'')+' | EV枚举';return _evR;}
    }
    if(street==='turn'&&didPFR&&scene==='check'&&typeof _turnFullEnumerateEV==='function'){
      var _evT=_turnFullEnumerateEV(k,hcKey,true,scene,bet,pot,btKey,ip,false,false,false,eq);
      if(_evT&&_evT.a){_evT.r=(_evT.r||'')+' | EV枚举';return _evT;}
    }
  }catch(e){}

  // ★ V3.0: River价值下注 (必须先检查，否则会被CBet/River诈唬覆盖)
  if(street==='river' && didPFR && scene==='check'){
    var rvResult = decideRiverValue(k, spr, eq, profile, bTexture, hClass);
    if(rvResult){
      if(_planAdvice||_rangeAdvice)rvResult.r=(rvResult.r||'')+_planAdvice+_rangeAdvice;
      return rvResult;
    }
  }

  // ★ V3.11: Flop/River面对下注 — 补全场景覆盖
  if(!didPFR && scene==='raise' && (street==='flop'||street==='river') && typeof _facingCBet==='function'){
    try{
      var _fcbR=_facingCBet(k,hcKey,btKey,ip,bet,pot,street,false);
      if(_fcbR&&_fcbR.a){return _fcbR;}
    }catch(e){}
  }

  // ★ V3.12: 面对Check-Raise (我们CBet后被反加)
  if(didPFR && scene==='reraise' && typeof _facingCR==='function'){
    try{
      var _fcrR=_facingCR(k,hcKey,btKey,bet,pot);
      if(_fcrR&&_fcrR.a){return _fcrR;}
    }catch(e){}
  }

  // ★ V3.12: Donk Bet (对手OOP主动下注)
  // V3.32: 用FrameDiffEngine检测donk（_facedDonk无人设置，死flag）
  var _isDonk=false;
  try{
    if(!didPFR && scene==='raise' && street!=='preflop'){
      var _fdA=typeof FrameDiffEngine!=='undefined'?FrameDiffEngine.getOppPostflopAction(street):null;
      // 翻牌圈对手先下注=donk; 或ActionLine记录对手先行动
      _isDonk = (_fdA&&_fdA==='bet') || G._facedDonk===true;
    }
  }catch(e){}
  if(!didPFR && scene==='raise' && typeof _donkDecision==='function' && _isDonk){
    try{
      var _donkR=_donkDecision(k,hcKey,btKey,ip,pot,oppType,null,_is3betPot,_isMultiway,street);
      if(_donkR&&_donkR.a){return _donkR;}
    }catch(e){}
  }

  // ★ V3.0: Turn防御 — OOP面对CBet
  if(street==='turn' && !ip && scene==='raise' && !didPFR){
    var tdResult = decideTurnDefense(k, spr, eq, profile, bTexture, hClass);
    if(tdResult) return tdResult;
  }

  // Turn Double Barrel
  if(street==='turn' && ip && scene==='check'){
    var dbResult = decideTurnDoubleBarrel(k, spr, eq, profile, bTexture, hClass);
    if(dbResult) return dbResult;
  }

  // ====== CBet ======
  if(didPFR&&scene==='check'&&street!=='river'){
    var cbTable=ip?_CBET_IP[_bt2keyNewTable(btKey)]:_CBET_OOP[_bt2keyNewTable(btKey)];
    var _hcSafe=_hc2keySafe(hcKey,'_CBET');
    if(cbTable&&_hcSafe!==null&&cbTable[_hcSafe]){
      var cb=cbTable[_hcSafe];
      var cbFreq=cb[0];
      if(ip&&scene==='check'){
        var adj=_quantExploitAdjust(cbFreq,'raise',profile,bTexture);
        cbFreq=adj.freq;
      }
      if(Math.random()<cbFreq){
        var cbPct=_pickSizing(cb[1],bTexture,spr);
        var cbSz=Math.round(pot*cbPct);cbSz=Math.min(cbSz,stk);
        var exploitR=applyExploit(eq,ip?'bet':'bet',oppType,{bet:bet,pot:pot});
        return{a:'raise',v:cbSz,r:'GTO CBet '+btKey+'/'+hcKey+'('+Math.round(cbFreq*100)+'%)',eq:exploitR.eq,c:eq>=55?'h':eq>=45?'m':'l',sizing:cbSz,scene:'CBet',spr:spr,sprAdvice:getSPRAdvice(spr),exploit:exploitR.exploit,drta:{type:profile.type,conf:profile.confidence,weights:weights},_se:true,_seFreq:cbFreq};
      }else{
        var exploitR2=applyExploit(eq,'check',oppType,{bet:0,pot:pot});
        return{a:'check',r:'GTO check('+Math.round((1-cbFreq)*100)+'%频率)',eq:exploitR2.eq,c:'m',scene:'check',spr:spr,sprAdvice:getSPRAdvice(spr),_se:true};
      }
    }
  }

  // ====== Check-Raise ======
  if(!ip&&scene==='raise'&&!didPFR&&street==='flop'){
    var crTable=_CR[_bt2keyNewTable(btKey)];
    var _hcCR=_hc2keySafe(hcKey,'_CR');
    if(crTable&&_hcCR!==null&&crTable[_hcCR]){
      var cr=crTable[_hcCR];var crFreq=cr[0];var crSzMult=cr[1];
      if(OppProfiler&&OppProfiler.getStat){var oppCB=OppProfiler.getStat('cbetFlop');if(oppCB>.7)crFreq=Math.min(.3,crFreq*1.5);}
      if(Math.random()<crFreq){
        var crSz=Math.round(bet*crSzMult);crSz=_sprSizingAdjust(spr,Math.min(crSz,stk),'check_raise');
        var exploitCR=applyExploit(eq,'raise',oppType,{bet:bet,pot:pot});
        return{a:'raise',v:crSz,r:'GTO CR '+btKey+'/'+hcKey+'('+Math.round(crFreq*100)+'%)',eq:exploitCR.eq,c:eq>=50?'h':'m',sizing:crSz,scene:'Check-Raise',spr:spr,_se:true,_seFreq:crFreq};
      } else {
        // V3.21: CR未命中频率 → call兜底（面对CBet不能静默弃牌）
        var _callEq = applyExploit(eq,'call',oppType,{bet:bet,pot:pot});
        return{a:'call',r:'GTO 面CBet call(CR未中)',eq:_callEq.eq,c:'m',scene:'面对CBet',spr:spr,_se:true,_seFreq:crFreq};
      }
    }
  }

  // ====== River诈唬 ======
  if(street==='river'&&scene==='check'){
    if(didPFR&&hClass&&hClass.name==='AIR'){
      var bluffPct=.5;var bluffRatio=_RIV_BLUFF[bluffPct]||.33;
      if(oppType==='calling_station'||oppType==='fish')bluffRatio*=.2;
      if(oppType==='nit'||oppType==='tight')bluffRatio*=1.4;
      if(Math.random()<bluffRatio){
        var blSz=Math.round(pot*bluffPct);blSz=_sprSizingAdjust(spr,Math.min(blSz,stk),'river_bluff');
        var exploitBL=applyExploit(eq,'raise',oppType,{bet:0,pot:pot});
        return{a:'raise',v:blSz,r:'GTO River诈唬('+Math.round(bluffRatio*100)+'%)',eq:exploitBL.eq,c:'l',sizing:blSz,scene:'River诈唬',spr:spr,_se:true,_seFreq:bluffRatio};
      }
    }
  }

  return null;
}



// ====== V3.11: 合并v2.9.164的EV计算核心 ======
function _computeFullEVCore(scene, betSz, pot, eq, _prof, _sprAdj, _is3bP, _isMW, stk){
    var evs={}, bestA=null, bestEV=-99999, bestSz=0;
    var _statFold=0.55, _statCall=0.32, _statRaise=0.13;
    // V2.9.162fix3: DRTA.getProfile() 实际字段是 fold_to_bet (50默认), 没有 callsBet
    if(_prof&&typeof _prof.fold_to_bet==='number'){
      _statFold=Math.max(0,Math.min(1,_prof.fold_to_bet/100));
      // callsBet 字段不存在 - 用 af (aggression factor) 推算: 高af→少call多raise
      if(typeof _prof.af==='number'&&_prof.af>0){
        _statCall=Math.max(0.20,Math.min(0.50,0.50-_statFold*(1-1/Math.max(_prof.af,1))));
        _statRaise=1-_statFold-_statCall;
      }else{
        _statRaise=Math.max(0.05,1-_statFold-0.32);
        _statCall=0.32;
      }
      if(_statRaise<0.02)_statRaise=0.02;
    }
    if(_isMW){_statFold=Math.min(0.85,_statFold*1.25);_statCall=Math.max(0.20,_statCall);}
    if(_is3bP){_statFold=Math.max(0.25,_statFold*0.85);}
    var _canBluff=_sprAdj&&_sprAdj.bluff>0.3;
    if(scene==='check'){
      var s33=Math.round(pot*0.33);
      var s75=Math.round(pot*0.75);
      evs.check=eq*pot;
      evs.betValue=-99999; evs.betValueSz=s33;
      var _betList=[s33,s75];
      for(var bi=0;bi<_betList.length;bi++){
        var bs=_betList[bi];
        var ev=eq*(pot+bs)-(1-eq)*bs*_statCall;
        if(ev>evs.betValue){evs.betValue=ev;evs.betValueSz=bs;}
      }
      evs.bluff=-99999; evs.bluffSz=0;
      if(_canBluff&&eq<0.40){
        for(var bj=0;bj<_betList.length;bj++){
          var bs2=_betList[bj];
          var bluffEV=_statFold*bs2 + (1-_statFold)*(eq*(pot+bs2)-(1-eq)*bs2);
          if(bluffEV>evs.bluff){evs.bluff=bluffEV;evs.bluffSz=bs2;}
        }
      }
      if(evs.check>bestEV){bestA='check';bestEV=evs.check;bestSz=0;}
      // V2.9.162fix2: 价值bet需要vBet显著超过chk (>=15%pot差)
      if(evs.betValue>bestEV&&evs.betValue-evs.check>=0.15*pot){bestA='bet';bestEV=evs.betValue;bestSz=evs.betValueSz;}
      // V2.9.162fix: bluff仅在"价值bet EV <= check EV"时启用
      if(evs.betValue<=evs.check&&evs.bluff>bestEV){bestA='bluff';bestEV=evs.bluff;bestSz=evs.bluffSz;}
    }else{
      evs.fold=0;
      evs.call=eq*(pot+betSz)-(1-eq)*betSz;
      var raiseSz=Math.round(Math.max(betSz*2.5,pot*1.5));
      raiseSz=Math.min(raiseSz,stk||100000);
      // V2.9.162fix3: foldsToRaise 字段不存在 - 用 3bet 字段反推 (3bet 越高, raise 弃牌越少)
      var _raiseFold=0.40;
      if(_prof){
        if(typeof _prof.foldsToRaise==='number')_raiseFold=_prof.foldsToRaise;
        // V2.9.162fix3: 仅当 threebet 有实际数据(>=5)才反推,避免默认值0.40→0.55破坏air face场景
        else if(typeof _prof.threebet==='number'&&_prof.threebet>=5)_raiseFold=Math.max(0.20,Math.min(0.65,0.55-_prof.threebet/100*0.5));
      }
      if(_isMW)_raiseFold=Math.min(0.7,_raiseFold*1.2);
      var callAfterEq=eq*0.70;
      evs.raise=_raiseFold*(pot+betSz) + (1-_raiseFold)*(callAfterEq*(pot+raiseSz)-(1-callAfterEq)*raiseSz);
      if(evs.fold>bestEV){bestA='fold';bestEV=evs.fold;bestSz=0;}
      if(evs.call>bestEV){bestA='call';bestEV=evs.call;bestSz=0;}
      if(evs.raise>bestEV){bestA='raise';bestEV=evs.raise;bestSz=raiseSz;}
    }
    if(!bestA)return null;
    return{evs:evs,bestA:bestA,bestEV:bestEV,bestSz:bestSz,_statFold:_statFold,_raiseFold:_raiseFold};
  }

function _classifyTurnCard(hole,comm){
    if(!comm||comm.length<4)return 'b';
    var flopComm=comm.slice(0,3).filter(function(c){return c;});
    var turnCard=comm[3];
    if(!turnCard)return 'b';
    var flopWet=boardTexture(flopComm);
    var allComm=comm.slice(0,4).filter(function(c){return c;});
    var turnWet=boardTexture(allComm);
    if(!flopWet||!turnWet)return 'b';
    var dw=turnWet.wetness-(flopWet.wetness||0);
    if(dw>=2)return 'w'; // 湿度增加→对PFR不利
    if(dw<=-1)return 'i'; // 湿度降低→对PFR有利
    return 'b';
  }

function _turnBarrel(k,hcKey,btKey,turnType,betSz,pot,didFlopCBet,ip,_oppType,_sprAdj2,_is3bP2,_isMW2){
    var btFallback={6:'4',1:'0',3:'2'};
    var _tbTable=ip?_TB_IP:_TB_OOP;
    if(!_tbTable[btKey+'_'+turnType]){btKey=btFallback[btKey]||btKey;}
    var table=_tbTable[btKey+'_'+turnType];
    if(!table||!table[hcKey])return null;
    var e=table[hcKey];
    var barrelFreq=e[0];barrelFreq=_applyPipeline(barrelFreq,'bet',hcKey,_oppType||oppType,'turn','barrel',_sprAdj2||_sprAdj,_is3bP2!==undefined?_is3bP2:_is3betPot,_isMW2!==undefined?_isMW2:_isMultiway);
    // V2.9.161: Flop未CBet时大幅降低barrel频率
    if(didFlopCBet===false)barrelFreq=barrelFreq*0.3;
    var spr=calcSPR();
    if(Math.random()<barrelFreq){
      var bSz=Math.round(pot*e[1]);
      bSz=Math.min(bSz,G.stk||100000);
      var _oppStatStr1i='';
      try{if(OppProfiler&&OppProfiler._profiles){var _oppNk1i=OppProfiler._getOppNk?OppProfiler._getOppNk():null;if(_oppNk1i){var _ftCB1i=OppProfiler.getFoldToTurnCBetPct(_oppNk1i);var _cbt1i=OppProfiler.getCbetTurnPct(_oppNk1i);if(_ftCB1i!==null||_cbt1i!==null)_oppStatStr1i=' H:'+(_ftCB1i!==null?_ftCB1i+'%ftcb':'')+(_cbt1i!==null?'/'+_cbt1i+'%cb':'');}}}catch(e){}
      return{a:'raise',v:bSz,r:'GTO Turn barrel '+btKey+'/'+turnType+'/'+hcKey+'('+Math.round(e[0]*100)+'%)'+_oppStatStr1i,eq:0,c:e[0]>.7?'h':'m',sizing:bSz,scene:'Turn Barrel',_se:true,_seFreq:e[0]};
    }
    // 不Barrel → check
    return{a:'check',r:'GTO Turn giveup '+btKey+'/'+turnType+'/'+hcKey,eq:0,c:'m',scene:'Turn Check',spr:spr,_se:true};
  }

function _riverDecision(k,hcKey,hasInitiative,scene,betSz,pot,btKey,ip,_sprAdj3,_is3bP3,_isMW3){
    // V2.9.161: River按面纹理+位置选择策略表
    var rivTbl=ip?_RIV.IP:_RIV.OOP;
    var rivKey=btKey+'_'+(scene==='check'?'bet':'face');
    var table=rivTbl[rivKey];
    if(!table){rivKey='0_'+(scene==='check'?'bet':'face');table=rivTbl[rivKey];}
    if(!table||!table[hcKey])return null;
    var e=table[hcKey];// V2.9.161: River SPR/3bet/Multiway调整
        var _rivAdj=1;
        if(e.a==='bluff'){
          if(_sprAdj.bluff<0.5)_rivAdj=0; // 短码不诈唬
          else _rivAdj=_sprAdj.bluff;
          if(_is3betPot)_rivAdj*=0.5; // 3bet底池诈唬减半
          if(_isMultiway)_rivAdj*=0.3; // 多人池几乎不诈唬
        }
        if(e.a==='bet'&&hcKey>=9&&hcKey<=11){
          // 听牌未成: SPR调整
          _rivAdj*=_sprAdj.cbet;
          if(_is3betPot)_rivAdj*=0.7;
        }
        if(_rivAdj<0.3&&e.a==='bluff'){e={a:'check',s:0};} // 调整后诈唬概率太低→check
    var spr=calcSPR();
    if(e.a==='bet'||e.a==='bluff'){
      var rSz=Math.round(pot*e.s);
      rSz=Math.min(rSz,G.stk||100000);
      return{a:'raise',v:rSz,r:'GTO River '+(e.a==='bluff'?'诈唬':'价值')+' '+hcKey+'('+Math.round(e.s*100)+'%pot)',eq:0,c:e.a==='bluff'?'l':'h',sizing:rSz,scene:'River '+(e.a==='bluff'?'诈唬':'价值'),spr:spr,_se:true};
    }
    if(e.a==='call'){
      return{a:'call',r:'GTO River call '+hcKey,eq:0,c:'m',scene:'River Call',spr:spr,_se:true};
    }
    if(e.a==='raise'){
      var rrSz=Math.round(Math.max(betSz*2.5,pot*e.s));
      rrSz=Math.min(rrSz,G.stk||100000);
      return{a:'raise',v:rrSz,r:'GTO River raise '+hcKey,eq:0,c:'h',sizing:rrSz,scene:'River Raise',spr:spr,_se:true};
    }
    if(e.a==='check'){
      return{a:'check',r:'GTO River check '+hcKey,eq:0,c:'m',scene:'River Check',spr:spr,_se:true};
    }
    if(e.a==='fold'){
      return _fold(0,'River fold '+hcKey,spr);
    }
    return null;
  }

function _riverFullEnumerateEV(k,hcKey,hasInitiative,scene,betSz,pot,btKey,ip,_sprAdj,_is3bP,_isMW,preEq){
    var h=G.hole||[];
    var comm=G.comm||[];
    var hole=h.filter(function(c){return c;});
    var bc=comm.filter(function(c){return c;});
    if(hole.length<2||bc.length<5)return null;
    if(typeof hole[0]==='string'){
      hole=hole.map(function(s){var m=s&&s.match(/^([2-9TJQKA])([♠♥♦♣])$/);return m?{rank:m[1],suit:m[2]}:null;}).filter(function(c){return c;});
    }
    if(typeof bc[0]==='string'){
      bc=bc.map(function(s){var m=s&&s.match(/^([2-9TJQKA])([♠♥♦♣])$/);return m?{rank:m[1],suit:m[2]}:null;}).filter(function(c){return c;});
    }
    // V2.9.162perf: 优先复用decidePostflop已计算的eq,避免重复riverExactEquity (从~20ms降到<10ms)
    var eq, eqR;
    if(typeof preEq==='number'&&preEq>0){
      eq=preEq/100;
      eqR={eq:preEq,combos:1};
    }else{
      var bTexture=boardTexture(bc);
      var oppRange=getOppRange('postflop','cbet',bTexture.wetness>=2?'wet':'dry');
      if(!oppRange||oppRange.length===0)return null;
      eqR=riverExactEquity(hole,bc,oppRange);
      if(!eqR||eqR.combos===0)return null;
      eq=eqR.eq/100;
    }
    // V2.9.162perf: DRTA.getProfile() 一次获取 (子任务4: 字段映射在 _computeFullEVCore 内部处理)
    var _prof=null;
    try{_prof=DRTA.getProfile();}catch(e){}
    // V2.9.162: 调用公共EV计算核心 (子任务4: turn/river共用, _statFold/_raiseFold 全部在 core 内计算)
    var _coreR=_computeFullEVCore(scene,betSz,pot,eq,_prof,_sprAdj,_is3bP,_isMW,G.stk||100000);
    if(!_coreR)return null;
    var evs=_coreR.evs, bestA=_coreR.bestA, bestEV=_coreR.bestEV, bestSz=_coreR.bestSz;
    var _statFold=_coreR._statFold, _raiseFold=_coreR._raiseFold;
    if(!bestA)return null;
    var rH=Math.round(eq*100);
    var result={
      // V3.20: action归一化 — 'bet'/'bluff'→'raise' (Kotlin执行层只认raise)
      a:(bestA==='bet'||bestA==='bluff')?'raise':bestA, v:bestSz,
      r:'',
      eq:rH,
      c:eq>=0.5?'h':(eq>=0.3?'m':'l'),
      spr:calcSPR(),
      _se:true,
      _seEV:true,
      ev:bestEV,
      evs:evs,
      scene:scene==='check'?'River Bet':'River Face',
      _evExplain:[]
    };
    var exp=[];
    exp.push('EV='+(bestEV/Math.max(pot,1)*100).toFixed(0)+'%pot');
    exp.push('eq='+rH+'%');
    if(scene==='check'){
      exp.push('chkEV='+(evs.check/Math.max(pot,1)*100).toFixed(0));
      exp.push('vBetEV='+(evs.betValue/Math.max(pot,1)*100).toFixed(0));
      if(evs.bluff>-99998)exp.push('bluffEV='+(evs.bluff/Math.max(pot,1)*100).toFixed(0));
      exp.push('oppF='+Math.round(_statFold*100)+'%');
    }else{
      exp.push('foldEV=0');
      exp.push('callEV='+(evs.call/Math.max(pot,1)*100).toFixed(0));
      exp.push('raiseEV='+(evs.raise/Math.max(pot,1)*100).toFixed(0));
      exp.push('oppFoldRaise='+Math.round(_raiseFold*100)+'%');
    }
    result._evExplain=exp;
    var aLabel={bet:'价值bet',bluff:'诈唬',raise:'raise',call:'call',fold:'fold',check:'check'}[bestA]||bestA;
    var _oppStatStr1j='';
    try{if(OppProfiler&&OppProfiler._profiles){var _oppNk1j=OppProfiler._getOppNk?OppProfiler._getOppNk():null;if(_oppNk1j){var _frCB1j=OppProfiler.getFoldToRiverCBetPct(_oppNk1j);var _cbr1j=OppProfiler.getCbetRiverPct(_oppNk1j);if(_frCB1j!==null||_cbr1j!==null)_oppStatStr1j=' H:'+(_frCB1j!==null?_frCB1j+'%frcb':'')+(_cbr1j!==null?'/'+_cbr1j+'%cb':'');}}}catch(e){}
    result.r='EV162 '+aLabel+' '+hcKey+' ['+exp.join('|')+']'+_oppStatStr1j;
    return result;
  }

function _turnFullEnumerateEV(k,hcKey,hasInitiative,scene,betSz,pot,btKey,ip,_sprAdj,_is3bP,_isMW,preEq){
    var h=G.hole||[];
    var comm=G.comm||[];
    var hole=h.filter(function(c){return c;});
    var bc=comm.filter(function(c){return c;});
    if(hole.length<2||bc.length<4)return null;
    if(typeof hole[0]==='string'){
      hole=hole.map(function(s){var m=s&&s.match(/^([2-9TJQKA])([♠♥♦♣])$/);return m?{rank:m[1],suit:m[2]}:null;}).filter(function(c){return c;});
    }
    if(typeof bc[0]==='string'){
      bc=bc.map(function(s){var m=s&&s.match(/^([2-9TJQKA])([♠♥♦♣])$/);return m?{rank:m[1],suit:m[2]}:null;}).filter(function(c){return c;});
    }
    if(hole.length<2||bc.length<4)return null;
    // V2.9.162perf: 优先复用decidePostflop已计算的eq
    var eq;
    if(typeof preEq==='number'&&preEq>0){
      eq=preEq/100;
    }else{
      // V2.9.185turn: 转牌eq用mcVsRange (蒙特卡洛), 迭代提升到2000-5000确保<1%误差
      var bTexture=boardTexture(bc);
      var oppRange=getOppRange('postflop','cbet',bTexture.wetness>=2?'wet':'dry');
      if(!oppRange||oppRange.length===0)return null;
      var mcI=2000;
      if(betSz>0&&betSz/(pot+betSz)>=.66)mcI=3500;
      else if(betSz>0&&betSz/(pot+betSz)>=.33)mcI=2500;
      var ms=mcVsRange(hole,bc,oppRange,Math.min(mcI,5000));
      if(!ms||typeof ms.eq!=='number')return null;
      eq=ms.eq/100;
    }
    // V2.9.162perf: DRTA.getProfile() 一次获取
    var _prof=null;
    try{_prof=DRTA.getProfile();}catch(e){}
    // V2.9.162: 调用公共EV计算核心 (子任务4: turn/river共用)
    var _coreR=_computeFullEVCore(scene,betSz,pot,eq,_prof,_sprAdj,_is3bP,_isMW,G.stk||100000);
    if(!_coreR)return null;
    var evs=_coreR.evs, bestA=_coreR.bestA, bestEV=_coreR.bestEV, bestSz=_coreR.bestSz;
    var _statFold=_coreR._statFold, _raiseFold=_coreR._raiseFold;
    var rH=Math.round(eq*100);
    var result={
      // V3.20: action归一化
      a:(bestA==='bet'||bestA==='bluff')?'raise':bestA, v:bestSz,
      r:'',
      eq:rH,
      c:eq>=0.5?'h':(eq>=0.3?'m':'l'),
      spr:calcSPR(),
      _se:true,
      _seEV:true,
      ev:bestEV,
      evs:evs,
      scene:scene==='check'?'Turn Bet':'Turn Face',
      _evExplain:[]
    };
    var exp=[];
    exp.push('EV='+(bestEV/Math.max(pot,1)*100).toFixed(0)+'%pot');
    exp.push('eq='+rH+'%');
    if(scene==='check'){
      exp.push('chkEV='+(evs.check/Math.max(pot,1)*100).toFixed(0));
      exp.push('vBetEV='+(evs.betValue/Math.max(pot,1)*100).toFixed(0));
      if(evs.bluff>-99998)exp.push('bluffEV='+(evs.bluff/Math.max(pot,1)*100).toFixed(0));
      exp.push('oppF='+Math.round(_statFold*100)+'%');
    }else{
      exp.push('foldEV=0');
      exp.push('callEV='+(evs.call/Math.max(pot,1)*100).toFixed(0));
      exp.push('raiseEV='+(evs.raise/Math.max(pot,1)*100).toFixed(0));
      exp.push('oppFoldRaise='+Math.round(_raiseFold*100)+'%');
    }
    result._evExplain=exp;
    var aLabel={bet:'价值bet',bluff:'诈唬',raise:'raise',call:'call',fold:'fold',check:'check'}[bestA]||bestA;
    var _oppStatStr1t='';
    try{if(OppProfiler&&OppProfiler._profiles){var _oppNk1t=OppProfiler._getOppNk?OppProfiler._getOppNk():null;if(_oppNk1t){var _ftCB1t=OppProfiler.getFoldToTurnCBetPct(_oppNk1t);var _cbt1t=OppProfiler.getCbetTurnPct(_oppNk1t);if(_ftCB1t!==null||_cbt1t!==null)_oppStatStr1t=' H:'+(_ftCB1t!==null?_ftCB1t+'%ftcb':'')+(_cbt1t!==null?'/'+_cbt1t+'%cb':'');}}}catch(e){}
    result.r='EV162T '+aLabel+' '+hcKey+' ['+exp.join('|')+']'+_oppStatStr1t;
    return result;
  }

// ====== V3.11: FCB表 (从v2.9.164合并) ======
var _FCB_IP={
    '0_s':{0:{c:0.3,r:0.7,f:0.0},1:{c:0.4,r:0.6,f:0.0},2:{c:0.6,r:0.4,f:0.0},3:{c:0.8,r:0.2,f:0.0},4:{c:0.85,r:0.1,f:0.05},5:{c:0.7,r:0.0,f:0.3},6:{c:0.5,r:0.0,f:0.5},7:{c:0.35,r:0.0,f:0.65},8:{c:0.6,r:0.3,f:0.1},9:{c:0.7,r:0.1,f:0.2},10:{c:0.5,r:0.0,f:0.5},11:{c:0.6,r:0.1,f:0.3},12:{c:0.4,r:0.0,f:0.6},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '0_m':{0:{c:0.31,r:0.69,f:0.0},1:{c:0.41,r:0.59,f:0.0},2:{c:0.61,r:0.39,f:0.0},3:{c:0.81,r:0.19,f:0.0},4:{c:0.85,r:0.09,f:0.06},5:{c:0.67,r:0.0,f:0.33},6:{c:0.46,r:0.0,f:0.54},7:{c:0.32,r:0.0,f:0.68},8:{c:0.6,r:0.28,f:0.12},9:{c:0.68,r:0.09,f:0.23},10:{c:0.46,r:0.0,f:0.54},11:{c:0.58,r:0.09,f:0.33},12:{c:0.37,r:0.0,f:0.63},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '0_l':{0:{c:0.31,r:0.69,f:0.0},1:{c:0.41,r:0.59,f:0.0},2:{c:0.61,r:0.39,f:0.0},3:{c:0.81,r:0.19,f:0.0},4:{c:0.84,r:0.09,f:0.07},5:{c:0.61,r:0.0,f:0.39},6:{c:0.4,r:0.0,f:0.6},7:{c:0.27,r:0.0,f:0.73},8:{c:0.58,r:0.27,f:0.15},9:{c:0.64,r:0.09,f:0.27},10:{c:0.4,r:0.0,f:0.6},11:{c:0.53,r:0.08,f:0.39},12:{c:0.31,r:0.0,f:0.69},13:{c:0.15,r:0.0,f:0.85},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '1_s':{0:{c:0.31,r:0.69,f:0.0},1:{c:0.41,r:0.59,f:0.0},2:{c:0.61,r:0.39,f:0.0},3:{c:0.81,r:0.19,f:0.0},4:{c:0.85,r:0.09,f:0.06},5:{c:0.68,r:0.0,f:0.32},6:{c:0.47,r:0.0,f:0.53},7:{c:0.33,r:0.0,f:0.67},8:{c:0.6,r:0.29,f:0.11},9:{c:0.69,r:0.09,f:0.22},10:{c:0.47,r:0.0,f:0.53},11:{c:0.58,r:0.09,f:0.33},12:{c:0.38,r:0.0,f:0.62},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '1_m':{0:{c:0.32,r:0.68,f:0.0},1:{c:0.43,r:0.57,f:0.0},2:{c:0.63,r:0.37,f:0.0},3:{c:0.82,r:0.18,f:0.0},4:{c:0.85,r:0.09,f:0.06},5:{c:0.65,r:0.0,f:0.35},6:{c:0.44,r:0.0,f:0.56},7:{c:0.3,r:0.0,f:0.7},8:{c:0.6,r:0.27,f:0.13},9:{c:0.67,r:0.09,f:0.24},10:{c:0.44,r:0.0,f:0.56},11:{c:0.56,r:0.08,f:0.36},12:{c:0.34,r:0.0,f:0.66},13:{c:0.16,r:0.0,f:0.84},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '1_l':{0:{c:0.32,r:0.68,f:0.0},1:{c:0.43,r:0.57,f:0.0},2:{c:0.63,r:0.37,f:0.0},3:{c:0.82,r:0.18,f:0.0},4:{c:0.83,r:0.09,f:0.08},5:{c:0.59,r:0.0,f:0.41},6:{c:0.38,r:0.0,f:0.62},7:{c:0.25,r:0.0,f:0.75},8:{c:0.58,r:0.26,f:0.16},9:{c:0.63,r:0.08,f:0.29},10:{c:0.38,r:0.0,f:0.62},11:{c:0.51,r:0.08,f:0.41},12:{c:0.29,r:0.0,f:0.71},13:{c:0.13,r:0.0,f:0.87},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '2_s':{0:{c:0.28,r:0.72,f:0.0},1:{c:0.38,r:0.62,f:0.0},2:{c:0.58,r:0.42,f:0.0},3:{c:0.79,r:0.21,f:0.0},4:{c:0.85,r:0.11,f:0.04},5:{c:0.75,r:0.0,f:0.25},6:{c:0.56,r:0.0,f:0.44},7:{c:0.41,r:0.0,f:0.59},8:{c:0.6,r:0.33,f:0.07},9:{c:0.73,r:0.11,f:0.16},10:{c:0.56,r:0.0,f:0.44},11:{c:0.64,r:0.12,f:0.24},12:{c:0.46,r:0.0,f:0.54},13:{c:0.24,r:0.0,f:0.76},14:{c:0.13,r:0.0,f:0.87},15:{c:0.04,r:0.0,f:0.96}},
    '2_m':{0:{c:0.29,r:0.71,f:0.0},1:{c:0.39,r:0.61,f:0.0},2:{c:0.59,r:0.41,f:0.0},3:{c:0.79,r:0.21,f:0.0},4:{c:0.85,r:0.1,f:0.05},5:{c:0.72,r:0.0,f:0.28},6:{c:0.53,r:0.0,f:0.47},7:{c:0.38,r:0.0,f:0.62},8:{c:0.6,r:0.31,f:0.09},9:{c:0.71,r:0.11,f:0.18},10:{c:0.53,r:0.0,f:0.47},11:{c:0.62,r:0.11,f:0.27},12:{c:0.43,r:0.0,f:0.57},13:{c:0.22,r:0.0,f:0.78},14:{c:0.11,r:0.0,f:0.89},15:{c:0.03,r:0.0,f:0.97}},
    '2_l':{0:{c:0.29,r:0.71,f:0.0},1:{c:0.39,r:0.61,f:0.0},2:{c:0.59,r:0.41,f:0.0},3:{c:0.8,r:0.2,f:0.0},4:{c:0.84,r:0.1,f:0.06},5:{c:0.67,r:0.0,f:0.33},6:{c:0.47,r:0.0,f:0.53},7:{c:0.32,r:0.0,f:0.68},8:{c:0.59,r:0.3,f:0.11},9:{c:0.68,r:0.1,f:0.22},10:{c:0.47,r:0.0,f:0.53},11:{c:0.57,r:0.1,f:0.33},12:{c:0.37,r:0.0,f:0.63},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '3_s':{0:{c:0.35,r:0.65,f:0.0},1:{c:0.45,r:0.55,f:0.0},2:{c:0.65,r:0.35,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.87,r:0.08,f:0.05},5:{c:0.73,r:0.0,f:0.27},6:{c:0.54,r:0.0,f:0.46},7:{c:0.39,r:0.0,f:0.61},8:{c:0.65,r:0.26,f:0.09},9:{c:0.73,r:0.09,f:0.18},10:{c:0.54,r:0.0,f:0.46},11:{c:0.64,r:0.09,f:0.27},12:{c:0.44,r:0.0,f:0.56},13:{c:0.23,r:0.0,f:0.77},14:{c:0.11,r:0.0,f:0.89},15:{c:0.03,r:0.0,f:0.97}},
    '3_m':{0:{c:0.36,r:0.64,f:0.0},1:{c:0.47,r:0.53,f:0.0},2:{c:0.66,r:0.34,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.87,r:0.08,f:0.05},5:{c:0.7,r:0.0,f:0.3},6:{c:0.5,r:0.0,f:0.5},7:{c:0.35,r:0.0,f:0.65},8:{c:0.65,r:0.25,f:0.1},9:{c:0.72,r:0.08,f:0.2},10:{c:0.5,r:0.0,f:0.5},11:{c:0.62,r:0.08,f:0.3},12:{c:0.4,r:0.0,f:0.6},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '3_l':{0:{c:0.36,r:0.64,f:0.0},1:{c:0.47,r:0.53,f:0.0},2:{c:0.66,r:0.34,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.86,r:0.08,f:0.06},5:{c:0.65,r:0.0,f:0.35},6:{c:0.44,r:0.0,f:0.56},7:{c:0.3,r:0.0,f:0.7},8:{c:0.63,r:0.24,f:0.13},9:{c:0.68,r:0.07,f:0.25},10:{c:0.44,r:0.0,f:0.56},11:{c:0.57,r:0.07,f:0.36},12:{c:0.35,r:0.0,f:0.65},13:{c:0.17,r:0.0,f:0.83},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '4_s':{0:{c:0.27,r:0.73,f:0.0},1:{c:0.37,r:0.63,f:0.0},2:{c:0.57,r:0.43,f:0.0},3:{c:0.78,r:0.22,f:0.0},4:{c:0.85,r:0.11,f:0.04},5:{c:0.77,r:0.0,f:0.23},6:{c:0.59,r:0.0,f:0.41},7:{c:0.44,r:0.0,f:0.56},8:{c:0.59,r:0.34,f:0.07},9:{c:0.74,r:0.12,f:0.14},10:{c:0.59,r:0.0,f:0.41},11:{c:0.65,r:0.12,f:0.23},12:{c:0.49,r:0.0,f:0.51},13:{c:0.26,r:0.0,f:0.74},14:{c:0.14,r:0.0,f:0.86},15:{c:0.04,r:0.0,f:0.96}},
    '4_m':{0:{c:0.29,r:0.71,f:0.0},1:{c:0.38,r:0.62,f:0.0},2:{c:0.58,r:0.42,f:0.0},3:{c:0.79,r:0.21,f:0.0},4:{c:0.85,r:0.11,f:0.04},5:{c:0.74,r:0.0,f:0.26},6:{c:0.55,r:0.0,f:0.45},7:{c:0.4,r:0.0,f:0.6},8:{c:0.6,r:0.32,f:0.08},9:{c:0.72,r:0.11,f:0.17},10:{c:0.55,r:0.0,f:0.45},11:{c:0.63,r:0.11,f:0.26},12:{c:0.45,r:0.0,f:0.55},13:{c:0.24,r:0.0,f:0.76},14:{c:0.12,r:0.0,f:0.88},15:{c:0.04,r:0.0,f:0.96}},
    '4_l':{0:{c:0.29,r:0.71,f:0.0},1:{c:0.39,r:0.61,f:0.0},2:{c:0.59,r:0.41,f:0.0},3:{c:0.79,r:0.21,f:0.0},4:{c:0.84,r:0.11,f:0.05},5:{c:0.7,r:0.0,f:0.3},6:{c:0.49,r:0.0,f:0.51},7:{c:0.34,r:0.0,f:0.66},8:{c:0.59,r:0.31,f:0.1},9:{c:0.69,r:0.11,f:0.2},10:{c:0.49,r:0.0,f:0.51},11:{c:0.59,r:0.1,f:0.31},12:{c:0.39,r:0.0,f:0.61},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '5_s':{0:{c:0.33,r:0.67,f:0.0},1:{c:0.43,r:0.57,f:0.0},2:{c:0.63,r:0.37,f:0.0},3:{c:0.82,r:0.18,f:0.0},4:{c:0.85,r:0.09,f:0.06},5:{c:0.66,r:0.0,f:0.34},6:{c:0.45,r:0.0,f:0.55},7:{c:0.31,r:0.0,f:0.69},8:{c:0.61,r:0.27,f:0.12},9:{c:0.68,r:0.09,f:0.23},10:{c:0.45,r:0.0,f:0.55},11:{c:0.57,r:0.08,f:0.35},12:{c:0.35,r:0.0,f:0.65},13:{c:0.17,r:0.0,f:0.83},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '5_m':{0:{c:0.34,r:0.66,f:0.0},1:{c:0.44,r:0.56,f:0.0},2:{c:0.64,r:0.36,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.85,r:0.08,f:0.07},5:{c:0.62,r:0.0,f:0.38},6:{c:0.41,r:0.0,f:0.59},7:{c:0.28,r:0.0,f:0.72},8:{c:0.6,r:0.25,f:0.15},9:{c:0.66,r:0.08,f:0.26},10:{c:0.41,r:0.0,f:0.59},11:{c:0.54,r:0.08,f:0.38},12:{c:0.32,r:0.0,f:0.68},13:{c:0.15,r:0.0,f:0.85},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '5_l':{0:{c:0.34,r:0.66,f:0.0},1:{c:0.44,r:0.56,f:0.0},2:{c:0.64,r:0.36,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.83,r:0.08,f:0.09},5:{c:0.56,r:0.0,f:0.44},6:{c:0.36,r:0.0,f:0.64},7:{c:0.23,r:0.0,f:0.77},8:{c:0.58,r:0.24,f:0.18},9:{c:0.61,r:0.07,f:0.32},10:{c:0.36,r:0.0,f:0.64},11:{c:0.49,r:0.07,f:0.44},12:{c:0.27,r:0.0,f:0.73},13:{c:0.12,r:0.0,f:0.88},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '6_s':{0:{c:0.29,r:0.71,f:0.0},1:{c:0.39,r:0.61,f:0.0},2:{c:0.59,r:0.41,f:0.0},3:{c:0.79,r:0.21,f:0.0},4:{c:0.86,r:0.11,f:0.03},5:{c:0.75,r:0.0,f:0.25},6:{c:0.56,r:0.0,f:0.44},7:{c:0.41,r:0.0,f:0.59},8:{c:0.61,r:0.32,f:0.07},9:{c:0.73,r:0.11,f:0.16},10:{c:0.56,r:0.0,f:0.44},11:{c:0.64,r:0.11,f:0.25},12:{c:0.46,r:0.0,f:0.54},13:{c:0.24,r:0.0,f:0.76},14:{c:0.13,r:0.0,f:0.87},15:{c:0.04,r:0.0,f:0.96}},
    '6_m':{0:{c:0.3,r:0.7,f:0.0},1:{c:0.4,r:0.6,f:0.0},2:{c:0.6,r:0.4,f:0.0},3:{c:0.8,r:0.2,f:0.0},4:{c:0.86,r:0.1,f:0.04},5:{c:0.72,r:0.0,f:0.28},6:{c:0.53,r:0.0,f:0.47},7:{c:0.38,r:0.0,f:0.62},8:{c:0.61,r:0.3,f:0.09},9:{c:0.72,r:0.1,f:0.18},10:{c:0.53,r:0.0,f:0.47},11:{c:0.62,r:0.1,f:0.28},12:{c:0.43,r:0.0,f:0.57},13:{c:0.22,r:0.0,f:0.78},14:{c:0.11,r:0.0,f:0.89},15:{c:0.03,r:0.0,f:0.97}},
    '6_l':{0:{c:0.3,r:0.7,f:0.0},1:{c:0.4,r:0.6,f:0.0},2:{c:0.6,r:0.4,f:0.0},3:{c:0.8,r:0.2,f:0.0},4:{c:0.85,r:0.1,f:0.05},5:{c:0.67,r:0.0,f:0.33},6:{c:0.47,r:0.0,f:0.53},7:{c:0.32,r:0.0,f:0.68},8:{c:0.59,r:0.29,f:0.12},9:{c:0.68,r:0.1,f:0.22},10:{c:0.47,r:0.0,f:0.53},11:{c:0.58,r:0.09,f:0.33},12:{c:0.37,r:0.0,f:0.63},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}}
  };

var _FCB_OOP={
    '0_s':{0:{c:0.36,r:0.64,f:0.0},1:{c:0.46,r:0.54,f:0.0},2:{c:0.66,r:0.34,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.86,r:0.08,f:0.06},5:{c:0.65,r:0.0,f:0.35},6:{c:0.44,r:0.0,f:0.56},7:{c:0.3,r:0.0,f:0.7},8:{c:0.62,r:0.24,f:0.14},9:{c:0.68,r:0.08,f:0.24},10:{c:0.44,r:0.0,f:0.56},11:{c:0.57,r:0.07,f:0.36},12:{c:0.34,r:0.0,f:0.66},13:{c:0.16,r:0.0,f:0.84},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '0_m':{0:{c:0.37,r:0.63,f:0.0},1:{c:0.47,r:0.53,f:0},2:{c:0.67,r:0.33,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.85,r:0.07,f:0.08},5:{c:0.61,r:0.0,f:0.39},6:{c:0.4,r:0.0,f:0.6},7:{c:0.27,r:0.0,f:0.73},8:{c:0.62,r:0.23,f:0.15},9:{c:0.65,r:0.07,f:0.28},10:{c:0.4,r:0.0,f:0.6},11:{c:0.54,r:0.07,f:0.39},12:{c:0.31,r:0.0,f:0.69},13:{c:0.14,r:0.0,f:0.86},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '0_l':{0:{c:0.37,r:0.63,f:0.0},1:{c:0.48,r:0.52,f:0.0},2:{c:0.67,r:0.33,f:0.0},3:{c:0.85,r:0.15,f:0.0},4:{c:0.84,r:0.07,f:0.09},5:{c:0.55,r:0.0,f:0.45},6:{c:0.35,r:0.0,f:0.65},7:{c:0.22,r:0.0,f:0.78},8:{c:0.6,r:0.22,f:0.18},9:{c:0.61,r:0.06,f:0.33},10:{c:0.35,r:0.0,f:0.65},11:{c:0.49,r:0.06,f:0.45},12:{c:0.26,r:0.0,f:0.74},13:{c:0.12,r:0.0,f:0.88},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '1_s':{0:{c:0.37,r:0.63,f:0.0},1:{c:0.47,r:0.53,f:0},2:{c:0.67,r:0.33,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.85,r:0.07,f:0.08},5:{c:0.62,r:0.0,f:0.38},6:{c:0.41,r:0.0,f:0.59},7:{c:0.28,r:0.0,f:0.72},8:{c:0.62,r:0.23,f:0.15},9:{c:0.66,r:0.07,f:0.27},10:{c:0.41,r:0.0,f:0.59},11:{c:0.55,r:0.07,f:0.38},12:{c:0.32,r:0.0,f:0.68},13:{c:0.15,r:0.0,f:0.85},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '1_m':{0:{c:0.38,r:0.62,f:0.0},1:{c:0.49,r:0.51,f:0.0},2:{c:0.68,r:0.32,f:0.0},3:{c:0.85,r:0.15,f:0.0},4:{c:0.85,r:0.07,f:0.08},5:{c:0.59,r:0.0,f:0.41},6:{c:0.38,r:0.0,f:0.62},7:{c:0.25,r:0.0,f:0.75},8:{c:0.62,r:0.22,f:0.16},9:{c:0.64,r:0.06,f:0.3},10:{c:0.38,r:0.0,f:0.62},11:{c:0.52,r:0.06,f:0.42},12:{c:0.29,r:0.0,f:0.71},13:{c:0.13,r:0.0,f:0.87},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '1_l':{0:{c:0.38,r:0.62,f:0.0},1:{c:0.49,r:0.51,f:0.0},2:{c:0.68,r:0.32,f:0.0},3:{c:0.85,r:0.15,f:0.0},4:{c:0.83,r:0.07,f:0.1},5:{c:0.53,r:0.0,f:0.47},6:{c:0.33,r:0.0,f:0.67},7:{c:0.21,r:0.0,f:0.79},8:{c:0.59,r:0.2,f:0.21},9:{c:0.59,r:0.06,f:0.35},10:{c:0.33,r:0.0,f:0.67},11:{c:0.46,r:0.05,f:0.49},12:{c:0.24,r:0.0,f:0.76},13:{c:0.11,r:0.0,f:0.89},14:{c:0.05,r:0.0,f:0.95},15:{c:0.01,r:0.0,f:0.99}},
    '2_s':{0:{c:0.34,r:0.66,f:0.0},1:{c:0.44,r:0.56,f:0.0},2:{c:0.64,r:0.36,f:0.0},3:{c:0.82,r:0.17,f:0.01},4:{c:0.86,r:0.09,f:0.05},5:{c:0.7,r:0.0,f:0.3},6:{c:0.5,r:0.0,f:0.5},7:{c:0.35,r:0.0,f:0.65},8:{c:0.63,r:0.27,f:0.1},9:{c:0.71,r:0.09,f:0.2},10:{c:0.5,r:0.0,f:0.5},11:{c:0.61,r:0.09,f:0.3},12:{c:0.4,r:0.0,f:0.6},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '2_m':{0:{c:0.35,r:0.65,f:0.0},1:{c:0.45,r:0.55,f:0.0},2:{c:0.65,r:0.35,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.86,r:0.08,f:0.06},5:{c:0.67,r:0.0,f:0.33},6:{c:0.47,r:0.0,f:0.53},7:{c:0.32,r:0.0,f:0.68},8:{c:0.63,r:0.25,f:0.12},9:{c:0.69,r:0.08,f:0.23},10:{c:0.47,r:0.0,f:0.53},11:{c:0.59,r:0.08,f:0.33},12:{c:0.37,r:0.0,f:0.63},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '2_l':{0:{c:0.35,r:0.65,f:0.0},1:{c:0.45,r:0.55,f:0.0},2:{c:0.65,r:0.35,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.85,r:0.08,f:0.07},5:{c:0.62,r:0.0,f:0.38},6:{c:0.41,r:0.0,f:0.59},7:{c:0.27,r:0.0,f:0.73},8:{c:0.61,r:0.24,f:0.15},9:{c:0.65,r:0.07,f:0.28},10:{c:0.41,r:0.0,f:0.59},11:{c:0.54,r:0.07,f:0.39},12:{c:0.31,r:0.0,f:0.69},13:{c:0.15,r:0.0,f:0.85},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '3_s':{0:{c:0.41,r:0.59,f:0.0},1:{c:0.51,r:0.49,f:0.0},2:{c:0.7,r:0.3,f:0.0},3:{c:0.86,r:0.14,f:0.0},4:{c:0.88,r:0.07,f:0.05},5:{c:0.68,r:0.0,f:0.32},6:{c:0.48,r:0.0,f:0.52},7:{c:0.33,r:0.0,f:0.67},8:{c:0.67,r:0.21,f:0.12},9:{c:0.71,r:0.06,f:0.23},10:{c:0.48,r:0.0,f:0.52},11:{c:0.61,r:0.06,f:0.33},12:{c:0.38,r:0.0,f:0.62},13:{c:0.19,r:0.0,f:0.81},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '3_m':{0:{c:0.42,r:0.58,f:0.0},1:{c:0.53,r:0.47,f:0.0},2:{c:0.72,r:0.28,f:0.0},3:{c:0.87,r:0.13,f:0.0},4:{c:0.87,r:0.06,f:0.07},5:{c:0.65,r:0.0,f:0.35},6:{c:0.44,r:0.0,f:0.56},7:{c:0.3,r:0.0,f:0.7},8:{c:0.66,r:0.2,f:0.14},9:{c:0.69,r:0.06,f:0.25},10:{c:0.44,r:0.0,f:0.56},11:{c:0.58,r:0.06,f:0.36},12:{c:0.34,r:0.0,f:0.66},13:{c:0.16,r:0.0,f:0.84},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '3_l':{0:{c:0.42,r:0.58,f:0.0},1:{c:0.53,r:0.47,f:0.0},2:{c:0.72,r:0.28,f:0.0},3:{c:0.87,r:0.13,f:0.0},4:{c:0.86,r:0.06,f:0.08},5:{c:0.59,r:0.0,f:0.41},6:{c:0.38,r:0.0,f:0.62},7:{c:0.25,r:0.0,f:0.75},8:{c:0.64,r:0.19,f:0.17},9:{c:0.65,r:0.05,f:0.3},10:{c:0.38,r:0.0,f:0.62},11:{c:0.53,r:0.05,f:0.42},12:{c:0.29,r:0.0,f:0.71},13:{c:0.13,r:0.0,f:0.87},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '4_s':{0:{c:0.33,r:0.67,f:0.0},1:{c:0.43,r:0.57,f:0.0},2:{c:0.63,r:0.37,f:0.0},3:{c:0.82,r:0.18,f:0.0},4:{c:0.87,r:0.09,f:0.04},5:{c:0.72,r:0.0,f:0.28},6:{c:0.53,r:0.0,f:0.47},7:{c:0.38,r:0.0,f:0.62},8:{c:0.63,r:0.28,f:0.09},9:{c:0.72,r:0.09,f:0.19},10:{c:0.53,r:0.0,f:0.47},11:{c:0.63,r:0.09,f:0.28},12:{c:0.43,r:0.0,f:0.57},13:{c:0.22,r:0.0,f:0.78},14:{c:0.11,r:0.0,f:0.89},15:{c:0.03,r:0.0,f:0.97}},
    '4_m':{0:{c:0.34,r:0.66,f:0.0},1:{c:0.44,r:0.56,f:0.0},2:{c:0.64,r:0.36,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.86,r:0.08,f:0.06},5:{c:0.69,r:0.0,f:0.31},6:{c:0.49,r:0.0,f:0.51},7:{c:0.34,r:0.0,f:0.66},8:{c:0.63,r:0.26,f:0.11},9:{c:0.71,r:0.08,f:0.21},10:{c:0.49,r:0.0,f:0.51},11:{c:0.6,r:0.08,f:0.32},12:{c:0.39,r:0.0,f:0.61},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '4_l':{0:{c:0.34,r:0.66,f:0.0},1:{c:0.45,r:0.55,f:0.0},2:{c:0.64,r:0.36,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.85,r:0.08,f:0.07},5:{c:0.64,r:0.0,f:0.36},6:{c:0.43,r:0.0,f:0.57},7:{c:0.29,r:0.0,f:0.71},8:{c:0.61,r:0.25,f:0.14},9:{c:0.67,r:0.08,f:0.25},10:{c:0.43,r:0.0,f:0.57},11:{c:0.56,r:0.08,f:0.36},12:{c:0.34,r:0.0,f:0.66},13:{c:0.16,r:0.0,f:0.84},14:{c:0.08,r:0.0,f:0.92},15:{c:0.02,r:0.0,f:0.98}},
    '5_s':{0:{c:0.38,r:0.62,f:0.0},1:{c:0.49,r:0.51,f:0.0},2:{c:0.68,r:0.32,f:0.0},3:{c:0.85,r:0.15,f:0.0},4:{c:0.85,r:0.07,f:0.08},5:{c:0.6,r:0.0,f:0.4},6:{c:0.39,r:0.0,f:0.61},7:{c:0.26,r:0.0,f:0.74},8:{c:0.62,r:0.22,f:0.16},9:{c:0.65,r:0.06,f:0.29},10:{c:0.39,r:0.0,f:0.61},11:{c:0.53,r:0.06,f:0.41},12:{c:0.3,r:0.0,f:0.7},13:{c:0.14,r:0.0,f:0.86},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}},
    '5_m':{0:{c:0.4,r:0.6,f:0.0},1:{c:0.5,r:0.5,f:0.0},2:{c:0.7,r:0.3,f:0.0},3:{c:0.86,r:0.14,f:0.0},4:{c:0.85,r:0.07,f:0.08},5:{c:0.56,r:0.0,f:0.44},6:{c:0.36,r:0.0,f:0.64},7:{c:0.23,r:0.0,f:0.77},8:{c:0.61,r:0.2,f:0.19},9:{c:0.62,r:0.06,f:0.32},10:{c:0.36,r:0.0,f:0.64},11:{c:0.5,r:0.05,f:0.45},12:{c:0.27,r:0.0,f:0.73},13:{c:0.12,r:0.0,f:0.88},14:{c:0.06,r:0.0,f:0.94},15:{c:0.02,r:0.0,f:0.98}},
    '5_l':{0:{c:0.4,r:0.6,f:0.0},1:{c:0.51,r:0.49,f:0.0},2:{c:0.7,r:0.3,f:0.0},3:{c:0.86,r:0.14,f:0.0},4:{c:0.83,r:0.06,f:0.11},5:{c:0.5,r:0.0,f:0.5},6:{c:0.3,r:0.0,f:0.7},7:{c:0.19,r:0.0,f:0.81},8:{c:0.59,r:0.19,f:0.22},9:{c:0.57,r:0.05,f:0.38},10:{c:0.3,r:0.0,f:0.7},11:{c:0.44,r:0.05,f:0.51},12:{c:0.22,r:0.0,f:0.78},13:{c:0.1,r:0.0,f:0.9},14:{c:0.05,r:0.0,f:0.95},15:{c:0.01,r:0.0,f:0.99}},
    '6_s':{0:{c:0.35,r:0.65,f:0.0},1:{c:0.45,r:0.55,f:0.0},2:{c:0.65,r:0.35,f:0.0},3:{c:0.83,r:0.17,f:0.0},4:{c:0.87,r:0.08,f:0.05},5:{c:0.7,r:0.0,f:0.3},6:{c:0.5,r:0.0,f:0.5},7:{c:0.35,r:0.0,f:0.65},8:{c:0.64,r:0.26,f:0.1},9:{c:0.72,r:0.08,f:0.2},10:{c:0.5,r:0.0,f:0.5},11:{c:0.61,r:0.08,f:0.31},12:{c:0.4,r:0.0,f:0.6},13:{c:0.2,r:0.0,f:0.8},14:{c:0.1,r:0.0,f:0.9},15:{c:0.03,r:0.0,f:0.97}},
    '6_m':{0:{c:0.36,r:0.64,f:0.0},1:{c:0.46,r:0.54,f:0.0},2:{c:0.66,r:0.34,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.86,r:0.08,f:0.06},5:{c:0.67,r:0.0,f:0.33},6:{c:0.47,r:0.0,f:0.53},7:{c:0.32,r:0.0,f:0.68},8:{c:0.63,r:0.24,f:0.13},9:{c:0.7,r:0.08,f:0.22},10:{c:0.47,r:0.0,f:0.53},11:{c:0.59,r:0.08,f:0.33},12:{c:0.37,r:0.0,f:0.63},13:{c:0.18,r:0.0,f:0.82},14:{c:0.09,r:0.0,f:0.91},15:{c:0.03,r:0.0,f:0.97}},
    '6_l':{0:{c:0.36,r:0.64,f:0.0},1:{c:0.47,r:0.53,f:0.0},2:{c:0.66,r:0.34,f:0.0},3:{c:0.84,r:0.16,f:0.0},4:{c:0.85,r:0.08,f:0.07},5:{c:0.62,r:0.0,f:0.38},6:{c:0.41,r:0.0,f:0.59},7:{c:0.27,r:0.0,f:0.73},8:{c:0.62,r:0.24,f:0.14},9:{c:0.66,r:0.07,f:0.27},10:{c:0.41,r:0.0,f:0.59},11:{c:0.54,r:0.07,f:0.39},12:{c:0.31,r:0.0,f:0.69},13:{c:0.15,r:0.0,f:0.85},14:{c:0.07,r:0.0,f:0.93},15:{c:0.02,r:0.0,f:0.98}}
  };

// ====== V3.13: _applyPipeline (从v2.9.164合并) ======
// ====== V2.9.161: RangeEstimator 对手范围推断 ======
  var RangeEstimator={
    // 从OppProfiler统计推断范围宽度
    getWidth:function(oppType,street){
      var widths={
        nit:{preflop:'narrow',flop:'narrow',turn:'very_narrow',river:'very_narrow'},
        tight:{preflop:'narrow',flop:'narrow',turn:'narrow',river:'narrow'},
        tag:{preflop:'medium',flop:'medium',turn:'medium',river:'narrow'},
        lag:{preflop:'wide',flop:'wide',turn:'medium',river:'medium'},
        fish:{preflop:'wide',flop:'wide',turn:'wide',river:'wide'},
        calling_station:{preflop:'wide',flop:'wide',turn:'wide',river:'wide'},
        maniac:{preflop:'very_wide',flop:'very_wide',turn:'wide',river:'wide'},
        unknown:{preflop:'medium',flop:'medium',turn:'medium',river:'medium'}
      };
      var w=(widths[oppType]||widths.unknown);
      return w[street]||w.preflop;
    },
    // 范围宽度→组合数估计(粗略)
    comboCount:function(width){
      return{very_narrow:30,narrow:60,medium:120,wide:200,very_wide:350}[width]||120;
    },
    // 范围宽度→对手range中弱牌占比
    weakRatio:function(width){
      return{very_narrow:0.15,narrow:0.25,medium:0.40,wide:0.55,very_wide:0.70}[width]||0.40;
    },
    // 基于范围推断调整频率
    adjustForRange:function(baseFreq,oppType,street,action){
      var w=this.getWidth(oppType,street);
      var adj=baseFreq;
      if(action==='bluff'||action==='bet'){
        // 对手range宽→bluff效果差; 对手range窄→bluff效果好
        var wr=this.weakRatio(w);
        if(wr>0.5)adj*=0.75; // 对手range宽，很多call
        else if(wr<0.3)adj*=1.3; // 对手range窄，容易fold
      }else if(action==='call'){
        // 对手range宽→我们的中等牌更fold(对手真牌多)
        if(w==='wide'||w==='very_wide')adj*=0.8;
      }else if(action==='fold'){
        // 对手range窄→更难fold(面对强range)
        if(w==='narrow'||w==='very_narrow')adj*=1.2;
      }
      return Math.max(0,Math.min(1,adj));
    }
  }

function _applyPipeline(baseFreq,action,hcKey,oppType,street,context,sprAdj,is3bP,isMW){
    var f=baseFreq;
    sprAdj=sprAdj||{cbet:1,fcb:1,bluff:1};
    // 1) SPR调整
    if(context==='cbet'||context==='barrel'||context==='donk'||context==='cr'){
      f=f*sprAdj.cbet;if(hcKey>=12)f=f*sprAdj.bluff;
    }else if(context==='facing'){
      f=f*sprAdj.fcb;
    }
    // 2) 3bet底池
    if(is3bP){
      if(context==='facing'){/* FCB内部已处理 */}
      else if(hcKey<=4){f=Math.min(.95,f*1.15);}
      else if(hcKey>=13){f=f*0.6;}
    }
    // 3) 多人池
    if(isMW){
      if(context==='facing'){/* FCB内部已处理 */}
      else{f=f*0.7;}
    }
    // 4) ExploitAdjuster
    var ea=ExploitAdjuster(f,action,hcKey,oppType,street||'flop',context);
    f=ea.freq;if(ea.label)console.log('[SE161] EA: '+ea.label);
    // 5) RangeEstimator
    f=RangeEstimator.adjustForRange(f,oppType,street||'flop',action);
    return f;
  }

function _facingCBet(k,hcKey,btKey,ip,betSz,pot,street,isDonk){
    var szRatio=betSz/Math.max(pot,1);
    // V2.9.161: 尺度三档 s/m/l (34-66%不再被当大注)
    var szKey=szRatio<=.33?'s':szRatio<=.66?'m':'l';
    var table=ip?_FCB_IP:_FCB_OOP;
    var btFallback={6:'4',1:'0',3:'2'};
    var btKeyOrig=btKey;
    // medium档无独立表时fallback到large(保守)
    if(!table[btKey+'_'+szKey]){
      if(szKey==='m'){
        // medium先尝试large表，再fallback纹理
        if(table[btKey+'_l'])szKey='l';
        else{btKey=btFallback[btKey]||btKey;szKey=table[btKey+'_l']?'l':'s';}
      }else{
        btKey=btFallback[btKey]||btKey;
      }
    }
    var entry=table[btKey+'_'+szKey];
    if(!entry){entry=table[btKey+'_s'];}
    if(!entry||!entry[hcKey])return null;
    var e=entry[hcKey];
    // V2.9.161: 频率调整——Turn更紧, River最紧, donk更call
    var adjC=e.c,adjR=e.r,adjF=e.f;
    if(street==='turn'){adjC=Math.max(0,adjC-0.06);adjR=Math.max(0,adjR-0.02);adjF=Math.min(1,adjF+0.08);}
    if(street==='river'){adjC=Math.max(0,adjC-0.10);adjR=Math.max(0,adjR-0.03);adjF=Math.min(1,adjF+0.13);}
    if(isDonk){adjC=adjC+adjF*0.25;adjF=adjF*0.75;adjR=adjR*1.1;} // donk range偏弱→更call
    // V2.9.161: 3bet底池面CBet——更难fold
    if(G._is3betPot){adjF=adjF*0.7;adjC=adjC+(1-adjC-adjR)*0.3;}
    // V2.9.161: 多人池面CBet——更紧
    if(G._isMultiway){adjF=Math.min(1,adjF*1.2);adjR=adjR*0.6;}
    // 归一化
    var sum=adjC+adjR+adjF;
    if(sum>0.01){adjC/=sum;adjR/=sum;adjF/=sum;}else{adjC=e.c;adjR=e.r;adjF=e.f;}
    var _fcbEA=ExploitAdjuster(1,'facing_cbet',hcKey,oppType,street||'flop','facing_cbet');
    if(_fcbEA.label){adjR=adjR*_fcbEA.freq;adjC=adjC+(1-_fcbEA.freq)*adjC;adjF=1-adjR-adjC;if(adjF<0)adjF=0;}
    // V2.9.161: SPR区面CBet调整
    adjF=adjF*_sprAdj.fcb;
    // 频率随机决策
    var r=Math.random();
    var spr=calcSPR();
    if(r<adjR){
      var rSz=Math.round(Math.max(betSz*2.5,pot*.66));
      rSz=Math.min(rSz,G.stk||100000);
      return{a:'raise',v:rSz,r:'GTO 面CBet raise '+btKey+'/'+hcKey+'('+Math.round(adjR*100)+'%)',eq:0,c:'h',sizing:rSz,scene:isDonk?'面对Donk':'面对CBet',_se:true,_seFreq:adjR};
    }
    if(r<adjR+adjC){
      return{a:'call',r:'GTO 面CBet call '+btKey+'/'+hcKey+'('+Math.round(adjC*100)+'%)',eq:0,c:'m',scene:isDonk?'面对Donk':'面对CBet',spr:spr,_se:true,_seFreq:adjC};
    }
    return _fold(0,'面CBet fold '+btKey+'/'+hcKey+'('+Math.round(adjF*100)+'%)',spr);
  }

// ====== V3.12: FCR/DONK表 (从v2.9.164合并) ======
var _FCR={
    // V2.9.161: 补全6(第二对)/7(弱对)/10(OESD)/11(组合听)/12(卡顺)/13(超牌)/14(后门)
    '0':{0:{c:.2,rr:.8,f:0},1:{c:.4,rr:.6,f:0},2:{c:.7,rr:.3,f:0},3:{c:.8,rr:.2,f:0},4:{c:.85,rr:.05,f:.1},5:{c:.5,rr:0,f:.5},6:{c:.4,rr:0,f:.6},7:{c:.3,rr:0,f:.7},8:{c:.8,rr:.1,f:.1},9:{c:.6,rr:0,f:.4},10:{c:.5,rr:0,f:.5},11:{c:.6,rr:.1,f:.3},12:{c:.4,rr:0,f:.6},13:{c:.2,rr:0,f:.8},14:{c:.1,rr:0,f:.9},15:{c:0,rr:0,f:1}},
    '2':{0:{c:.1,rr:.9,f:0},1:{c:.3,rr:.7,f:0},2:{c:.5,rr:.5,f:0},3:{c:.8,rr:.1,f:.1},4:{c:.7,rr:.1,f:.2},5:{c:.4,rr:0,f:.6},6:{c:.35,rr:0,f:.65},7:{c:.25,rr:0,f:.75},8:{c:.5,rr:.3,f:.2},9:{c:.7,rr:.1,f:.2},10:{c:.5,rr:.05,f:.45},11:{c:.7,rr:.2,f:.1},12:{c:.4,rr:0,f:.6},13:{c:.15,rr:0,f:.85},14:{c:.05,rr:0,f:.95},15:{c:0,rr:0,f:1}},
    '4':{0:{c:.15,rr:.85,f:0},1:{c:.35,rr:.65,f:0},2:{c:.6,rr:.3,f:.1},3:{c:.75,rr:.1,f:.15},4:{c:.65,rr:.05,f:.3},6:{c:.4,rr:0,f:.6},7:{c:.3,rr:0,f:.7},8:{c:.5,rr:.4,f:.1},9:{c:.65,rr:.1,f:.25},10:{c:.5,rr:.05,f:.45},11:{c:.5,rr:.35,f:.15},12:{c:.35,rr:0,f:.65},13:{c:.1,rr:0,f:.9},14:{c:.05,rr:0,f:.95},15:{c:0,rr:0,f:1}},
    '5':{0:{c:.2,rr:.8,f:0},1:{c:.5,rr:.5,f:0},2:{c:.7,rr:.2,f:.1},3:{c:.85,rr:.05,f:.1},4:{c:.8,rr:.05,f:.15},5:{c:.5,rr:0,f:.5},6:{c:.4,rr:0,f:.6},7:{c:.3,rr:0,f:.7},8:{c:.7,rr:.1,f:.2},9:{c:.5,rr:0,f:.5},10:{c:.4,rr:0,f:.6},11:{c:.5,rr:.1,f:.4},12:{c:.3,rr:0,f:.7},13:{c:.15,rr:0,f:.85},14:{c:.05,rr:0,f:.95},15:{c:0,rr:0,f:1}}
  };

var _DONK={
    '0_ip':{0:[0.66,0.75],1:[0.55,0.66],2:[0.44,0.66],3:[0.39,0.5],4:[0.33,0.5],5:[0.22,0.4],6:[0.17,0.33],7:[0.06,0],8:[0.28,0.8],9:[0.22,0.8],10:[0.17,0.75],11:[0.33,0.75],12:[0.09,0.8],13:[0.04,0.8],14:[0.02,0.75]},
    '0_oop':{0:[0.53,0.68],1:[0.44,0.59],2:[0.35,0.59],3:[0.31,0.45],4:[0.26,0.45],5:[0.18,0.36],6:[0.13,0.3],7:[0.04,0],8:[0.22,0.72],9:[0.18,0.72],10:[0.13,0.68],11:[0.26,0.68],12:[0.05,0.5],13:[0.02,0.5],14:[0.01,0.5]},
    '1_ip':{0:[0.6,0.75],1:[0.5,0.66],2:[0.4,0.66],3:[0.35,0.5],4:[0.3,0.5],5:[0.2,0.4],6:[0.15,0.33],7:[0.05,0],8:[0.25,0.8],9:[0.2,0.8],10:[0.15,0.75],11:[0.3,0.75],12:[0.08,0.8],13:[0.04,0.8],14:[0.02,0.75]},
    '1_oop':{0:[0.48,0.68],1:[0.4,0.59],2:[0.32,0.59],3:[0.28,0.45],4:[0.24,0.45],5:[0.16,0.36],6:[0.12,0.3],7:[0.04,0],8:[0.2,0.72],9:[0.16,0.72],10:[0.12,0.68],11:[0.24,0.68],12:[0.06,0.72],13:[0.03,0.72],14:[0.02,0.68]},
    '2_ip':{0:[0.42,0.75],1:[0.35,0.66],2:[0.28,0.66],3:[0.24,0.5],4:[0.21,0.5],5:[0.14,0.4],6:[0.1,0.33],7:[0.03,0],8:[0.17,0.8],9:[0.14,0.8],10:[0.1,0.75],11:[0.21,0.75],12:[0.06,0.8],13:[0.03,0.8]},
    '2_oop':{0:[0.34,0.68],1:[0.28,0.59],2:[0.22,0.59],3:[0.2,0.45],4:[0.17,0.45],5:[0.11,0.36],6:[0.08,0.3],7:[0.03,0],8:[0.14,0.72],9:[0.11,0.72],10:[0.08,0.68],11:[0.17,0.68],12:[0.04,0.72],13:[0.02,0.72]},
    '3_ip':{0:[0.42,0.75],1:[0.35,0.66],2:[0.28,0.66],3:[0.24,0.5],4:[0.21,0.5],5:[0.14,0.4],6:[0.1,0.33],7:[0.03,0],8:[0.17,0.8],9:[0.14,0.8],10:[0.1,0.75],11:[0.21,0.75],12:[0.06,0.8],13:[0.03,0.8]},
    '3_oop':{0:[0.34,0.68],1:[0.28,0.59],2:[0.22,0.59],3:[0.2,0.45],4:[0.17,0.45],5:[0.11,0.36],6:[0.08,0.3],7:[0.03,0],8:[0.14,0.72],9:[0.11,0.72],10:[0.08,0.68],11:[0.17,0.68],12:[0.04,0.72],13:[0.02,0.72]}
  };

function _facingCR(k,hcKey,btKey,betSz,pot){
    var btFallback={6:'4',1:'0',3:'2'};
    if(!_FCR[btKey]){btKey=btFallback[btKey]||btKey;}
    var table=_FCR[btKey];
    if(!table||!table[hcKey])return null;
    var e=table[hcKey];
    var r=Math.random();
    var spr=calcSPR();
    if(r<e.rr){
      var rrSz=Math.round(Math.max(betSz*2.5,pot*2));
      rrSz=Math.min(rrSz,G.stk||100000);
      return{a:'raise',v:rrSz,r:'GTO 面CR reraise '+btKey+'/'+hcKey+'('+Math.round(e.rr*100)+'%)',eq:0,c:'h',sizing:rrSz,scene:'面对CR',_se:true,_seFreq:e.rr};
    }
    if(r<e.rr+e.c){
      return{a:'call',r:'GTO 面CR call '+btKey+'/'+hcKey+'('+Math.round(e.c*100)+'%)',eq:0,c:'m',scene:'面对CR',spr:spr,_se:true,_seFreq:e.c};
    }
    return _fold(0,'面CR fold '+btKey+'/'+hcKey+'('+Math.round(e.f*100)+'%)',spr);
  }

function _donkDecision(k,hcKey,btKey,ip,pot,_oppType2,_sprAdj2,_is3bP2,_isMW2,_street2){
    var dkTable=ip?_DONK[btKey+'_ip']:_DONK[btKey+'_oop'];
    if(!dkTable){dkTable=_DONK['0_'+(ip?'ip':'oop')];}
    if(!dkTable||!dkTable[hcKey])return null;
    var entry=dkTable[hcKey];
    var freq=entry[0],sz=entry[1];
    // 剥削调整
    if(OppProfiler&&OppProfiler.getStat){
      var oppCB=OppProfiler.getStat('cbetFlop')||0;
      if(oppCB>.7){freq*=1.3;} // 对手CBet多→我们donk更多
      else if(oppCB<.4){freq*=0.5;} // 对手不CBet→等他check我们bet
    }
freq=_applyPipeline(freq,'bet',hcKey,_oppType2||'unknown',_street2||'flop','donk',_sprAdj2||{cbet:1,fcb:1,bluff:1},_is3bP2||false,_isMW2||false);    if(Math.random()>freq)return null;
    var donkSz=Math.round(pot*sz);
    donkSz=Math.min(donkSz,G.stk||100000);
    return{a:'raise',v:donkSz,r:'SE160 Donk '+hcKey+'('+Math.round(freq*100)+'%)',eq:0,c:hcKey<=4?'h':'l',sizing:donkSz,scene:'Donk',_se:true};
  }



// ====== V3.11: ExploitHistory (从v2.9.164合并) ======
  var _exploitHistory={bluffAttempts:0,bluffWins:0,valueAttempts:0,valueCalls:0,valueWins:0,foldToFaced:0,foldToTotal:0,lastReset:Date.now()};
  function _resetExploitHistory(){if(Date.now()-_exploitHistory.lastReset>3600000){_exploitHistory={bluffAttempts:0,bluffWins:0,valueAttempts:0,valueCalls:0,valueWins:0,foldToFaced:0,foldToTotal:0,lastReset:Date.now()};}}

// ====== V3.11: ExploitAdjuster (从v2.9.164合并) ======
function ExploitAdjuster(freq,action,hcKey,oppType,street,scene){
    _resetExploitHistory();var adj=freq;var label='';
    if(OppProfiler&&OppProfiler.getStat){
      var ftCB=OppProfiler.getStat('foldToCBetFlop')||0;
      var oppCB=OppProfiler.getStat('cbetFlop')||0;
      var oppAF=OppProfiler.getStat('af')||1;
      if((action==='bet'||action==='raise')&&ftCB>.6){adj=Math.min(.95,adj*1.4);label='过度弃牌剥削';}
      else if((action==='bet'||action==='raise')&&ftCB>.5){adj=Math.min(.95,adj*1.2);label='偏弃牌剥削';}
      if(action==='raise'&&scene==='facing_cbet'&&oppCB>.7){adj=Math.min(.4,adj*1.8);label='过度CBet剥削';}
      if(action==='fold'&&oppAF<1&&scene==='facing_raise'){adj=Math.min(.95,adj*1.3);label='被动对手剥削';}
      if(oppType==='nit'&&(action==='bet'||action==='raise')&&hcKey>=13){adj=Math.min(.9,adj*1.5);label='nit诈唬剥削';}
      if((oppType==='calling_station'||oppType==='fish')&&hcKey>=13){adj=adj*0.2;label='跟注站不诈唬';}
      if((oppType==='calling_station'||oppType==='fish')&&hcKey<=4){adj=Math.min(.95,adj*1.3);label='跟注站价值加码';}
    }
    if(_exploitHistory.bluffAttempts>=3){var br=_exploitHistory.bluffWins/_exploitHistory.bluffAttempts;if(br<.3&&(action==='bet'||action==='raise')&&hcKey>=13){adj=adj*0.3;label='bluff被catch减频';}}
    if(_exploitHistory.valueCalls>=5){var vr=_exploitHistory.valueWins/_exploitHistory.valueCalls;if(vr>.8&&hcKey<=4){adj=Math.min(.98,adj*1.15);label='价值尺度加码';}}
    if(_exploitHistory.foldToTotal>=5){var fr2=_exploitHistory.foldToFaced/_exploitHistory.foldToTotal;if(fr2>.6&&action==='fold'){adj=adj*0.7;label='过度fold修正';}}
    if(_exploitHistory.bluffAttempts>=8){var ta=_exploitHistory.bluffAttempts+_exploitHistory.valueAttempts;if(ta>0&&_exploitHistory.bluffAttempts/ta>.4&&hcKey>=13){adj=adj*0.7;label='反剥削平衡';}}
    return{freq:Math.max(0,Math.min(1,adj)),label:label};
  }

// ====== 辅助函数 ======
function _fold(eq,reason,spr){return{a:'fold',r:'[SE]'+reason,eq:eq,c:'l',scene:'',spr:spr||0,sprAdvice:spr?getSPRAdvice(spr):'',_se:true};}
function _preflopSizing(pos,pot,scene,spr){var base=Math.round(pot*2.5);if(pos==='btn'||pos==='sb')base=Math.round(pot*3);if(spr<4)base=Math.round(pot*2.2);return Math.min(base,G.stk||100000);}
function _adjFreq3bet(act,freq,oppType,raiserRole,heroPos){if(act==='3b'&&(oppType==='calling_station'||oppType==='fish'))return freq*0.3;if(act==='3b'&&(oppType==='nit'||oppType==='tight'))return Math.min(1,freq*1.2);return freq;}
function _get3bAlt(k,table,action){return 0.3;}

return{
  decidePreflop:decidePreflop,
  decidePostflop:decidePostflop,
  isEnabled:function(){return G._seEnabled!==false&&G.tt<=5;},
  getVersion:function(){return'2.9.300';},
  getRFI:function(pos){return _RFI[pos]||null;},
  get3B:function(vs,from){return _3B[vs]?_3B[vs][from]:null;},
  getF3B:function(pos){return _F3B[pos]||null;},
  getCBetIP:function(bt){return _CBET_IP[bt]||null;},
  getCBetOOP:function(bt){return _CBET_OOP[bt]||null;},
  setGGLevel:function(lvl){G.ggLevel=lvl;} // V3.0: 设置GG扑克级别
};
})();

if(typeof global!=="undefined")global.StrategyEngine=StrategyEngine;
// V3.19: hcKey映射 — 表中缺失的键映射到最接近的
function _hc2keySafe(hcKey, tableName){
  if(tableName==='_CR'&&(hcKey===0||hcKey===4))return null; // 强牌不CR(设计如此)
  if(hcKey===12)return 13;  // 弱听牌→接近空气的13
  if(hcKey===10)return 9;   // 中听牌→9
  return hcKey;
}


