// ============================================================
// V3.1: StreetPlan 多街计划 + RangeVsRange 范围分析
// 独立模块，挂载到 G 全局，策略引擎可选用
// 依赖: eH()(牌力), mcVsRange()(蒙特卡洛), getOppRange()(范围)
// ============================================================

// ============ 第一部分: RangeVsRange 范围分析 ============
var RangeVsRange=(function(){
  'use strict';
  
  // 范围转组合列表缓存
  var _rangeCache={};
  
  // 常用范围定义 (简化组合表示)
  var RANGES={
    btn_open:['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
              'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
              'KQs','KJs','KTs','K9s','QJs','QTs','JTs','T9s','98s','87s','76s','65s','54s',
              'AKo','AQo','AJo','ATo','KQo','KJo','QJo','JTo','T9o'],
    bb_call:['22','33','44','55','66','77','88','99','TT',
             'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
             'K9s','KTs','KJs','KQs','Q9s','QTs','QJs','J9s','JTs','T9s','98s','87s','76s','65s','54s',
             'ATo','AJo','AQo','AKo','KQo','KJo','QJo','JTo'],
    bb_defend_vs_steal:['22','33','44','55','66','77','88','99','TT','JJ',
             'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
             'K9s','KTs','KJs','KQs','Q9s','QTs','QJs','J9s','JTs','T9s','98s','87s','76s','65s',
             'ATo','AJo','AQo','AKo','KQo']
  };
  
  /**
   * 计算双方范围在当前牌面的权益对比
   * @param myRange 我的范围(组合key数组)
   * @param oppRange 对手范围
   * @param board 公共牌
   * @param iterations 蒙特卡洛次数(默认150, 手机端控制延迟)
   * @return {myEquity, oppEquity, nutAdvantage, myNutCount, oppNutCount}
   */
  function calcRangeEquity(myRange, oppRange, board, iterations){
    iterations=iterations||150;
    var known=board.filter(function(c){return c;});
    var myCombos=rangeToCombos(myRange, known);
    var oppCombos=rangeToCombos(oppRange, known);
    
    if(myCombos.length===0||oppCombos.length===0){
      return{myEquity:50,oppEquity:50,nutAdvantage:0,myNutCount:0,oppNutCount:0};
    }
    
    var myWins=0, ties=0;
    for(var i=0;i<iterations;i++){
      var myHole=myCombos[Math.floor(Math.random()*myCombos.length)];
      var oppHole=oppCombos[Math.floor(Math.random()*oppCombos.length)];
      // 随机补全公共牌到5张
      var fullBoard=completeBoard(known, myHole, oppHole);
      var myBest=eH(myHole.concat(fullBoard));
      var oppBest=eH(oppHole.concat(fullBoard));
      if(myBest>oppBest)myWins++;
      else if(myBest===oppBest)ties++;
    }
    
    var myEq=(myWins+ties*0.5)/iterations*100;
    
    // 坚果优势: 当前已知公共牌下的最强牌型数量
    var myNut=countNuts(myCombos, known);
    var oppNut=countNuts(oppCombos, known);
    
    return{
      myEquity:myEq,
      oppEquity:100-myEq,
      nutAdvantage:myNut-oppNut,
      myNutCount:myNut,
      oppNutCount:oppNut,
      myRangeSize:myCombos.length,
      oppRangeSize:oppCombos.length
    };
  }
  
  // 范围key → 具体组合
  function rangeToCombos(rangeKeys, known){
    var cacheKey=rangeKeys.join(',')+'_'+(known.length>0?known.length+'b':'nb');
    if(_rangeCache[cacheKey])return _rangeCache[cacheKey];
    
    var combos=[];
    var used=new Set();
    for(var i=0;i<known.length;i++){
      var c=known[i];
      if(c&&c.rank)used.add(c.rank+c.suit);
    }
    
    for(var k=0;k<rangeKeys.length;k++){
      var key=rangeKeys[k];
      var hands=handKeyToCards(key);
      for(var h=0;h<hands.length;h++){
        var hand=hands[h];
        var k1=hand[0].rank+hand[0].suit;
        var k2=hand[1].rank+hand[1].suit;
        if(used.has(k1)||used.has(k2))continue;
        combos.push(hand);
      }
    }
    _rangeCache[cacheKey]=combos;
    return combos;
  }
  
  // 补全公共牌到5张
  function completeBoard(board, myHole, oppHole){
    var used=new Set();
    function mark(cards){
      for(var i=0;i<cards.length;i++){
        if(cards[i]&&cards[i].rank)used.add(cards[i].rank+(cards[i].suit||''));
      }
    }
    mark(board);mark(myHole);mark(oppHole);
    
    var deck=[];
    for(var ri=0;ri<R.length;ri++){
      for(var si=0;si<SU.length;si++){
        var key=R[ri]+SU[si];
        if(!used.has(key))deck.push({rank:R[ri],suit:SU[si]});
      }
    }
    // 洗牌
    for(var j=deck.length-1;j>0;j--){
      var k2=Math.floor(Math.random()*(j+1));
      var t=deck[j];deck[j]=deck[k2];deck[k2]=t;
    }
    var need=5-board.length;
    return board.concat(deck.slice(0,need));
  }
  
  // 计算坚果数量(在当前board下, range里有多少组合是nuts或准nuts)
  function countNuts(combos, board){
    if(board.length<3)return 0;
    var nutCount=0;
    // 抽样计算(组合太多时)
    var sampleSize=Math.min(combos.length, 50);
    for(var s=0;s<sampleSize;s++){
      var hole=combos[Math.floor(s*combos.length/sampleSize)];
      var fullBoard=board.slice(0,5);
      // 只评估当前board(不补全), 用当前5张或部分
      var score=eH(hole.concat(fullBoard));
      // 简化: score>=NUTS阈值(8=四条,7=葫芦)算坚果
      if(score>=7000000)nutCount++;
    }
    return nutCount;
  }
  
  return{
    calcRangeEquity:calcRangeEquity,
    getRange:function(name){return RANGES[name]||RANGES.btn_open;},
    rangeToCombos:rangeToCombos
  };
})();

