#!/usr/bin/env node
/**
 * 综合Bug扫描 — 一次性检查所有类别
 * 1. 未定义变量引用（函数内用了但既不是参数也不是全局）
 * 2. 表键覆盖（btKey/hcKey 所有组合）
 * 3. 运行时ReferenceError（全场景模拟）
 * 4. 概率分布（null率统计）
 */
const fs = require('fs');
const engine = fs.readFileSync('strategy_engine_v2155.js', 'utf8');

// ====== 1. 未定义变量扫描 ======
console.log('=== 1. 未定义变量扫描 ===');
// 找所有函数
const funcMatches = [...engine.matchAll(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g)];
let undefinedVarIssues = [];
for (const m of funcMatches) {
  const fnName = m[1];
  const params = m[2].split(',').map(p => p.trim()).filter(p => p);
  // 找函数体
  const fnStart = m.index;
  let depth = 0;
  let fnEnd = fnStart;
  for (let i = fnStart; i < engine.length; i++) {
    if (engine[i] === '{') depth++;
    else if (engine[i] === '}') {
      depth--;
      if (depth === 0) { fnEnd = i + 1; break; }
    }
  }
  const body = engine.substring(fnStart, fnEnd);
  // 函数内声明的var
  const localVars = new Set([...body.matchAll(/var\s+(\w+)\s*=/g)].map(x => x[1]));
  // 函数内引用的标识符
  const refs = new Set([...body.matchAll(/\b([a-zA-Z_$]\w*)\b/g)].map(x => x[1]));
  // 全局已知的
  const globals = new Set(['G','Math','JSON','String','Array','Object','Number','Boolean','Date','RegExp','parseInt','parseFloat','isNaN','console','setTimeout','setInterval','undefined','NaN','Infinity','eval','arguments','OppProfiler','RangeEstimator','ExploitAdjuster','NashPushFold','StreetPlan','RangeVsRange','ActionLine','DRTA','SPRZone','TiltDetector','FrameDiffEngine','BvBStrategy','calcSPR','getCurrentStreet','pA','handClassify','boardTexture','eQ','applyExploit','compareEVs','getSPRAdvice','riverExactEquity','mcVsRange','getOppRange','R','SU','RV','Squeeze','MIX_FREQ','FIVE_BET','CBET_FREQ','postF','preF','HandStateMachine','MultiTableDetector','SelfTiltGuard','PoolTypeDetector','ValueThicknessAnalyzer','PoolStrategyMatrix','ColorStrategy','PotConfidence','SafetyGuard','CounterExploit','TablePulse']);
  const known = new Set([...params, ...localVars, ...globals]);
  for (const r of refs) {
    // 排除属性访问(obj.xxx)、关键字、引擎内定义的函数
    if (known.has(r)) continue;
    if (engine.includes('function ' + r + '(')) continue; // 引擎内定义的函数
    if (engine.includes('var ' + r + '=')) continue; // 引擎内定义的变量
    // 排除对象属性
    const propPattern = new RegExp('\\.' + r + '\\b');
    if (propPattern.test(body)) continue;
    // 排除函数声明后hoisting
    undefinedVarIssues.push(`${fnName} 引用了未定义的: ${r}`);
  }
}
if (undefinedVarIssues.length === 0) {
  console.log('✅ 无未定义变量引用');
} else {
  for (const issue of [...new Set(undefinedVarIssues)]) console.log('⚠️', issue);
}

