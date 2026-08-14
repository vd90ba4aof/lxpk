const fs = require('fs');
let engine = fs.readFileSync('strategy_engine_v2155.js', 'utf8');
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

eval(engine);
G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'}];
G.hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}];

const btMap = {'0':{category:'dry',wetness:0,hasMonotone:false,hasPaired:false},'1':{category:'dry',wetness:1,hasMonotone:false,hasPaired:false},'2':{category:'wet',wetness:2,hasMonotone:false,hasPaired:false},'4':{category:'wet',wetness:2,hasMonotone:true,hasPaired:false},'5':{category:'paired',wetness:1,hasMonotone:false,hasPaired:true},'6':{category:'semi-wet',wetness:2,hasMonotone:false,hasPaired:true}};
const hcMap = {'0':{name:'NUTS'},'4':{name:'STRONG'},'6':{name:'MEDIUM'},'9':{name:'DRAW',outs:9},'10':{name:'DRAW',outs:7},'11':{name:'DRAW',outs:13},'12':{name:'DRAW',outs:5},'13':{name:'AIR'},'15':{name:'AIR'}};

console.log('=== flop-cbet 剩余null ===');
for (const [btK, btObj] of Object.entries(btMap)) {
  for (const [hcK, hcObj] of Object.entries(hcMap)) {
    G._bt=btObj; G._hc=hcObj; G.scene='check';
    G._street='flop';
    global.getCurrentStreet = function(){return 'flop';};
    global.ActionLine.didPreflopRaise = function(){return true;};
    global.pA = function(){return 0.7;};
    G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'}];
    const r = StrategyEngine.decidePostflop('AKs');
    if (!r) console.log(`null: bt=${btK} hc=${hcK} (${hcObj.name})`);
  }
}
console.log('=== turn-face 剩余null ===');
G._street='turn'; G.scene='raise'; G.bet=80;
global.getCurrentStreet = function(){return 'turn';};
global.ActionLine.didPreflopRaise = function(){return false;};
global.pA = function(){return 0.3;};
G.comm=[{rank:'J',suit:'h'},{rank:'9',suit:'d'},{rank:'8',suit:'c'},{rank:'2',suit:'s'}];
for (const [btK, btObj] of Object.entries(btMap)) {
  for (const [hcK, hcObj] of Object.entries(hcMap)) {
    G._bt=btObj; G._hc=hcObj;
    const r = StrategyEngine.decidePostflop('AKs');
    if (!r) console.log(`null: bt=${btK} hc=${hcK} (${hcObj.name})`);
  }
}