// ============ 第二部分: StreetPlan 多街计划 ============
var StreetPlan=(function(){
  'use strict';
  
  var _currentPlan=null;
  var _handId=null;
  
  /**
   * 翻牌时生成三街计划
   * @param hole 手牌
   * @param flop 翻牌3张
   * @param pos 位置('btn'/'sb'/'bb'/等)
   * @param isPFR 是否是翻前加注者
   * @return 计划对象
   */
  function makePlan(hole, flop, pos, isPFR){
    var hClass=handClassify(hole, flop);
    var texture=boardTexture(flop);
    var plan={
      street:'flop',
      hClass:hClass?hClass.name:'unknown',
      texture:texture?texture.category:'unknown',
      isPFR:!!isPFR,
      pos:pos,
      // 路线模板
      route:'',       // 'value' / 'bluff' / 'draw' / 'pot_control' / 'giveup'
      turnGoodCards:[],  // Turn好牌(击中后继续)
      turnBadCards:[],   // Turn危险牌(刹车)
      riverPlan:'',     // 'value' / 'bluff' / 'check'
      notes:[]
    };
    
    // === 路线判定 ===
    var hcKey=hClass?hClass.name:'unknown';
    var wet=texture?texture.wetness:0;
    
    if(hcKey==='NUTS'||hcKey==='STRONG'){
      // 强牌: 价值路线, 三街全下注
      plan.route='value';
      plan.riverPlan='value';
      plan.notes.push('强牌: 三街价值路线');
    } else if(hcKey==='DRAW'){
      // 听牌: 半诈唬路线, 击中继续
      plan.route='draw';
      plan.riverPlan=hClass.outs>=12?'bluff':'check';
      plan.notes.push('听牌('+hClass.outs+'outs): 半诈唬, 击中转价值');
      // 好牌=完成听牌的牌
      plan.turnGoodCards=getDrawCompletingCards(hClass, flop);
      // 坏牌=跟听牌无关的大牌(可能帮到对手)
      plan.turnBadCards=['A','K','Q'];
    } else if(hcKey==='MEDIUM'){
      // 中等牌: 控制底池
      plan.route='pot_control';
      plan.riverPlan='check';
      plan.notes.push('中等牌: 控池路线, 一街下注最多');
    } else if(hcKey==='AIR'){
      // 空气: 看纹理决定诈唬或放弃
      if(wet>=2&&isPFR){
        plan.route='bluff';
        plan.riverPlan='bluff';
        plan.notes.push('湿面空气: 利用范围优势诈唬');
      } else {
        plan.route='giveup';
        plan.riverPlan='check';
        plan.notes.push('干面空气: 放弃');
      }
    } else {
      plan.route='pot_control';
      plan.riverPlan='check';
    }
    
    _currentPlan=plan;
    _handId=Date.now();
    return plan;
  }
  
  /**
   * 每街检查计划是否按预期发展
   * @param street 当前街('turn'/'river')
   * @param newCards 新发的牌
   * @return {onTrack, shouldContinue, shouldBluff, adjustment}
   */
  function checkPlan(street, newCards, currentBoard){
    if(!_currentPlan)return{onTrack:true,shouldContinue:true};
    var plan=_currentPlan;
    
    // Turn好牌命中?
    var hit=false;
    if(street==='turn'&&newCards&&newCards.length>0){
      for(var i=0;i<newCards.length;i++){
        var r=newCards[i].rank;
        if(plan.turnGoodCards.indexOf(r)>=0)hit=true;
      }
    }
    
    var result={
      onTrack:true,
      shouldContinue:true,
      hitDraw:false,
      planRoute:plan.route,
      riverPlan:plan.riverPlan,
      adjustment:''
    };
    
    if(plan.route==='draw'&&street==='turn'){
      if(hit){
        result.hitDraw=true;
        result.shouldContinue=true;
        result.riverPlan='value';
        result.adjustment='听牌击中→转价值路线';
      } else {
        result.shouldContinue=false;
        result.adjustment='听牌miss→按计划刹车';
      }
    } else if(plan.route==='giveup'&&street==='turn'){
      result.shouldContinue=false;
      result.adjustment='放弃路线→持续过牌';
    } else if(plan.route==='value'&&street==='turn'){
      // 危险牌检查
      if(newCards&&newCards.length>0){
        for(var j=0;j<newCards.length;j++){
          if(plan.turnBadCards.indexOf(newCards[j].rank)>=0){
            result.shouldContinue=Math.random()>0.5; // 50%继续, 50%减速
            result.adjustment='危险牌'+newCards[j].rank+'→半速';
            break;
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * 新一手牌重置计划
   */
  function reset(){
    _currentPlan=null;
    _handId=null;
  }
  
  // 听牌完成牌计算
  function getDrawCompletingCards(hClass, board){
    if(!hClass)return[];
    var completing=[];
    var name=hClass.name;
    // 简化: 返回常见完成牌
    if(hClass.outs>=8){
      // 同花听牌或OESD, 完成牌是补齐花色的或顺子牌
      // 这里用简化启发式
      completing=['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
    }
    return completing;
  }
  
  return{
    makePlan:makePlan,
    checkPlan:checkPlan,
    reset:reset,
    getCurrentPlan:function(){return _currentPlan;}
  };
})();

// 挂载到全局
if(typeof G!=='undefined'){
  G.RangeVsRange=RangeVsRange;
  G.StreetPlan=StreetPlan;
}
if(typeof global!=="undefined"){
  global.RangeVsRange=RangeVsRange;
  global.StreetPlan=StreetPlan;
}