// ====== 2. 表键覆盖 ======
console.log('\n=== 2. 表键覆盖 ===');
const btKeys = ['0','1','2','3','4','5','6'];
const hcKeys = ['0','4','6','9','10','11','12','15'];
for (const tableName of ['_CBET_IP','_CBET_OOP','_CR','_DB_TURN','_RIV_VALUE','_TURN_DEFENSE']) {
  const m = engine.match(new RegExp('var ' + tableName + '=\\{([\\s\\S]*?)\\n\\};'));
  if (!m) { console.log(`⚠️ ${tableName}: 表不存在!`); continue; }
  const body = m[1];
  const tableBtKeys = new Set([...body.matchAll(/'(\d+)':\{/g)].map(x => x[1]));
  const missingBt = btKeys.filter(k => !tableBtKeys.has(k));
  if (missingBt.length > 0) console.log(`⚠️ ${tableName}: 缺btKey ${missingBt.join(',')}`);
}

// ====== 3. 运行时全场景测试 ======
console.log('\n=== 3. 运行时全场景测试 ===');
global.G = {_seEnabled:true, tt:6, pot:100, stk:5000, pos:'btn', scene:'check', opp:'unknown', phase:'pre', comm:[], hole:[], ante:0, _lastPlayers:[], _faced3bet:false, _facedDonk:false, limpers:0, players:[{active:true,folded:false,chips:1000},{active:true,folded:false,chips:1000}]};
global._mcSimCache = null;
global.R = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
global.SU = ['h','d','s','c'];
global.RV = {A:14,K:13,Q:12,J:11,T:10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2};
global.calcSPR = function(){return G._spr;};
global.getCurrentStreet = function(){return G._street;};
global.pA = function(){return G._ip?0.7:0.3;};
global.handClassify = function(){return G._hc;};
global.boardTexture = function(){return G._bt;};
global.ActionLine = {didPreflopRaise: function(){return G._pfr;}, didCbetOnFlop: function(){return G._didCbet;}};
global.DRTA = {getProfile: function(){return {type:'unknown',confidence:0};}, getWeights: function(){return {};}};
global.eQ = function(k){return G._eq;};
global.applyExploit = function(eq,a,t,b){return {eq:eq};};
global.compareEVs = function(){return [];};
global.getSPRAdvice = function(spr){return '';};
global.SPRZone = {getZone: function(){return 'standard';}};
global.TiltDetector = {detectTilt: function(){return null;}};
global.riverExactEquity = function(){return {eq:G._eq,combos:1};};
global.mcVsRange = function(){return {eq:G._eq};};
global.getOppRange = function(){return [1,2,3];};
global.OppProfiler = {getStat:function(){return 0;}, _profiles:{}, _getOppNk:function(){return null;}};
global.RangeEstimator = {adjustForRange: function(f){return f;}};
global.StreetPlan = null;
global.RangeVsRange = null;
global.NashPushFold = null;
global.FrameDiffEngine = {getOppPostflopAction:function(){return null;}};
global.BvBStrategy = null;

eval(engine);

const btMap = {'0':{category:'dry',wetness:0,hasMonotone:false,hasPaired:false},'1':{category:'dry',wetness:1,hasMonotone:false,hasPaired:false},'2':{category:'wet',wetness:2,hasMonotone:false,hasPaired:0},'4':{category:'wet',wetness:2,hasMonotone:true,hasPaired:false},'5':{category:'paired',wetness:1,hasMonotone:false,hasPaired:true},'6':{category:'semi-wet',wetness:2,hasMonotone:false,hasPaired:true}};
const hcMap = {'0':{name:'NUTS'},'4':{name:'STRONG'},'6':{name:'MEDIUM'},'9':{name:'DRAW',outs:9},'10':{name:'DRAW',outs:7},'11':{name:'DRAW',outs:13},'12':{name:'DRAW',outs:5},'13':{name:'AIR'},'15':{name:'AIR'}};
G.hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}];
G._eq=50; G._spr=30;

