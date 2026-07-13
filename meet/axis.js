// ソコナラ「仕事の軸」共通モジュール（追記48）
// 当日ページ(/meet/day.html)とアプリ(index.html)の両方がこれを読み込む＝計算式は常にこの1本。
// データの系譜：
//   companies.wb（admin設定＝企業の軸） … チェックした企業のwbを重ね合わせ（間接シグナル・弱め）
//   reactions（経営層カードで本人がタップした共感ポイント＝軸キーと1:1） … 直接シグナル・主役
//   survey.rtags（アンケートの理由タグ＝同じ軸キー） … 直接シグナル
window.SN_AXIS = (function(){
  var AX = [['meaning','意味・使命'],['agency','裁量・挑戦'],['people','人・近さ'],['local','地域・つながり'],['time','時間・ゆとり'],['econ','経済（年収）']];
  // タグ→軸の加点。新タグ＝軸キーそのもの（1:1）。旧タグ(leader/biz/exp/growth/cond)は過去データ互換用マッピング。
  var TAG_AX = {
    meaning:{meaning:10}, agency:{agency:10}, people:{people:10}, local:{local:12}, time:{time:10}, econ:{econ:12},
    leader:{people:10}, biz:{meaning:8,agency:6}, exp:{agency:10}, growth:{agency:10}, cond:{econ:12}
  };
  function clamp(v){ return Math.max(0,Math.min(100,Math.round(v))); }
  // m = {checks:[], reactions:{coId:[axisKey,..]}, survey:{deep:[],talk:[],rtags:[]}}
  // wbById = {coId: {meaning:60,...}}（companies.wb）
  function centroid(m, wbById){
    var w = {meaning:52,agency:52,people:52,local:52,time:52,econ:50};
    m = m || {}; var sv = m.survey || {};
    var ids = {};
    (m.checks||[]).concat(sv.deep||[], sv.talk||[]).forEach(function(id){ ids[String(id)] = 1; });
    Object.keys(ids).forEach(function(id){
      var wb = wbById && wbById[id]; if(!wb || typeof wb!=='object') return;
      AX.forEach(function(a){ var v = (wb[a[0]]!=null)?wb[a[0]]:60; w[a[0]] = clamp(w[a[0]] + (v-58)*0.35); });
    });
    // 本人が直接タップした共感ポイント（経営層ごと・複数社で同じ軸なら積み上がる）
    var re = m.reactions || {};
    Object.keys(re).forEach(function(id){
      (re[id]||[]).forEach(function(t){ var mm = TAG_AX[t]; if(mm) Object.keys(mm).forEach(function(k){ w[k] = clamp(w[k] + Math.round(mm[k]*0.7)); }); });
    });
    (sv.rtags||[]).forEach(function(t){ var mm = TAG_AX[t]; if(mm) Object.keys(mm).forEach(function(k){ w[k] = clamp(w[k] + mm[k]); }); });
    return w;
  }
  function radar(w){
    var cx=130, cy=118, R=82;
    function pt(i,val){ var a=(-90+i*60)*Math.PI/180, r=R*clamp(val)/100; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
    function ring(g,f){ var p=[]; for(var i=0;i<6;i++){ var q=pt(i,g); p.push(q[0].toFixed(1)+','+q[1].toFixed(1)); } return '<polygon points="'+p.join(' ')+'" fill="'+(f||'none')+'" stroke="rgba(22,34,63,0.10)" stroke-width="0.8"/>'; }
    var s='<svg viewBox="-24 -4 308 250" width="100%" style="max-width:300px;display:block;margin:4px auto;">'
      +'<defs><linearGradient id="dg1" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#3cbcaa" stop-opacity="0.55"/><stop offset="1" stop-color="#16223f" stop-opacity="0.22"/></linearGradient>'
      +'<filter id="ds1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#16223f" flood-opacity="0.28"/></filter></defs>';
    [100,66,33].forEach(function(g){ s+=ring(g,'rgba(22,34,63,0.030)'); });
    for(var i=0;i<6;i++){ var e=pt(i,100); s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+e[0].toFixed(1)+'" y2="'+e[1].toFixed(1)+'" stroke="rgba(22,34,63,0.10)" stroke-width="0.8"/>'; }
    var p=[]; for(var j=0;j<6;j++){ var q=pt(j,w[AX[j][0]]); p.push(q[0].toFixed(1)+','+q[1].toFixed(1)); }
    s+='<g class="wbGrow">';
    s+='<polygon points="'+p.join(' ')+'" fill="url(#dg1)" stroke="#2f9c8d" stroke-width="2.2" stroke-linejoin="round" filter="url(#ds1)"/>';
    for(var d=0;d<6;d++){ var qd=pt(d,w[AX[d][0]]); s+='<circle cx="'+qd[0].toFixed(1)+'" cy="'+qd[1].toFixed(1)+'" r="3" fill="#fff" stroke="#2f9c8d" stroke-width="2"/>'; }
    s+='</g>';
    for(var k=0;k<6;k++){ var lp=pt(k,128); s+='<text x="'+lp[0].toFixed(1)+'" y="'+lp[1].toFixed(1)+'" font-size="9.5" font-weight="700" fill="#3d4453" text-anchor="middle" dominant-baseline="middle">'+AX[k][1]+'</text>'; }
    return s+'</svg>';
  }
  return { AX:AX, TAG_AX:TAG_AX, clamp:clamp, centroid:centroid, radar:radar };
})();
