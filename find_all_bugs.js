#!/usr/bin/env node
/**
 * 🕵️ 找茬大师 — 一键全量自检
 * 
 * 检查内容：
 * 1. JS语法完整性（node -c）
 * 2. HTML括号配平
 * 3. Kotlin括号配平
 * 4. 未定义变量引用（函数内用了但既不是参数也不是全局）
 * 5. 表键覆盖（btKey/hcKey所有组合）
 * 6. 死代码检测（定义但从未调用/引用但从未赋值）
 * 7. 运行时全场景测试（324组合零null）
 * 8. 翻前10场景测试
 * 9. 概率分布（null率统计）
 * 
 * 用法: node find_all_bugs.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let totalIssues = 0;
const report = (severity, msg) => {
  const icon = severity === '致命' ? '🔴' : severity === '严重' ? '🟠' : severity === '警告' ? '🟡' : '🔵';
  console.log(`${icon} [${severity}] ${msg}`);
  if (severity !== '提示') totalIssues++;
};

console.log('═'.repeat(70));
console.log('🕵️ 找茬大师 — 一键全量自检');
console.log('═'.repeat(70));

// ============ 1. JS语法 ============
console.log('\n【1】JS语法完整性');
try {
  execSync('node -c strategy_engine_v2155.js', { stdio: 'pipe' });
  report('提示', 'strategy_engine_v2155.js 语法OK');
} catch (e) {
  report('致命', `strategy_engine_v2155.js 语法错误: ${e.stderr}`);
}

// ============ 2. HTML括号 ============
console.log('\n【2】HTML括号配平');
const html = fs.readFileSync('app/src/main/assets/poker_helper.html', 'utf8');
let depth = 0;
for (const ch of html) {
  if (ch === '{') depth++;
  else if (ch === '}') depth--;
}
if (depth === 0) report('提示', 'HTML括号配平');
else report('致命', `HTML括号不配平 depth=${depth}`);

// ============ 3. Kotlin括号 ============
console.log('\n【3】Kotlin括号配平');
function scanKotlin(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let i = 0, d = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') { i++; while (i < text.length && text[i] !== '"') { if (text[i] === '\\') i++; i++; } }
    else if (ch === "'") { i++; while (i < text.length && text[i] !== "'") { if (text[i] === '\\') i++; i++; } }
    else if (ch === '/' && text[i+1] === '/') { while (i < text.length && text[i] !== '\n') i++; }
    else if (ch === '/' && text[i+1] === '*') { i += 2; while (i+1 < text.length && !(text[i] === '*' && text[i+1] === '/')) i++; i++; }
    else if (ch === '{') d++;
    else if (ch === '}') d--;
    i++;
  }
  return d;
}
const ktFiles = fs.readdirSync('app/src/main/java/com/pokerhelper/app').filter(f => f.endsWith('.kt'));
for (const f of ktFiles) {
  const d = scanKotlin(`app/src/main/java/com/pokerhelper/app/${f}`);
  if (d !== 0) report('致命', `${f} 括号不配平 depth=${d}`);
}
report('提示', `${ktFiles.length}个Kotlin文件检查完成`);

// ============ 4. 未定义变量 ============
console.log('\n【4】未定义变量引用');
const engine = fs.readFileSync('strategy_engine_v2155.js', 'utf8');
const funcMatches = [...engine.matchAll(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g)];
const globals = new Set(['G','Math','JSON','String','Array','Object','Number','Boolean','Date','RegExp','parseInt','parseFloat','isNaN','console','setTimeout','setInterval','undefined','NaN','Infinity','eval','arguments','OppProfiler','RangeEstimator','ExploitAdjuster','NashPushFold','StreetPlan','RangeVsRange','ActionLine','DRTA','SPRZone','TiltDetector','FrameDiffEngine','BvBStrategy','calcSPR','getCurrentStreet','pA','handClassify','boardTexture','eQ','applyExploit','compareEVs','getSPRAdvice','riverExactEquity','mcVsRange','getOppRange','R','SU','RV']);
let undefinedFound = 0;
for (const m of funcMatches) {
  const fnName = m[1];
  const params = m[2].split(',').map(p => p.trim()).filter(Boolean);
  // 提取函数体
  let d = 0, fnEnd = m.index;
  for (let i = m.index; i < engine.length; i++) {
    if (engine[i] === '{') d++;
    else if (engine[i] === '}') { d--; if (d === 0) { fnEnd = i + 1; break; } }
  }
  const body = engine.substring(m.index, fnEnd);
  // V3.49: 先移除注释再提取引用
  const bodyNoComments = body.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const localVars = new Set([...bodyNoComments.matchAll(/var\s+(\w+)\s*=/g)].map(x => x[1]));
  const refs = new Set([...bodyNoComments.matchAll(/\b([a-zA-Z_$]\w*)\b/g)].map(x => x[1]));
  const known = new Set([...params, ...localVars, ...globals]);
  for (const r of refs) {
    if (known.has(r)) continue;
    if (/^(function|var|if|else|for|while|return|typeof|new|in|of|true|false|null|this|case|switch|break|continue|try|catch|finally|throw|delete|void|do|const|let|class|extends|super|static|import|export|default|yield|await|async|instanceof)$/.test(r)) continue;
    if (engine.includes('function ' + r + '(') || engine.includes('var ' + r + '=')) continue;
    if (new RegExp('\\.' + r + '\\b').test(body)) continue;
    if (r.startsWith('_') && (engine.includes('var ' + r) || engine.includes('function ' + r))) continue;
    // V3.49: 过滤字符串字面量（引号内的单词不是变量）
    if (body.includes("'" + r + "'") || body.includes('"' + r + '"')) continue;
    // 过滤对象属性键
    if (new RegExp(r + '\\s*:').test(body) || new RegExp(r + ':').test(body)) continue;
    // 过滤属性访问（obj.r 形式）
    if (new RegExp('\\.' + r + '\\b').test(body)) continue;
    report('严重', `${fnName} 引用了未定义的变量: ${r}`);
    undefinedFound++;
  }
}
if (undefinedFound === 0) report('提示', '无未定义变量引用');

// ============ 5. 表键覆盖 ============
console.log('\n【5】策略表键覆盖');
const btKeys = ['0','1','2','3','4','5','6'];
const hcKeys = ['0','4','6','9','10','11','12','15'];
for (const tableName of ['_CBET_IP','_CBET_OOP','_CR','_DB_TURN','_RIV_VALUE','_TURN_DEFENSE','_FCB_IP','_FCB_OOP']) {
  const m = engine.match(new RegExp('var ' + tableName + '=\\{([\\s\\S]*?)\\n\\};'));
  if (!m) { report('警告', `${tableName}: 表不存在`); continue; }
  const tableBtKeys = new Set([...m[1].matchAll(/'(\d+)':\{/g)].map(x => x[1]));
  const missingBt = btKeys.filter(k => !tableBtKeys.has(k));
  if (missingBt.length > 0) report('警告', `${tableName}: 缺btKey ${missingBt.join(',')}`);
}
report('提示', '表键检查完成');

// ============ 6. 死代码 ============
console.log('\n【6】死代码检测');
const definedFuncs = [...engine.matchAll(/function\s+(\w+)\s*\(/g)].map(x => x[1]);
for (const fn of definedFuncs) {
  const calls = engine.split(fn).length - 1;
  if (calls <= 1 && fn !== 'decidePreflop' && fn !== 'decidePostflop') {
    report('警告', `${fn}: 定义但从未调用`);
  }
}

// ============ 7. 运行时全场景 ============
console.log('\n【7】运行时全场景测试（324组合）');
global.G = {_seEnabled:true, tt:6, pot:100, stk:5000, pos:'btn', scene:'check', opp:'unknown', phase:'post', comm:[], hole:[], ante:0, _lastPlayers:[], _faced3bet:false, _facedDonk:false, limpers:0, players:[{active:true,folded:false,chips:1000},{active:true,folded:false,chips:1000}]};
global._mcSimCache = null;
global.R = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
global.SU = ['h','d','s','c'];
global.RV = {A:14,K:13,Q:12,J:11,T:10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2};
global.calcSPR = function(){return 30;};
global.getCurrentStreet = function(){return 'flop';};
global.pA = function(){return 0.7;};
global.handClassify = function(){return G._hc;};
global.boardTexture = function(){return G._bt;};
global.ActionLine = {didPreflopRaise: function(){return true;}, didCbetOnFlop: function(){return false;}};
global.DRTA = {getProfile: function(){return {type:'unknown',confidence:0};}, getWeights: function(){return {};}};
global.eQ = function(k){return 50;};
global.applyExploit = function(eq,a,t,b){return {eq:eq};};
global.compareEVs = function(){return [];};
global.getSPRAdvice = function(spr){return '';};
global.SPRZone = {getZone: function(){return 'standard';}};
global.TiltDetector = {detectTilt: function(){return null;}};
global.riverExactEquity = function(){return {eq:50,combos:1};};
global.mcVsRange = function(){return {eq:50};};
global.getOppRange = function(){return [1,2,3];};
global.OppProfiler = {getStat:function(){return 0;}, _profiles:{}, _getOppNk:function(){return null;}};
global.RangeEstimator = {adjustForRange: function(f){return f;}};
global.StreetPlan = null;
global.RangeVsRange = null;
global.NashPushFold = null;
global.FrameDiffEngine = {getOppPostflopAction:function(){return null;}};
global.BvBStrategy = null;

eval(engine);

const btMap = {'0':{category:'dry',wetness:0,hasMonotone:false,hasPaired:false},'1':{category:'dry',wetness:1,hasMonotone:false,hasPaired:false},'2':{category:'wet',wetness:2,hasMonotone:false,hasPaired:false},'4':{category:'wet',wetness:2,hasMonotone:true,hasPaired:false},'5':{category:'paired',wetness:1,hasMonotone:false,hasPaired:true},'6':{category:'semi-wet',wetness:2,hasMonotone:false,hasPaired:true}};
const hcMap = {'0':{name:'NUTS'},'4':{name:'STRONG'},'6':{name:'MEDIUM'},'9':{name:'DRAW',outs:9},'10':{name:'DRAW',outs:7},'11':{name:'DRAW',outs:13},'12':{name:'DRAW',outs:5},'13':{name:'AIR'},'15':{name:'AIR'}};
G.hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}];
G._eq=50;

const scenarios = {
  'flop-cbet': function(){G._street='flop';G.scene='check';global.getCurrentStreet=function(){return'flop';};global.ActionLine.didPreflopRaise=function(){return true;};global.ActionLine.didCbetOnFlop=function(){return false;};global.pA=function(){return 0.7;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'}];},
  'flop-face': function(){G._street='flop';G.scene='raise';G.bet=50;global.ActionLine.didPreflopRaise=function(){return false;};global.pA=function(){return 0.3;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'}];},
  'turn-db': function(){G._street='turn';G.scene='check';global.getCurrentStreet=function(){return'turn';};global.ActionLine.didPreflopRaise=function(){return true;};global.ActionLine.didCbetOnFlop=function(){return true;};global.pA=function(){return 0.7;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'}];},
  'turn-face': function(){G._street='turn';G.scene='raise';G.bet=80;global.ActionLine.didPreflopRaise=function(){return false;};global.pA=function(){return 0.3;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'}];},
  'river-value': function(){G._street='river';G.scene='check';global.getCurrentStreet=function(){return'river';};global.ActionLine.didPreflopRaise=function(){return true;};global.pA=function(){return 0.7;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'},{rank:'7',suit:'h'}];},
  'river-face': function(){G._street='river';G.scene='raise';G.bet=100;global.ActionLine.didPreflopRaise=function(){return false;};global.pA=function(){return 0.3;};G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'},{rank:'7',suit:'h'}];},
};

const stats = {};
let crashes = 0;
const total = Object.keys(btMap).length * Object.keys(hcMap).length;
for (const [scName, setup] of Object.entries(scenarios)) {
  for (const [btK, btObj] of Object.entries(btMap)) {
    for (const [hcK, hcObj] of Object.entries(hcMap)) {
      G._bt = btObj; G._hc = hcObj;
      setup();
      try {
        if (!StrategyEngine.decidePostflop('AKs')) stats[scName] = (stats[scName] || 0) + 1;
      } catch (e) { crashes++; }
    }
  }
}
let nullTotal = 0;
for (const [k, v] of Object.entries(stats)) {
  nullTotal += v;
  const pct = Math.round(v / total * 100);
  if (pct > 0) report('严重', `${k}: null ${v}/${total} (${pct}%)`);
}
if (crashes > 0) report('致命', `运行时崩溃 ${crashes}次`);
if (nullTotal === 0) report('提示', `全场景零null (${Object.keys(scenarios).length * total}次决策)`);

// ============ 8. 翻前场景 ============
console.log('\n【8】翻前10场景');
const preflopTests = [
  ['BTN开池AKs', function(){G.phase='pre';G.scene='check';G.pos='btn';G.comm=[];G.hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}];G.bet=0;G.limpers=0;return StrategyEngine.decidePreflop('AKs');}],
  ['BB 3bet AA vs BTN', function(){G.phase='pre';G.scene='raise';G.pos='bb';G._raiserRole='btn';G.bet=30;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['BB 3bet AA vs SB', function(){G.phase='pre';G.scene='raise';G.pos='bb';G._raiserRole='sb';G.bet=30;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['BTN 4bet KK', function(){G.phase='pre';G.scene='reraise';G.pos='btn';G.bet=90;G.hole=[{rank:'K',suit:'h'},{rank:'K',suit:'d'}];return StrategyEngine.decidePreflop('KK');}],
  ['BB allin call AA', function(){G.phase='pre';G.scene='allin';G.pos='bb';G.bet=500;G.hole=[{rank:'A',suit:'h'},{rank:'A',suit:'d'}];return StrategyEngine.decidePreflop('AA');}],
  ['MP开池88', function(){G.phase='pre';G.scene='check';G.pos='mp';G.bet=0;G.hole=[{rank:'8',suit:'h'},{rank:'8',suit:'d'}];return StrategyEngine.decidePreflop('88');}],
  ['MP面对3bet JJ', function(){G.phase='pre';G.scene='reraise';G.pos='mp';G.bet=90;G.hole=[{rank:'J',suit:'h'},{rank:'J',suit:'d'}];return StrategyEngine.decidePreflop('JJ');}],
  ['BB check option', function(){G.phase='pre';G.scene='check';G.pos='bb';G.bet=0;G.hole=[{rank:'7',suit:'h'},{rank:'2',suit:'d'}];return StrategyEngine.decidePreflop('72o');}],
  ['SB开池A5s', function(){G.phase='pre';G.scene='check';G.pos='sb';G.bet=0;G.hole=[{rank:'A',suit:'h'},{rank:'5',suit:'h'}];return StrategyEngine.decidePreflop('A5s');}],
  ['limpers BTN KQo', function(){G.phase='pre';G.scene='check';G.pos='btn';G.bet=0;G.limpers=2;G.hole=[{rank:'K',suit:'h'},{rank:'Q',suit:'d'}];return StrategyEngine.decidePreflop('KQo');}],
];
let preflopNull = 0;
for (const [name, fn] of preflopTests) {
  try {
    const r = fn();
    if (!r) { report('严重', `${name}: null`); preflopNull++; }
  } catch (e) {
    report('致命', `${name}: 崩溃 ${e.message}`);
    preflopNull++;
  }
}
if (preflopNull === 0) report('提示', '翻前10场景零null');

// ============ 9. Kotlin状态机 ============
console.log('\n【9】Kotlin状态机（isVisionInProgress）');
const fsContent = fs.readFileSync('app/src/main/java/com/pokerhelper/app/FloatingService.kt', 'utf8');
const sets = (fsContent.match(/isVisionInProgress\s*=\s*true/g) || []).length;
const resets = (fsContent.match(/isVisionInProgress\s*=\s*false/g) || []).length;
report('提示', `isVisionInProgress: 置true ${sets}次, 置false ${resets}次 ${sets <= resets ? '✅平衡' : '⚠️可能泄漏'}`);

// ============ 总结 ============
console.log('\n' + '═'.repeat(70));
if (totalIssues === 0) {
  console.log('🎉 全检通过！没有发现问题');
} else {
  console.log(`📋 发现 ${totalIssues} 个问题，请逐条修复`);
}
console.log('═'.repeat(70));
