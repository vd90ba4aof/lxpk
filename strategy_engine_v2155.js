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
    from_BB:{AA:{a:'3b',f:1},KK:{a:'3b',f:1},QQ:{a:'3b',f:.9},JJ:{a:'3b',f:.7},TT:{a:'3b',f:.5},"99":{a:'3b',f:.3},AKs:{a:'3b',f:.8},AKo:{a:'3b',f:.7},AQs:{a:'3b',f:.5},AQo:{a:'3b',f:.3},AJs:{a:'3b',f:.2},A5s:{a:'3b',f:.5},A4s:{a:'3b',f:.5},A3s:{a:'3b',f:.4},A2s:{a:'3b',f:.3},KQs:{a:'3b',f:.2},K5s:{a:'3b',f:.2},K4s:{a:'3b',f:.2},"98s":{a:'3b',f:.3},"87s":{a:'3b',f:.2},ATs:{a:'c',f:.7},A9s:{a:'c',f:.6},A8s:{a:'c',f:.5},A7s:{a:'c',f:.4},A6s:{a:'c',f:.3},KJs:{a:'c',f:.6},KTs:{a:'c',f:.5},K9s:{a:'c',f:.4},QJs:{a:'c',f:.5},QTs:{a:'c',f:.4},JTs:{a:'c',f:.6},J9s:{a:'c',f:.4},T9s:{a:'c',f:.6},T8s:{a:'c',f:.4},"98s":{a:'c',f:.5},"87s":{a:'c',f:.4},"76s":{a:'c',f:.3},"65s":{a:'c',f:.3},"54s":{a:'c',f:.2},AJo:{a:'c',f:.3},KQo:{a:'c',f:.4},KJo:{a:'c',f:.3},QJo:{a:'c',f:.2}}
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
  return w<=1?'0':'1';
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
  if(spr<2) return Math.min(baseSizing, spr*0.6);
  if(spr<5) return Math.min(baseSizing, spr*0.35);
  if(spr>12) return baseSizing*1.2;
  return baseSizing;
}

// ★ V3.0: 多尺度sizing选择
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
  return _sprSizingAdjust(spr, pct, 'cbet');
}

function _pickRivSizing(handClass, eq, pot, spr){
  var btKey = _bt2key(bTexture);
  var hcKey = _hc2key(handClass);
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

  var btKey=_bt2key(bTexture);
  var hcKey=_hc2key(hClass);
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

  var btKey=_bt2key(bTexture);
  var hcKey=_hc2key(hClass);
  var rv=_RIV_VALUE[btKey]&&_RIV_VALUE[btKey][hcKey];
  if(!rv) return null;

  var rvFreq=rv[0], rvMult=rv[1];
  var pot=G.pot||1, stk=G.stk||100000;

  if(Math.random()<rvFreq){
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
  var dbTable=_DB_TURN[btKey];
  if(!dbTable||!dbTable[hcKey]) return null;

  var dbFreq=dbTable[hcKey][0];
  var pot=G.pot||1, stk=G.stk||100000;

  var adj=_quantExploitAdjust(dbFreq, 'raise', oppProfile, bTexture);
  dbFreq=adj.freq;

  if(Math.random()<dbFreq){
    var sizingPct = bTexture.wetness>=2?0.70:(bTexture.category==='paired'?0.50:bTexture.hasMonotone?0.65:0.55);
    sizingPct*=adj.sizingMult;
    var dbSz=Math.round(pot*sizingPct);
    dbSz=_sprSizingAdjust(spr, Math.min(dbSz, stk), 'double_barrel');
    return{a:'raise', v:dbSz, r:'GTO DB Turn('+Math.round(dbFreq*100)+'%) '+(sizingPct*100).toFixed(0)+'%',
      eq:eq, c:eq>=50?'h':'m', sizing:dbSz, scene:'DB Turn', spr:spr, _se:true, _seFreq:dbFreq, exploit:adj.note};
  }
  return null;
}

// ====== 翻前决策 (保持V2.9.215) ======
function decidePreflop(k){
  var p=G.pos||'btn', scene=G.scene||'check', stk=G.stk||100000, pot=G.pot||1, bet=G.bet||0;
  var spr=calcSPR(), eq=eQ(k);
  var profile=DRTA.getProfile(), oppType=G.opp||'unknown', p5=_pos5(p);

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
  if(scene==='check'||scene==='call'){
    var rfi=_RFI[p5];if(!rfi)return null;var freq=rfi[k];
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
    var f3b=_F3B[p5];if(!f3b)return null;var entry3=f3b[k];if(!entry3)return _fold(eq,k+' vs 3bet→fold',spr);
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

  // ★ V3.0: River价值下注 (必须先检查，否则会被CBet/River诈唬覆盖)
  if(street==='river' && didPFR && scene==='check'){
    var rvResult = decideRiverValue(k, spr, eq, profile, bTexture, hClass);
    if(rvResult){
      if(_planAdvice||_rangeAdvice)rvResult.r=(rvResult.r||'')+_planAdvice+_rangeAdvice;
      return rvResult;
    }
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
    var cbTable=ip?_CBET_IP[btKey]:_CBET_OOP[btKey];
    if(cbTable&&cbTable[hcKey]){
      var cb=cbTable[hcKey];
      var cbFreq=cb[0];
      if(ip&&scene==='check'){
        var adj=_quantExploitAdjust(cbFreq,'raise',profile,bTexture);
        cbFreq=adj.freq;
      }
      if(Math.random()<cbFreq){
        var cbPct=_pickSizing(cb[1],bTexture,spr)/pot;
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
    var crTable=_CR[btKey];
    if(crTable&&crTable[hcKey]){
      var cr=crTable[hcKey];var crFreq=cr[0];var crSzMult=cr[1];
      if(OppProfiler&&OppProfiler.getStat){var oppCB=OppProfiler.getStat('cbetFlop');if(oppCB>.7)crFreq=Math.min(.3,crFreq*1.5);}
      if(Math.random()<crFreq){
        var crSz=Math.round(bet*crSzMult);crSz=_sprSizingAdjust(spr,Math.min(crSz,stk),'check_raise');
        var exploitCR=applyExploit(eq,'raise',oppType,{bet:bet,pot:pot});
        return{a:'raise',v:crSz,r:'GTO CR '+btKey+'/'+hcKey+'('+Math.round(crFreq*100)+'%)',eq:exploitCR.eq,c:eq>=50?'h':'m',sizing:crSz,scene:'Check-Raise',spr:spr,_se:true,_seFreq:crFreq};
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