const scenarios = ['flop-cbet','flop-face','turn-db','turn-face','river-value','river-face'];
const stats = {};
let crashes = 0;
for (const [btK, btObj] of Object.entries(btMap)) {
  for (const [hcK, hcObj] of Object.entries(hcMap)) {
    G._bt=btObj; G._hc=hcObj;
    // flop-cbet
    G._street='flop'; G.scene='check'; G._pfr=true; G._didCbet=false; G._ip=true;
    G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'}];
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['flop-cbet']=(stats['flop-cbet']||0)+1; } catch(e){crashes++;}
    // flop-face
    G.scene='raise'; G._pfr=false; G._ip=false; G.bet=50;
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['flop-face']=(stats['flop-face']||0)+1; } catch(e){crashes++;}
    // turn-db
    G._street='turn'; G.scene='check'; G._pfr=true; G._didCbet=true; G._ip=true;
    G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'}];
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['turn-db']=(stats['turn-db']||0)+1; } catch(e){crashes++;}
    // turn-face
    G.scene='raise'; G._pfr=false; G._ip=false; G.bet=80;
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['turn-face']=(stats['turn-face']||0)+1; } catch(e){crashes++;}
    // river-value
    G._street='river'; G.scene='check'; G._pfr=true; G._didCbet=true; G._ip=true;
    G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'},{rank:'7',suit:'h'}];
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['river-value']=(stats['river-value']||0)+1; } catch(e){crashes++;}
    // river-face
    G.scene='raise'; G._pfr=false; G._ip=false; G.bet=100;
    try { if(!StrategyEngine.decidePostflop('AKs')) stats['river-face']=(stats['river-face']||0)+1; } catch(e){crashes++;}
  }
}
const total = Object.values(btMap).length * Object.values(hcMap).length;
console.log(`组合数: ${total} 每场景`);
for (const [k,v] of Object.entries(stats)) {
  const pct = Math.round(v/total*100);
  const mark = pct > 30 ? '🔴' : pct > 10 ? '🟡' : '✅';
  console.log(`  ${mark} ${k}: null ${v}/${total} (${pct}%)`);
}
console.log(`  崩溃: ${crashes}`);

// ====== 4. 翻前场景 ======
console.log('\n=== 4. 翻前场景测试 ===');
const preflopTests = [
  ['BTN开池AKs', function(){G.phase='pre';G.scene='check';G.pos='btn';G._street='preflop';G.comm=[];G.hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}];return StrategyEngine.decidePreflop('AKs');}],
  ['BB 3bet AA vs BTN', function(){G.phase='pre';G.scene='raise';G.pos='bb';G._raiserRole='btn';G.bet=30;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['BB 3bet AA vs SB', function(){G.phase='pre';G.scene='raise';G.pos='bb';G._raiserRole='sb';G.bet=30;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['BTN 4bet KK', function(){G.phase='pre';G.scene='reraise';G.pos='btn';G.bet=90;G.hole=[{rank:'K',suit:'h'},{rank:'K',suit:'d'}];return StrategyEngine.decidePreflop('KK');}],
  ['BB allin call AA', function(){G.phase='pre';G.scene='allin';G.pos='bb';G.bet=500;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['MP开池88', function(){G.phase='pre';G.scene='check';G.pos='mp';G.bet=0;G.hole=[{rank:'8',suit:'h'},{rank:'8',suit:'d'}];return StrategyEngine.decidePreflop('88');}],
  ['MP面对3bet JJ', function(){G.phase='pre';G.scene='reraise';G.pos='mp';G.bet=90;G.hole=[{rank:'J',suit:'h'},{rank:'J',suit:'d'}];return StrategyEngine.decidePreflop('JJ');}],
  ['BB check option 72o', function(){G.phase='pre';G.scene='check';G.pos='bb';G.bet=0;G.hole=[{rank:'7',suit:'h'},{rank:'2',suit:'d'}];return StrategyEngine.decidePreflop('72o');}],
  ['SB开池A5s', function(){G.phase='pre';G.scene='check';G.pos='sb';G.bet=0;G.hole=[{rank:'A',suit:'h'},{rank:'5',suit:'h'}];return StrategyEngine.decidePreflop('A5s');}],
  ['limpers后BTN开池KQo', function(){G.phase='pre';G.scene='check';G.pos='btn';G.bet=0;G.limpers=2;G.hole=[{rank:'K',suit:'h'},{rank:'Q',suit:'d'}];return StrategyEngine.decidePreflop('KQo');}],
];
let preflopNull = 0;
for (const [name, fn] of preflopTests) {
  try {
    const r = fn();
    console.log(`  ${r ? r.a+' v='+(r.v||0) : 'null'}  ${name}`);
    if (!r) preflopNull++;
  } catch(e) {
    console.log(`  💥${e.message}  ${name}`);
    preflopNull++;
  }
}
console.log(`翻前null: ${preflopNull}/${preflopTests.length}`);
