
// ===== New Section Switching =====
var SECTION_HANDLERS = {};
function registerSection(name, handler){
  SECTION_HANDLERS[name] = handler;
}
function switchSection(name){
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  var btn = document.querySelector('.nav-btn[onclick*="'+name+'"]');
  if(btn) btn.classList.add('active');
  // Hide all section-content
  document.querySelectorAll('.section-content').forEach(function(c){c.classList.remove('active');});
  // Hide legacy tab-content for bazi/zwds
  document.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');});
  document.querySelectorAll('.result-area').forEach(function(r){r.classList.remove('show');});
  // Show target
  var target = document.getElementById('section-'+name);
  if(target){
    target.classList.add('active');
    // 恢复内部的 tab-content active（避免被全局清除影响）
    var tab = target.querySelector('.tab-content');
    if(tab) tab.classList.add('active');
    if(SECTION_HANDLERS[name]) SECTION_HANDLERS[name]();
  }
  window.scrollTo({top:0,behavior:'smooth'});
  // 同步已存储的出生信息到当前板块
  syncBirthDataTo(name);
}

// ===== 全局出生数据同步 =====
var _BIRTH_DATA = {};
function saveBirthData(src){
  var prefixes = {
    'bazi':['bazi','name'],'zwds':['zwds','name'],
    'qizheng':['qz','name'],'sanhe':['sh','name'],
    'liuren':['lr',''],'wx':['wx','']
  };
  var cfg = prefixes[src] || [src,''];
  var pfx = cfg[0], nameField = cfg[1];
  _BIRTH_DATA.year = document.getElementById(pfx+'-year') ? document.getElementById(pfx+'-year').value : _BIRTH_DATA.year;
  _BIRTH_DATA.month = document.getElementById(pfx+'-month') ? document.getElementById(pfx+'-month').value : _BIRTH_DATA.month;
  _BIRTH_DATA.day = document.getElementById(pfx+'-day') ? document.getElementById(pfx+'-day').value : _BIRTH_DATA.day;
  var hourSel = document.getElementById(pfx+'-hour');
  if(hourSel) _BIRTH_DATA.hour = hourSel.value;
  if(nameField && document.getElementById(pfx+'-'+nameField)){
    _BIRTH_DATA.name = document.getElementById(pfx+'-'+nameField).value;
  }
  // 性别
  var genderRadios = document.getElementsByName(pfx+'-gender');
  for(var gi=0;gi<genderRadios.length;gi++){
    if(genderRadios[gi].checked) _BIRTH_DATA.gender = genderRadios[gi].value;
  }
}
function syncBirthDataTo(section){
  var map = {
    'bazi':{pfx:'bazi',name:'bazi-name',gender:'bazi-gender',hour:'bazi-hour'},
    'zwds':{pfx:'zwds',name:'zwds-name',gender:'zwds-gender',hour:'zwds-hour'},
    'qizheng':{pfx:'qz',name:'qz-name',gender:'qz-gender',hour:'qz-hour'},
    'sanhe':{pfx:'sh',name:'sh-name',gender:'sh-gender',hour:'sh-hour'},
    'liuren':{pfx:'lr',name:'',gender:'',hour:'lr-hour'},
    'baibaodai':{pfx:'wx',name:'',gender:'wx-gender',hour:'wx-hour'}
  };
  var cfg = map[section];
  if(!cfg||!_BIRTH_DATA.year) return;
  if(_BIRTH_DATA.year){
    var yEl=document.getElementById(cfg.pfx+'-year');if(yEl)yEl.value=_BIRTH_DATA.year;
  }
  if(_BIRTH_DATA.month){
    var mEl=document.getElementById(cfg.pfx+'-month');if(mEl)mEl.value=_BIRTH_DATA.month;
  }
  if(_BIRTH_DATA.day){
    var dEl=document.getElementById(cfg.pfx+'-day');if(dEl)dEl.value=_BIRTH_DATA.day;
  }
  if(_BIRTH_DATA.hour!==undefined){
    var hEl=document.getElementById(cfg.hour);if(hEl)hEl.value=_BIRTH_DATA.hour;
  }
  if(_BIRTH_DATA.name&&cfg.name){
    var nEl=document.getElementById(cfg.name);if(nEl)nEl.value=_BIRTH_DATA.name;
  }
  if(_BIRTH_DATA.gender&&cfg.gender){
    var gs=document.getElementsByName(cfg.gender);
    for(var gi=0;gi<gs.length;gi++){
      if(gs[gi].value===_BIRTH_DATA.gender) gs[gi].checked=true;
    }
  }
}
// 给所有排盘按钮绑定保存出生数据
function autoSaveBirth(src){
  saveBirthData(src);
  syncBirthDataTo('bazi');syncBirthDataTo('zwds');
  syncBirthDataTo('qizheng');syncBirthDataTo('sanhe');
  syncBirthDataTo('liuren');syncBirthDataTo('baibaodai');
}
// 保存/恢复基础信息
(function(){
  var saved = localStorage.getItem('bazi_base_info');
  if(saved){
    try{
      var d = JSON.parse(saved);
      _BIRTH_DATA = {name:d.name,gender:d.gender,year:d.year,month:d.month,day:d.day,hour:d.hour};
      setTimeout(function(){
        syncBirthDataTo('bazi');syncBirthDataTo('zwds');
        syncBirthDataTo('qizheng');syncBirthDataTo('sanhe');
        syncBirthDataTo('liuren');syncBirthDataTo('baibaodai');
        ['bazi','zwds'].forEach(function(p){
          var nEl=document.getElementById(p+'-name');if(nEl)nEl.value=d.name||'';
          var gs=document.getElementsByName(p+'-gender');
          for(var gi=0;gi<gs.length;gi++){if(gs[gi].value===d.gender)gs[gi].checked=true;}
        });
      }, 100);
    }catch(e){}
  }
})();

// ===== Tab Switching =====
function switchTab(name){
  // Sync form values between tabs
  var src = name === 'bazi' ? 'zwds' : 'bazi';
  var dst = name;
  if(src !== dst){
    // Name
    document.getElementById(dst+'-name').value = document.getElementById(src+'-name').value;
    // Gender
    var srcGender = document.querySelector('input[name="'+src+'-gender"]:checked');
    if(srcGender){
      document.querySelector('input[name="'+dst+'-gender"][value="'+srcGender.value+'"]').checked = true;
    }
    // Date selects
    ['year','month','day','hour'].forEach(function(f){
      var srcEl = document.getElementById(src+'-'+f);
      var dstEl = document.getElementById(dst+'-'+f);
      if(srcEl && dstEl) dstEl.value = srcEl.value;
    });
    // Lunar date selects
    ['lyear','lmonth','lday','lhour','lleap'].forEach(function(f){
      var srcEl = document.getElementById(src+'-'+f);
      var dstEl = document.getElementById(dst+'-'+f);
      if(srcEl && dstEl) dstEl.value = srcEl.value;
    });
    // Minute
    var srcMin = document.getElementById(src+'-minute');
    var dstMin = document.getElementById(dst+'-minute');
    if(srcMin && dstMin) dstMin.value = srcMin.value;
    // Calendar type
    window[dst+'_caltype'] = window[src+'_caltype'] || 'solar';
    var calType = window[dst+'_caltype'];
    // Update calendar toggle UI
    var solarDiv = document.getElementById(dst+'-solar');
    var lunarDiv = document.getElementById(dst+'-lunar');
    if(solarDiv && lunarDiv){
      solarDiv.style.display = calType === 'solar' ? 'block' : 'none';
      lunarDiv.style.display = calType === 'lunar' ? 'block' : 'none';
    }
    var calBtns = document.querySelectorAll('#'+dst+'-solar, #'+dst+'-lunar');
    document.querySelectorAll('#'+dst+'-solar ~ .fs-title .cal-btn, #'+dst+'-lunar ~ .fs-title .cal-btn').forEach(function(b){
      // This selector might not work, use a different approach
    });
    // Update calendar toggle button states
    var toggle = document.querySelector('#'+dst+'-solar').parentElement.previousElementSibling;
    if(toggle && toggle.querySelectorAll){
      toggle.querySelectorAll('.cal-btn').forEach(function(b){
        b.classList.toggle('active', b.textContent.trim() === (calType==='solar'?'公历':'农历'));
      });
    }
    // Location
    ['province','city'].forEach(function(f){
      var srcEl = document.getElementById(src+'-'+f);
      var dstEl = document.getElementById(dst+'-'+f);
      if(srcEl && dstEl){
        dstEl.value = srcEl.value;
        if(f === 'province' && srcEl.value) updateCities(dst);
      }
    });
  }

  // Tab UI switching
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');});
  document.querySelectorAll('.result-area').forEach(function(r){r.classList.remove('show');});
  if(name==='bazi'){document.querySelector('.tabs button:first-child').classList.add('active')}
  else{document.querySelector('.tabs button:last-child').classList.add('active')}
  document.getElementById('tab-'+name).classList.add('active');
}

// ===== Populate Date Selects =====
function populateSelects(prefix){
  var yearSel = document.getElementById(prefix+'-year');
  var monthSel = document.getElementById(prefix+'-month');
  var daySel = document.getElementById(prefix+'-day');
  if(!yearSel || yearSel.tagName!=='SELECT') return; // 兼容input+datalist模式
  var curYear = new Date().getFullYear();
  // 添加"请选择"占位选项
  var placeholder = function(label){var o=document.createElement('option');o.value='';o.textContent=label;o.disabled=true;o.selected=true;return o;};
  yearSel.appendChild(placeholder('请选择年份'));
  for(var y=curYear; y>=1900; y--){
    var opt = document.createElement('option');
    opt.value = y; opt.textContent = y+'年';
    yearSel.appendChild(opt);
  }
  monthSel.appendChild(placeholder('请选择月份'));
  for(var m=1; m<=12; m++){
    var opt = document.createElement('option');
    opt.value = m; opt.textContent = m+'月';
    monthSel.appendChild(opt);
  }
  daySel.appendChild(placeholder('请选择日期'));
  for(var d=1; d<=31; d++){
    var opt = document.createElement('option');
    opt.value = d; opt.textContent = d+'日';
    daySel.appendChild(opt);
  }
  function updateDays(){
    var y = parseInt(yearSel.value);
    var m = parseInt(monthSel.value);
    if(!y || !m || isNaN(y) || isNaN(m)) return;
    var max = new Date(y, m, 0).getDate();
    var cur = parseInt(daySel.value);
    if(cur > max) cur = max;
    daySel.innerHTML = '';
    for(var d=1; d<=max; d++){
      var opt = document.createElement('option');
      opt.value = d; opt.textContent = d+'日';
      if(d===cur) opt.selected = true;
      daySel.appendChild(opt);
    }
  }
  monthSel.addEventListener('change', updateDays);
  yearSel.addEventListener('change', updateDays);
}
populateSelects('bazi');
populateSelects('zwds');
// 初始化下拉候选列表 (datalist)
(function(){
  var curYear = new Date().getFullYear();
  ['bazi','zwds'].forEach(function(p){
    ['year','lyear'].forEach(function(f){
      var dl = document.getElementById(p+'-'+f+'-list');
      if(dl){for(var y=curYear;y>=1900;y--){var o=document.createElement('option');o.value=y;dl.appendChild(o);}}
    });
    ['month','lmonth'].forEach(function(f){
      var dl = document.getElementById(p+'-'+f+'-list');
      if(dl){for(var m=1;m<=12;m++){var o=document.createElement('option');o.value=m;dl.appendChild(o);}}
    });
    ['day','lday'].forEach(function(f){
      var dl = document.getElementById(p+'-'+f+'-list');
      if(dl){for(var d=1;d<=31;d++){var o=document.createElement('option');o.value=d;dl.appendChild(o);}}
    });
  });
})();

// Calendar toggle
function setCalendar(prefix, type, btn){
  document.getElementById(prefix+'-solar').style.display = type==='solar'?'block':'none';
  document.getElementById(prefix+'-lunar').style.display = type==='lunar'?'block':'none';
  btn.parentElement.querySelectorAll('.cal-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  window[prefix+'_caltype'] = type;
}

// Populate lunar date selects
function populateLunar(prefix){
  var ySel = document.getElementById(prefix+'-lyear');
  var mSel = document.getElementById(prefix+'-lmonth');
  var dSel = document.getElementById(prefix+'-lday');
  if(!ySel || !mSel || !dSel) return; // 兼容input+datalist模式
  if(ySel.tagName !== 'SELECT') return;
  var curYear = new Date().getFullYear();
  for(var y=curYear; y>=1900; y--){
    var opt = document.createElement('option');
    opt.value = y; opt.textContent = y+'年';
    if(y===curYear-20) opt.selected = true;
    ySel.appendChild(opt);
  }
  var lunarMonths = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
  lunarMonths.forEach(function(m,i){
    var opt = document.createElement('option');
    opt.value = i+1; opt.textContent = m;
    if(i===0) opt.selected = true;
    mSel.appendChild(opt);
  });
  var lunarDays = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  lunarDays.forEach(function(d,i){
    var opt = document.createElement('option');
    opt.value = i+1; opt.textContent = d;
    if(i===14) opt.selected = true;
    dSel.appendChild(opt);
  });
}
// populateLunar calls are handled by each page's useEffect
window.bazi_caltype = 'solar';
window.zwds_caltype = 'solar';

// ====================================================================
// 八字计算 (Ba Zi)
// ====================================================================
var WUXI_NAMES = {jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
var GAN_LIST = ['','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var ZHI_LIST = ['','子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function ganWx(i){return ['','木','木','火','火','土','土','金','金','水','水'][i]||''}
function zhiWx(i){return ['','水','土','木','木','土','火','火','土','金','金','土','水'][i]||''}
var CANG_GAN = {1:[10,11],2:[6,10,7],3:[1,3,5],4:[2],5:[5,7,1],6:[3,5,7],7:[4,6],8:[5,8,2],9:[7,9,5],10:[8],11:[5,10,8],12:[9,1]};
function getCG(z){return (CANG_GAN[z]||[]).map(function(i){return GAN_LIST[i];});}
function getSS(d,o){return ['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印'][(o-d+10)%10]||'';}
var DAY_MASTER = {
  '甲':'甲木为阳木，如参天大树。正直坚韧、有领导力，心胸开阔。但有时过于固执。',
  '乙':'乙木为阴木，如藤蔓花草。柔韧灵活、心思细腻，有艺术天赋。但容易优柔寡断。',
  '丙':'丙火为阳火，如太阳当空。热情开朗、慷慨大方、善于社交。但容易冲动，缺乏耐心。',
  '丁':'丁火为阴火，如灯烛之火。温和文雅、内秀持久、洞察力强。但容易多虑，略显保守。',
  '戊':'戊土为阳土，如巍峨高山。稳重厚实、诚信可靠、包容性强。但有时过于固执。',
  '己':'己土为阴土，如田园沃土。温和谦逊、善解人意、脚踏实地。但容易缺乏主见。',
  '庚':'庚金为阳金，如刀剑钢铁。刚毅果断、意志坚强、有魄力。但容易过于刚直。',
  '辛':'辛金为阴金，如珠宝首饰。细致精致、追求完美。但容易挑剔，有些孤傲。',
  '壬':'壬水为阳水，如江河大海。智慧深邃、眼界开阔、善于应变。但容易散漫。',
  '癸':'癸水为阴水，如雨露甘霖。聪明灵慧、直觉敏锐。但容易多愁善感。'
};
var WX_STR = {
  jin:{s:'金旺：果断坚毅，有领导力。适合金融、法律、技术。',w:'金弱：缺乏决断力。可佩戴金属饰品。'},
  mu:{s:'木旺：仁慈善良，有活力。适合教育、文化、创意。',w:'木弱：缺乏动力。多接触自然，穿绿色。'},
  shui:{s:'水旺：智慧聪颖，善于交际。适合艺术、传媒、贸易。',w:'水弱：思维不够灵活。多近水，穿黑色/蓝色。'},
  huo:{s:'火旺：热情开朗，积极向上。适合销售、演艺、餐饮。',w:'火弱：缺乏热情。多晒太阳，穿红色/紫色。'},
  tu:{s:'土旺：稳重可靠，诚信厚道。适合房地产、农业、管理。',w:'土弱：缺乏稳定性。多接触大地，穿黄色/棕色。'}
};
var SS_DESC = {
  '比肩':'代表自我、兄弟、朋友。独立有主见，但易固执。',
  '劫财':'代表手足、社交。朋友多，善于社交，但易付出过多。',
  '食神':'代表才华、享受。有艺术天赋，乐观开朗。',
  '伤官':'代表才华、智慧。聪明有才，思维敏捷，但不喜约束。',
  '偏财':'代表意外之财、社交。财运好，大方豪爽。',
  '正财':'代表正职收入、妻子。踏实稳定，善于理财。',
  '七杀':'代表权威、魄力。有领导力，勇敢果断，但易冲动。',
  '正官':'代表事业、名誉。正直有责任心，仕途顺利。',
  '偏印':'代表学识、技艺。深思熟虑，有独特见解。',
  '正印':'代表学业、长辈。学习能力强，有贵人相助。'
};
var WX_SHENG = {木:'火',火:'土',土:'金',金:'水',水:'木'};
var WX_KE = {木:'土',土:'水',水:'火',火:'金',金:'木'};

// ===== 神煞全局数据（供refreshLiuTable使用）=====
var BZ_SHEN_SHA = {
  甲:{寅:'文昌',卯:'天乙',丑:'天厨',巳:'禄神',午:'羊刃'},
  乙:{亥:'文昌',巳:'天乙',子:'天厨',卯:'禄神',寅:'羊刃'},
  丙:{戌:'文昌',酉:'天乙',巳:'禄神',午:'羊刃',申:'文昌'},
  丁:{酉:'文昌',亥:'天乙',午:'禄神',巳:'羊刃',未:'天厨'},
  戊:{申:'文昌',丑:'天乙',巳:'禄神',午:'羊刃',戌:'天厨'},
  己:{申:'文昌',子:'天乙',午:'禄神',巳:'羊刃',酉:'天厨'},
  庚:{未:'文昌',丑:'天乙',申:'禄神',酉:'羊刃',亥:'天厨'},
  辛:{午:'文昌',寅:'天乙',酉:'禄神',申:'羊刃',子:'天厨'},
  壬:{巳:'文昌',卯:'天乙',亥:'禄神',子:'羊刃',寅:'天厨'},
  癸:{卯:'文昌',巳:'天乙',子:'禄神',亥:'羊刃',申:'天厨'}
};
var BZ_YM_ZU = {申子辰:'寅',寅午戌:'申',巳酉丑:'亥',亥卯未:'巳'};
var BZ_TH_ZU = {申子辰:'酉',寅午戌:'卯',巳酉丑:'午',亥卯未:'子'};
var BZ_HG_ZU = {申子辰:'辰',寅午戌:'戌',巳酉丑:'丑',亥卯未:'未'};
var BZ_JX_ZU = {申子辰:'子',寅午戌:'午',巳酉丑:'酉',亥卯未:'卯'};
var BZ_SL_ZU = {申:'申子辰',子:'申子辰',辰:'申子辰',寅:'寅午戌',午:'寅午戌',戌:'寅午戌',巳:'巳酉丑',酉:'巳酉丑',丑:'巳酉丑',亥:'亥卯未',卯:'亥卯未',未:'亥卯未'};
// 神煞解释
var BZ_SS_DESC = {
  '文昌':'聪明好学，学业顺利，有文学才华',
  '天乙':'贵人相助，逢凶化吉，人缘好',
  '天厨':'口福好，有美食缘，善于享受生活',
  '禄神':'福禄丰足，财运佳，衣食无忧',
  '羊刃':'刚强果断，有魄力，但易招是非',
  '驿马':'奔波变动，宜远行，动中求财',
  '桃花':'人缘魅力好，感情丰富，易有桃花',
  '华盖':'孤傲清高，有艺术天赋，喜静思悟道',
  '将星':'有领导才能，威权显赫，能统领众人'
};
function getPSS(gan, zhi, dg, yz){
  var r=[];
  if(BZ_SHEN_SHA[dg]&&BZ_SHEN_SHA[dg][zhi]) r.push({name:BZ_SHEN_SHA[dg][zhi], desc:BZ_SS_DESC[BZ_SHEN_SHA[dg][zhi]]||''});
  var zu=BZ_SL_ZU[yz];
  if(zu){
    var m = null;
    if(BZ_YM_ZU[zu]===zhi) m='驿马';
    else if(BZ_TH_ZU[zu]===zhi) m='桃花';
    else if(BZ_HG_ZU[zu]===zhi) m='华盖';
    else if(BZ_JX_ZU[zu]===zhi) m='将星';
    if(m) r.push({name:m, desc:BZ_SS_DESC[m]||''});
  }
  return r;
}
// 五行颜色函数: 根据天干或地支返回五行颜色
var WX_COLORS = {木:'#33AA33',火:'#CC0000',土:'#BB7711',金:'#CC9900',水:'#3399CC'};
var GAN_WX = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
var ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
function getCharColor(ch){
  return WX_COLORS[GAN_WX[ch]] || WX_COLORS[ZHI_WX[ch]] || WX_COLORS[ch] || '#666';
}
// 全局函数: 给字符串中所有天干地支上色
function colorGZ(t){if(typeof t!=='string')return t||'';return t.replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥金木水火土]/g,function(m){return '<span style="color:'+getCharColor(m)+';font-weight:600">'+m+'</span>';});}
// 日主性格描述（全局，各板块共用）
var DMDESC = {'甲':'正直坚韧有领导力','乙':'柔韧灵活有艺术天赋','丙':'热情开朗善于社交','丁':'温和文雅洞察力强','戊':'稳重厚实包容性强','己':'温和谦逊脚踏实地','庚':'刚毅果断有魄力','辛':'细致精致追求完美','壬':'智慧深邃善于应变','癸':'聪明灵慧直觉敏锐'};
// ===== AI 分析生成函数 =====
function aiAnalysis(sec, dm, dmWx, gans, zhis, wc, gSS, zSS, qiangText, totalScore, yongShen, xiShen, jiShen, baziFull, deLing, deDi, deShi, ec){
  var WN={jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
  var wxSorted=Object.keys(wc).sort(function(a,b){return wc[b]-wc[a];});
  var mostWx=WN[wxSorted[0]]||'', leastWx=WN[wxSorted[wxSorted.length-1]]||'';
  var wxDesc='';
  if(wc[wxSorted[0]]>0) wxDesc='五行以<b style="color:'+getCharColor(mostWx)+'">'+mostWx+'</b>最旺';
  if(wc[wxSorted[wxSorted.length-1]]>0&&wxSorted[0]!==wxSorted[wxSorted.length-1]) wxDesc+='，<b style="color:'+getCharColor(leastWx)+'">'+leastWx+'</b>偏弱';
  if(mostWx) wxDesc+='。';
  var tips={};
  tips['四柱']='四柱八字：<b>'+colorGZ(baziFull)+'</b>。日主为<b style="color:'+getCharColor(dm)+'">'+dm+'</b>（'+dmWx+'），'+dmWx+'命，'+(DMDESC[dm]||'')+'。'+wxDesc;
  var rel=[];
  if(deLing>0) rel.push('得令（+'+deLing+'分，得月令之气）');
  else rel.push('不令（'+deLing+'分，失月令之气）');
  if(deDi>0) rel.push('得地（+'+deDi+'分，有根气）');
  else rel.push('失地（'+deDi+'分，根气不足）');
  if(deShi>0) rel.push('得势（+'+deShi+'分，同党相助）');
  else rel.push('失势（'+deShi+'分，孤立无援）');
  tips['气数']='日主<b style="color:'+getCharColor(dm)+'">'+dm+'</b>综合判定为<b class="red">'+qiangText+'</b>（总分'+totalScore+'）。'+rel.join('，')+'。'+(totalScore>30?'日主偏强，宜克泄耗，喜'+yongShen+'、'+xiShen+'，忌'+jiShen+'。':totalScore<-10?'日主偏弱，宜生扶，喜'+yongShen+'、'+xiShen+'，忌'+jiShen+'。':'日主中和，五行平衡为贵。');
  var wxParts=[];var wxNames={jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
  Object.keys(wc).forEach(function(k){if(wc[k]>0)wxParts.push('<b style="color:'+getCharColor(wxNames[k])+'">'+wxNames[k]+'</b>'+wc[k]);});
  tips['五行']='五行分布：'+wxParts.join('、')+'。'+wxDesc;
  if(yongShen) tips['五行']+='喜用<b style="color:'+getCharColor(yongShen)+'">'+yongShen+'</b>，宜穿戴'+getCharColor(yongShen)+'色，向'+(yongShen==='金'?'西':yongShen==='木'?'东':yongShen==='水'?'北':yongShen==='火'?'南':'中')+'方发展。';
  var ssPresent=[];
  if(gSS[0]&&gSS[0]!=='日主')ssPresent.push('年干'+gSS[0]);
  if(gSS[1]&&gSS[1]!=='日主')ssPresent.push('月干'+gSS[1]);
  if(gSS[3]&&gSS[3]!=='日主')ssPresent.push('时干'+gSS[3]);
  var ssDesc={'正官':'事业顺遂、有管理能力','七杀':'魄力大、敢作敢为','正印':'学业好、有贵人','偏印':'思维独特、有偏才','正财':'财运稳定、务实','偏财':'慷慨大方、财运好','比肩':'独立自主、有竞争','劫财':'社交广、人缘好','食神':'才华横溢、有口福','伤官':'聪明傲气、才华出众'};
  tips['十神']='命局十神：'+(ssPresent.length?ssPresent.map(function(s){return '<b>'+colorGZ(s)+'</b>（'+(ssDesc[s.replace(/年干|月干|时干/,'')]||'')+'）';}).join('，'):'无明显十神显现')+'。';
  tips['综合']='此命为<b style="color:'+getCharColor(dm)+'">'+dm+'</b>日生人（'+dmWx+'命），八字<b>'+colorGZ(baziFull)+'</b>。'+wxDesc+(yongShen?'以<b style="color:'+getCharColor(yongShen)+'">'+yongShen+'</b>为用神，<b style="color:'+getCharColor(xiShen)+'">'+xiShen+'</b>为喜神，<b style="color:'+getCharColor(jiShen)+'">'+jiShen+'</b>为忌神。':'')+'日主'+qiangText+'，大运顺逆关乎一生走势。';
  tips['排盘']='排盘明细显示年柱<b>'+gans[0]+zhis[0]+'</b>（'+gSS[0]+'）、月柱<b>'+gans[1]+zhis[1]+'</b>（'+gSS[1]+'）、日柱<b>'+gans[2]+zhis[2]+'</b>（日主）、时柱<b>'+gans[3]+zhis[3]+'</b>（'+gSS[3]+'）。藏干揭示地支暗藏能量，纳音为先天五行声气，空亡主虚浮不定，地势论五行旺衰历程。';
  tips['刑冲']='四柱地支间存在多种互动关系。六合主合作和谐，六冲主变动冲突，六害主暗中受损，三刑主口舌是非。'+wxDesc+'冲合刑害需结合十神定性。';
  tips['宫位']='年柱管祖业根基与少年运势（15岁前），月柱管父母家庭与青年运势（16-32岁），日柱管自身与中年运势（33-48岁），时柱管子女子孙与晚年运势（49岁后）。';
  tips['神煞']='神煞为命理辅助符号：天乙贵人主逢凶化吉，文昌主聪明好学，桃花主人缘魅力，驿马主奔波变动。吉神增福，凶神减吉，需结合主星综合判断。';
  tips['大运']='大运十年一换，起运岁数由出生日距最近节气天数决定。用神运至则事半功倍，忌神运临则需谨慎行事。当前大运与命局互动最为关键。';
  tips['人生']='人生各阶段由四柱宫位与大运共同决定。年柱根基深厚则少年顺遂，月柱吉则青年得助，日柱强则中年有成，时柱吉则晚年安乐。大运吉凶更直接改变各阶段走势。';
  tips['留意']='天干五合主和合之象，地支六冲主变动之局。三刑六害各有所象：合则聚气增力，冲则散气变动，刑则伤气口舌，害则暗中受损。吉凶定性需结合十神喜忌。';
  return tips[sec]||'以上分析基于传统命理学理论，结合八字实际格局生成。';
}

// ===== 中国行政区数据 =====
// Data is now inline in updateCities() and populateProvinces()

function updateCities(prefix){
  var cityMap = {
    '北京':['东城区','西城区','朝阳区','丰台区','石景山区','海淀区','顺义区','通州区','大兴区','房山区','昌平区','门头沟区'],
    '上海':['黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区','闵行区','宝山区','嘉定区','浦东新区','松江区','青浦区'],
    '天津':['和平区','河东区','河西区','南开区','河北区','红桥区','东丽区','西青区','津南区','北辰区','武清区','宝坻区'],
    '重庆':['渝中区','江北区','沙坪坝区','九龙坡区','南岸区','北碚区','渝北区','巴南区','涪陵区','万州区','黔江区'],
    '广东':['广州','深圳','珠海','汕头','佛山','韶关','湛江','肇庆','江门','茂名','惠州','梅州','汕尾','河源','阳江','清远','东莞','中山','潮州','揭阳','云浮'],
    '浙江':['杭州','宁波','温州','嘉兴','湖州','绍兴','金华','衢州','舟山','台州','丽水'],
    '江苏':['南京','无锡','徐州','常州','苏州','南通','连云港','淮安','盐城','扬州','镇江','泰州','宿迁'],
    '山东':['济南','青岛','淄博','枣庄','东营','烟台','潍坊','济宁','泰安','威海','日照','临沂','德州','聊城','滨州','菏泽'],
    '福建':['福州','厦门','莆田','三明','泉州','漳州','南平','龙岩','宁德'],
    '湖北':['武汉','黄石','十堰','宜昌','襄阳','鄂州','荆门','孝感','荆州','黄冈','咸宁','随州'],
    '湖南':['长沙','株洲','湘潭','衡阳','邵阳','岳阳','常德','张家界','益阳','郴州','永州','怀化','娄底'],
    '河南':['郑州','开封','洛阳','平顶山','安阳','鹤壁','新乡','焦作','濮阳','许昌','漯河','三门峡','南阳','商丘','信阳','周口','驻马店'],
    '河北':['石家庄','唐山','秦皇岛','邯郸','邢台','保定','张家口','承德','沧州','廊坊','衡水'],
    '四川':['成都','自贡','攀枝花','泸州','德阳','绵阳','广元','遂宁','内江','乐山','南充','眉山','宜宾','广安','达州','雅安','巴中','资阳'],
    '安徽':['合肥','芜湖','蚌埠','淮南','马鞍山','淮北','铜陵','安庆','黄山','滁州','阜阳','宿州','六安','亳州','池州','宣城'],
    '江西':['南昌','景德镇','萍乡','九江','新余','鹰潭','赣州','吉安','宜春','抚州','上饶'],
    '辽宁':['沈阳','大连','鞍山','抚顺','本溪','丹东','锦州','营口','阜新','辽阳','盘锦','铁岭','朝阳','葫芦岛'],
    '吉林':['长春','吉林','四平','辽源','通化','白山','松原','白城'],
    '黑龙江':['哈尔滨','齐齐哈尔','鸡西','鹤岗','双鸭山','大庆','伊春','佳木斯','七台河','牡丹江','黑河','绥化'],
    '陕西':['西安','铜川','宝鸡','咸阳','渭南','延安','汉中','榆林','安康','商洛'],
    '山西':['太原','大同','阳泉','长治','晋城','朔州','晋中','运城','忻州','临汾','吕梁'],
    '甘肃':['兰州','嘉峪关','金昌','白银','天水','武威','张掖','平凉','酒泉','庆阳','定西','陇南'],
    '云南':['昆明','曲靖','玉溪','保山','昭通','丽江','普洱','临沧'],
    '贵州':['贵阳','六盘水','遵义','安顺','毕节','铜仁'],
    '广西':['南宁','柳州','桂林','梧州','北海','防城港','钦州','贵港','玉林','百色','贺州','河池','来宾','崇左'],
    '内蒙古':['呼和浩特','包头','乌海','赤峰','通辽','鄂尔多斯','呼伦贝尔','巴彦淖尔','乌兰察布'],
    '新疆':['乌鲁木齐','克拉玛依','吐鲁番','哈密'],
    '西藏':['拉萨','日喀则','昌都','林芝','山南'],
    '海南':['海口','三亚','三沙','儋州'],
    '宁夏':['银川','石嘴山','吴忠','固原','中卫'],
    '青海':['西宁','海东'],
    '香港':['香港岛','九龙','新界'],
    '澳门':['澳门半岛','氹仔','路环'],
    '台湾':['台北','高雄','台中','台南','新北','桃园','基隆','新竹','嘉义']
  };
  var prov = document.getElementById(prefix+'-province').value;
  var citySel = document.getElementById(prefix+'-city');
  citySel.innerHTML = '';
  if(!prov || !cityMap[prov]){
    citySel.innerHTML = '<option value="">— 请先选省份 —</option>';
    return;
  }
  citySel.innerHTML = '<option value="">— 请选择城市 —</option>';
  cityMap[prov].forEach(function(c){
    var opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    citySel.appendChild(opt);
  });
}

function getGender(prefix){
  var radios = document.getElementsByName(prefix+'-gender');
  for(var i=0;i<radios.length;i++){
    if(radios[i].checked) return radios[i].value;
  }
  return '男';
}

var GAN_YINYANG = ['',1,0,1,0,1,0,1,0,1,0]; // 1=阳 0=阴
var ZHI_YINYANG = ['',1,0,1,0,1,0,1,0,1,0,1,0];
var DAYUN_GAN = ['甲','丙','戊','庚','壬','乙','丁','己','辛','癸'];
var GAN_HE = {甲:['己'],乙:['庚'],丙:['辛'],丁:['壬'],戊:['癸'],己:['甲'],庚:['乙'],辛:['丙'],壬:['丁'],癸:['戊']};
var KONG_WANG = {甲子:['戌','亥'],甲戌:['申','酉'],甲申:['午','未'],甲午:['辰','巳'],甲辰:['寅','卯'],甲寅:['子','丑']};
var NAYIN = {
  '甲子':'海中金','乙丑':'海中金','丙寅':'炉中火','丁卯':'炉中火','戊辰':'大林木','己巳':'大林木',
  '庚午':'路旁土','辛未':'路旁土','壬申':'剑锋金','癸酉':'剑锋金','甲戌':'山头火','乙亥':'山头火',
  '丙子':'涧下水','丁丑':'涧下水','戊寅':'城头土','己卯':'城头土','庚辰':'白蜡金','辛巳':'白蜡金',
  '壬午':'杨柳木','癸未':'杨柳木','甲申':'泉中水','乙酉':'泉中水','丙戌':'屋上土','丁亥':'屋上土',
  '戊子':'霹雳火','己丑':'霹雳火','庚寅':'松柏木','辛卯':'松柏木','壬辰':'长流水','癸巳':'长流水',
  '甲午':'沙中金','乙未':'沙中金','丙申':'山下火','丁酉':'山下火','戊戌':'平地木','己亥':'平地木',
  '庚子':'壁上土','辛丑':'壁上土','壬寅':'金箔金','癸卯':'金箔金','甲辰':'覆灯火','乙巳':'覆灯火',
  '丙午':'天河水','丁未':'天河水','戊申':'大驿土','己酉':'大驿土','庚戌':'钗钏金','辛亥':'钗钏金',
  '壬子':'桑柘木','癸丑':'桑柘木','甲寅':'大溪水','乙卯':'大溪水','丙辰':'沙中土','丁巳':'沙中土',
  '戊午':'天上火','己未':'天上火','庚申':'石榴木','辛酉':'石榴木','壬戌':'大海水','癸亥':'大海水'
};
var JIE_QI = [
  '立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'
];

function calcDaYun(yearGan, yearZhi, dayGan, gender){
  // Simplified Da Yun calculation
  var dayGanIdx = GAN_LIST.indexOf(dayGan);
  var yearGanIdx = GAN_LIST.indexOf(yearGan);
  var yearZhiIdx = ZHI_LIST.indexOf(yearZhi);
  var isYang = GAN_YINYANG[dayGanIdx] === 1;
  var isMale = gender === '男';
  // 阳男阴女顺行, 阴男阳女逆行
  var forward = (isYang && isMale) || (!isYang && !isMale);
  
  var result = [];
  var startIdx = yearGanIdx;
  for(var i=0; i<8; i++){
    var step = forward ? i+1 : -(i+1);
    var ganIdx = ((startIdx + step - 1 + 60) % 10) + 1;
    var zhiIdx = ((yearZhiIdx + step - 1 + 60) % 12) + 1;
    result.push({
      ganzhi: GAN_LIST[ganIdx] + ZHI_LIST[zhiIdx],
      age: i * 10
    });
  }
  return result;
}

function getJiaZiIndex(gz){
  var jzList = [];
  for(var i=1;i<=10;i++){
    for(var j=1;j<=12;j++){
      if((i%2)===(j%2)){
        jzList.push(GAN_LIST[i]+ZHI_LIST[j]);
      }
    }
  }
  return jzList.indexOf(gz);
}

function getKongWang(gz){
  var idx = getJiaZiIndex(gz);
  if(idx===-1) return '';
  var xunIdx = Math.floor(idx / 10) * 10;
  var xunStart = '';
  for(var i in KONG_WANG){
    var si = getJiaZiIndex(i);
    if(si === xunIdx){ xunStart = i; break; }
  }
  if(!xunStart) return '';
  var kw = KONG_WANG[xunStart];
  return kw ? kw.join('、') : '';
}

// 🚫 八字保护区开始 =========================
// calcBazi及其辅助函数已稳定，请勿修改
function calcBazi(){
  autoSaveBirth('bazi');
  // 表单验证
  var errEl = document.getElementById('bazi-err');
  if(!errEl){
    errEl = document.createElement('div');
    errEl.id = 'bazi-err';
    errEl.style.cssText = 'color:#CC0000;font-size:12px;margin:8px 0;padding:8px;background:#FFF0F0;border:1px solid #CC0000;border-radius:4px;display:none';
    document.querySelector('#tab-bazi .card').appendChild(errEl);
  }
  errEl.style.display = 'none';
  
  var name = document.getElementById('bazi-name').value.trim() || '未知';
  var gender = document.getElementById('bazi-gender-group').querySelector('input:checked').value;
  var calType = window.bazi_caltype || 'solar';
  var year, month, day, hour, minute;
  if(calType === 'lunar'){
    year = parseInt(document.getElementById('bazi-lyear').value);
    month = parseInt(document.getElementById('bazi-lmonth').value);
    day = parseInt(document.getElementById('bazi-lday').value);
    hour = parseInt(document.getElementById('bazi-lhour').value);
    minute = 0;
  } else {
    year = parseInt(document.getElementById('bazi-year').value);
    month = parseInt(document.getElementById('bazi-month').value);
    day = parseInt(document.getElementById('bazi-day').value);
    hour = parseInt(document.getElementById('bazi-hour').value);
    minute = 0;
  }
  
  // 逐项验证
  var errors = [];
  if(!name || name === '未知') errors.push('请输入姓名');
  if(!year || isNaN(year) || year < 1900 || year > 2100) errors.push('出生年份不正确，请选择有效年份');
  if(!month || isNaN(month) || month < 1 || month > 12) errors.push('出生月份不正确，请选择1-12月');
  if(!day || isNaN(day) || day < 1 || day > 31) errors.push('出生日期不正确，请选择有效日期');
  if(!hour && hour !== 0 || isNaN(hour) || hour < 0 || hour > 23) errors.push('出生时辰不正确，请选择有效时辰');
  
  // 农历日期有效性
  if(calType === 'lunar'){
    try {
      var testL = Lunar.fromYmd(year, month, day);
      if(!testL) errors.push('农历日期不合法');
    } catch(e) { errors.push('农历日期有误，请检查'); }
  }
  
  if(errors.length){
    errEl.innerHTML = '⚠ ' + errors.join('<br>⚠ ');
    errEl.style.display = 'block';
    errEl.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  try {
    var sf;
    if(calType === 'lunar'){
      var lunarDate = Lunar.fromYmd(year, month, day);
      sf = Solar.fromYmdHms(lunarDate.getSolar().getYear(), lunarDate.getSolar().getMonth(), lunarDate.getSolar().getDay(), hour, 0, 0);
    } else {
      sf = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    }
    var lf = sf.getLunar();
    lf.getEightChar().setSect(1); // 使用 exact sect
    var ec = lf.getEightChar();
    // Gender code for getYun: 1=男造, 0=女造
    var genderCode = gender === '男' ? 1 : 0;
    var yun = ec.getYun(genderCode);
    var dayun = yun.getDaYun();
    var dyStartYear = yun.getStartYear();

    // Wuxi count helper
    function countWx(items){
      var wc={jin:0,mu:0,shui:0,huo:0,tu:0};
      items.forEach(function(w){
        // w可能是"金火"这样的两个字组合,需要拆分
        var chars = typeof w === 'string' ? w.split('') : [];
        chars.forEach(function(c){
          var map = {金:'jin',木:'mu',水:'shui',火:'huo',土:'tu'};
          if(map[c]) wc[map[c]]++;
        });
      });
      return wc;
    }
    var allWx = [ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ec.getTimeWuXing()];
    var wc = countWx(allWx);
    var mx='',mxc=0,ord=['mu','huo','tu','jin','shui'];
    for(var k in wc){if(wc[k]>mxc){mxc=wc[k];mx=k;}}
    var dm = ec.getDayGan ? ec.getDayGan() : ec.getDay().charAt(0);

    var h = '<div class="bazi-result-wrap">';
    
    // === 1. HEADER BAR ===
    h += '<div class="bz-header">';
    h += '<div class="bz-hl">☰ 四柱八字排盘</div>';
    h += '<div class="bz-hr"><span class="bz-tag">'+gender+'</span><span class="bz-loc">'+name+'</span></div></div>';
    
    var jq = ''; try{ jq = lf.getJieQi() || ''; }catch(e){}
    var weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    var wd = weekDays[sf.getWeek()] || '';
    var shengXiao = lf.getYearShengXiaoExact ? lf.getYearShengXiaoExact() : (lf.getYearShengXiao ? lf.getYearShengXiao() : '');
    
    h += '<div class="bz-info">';
    h += '<span>公历 '+year+'年'+String(month).padStart(2,'0')+'月'+String(day).padStart(2,'0')+'日 '+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0')+'</span>';
    h += '<span>农历 '+lf.getYearInChinese()+'年 '+lf.getMonthInChinese()+'月 '+lf.getDayInChinese()+'</span>';
    h += '<span>节气 '+jq+'</span>';
    h += '<span>星期 '+wd+'</span>';
    h += '<span>生肖 '+shengXiao+'</span>';
    h += '<span>星座 '+sf.getXingZuo()+'座</span>';
    h += '</div>';

    // === 2. FOUR PILLARS ===
    var pillarNames = ['年柱','月柱','日柱','时柱'];
    var pillarLife = ['少年·祖业','青年·父母','中年·自身','晚年·子女'];
    var gans = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()];
    var zhis = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
    var gSS = [ec.getYearShiShenGan(), ec.getMonthShiShenGan(), '日主', ec.getTimeShiShenGan()];
    var zSS = [ec.getYearShiShenZhi(), ec.getMonthShiShenZhi(), ec.getDayShiShenZhi(), ec.getTimeShiShenZhi()];
    
    h += '<div class="bz-pillars">';
    for(var pi=0; pi<4; pi++){
      var gWx = [ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ec.getTimeWuXing()][pi];
      var wxC = {金:'#CC9900',木:'#33AA33',水:'#3399CC',火:'#CC0000',土:'#BB7711'};
      h += '<div class="bz-p">';
      h += '<div class="bz-pn">'+pillarNames[pi]+'<br><span style="font-size:9px;color:#aaa">'+pillarLife[pi]+'</span></div>';
      h += '<div class="bz-pg" style="color:'+getCharColor(gans[pi])+'">'+gans[pi]+'</div>';
      h += '<div class="bz-ps">'+gSS[pi]+'</div>';
      h += '<div class="bz-pz" style="color:'+getCharColor(zhis[pi])+'">'+zhis[pi]+'</div>';
      h += '<div class="bz-ps">'+zSS[pi]+'</div>';
      h += '</div>';
    }
    h += '</div>';

    // === 综合解读（前置到排盘明细前）===
    h += '<div class="result-card"><div class="rc-header">📖 综合解读</div><div class="rc-text">';
    h += '命主为<b style="color:'+getCharColor(dm)+'">'+dm+'日</b>生人，'+gender+'命。<br>';
    var baziFull = ec.getYear()+ec.getMonth()+ec.getDay()+ec.getTime();
    h += '八字：<b>'+baziFull.replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g,function(m){return '<span style="color:'+getCharColor(m)+'">'+m+'</span>';})+'</b><br>';
    h += '胎元：<b>'+colorGZ(ec.getTaiYuan())+'</b>（'+ec.getTaiYuanNaYin()+'）｜命宫：<b>'+colorGZ(ec.getMingGong())+'</b>（'+ec.getMingGongNaYin()+'）<br>';
    h += '大运起于<b class="red">'+dyStartYear+'</b>岁，顺逆：<b>'+(yun.isForward()?'顺行':'逆行')+'</b>。';
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6" id="ai-综合" data-fallback="'+aiAnalysis('综合',dm,dmWx,gans,zhis,wc,gSS,zSS,qiangText,totalScore,yongShen,xiShen,jiShen,baziFull,deLing,deDi,deShi,ec)+'">🤖 <b>命理分析：</b>'+aiAnalysis('综合',dm,dmWx,gans,zhis,wc,gSS,zSS,qiangText,totalScore,yongShen,xiShen,jiShen,baziFull,deLing,deDi,deShi,ec)+'</div>';
    h += '</div></div>';

    // === 3. 排盘明细 TABLE ===
    h += '<div class="result-card"><div class="rc-header">📋 排盘明细</div><table class="bz-detail">';
    var rows = [
      ['藏干', ec.getYearHideGan().join(','), ec.getMonthHideGan().join(','), ec.getDayHideGan().join(','), ec.getTimeHideGan().join(',')],
      ['纳音', ec.getYearNaYin(), ec.getMonthNaYin(), ec.getDayNaYin(), ec.getTimeNaYin()],
      ['空亡', ec.getYearXunKong(), ec.getMonthXunKong(), ec.getDayXunKong(), ec.getTimeXunKong()],
      ['地势', ec.getYearDiShi(), ec.getMonthDiShi(), ec.getDayDiShi(), ec.getTimeDiShi()],
      ['五行', ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ec.getTimeWuXing()],
    ];
    for(var ri=0; ri<rows.length; ri++){
      h += '<tr><td class="dl">'+rows[ri][0]+'</td>';
      for(var ci=1; ci<5; ci++) h += '<td>'+colorGZ(rows[ri][ci])+'</td>';
      h += '</tr>';
    }
h += '</table></div>';

    // === 4. 柱间刑冲合害 ===
    var HE6 = {子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
    var CHONG6 = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
    var HAI6 = {子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'};
    var XING3 = {寅:'巳',巳:'申',申:'寅',丑:'戌',戌:'未',未:'丑',子:'卯',卯:'子'};
    var ZIXING = {辰:1,午:1,酉:1,亥:1};
    var sanHe = {'申子辰':'水局','亥卯未':'木局','寅午戌':'火局','巳酉丑':'金局'};
    
    h += '<div class="result-card"><div class="rc-header">⚡ 柱间刑冲合害</div><div class="rc-text">';
    var rels = [];
    // 关系解释
    var REL_DESC = {
      '六合':'合化之象，婚姻合作有利，人际关系和谐。',
      '六冲':'对冲之象，变动冲突，需注意人际矛盾与突发变化。',
      '六害':'暗中受害，小人是非，需谨慎行事，防人之心不可无。',
      '三刑':'刑伤之象，多口舌是非，需注意健康与法律问题。',
      '自刑':'自我纠结，内心矛盾，容易钻牛角尖，需放宽心态。',
      '天干五合':'天干相合，和合之象，化为某种五行能量。',
    };
    function addRel(pair, type){
      var desc = REL_DESC[type]||'';
      // 给天干地支加上五行颜色
      var colored = pair.replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g, function(m){return '<span style="color:'+getCharColor(m)+';font-weight:600">'+m+'</span>';});
      rels.push(colored + ' → <b class="red">' + type + '</b><br><span style="font-size:11px;color:#888;margin-left:16px">' + desc + '</span>');
    }
    for(var pi=0; pi<4; pi++){
      for(var pj=pi+1; pj<4; pj++){
        var z1 = zhis[pi], z2 = zhis[pj];
        if(HE6[z1]===z2) addRel(pillarNames[pi]+'('+z1+') × '+pillarNames[pj]+'('+z2+')', '六合');
        if(CHONG6[z1]===z2) addRel(pillarNames[pi]+'('+z1+') × '+pillarNames[pj]+'('+z2+')', '六冲');
        if(HAI6[z1]===z2) addRel(pillarNames[pi]+'('+z1+') × '+pillarNames[pj]+'('+z2+')', '六害');
        if(XING3[z1]===z2 || XING3[z2]===z1) addRel(pillarNames[pi]+'('+z1+') × '+pillarNames[pj]+'('+z2+')', '三刑');
      }
      if(ZIXING[zhis[pi]]) addRel(pillarNames[pi]+'('+zhis[pi]+')', '自刑');
    }
    // Check 天干五合
    var HE5 = {甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
    for(var pi=0; pi<4; pi++){
      for(var pj=pi+1; pj<4; pj++){
        if(HE5[gans[pi]]===gans[pj]){
          var heWx = {甲:'土',乙:'金',丙:'水',丁:'木',戊:'火',己:'土',庚:'金',辛:'水',壬:'木',癸:'火'};
          addRel(pillarNames[pi]+'('+gans[pi]+') × '+pillarNames[pj]+'('+gans[pj]+')', '天干五合');
          // Append the化五行 info
          rels[rels.length-1] += '（化<b style="color:'+getCharColor(heWx[gans[pi]])+'">'+heWx[gans[pi]]+'</b>）';
        }
      }
    }
    // Check 三合
    var allZ = zhis.join('');
    for(var sh in sanHe){
      var match = 0;
      for(var c=0; c<3; c++) if(allZ.indexOf(sh[c])>=0) match++;
      if(match>=2) rels.push('含有<b>'+sanHe[sh]+'</b>（<b>'+sh.replace(/[子丑寅卯辰巳午未申酉戌亥]/g,function(m){return '<span style="color:'+getCharColor(m)+';font-weight:600">'+m+'</span>';})+'</b>）<br><span style="font-size:11px;color:#888;margin-left:16px">三合之局，能量增强，该五行力量大增。</span>');
    }
    if(rels.length){rels.forEach(function(r){h+='<div style="font-size:12px;color:#555;line-height:1.9;margin-bottom:6px;padding:4px 8px;background:#FFF;border-radius:4px">'+r+'</div>';});}
    else{h+='<div style="font-size:12px;color:#999">四柱无特殊刑冲合害。</div>';}
    // 动态命理分析：根据实际刑冲合害生成
    var xcDesc = [];
    var hasHe=false,hasChong=false,hasHai=false,hasXing=false,hasZiXing=false,hasSanHe=false,hasHe5=false;
    rels.forEach(function(r){
      if(r.indexOf('六合')>=0)hasHe=true;if(r.indexOf('六冲')>=0)hasChong=true;
      if(r.indexOf('六害')>=0)hasHai=true;if(r.indexOf('三刑')>=0)hasXing=true;
      if(r.indexOf('自刑')>=0)hasZiXing=true;if(r.indexOf('三合')>=0)hasSanHe=true;
      if(r.indexOf('天干五合')>=0)hasHe5=true;
    });
    var ziXingZhis = [];for(var pi=0;pi<4;pi++)if(ZIXING[zhis[pi]])ziXingZhis.push(pillarNames[pi]+'('+zhis[pi]+')');
    if(hasHe)xcDesc.push('有<b>六合</b>，主和谐合作、人际关系融洽');
    if(hasChong)xcDesc.push('有<b>六冲</b>，主动荡变化、易有突发状况');
    if(hasHai)xcDesc.push('有<b>六害</b>，主暗中小人、需防口舌是非');
    if(hasXing)xcDesc.push('有<b>三刑</b>，主纠葛困扰、注意健康与法律纠纷');
    if(hasZiXing&&ziXingZhis.length)xcDesc.push('存在<b>自刑</b>，'+ziXingZhis.join('、')+'：内心矛盾纠结，容易自我较劲，放不下执念，建议多与人沟通、学习放松');
    if(hasSanHe)xcDesc.push('有<b>三合局</b>，对应五行能量增强，代表某方面有天赋或助力');
    if(hasHe5)xcDesc.push('有<b>天干五合</b>，天干互动和合，化气五行影响命局平衡');
    if(xcDesc.length===0)xcDesc.push('四柱无特殊刑冲合害，命局平和稳定');
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+xcDesc.join('；')+'。刑冲合害定性需结合十神喜忌综合判断。</div>';
h += '</div></div>';

    // === 5. 五行旺衰 ===
    h += '<div class="result-card"><div class="rc-header">🪨 五行旺衰</div>';
    var mxc2=Math.max.apply(null,ord.map(function(k){return wc[k];}));
    if(mxc2<1)mxc2=1;
    var WX_NAMES2 = {jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
    var ord2 = ['mu','huo','tu','jin','shui'];
    ord2.forEach(function(k){
      var pct=(wc[k]/mxc2)*100;
      h += '<div class="wxr"><span class="wxl wx-'+k+'">'+WX_NAMES2[k]+'</span>';
      h += '<div class="wxt"><div class="wxf wx-'+k+'" style="width:'+pct+'%"></div></div>';
      h += '<span class="wxn">'+wc[k]+'</span></div>';
    });
    var WX_STR2 = {jin:{s:'金旺：果断坚毅',w:'金弱：缺乏决断力'},mu:{s:'木旺：仁慈善良',w:'木弱：缺乏动力'},shui:{s:'水旺：智慧聪颖',w:'水弱：思维不灵活'},huo:{s:'火旺：热情开朗',w:'火弱：缺乏热情'},tu:{s:'土旺：稳重可靠',w:'土弱：缺乏稳定性'}};
    h += '<div class="rc-text" style="margin-top:6px">';
    h += '日主：<b style="color:'+getCharColor(dm)+'">'+dm+'</b>（'+ganWx(GAN_LIST.indexOf(dm))+'）　五行：'+ord2.map(function(k){return WX_NAMES2[k]+wc[k];}).join('、');
    if(mx) h += '　最旺：<b style="color:'+getCharColor(WX_NAMES2[mx])+'">'+WX_NAMES2[mx]+'</b>：'+(WX_STR2[mx]?WX_STR2[mx].s:'');
    // 动态五行解读
    var wxRead = '';
    var wxSorted = ord2.slice().sort(function(a,b){return wc[b]-wc[a];});
    if(wc[wxSorted[0]] > wc[wxSorted[3]]*2 && wc[wxSorted[3]] > 0){
      wxRead = '五行'+WX_NAMES2[wxSorted[0]]+'明显偏旺，'+WX_NAMES2[wxSorted[3]]+'偏弱，需注意五行平衡。';
    }
    if(wxRead) h += '<div style="font-size:11px;color:#888;margin-top:4px;line-height:1.6">💡 '+wxRead+'</div>';
    // 动态五行命理分析
    var wxDescParts = [];
    var wxW = {jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
    var wxs = ord2.slice().sort(function(a,b){return wc[b]-wc[a];});
    var maxV = wc[wxs[0]], minV = wc[wxs[wxs.length-1]];
    if(maxV > 0){
      wxDescParts.push('五行中以<b style="color:'+getCharColor(wxW[wxs[0]])+'">'+wxW[wxs[0]]+'</b>最旺（'+maxV+'分）');
      if(wxs[1] && wc[wxs[1]] > 0) wxDescParts.push('<b style="color:'+getCharColor(wxW[wxs[1]])+'">'+wxW[wxs[1]]+'</b>次之（'+wc[wxs[1]]+'分）');
    }
    if(minV === 0 && maxV > 0) {
      wxDescParts.push('<b style="color:'+getCharColor(wxW[wxs[wxs.length-1]])+'">'+wxW[wxs[wxs.length-1]]+'</b>缺失');
    } else if(maxV - minV >= 2 && minV > 0) {
      wxDescParts.push('<b style="color:'+getCharColor(wxW[wxs[wxs.length-1]])+'">'+wxW[wxs[wxs.length-1]]+'</b>偏弱（'+minV+'分）');
    } else if(maxV === minV && maxV > 0) {
      wxDescParts.push('五行分布较为均衡');
    }
    // 旺衰影响
    var wxEffect = '';
    if(mx) {
      if(mx === dmWx) wxEffect = '日主五行与最旺五行相同，身强之象，喜克泄耗。';
      else if(WX_SHENG[mx] === dmWx) wxEffect = '最旺五行生助日主，为命局助力。';
      else if(WX_KE[mx] === dmWx) wxEffect = '最旺五行克制日主，需用神化解。';
    }
    if(wxEffect) wxDescParts.push(wxEffect);
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+wxDescParts.join('；')+'。'+'日主'+dm+'属'+(dmWx||'?')+'，'+(yongShen?'宜补<b style="color:'+getCharColor(yongShen)+'">'+yongShen+'</b>，忌<b style="color:'+getCharColor(jiShen)+'">'+jiShen+'</b>。':'')+'五行平衡为贵，偏旺需泄耗，偏弱需生扶。</div>';
h += '</div></div>';

    // === 6. 日主气数（滴天髓四层考核） ===
    var dmWx = ganWx(GAN_LIST.indexOf(dm));
    var monthZhi = ec.getMonthZhi();
    var monthZhiIdx = ZHI_LIST.indexOf(monthZhi);
    // 得令: check if month's wuxi supports day master
    var monthWx = zhiWx(monthZhiIdx);
    var deLing = (WX_SHENG[monthWx]===dmWx) ? 22 : (monthWx===dmWx ? -5 : (WX_KE[monthWx]===dmWx ? -22 : -10));
    var deLingText = deLing>0 ? '相（+'+deLing+'分）' : '不令（'+deLing+'分）';
    // 得地: check 藏干 for support
    var allCang = ec.getYearHideGan().concat(ec.getMonthHideGan()).concat(ec.getDayHideGan()).concat(ec.getTimeHideGan());
    var rootCount = 0;
    allCang.forEach(function(cg){ if(ganWx(GAN_LIST.indexOf(cg))===dmWx) rootCount++; });
    var deDi = rootCount * 10 - 30;
    // 得势: count same-wuxi 天干
    var shiCount = 0;
    gans.forEach(function(g){ if(ganWx(GAN_LIST.indexOf(g))===dmWx) shiCount++; });
    var deShi = shiCount * 15 - 20;
    // 动态: overall
    var totalScore = deLing + deDi + deShi;
    var qiangText = totalScore>30 ? '偏强' : totalScore>10 ? '中强' : totalScore>-10 ? '中和' : totalScore>-30 ? '偏弱' : '极弱';
    
    h += '<div class="result-card"><div class="rc-header">📊 日主气数</div><div class="rc-text">';
    h += '日主：<b style="color:'+getCharColor(dm)+'">'+dm+'</b>（'+dmWx+'）<br>';
    h += '<div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap">';
    var layers = [
      {name:'得令·月令',val:deLing,desc:deLingText},
      {name:'得地·通根',val:deDi,desc:'根气×'+rootCount+'（'+deDi+'分）'},
      {name:'得势·透干',val:deShi,desc:'同党×'+shiCount+'（'+deShi+'分）'},
    ];
    layers.forEach(function(l){
      var bg = l.val>0 ? '#CC0000' : l.val>-10 ? '#CC9900' : '#999';
      h += '<div style="background:'+bg+';color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;text-align:center;min-width:70px">';
      h += '<div>'+l.name+'</div><div style="font-weight:700;font-size:14px">'+(l.val>0?'+':'')+l.val+'</div><div style="font-size:10px;opacity:.8">'+l.desc+'</div></div>';
    });
    h += '</div>';
    h += '<div style="margin-top:6px;text-align:center;font-size:13px">日主<b class="red">'+qiangText+'</b>（综合分<b class="red">'+totalScore+'</b>）</div>';
    // 动态气数命理分析
    var qiDesc = '日主<b style="color:'+getCharColor(dm)+'">'+dm+'</b>（'+dmWx+'命）综合判定为<b class="red">'+qiangText+'</b>（总分'+totalScore+'）。';
    var qiParts = [];
    qiParts.push(deLing>0?'<b>得令</b>（+'+deLing+'分，月令生助日主）':'<b>不令</b>（'+deLing+'分，月令不利于日主）');
    qiParts.push(deDi>0?'<b>得地</b>（+'+deDi+'分，地支有根气）':'<b>失地</b>（'+deDi+'分，地支根气不足）');
    qiParts.push(deShi>0?'<b>得势</b>（+'+deShi+'分，同党相助）':'<b>失势</b>（'+deShi+'分，同党稀少）');
    qiDesc += qiParts.join('，')+'。';
    if(totalScore > 30) qiDesc += '日主偏强，宜克泄耗，喜<b style="color:'+getCharColor(yongShen)+'">'+yongShen+'</b>、<b style="color:'+getCharColor(xiShen)+'">'+xiShen+'</b>，忌<b style="color:'+getCharColor(jiShen)+'">'+jiShen+'</b>。';
    else if(totalScore < -10) qiDesc += '日主偏弱，宜生扶，喜<b style="color:'+getCharColor(yongShen)+'">'+yongShen+'</b>、<b style="color:'+getCharColor(xiShen)+'">'+xiShen+'</b>，忌<b style="color:'+getCharColor(jiShen)+'">'+jiShen+'</b>。';
    else qiDesc += '日主中和，五行平衡为贵，顺势而为即可。';
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+qiDesc+'</div>';
h += '</div></div>';

    
// 十神动态分析
function genSSAnalysis(dm,gSS,zSS,ec){
  var ssMap={'正官':'事业管理','七杀':'魄力权威','正印':'学业贵人','偏印':'独特思维','正财':'稳定财运','偏财':'社交财运','比肩':'独立竞争','劫财':'社交人缘','食神':'才华享受','伤官':'聪明傲气'};
  var ps=[];
  if(gSS[0]&&gSS[0]!=='日主')ps.push('年干<b>'+colorGZ(gSS[0])+'</b>：'+(ec?ec.getYearShiShenGan()+'':'')+'代表祖业与少年时期，关系家族根基');
  if(gSS[1]&&gSS[1]!=='日主')ps.push('月干<b>'+colorGZ(gSS[1])+'</b>：'+'代表父母家庭与青年运势，主导事业方向');
  if(gSS[3]&&gSS[3]!=='日主')ps.push('时干<b>'+colorGZ(gSS[3])+'</b>：'+'代表子女下属与晚年运势，影响最终成就');
  var r='命局十神分布：';
  if(ps.length) r+=ps.join('；');
  else r+='无明显十神显现于天干。';
  // 地支藏干十神
  if(zSS&&zSS.length){
    r+='地支藏干十神：年<b>'+zSS[0]+'</b>月<b>'+zSS[1]+'</b>日<b>'+zSS[2]+'</b>时<b>'+zSS[3]+'</b>，藏干十神反映隐性性格与潜在能力。';
  }
  return r;
}
// 宫位动态分析
function genGongWeiAnalysis(dm,gSS,zSS,pillarNames,zhis){
  var r='四柱宫位对应人生不同阶段：';
  r+='<b>'+pillarNames[0]+'</b>（'+zhis[0]+'）管祖业根基与少年运势（15岁前），'+(gSS[0]&&gSS[0]!=='日主'?'天干'+gSS[0]+'表明早期性格倾向。':'');
  r+='<b>'+pillarNames[1]+'</b>（'+zhis[1]+'）管父母家庭与青年运势（16-32岁），月柱为命局枢纽，主导人生基调。';
  r+='<b>'+pillarNames[2]+'</b>（'+zhis[2]+'）管自身与中年运势（33-48岁），日支为配偶宫，影响婚姻质量。';
  r+='<b>'+pillarNames[3]+'</b>（'+zhis[3]+'）管子女子孙与晚年运势（49岁后），时柱吉则晚年安稳。';
  return r;
}
// 神煞动态分析
function genShenShaAnalysis(dm,zhis,gans,ec){
  var shaMap={};
  // 常见神煞
  var tianYi={甲:'丑未',乙:'子申',丙:'酉亥',丁:'酉亥',戊:'丑未',己:'子申',庚:'丑未',辛:'午寅',壬:'巳卯',癸:'巳卯'};
  var taiYang={甲:'午',乙:'亥',丙:'酉',丁:'申',戊:'未',己:'午',庚:'亥',辛:'子',壬:'丑',癸:'卯'};
  var hongLuan={子:'卯',丑:'寅',寅:'丑',卯:'子',辰:'亥',巳:'戌',午:'酉',未:'申',申:'未',酉:'午',戌:'巳',亥:'辰'};
  var shenList=[];
  // 天乙贵人
  if(tianYi[dm]){
    var yiZhis=tianYi[dm].split('');
    for(var i=0;i<4;i++){if(yiZhis.indexOf(zhis[i])>=0){shenList.push('天乙贵人（'+zhis[i]+'）——逢凶化吉，贵人相助');break;}}
  }
  // 桃花(红鸾)
  for(var i=0;i<4;i++){
    var hz=hongLuan[zhis[i]];
    for(var j=i+1;j<4;j++){if(zhis[j]===hz){shenList.push('红鸾桃花（'+zhis[i]+'×'+hz+'）——人缘好，有魅力');break;}}
  }
  // 文昌
  if(taiYang[dm]&&zhis.indexOf(taiYang[dm])>=0) shenList.push('文昌（'+taiYang[dm]+'）——聪明好学，有利学业考试');
  
  var r='';
  if(shenList.length) r+='命带神煞：'+shenList.join('；');
  else r+='命局无明显神煞显现。';
  r+='神煞为命理辅助参考，吉神增福（天乙贵人逢凶化吉、文昌主智慧），凶神减吉（如羊刃主竞争、阴煞主小人），但需结合十神喜忌综合判断，不可完全依赖神煞断吉凶。';
  return r;
}
// 大运动态分析
function genDaYunAnalysis(dayun,curAge,dmWx,yongShen,xiShen,jiShen,dm,ec){
  var r='';
  if(!dayun||!dayun.length) return '大运信息待完善。';
  var curDayun = null;
  for(var di=0;di<dayun.length;di++){
    var sa=dayun[di].getStartAge(),ea=dayun[di].getEndAge();
    if(curAge>=sa&&curAge<=ea){curDayun=dayun[di];break;}
  }
  if(curDayun){
    var dyGZ=curDayun.getGanZhi(), dyGan=dyGZ.charAt(0);
    var dyGanWx=ganWx(GAN_LIST.indexOf(dyGan));
    var isGood=(WX_SHENG[dyGanWx]===dmWx||dyGanWx===yongShen||dyGanWx===xiShen);
    r+='当前行运<b>'+colorGZ(dyGZ)+'</b>（'+curDayun.getStartAge()+'-'+curDayun.getEndAge()+'岁），五行属<b style="color:'+getCharColor(dyGanWx)+'">'+dyGanWx+'</b>。'+(isGood?'此运为<b style="color:green">用神/喜神运</b>，事业顺遂，宜积极进取。':'此运为<b style="color:#CC0000">忌神运</b>，需保守谨慎，稳中求进。');
  }
  if(ec){
    var taiYuan=ec.getTaiYuan(), mingGong=ec.getMingGong();
    if(taiYuan) r+='胎元<b>'+colorGZ(taiYuan)+'</b>（先天根基），';
    if(mingGong) r+='命宫<b>'+colorGZ(mingGong)+'</b>（后天归宿）。';
  }
  r+='大运十年一换，起运数由出生日距最近节气天数决定。每步大运的干支与原局产生新的五行互动，引动不同的十神宫位。用神运至事半功倍，忌神运临宜静不宜动。';
  return r;
}
// 人生阶段动态分析
function genLifeAnalysis(gans,zhis,gSS,zSS,ec,nys){
  var r='四柱宫位对应人生脉络：';
  stages=[
    {name:'年柱',pillar:'少年',ss:gSS[0],zhi:zhis[0],ny:nys[0]},
    {name:'月柱',pillar:'青年',ss:gSS[1],zhi:zhis[1],ny:nys[1]},
    {name:'日柱',pillar:'中年',ss:gSS[2],zhi:zhis[2],ny:nys[2]},
    {name:'时柱',pillar:'晚年',ss:gSS[3],zhi:zhis[3],ny:nys[3]},
  ];
  stages.forEach(function(st){
    r+=st.name+'（'+st.pillar+'）：天干<b>'+colorGZ(st.ss)+'</b>，地支<b>'+colorGZ(st.zhi)+'</b>，纳音<b>'+colorGZ(st.ny)+'</b>。';
    if(st.ss&&st.ss!=='日主') r+=st.ss+'主导此阶段特质。';
  });
  r+='各柱藏干揭示隐性潜力，纳音反映先天气质。大运引动某柱时对应人生领域将被激活。';
  return r;
}

// === 7. 十神格局 ===
    h += '<div class="result-card"><div class="rc-header">👤 十神格局</div><div class="rc-text">';
    var ssDesc = {比肩:'代表自我、兄弟',劫财:'代表手足、社交',食神:'代表才华、享受',伤官:'代表才华、智慧',偏财:'代表意外之财',正财:'代表正职收入',七杀:'代表权威、魄力',正官:'代表事业、名誉',偏印:'代表学识、技艺',正印:'代表学业、贵人'};
    h += '<div style="display:flex;gap:10px;margin-bottom:6px;font-size:13px">';
    h += '<span><span style="color:#999">年</span> <b style="color:'+getCharColor(ec.getYearGan())+'">'+ec.getYearShiShenGan()+'</b></span>';
    h += '<span><span style="color:#999">月</span> <b style="color:'+getCharColor(ec.getMonthGan())+'">'+ec.getMonthShiShenGan()+'</b></span>';
    h += '<span><span style="color:#999">日</span> <b style="color:'+getCharColor(ec.getDayGan())+'">日主</b></span>';
    h += '<span><span style="color:#999">时</span> <b style="color:'+getCharColor(ec.getTimeGan())+'">'+ec.getTimeShiShenGan()+'</b></span></div>';
    h += '<div style="font-size:11.5px;color:#888;margin-bottom:8px">地支藏干十神：年<b style="color:'+getCharColor(ec.getYearZhi())+'">'+ec.getYearShiShenZhi()+'</b>　月<b style="color:'+getCharColor(ec.getMonthZhi())+'">'+ec.getMonthShiShenZhi()+'</b>　日<b style="color:'+getCharColor(ec.getDayZhi())+'">'+ec.getDayShiShenZhi()+'</b>　时<b style="color:'+getCharColor(ec.getTimeZhi())+'">'+ec.getTimeShiShenZhi()+'</b></div>';
    var allSS = [ec.getYearShiShenGan(), ec.getMonthShiShenGan(), ec.getTimeShiShenGan()];
    // 列出全部十神解释,命中有无都显示
    var ALL_SS_NAMES = ['正官','偏官(七杀)','正印','偏印(枭神)','正财','偏财','比肩','劫财','食神','伤官'];
    var ALL_SS_DESC = {
      '正官':'代表事业、名誉、管理能力。正直有责任心，仕途顺利，遵纪守法。',
      '偏官(七杀)':'代表权威、魄力、决断力。有领导才能，勇敢果断，但易冲动偏激。',
      '正印':'代表学业、长辈、福气。学习能力强，有贵人相助，心地善良。',
      '偏印(枭神)':'代表学识、技艺、独特思维。深思熟虑，有独特见解，但易孤僻。',
      '正财':'代表正职收入、资产。踏实稳定，善于理财，婚姻和谐。',
      '偏财':'代表意外之财、社交手腕。财运好，慷慨大方，善于交际。',
      '比肩':'代表自我、兄弟、朋友。独立有主见，竞争意识强，但易固执己见。',
      '劫财':'代表手足、社交、竞争。朋友多，社交能力强，但易付出多收获少。',
      '食神':'代表才华、享受、福气。有艺术天赋，乐观开朗，口福好。',
      '伤官':'代表才华、智慧、傲气。聪明有才，思维敏捷，不喜约束，易得罪人。'
    };
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0;font-size:12px">';
    ALL_SS_NAMES.forEach(function(sname){
      var isPresent = allSS.indexOf(sname) >= 0 || allSS.indexOf(sname.replace(/\(.*/,'')) >= 0;
      h += '<span style="display:inline-block;padding:3px 8px;border-radius:4px;';
      if(isPresent){
        h += 'background:#CC0000;color:#fff;font-weight:700';
      } else {
        h += 'background:#E8DCC0;color:#999';
      }
      h += '">'+sname+'</span>';
    });
    h += '</div><div style="font-size:12px;color:#555;line-height:1.9;margin-top:6px">';
    ALL_SS_NAMES.forEach(function(sname){
      var isPresent = allSS.indexOf(sname) >= 0 || allSS.indexOf(sname.replace(/\(.*/,'')) >= 0;
      if(isPresent){
        h += '<div style="padding:3px 0;border-bottom:1px dashed #E8DCC0"><b style="color:#CC0000">● '+sname+'</b>：'+ALL_SS_DESC[sname]+'</div>';
      }
    });
    // 如果无任何十神,显示基本的
    if(!allSS.some(function(s){return s && s!=='日主';})){
      h += '<div style="color:#999;font-size:12px">命盘中无明显十神显现。</div>';
    }
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+genSSAnalysis(dm,gSS,zSS,ec)+'</div>';
h += '</div></div>';

    // === 8. 十神与宫位（参考图10） ===
    h += '<div class="result-card"><div class="rc-header">🏠 十神·宫位双维</div><div class="rc-text">';
    // 动态解释生成函数
    function buildExplain(fam, sslist){
      var genDesc = function(ssArr, posDesc){
        if(!ssArr.length) return posDesc+'暂无显著十神显现。';
        var txt = '';
        ssArr.forEach(function(ss){
          if(ss.indexOf('正印')>=0) txt += '正印临宫，得长辈荫庇，学业顺利，为人仁慈。';
          else if(ss.indexOf('偏印')>=0) txt += '偏印入位，思维独特，有偏才技艺，但易孤僻。';
          else if(ss.indexOf('正官')>=0) txt += '正官得地，正直有责，事业有成，遵纪守法。';
          else if(ss.indexOf('七杀')>=0 || ss.indexOf('偏官')>=0) txt += '七杀坐守，魄力过人，敢作敢为，但需防冲动。';
          else if(ss.indexOf('正财')>=0) txt += '正财贴身，财运稳定，踏实务实，婚姻和谐。';
          else if(ss.indexOf('偏财')>=0) txt += '偏财透出，慷慨大方，财运亨通，善于交际。';
          else if(ss.indexOf('比肩')>=0) txt += '比肩同柱，独立自主，兄弟朋友相助，但易固执。';
          else if(ss.indexOf('劫财')>=0) txt += '劫财相伴，社交活跃，人缘广泛，但需防破财。';
          else if(ss.indexOf('食神')>=0) txt += '食神临位，才华横溢，乐观豁达，福禄丰足。';
          else if(ss.indexOf('伤官')>=0) txt += '伤官透出，聪明傲气，才华出众，不喜约束。';
        });
        return txt || posDesc;
      };
      if(fam === '父母'){
        var ySS = document.querySelector('#bazi-result') ? '' : '';
        return genDesc(sslist, '父母宫为月柱，代表家庭根基与双亲缘分。');
      }
      if(fam === '配偶'){
        if(!sslist.length) return '配偶宫为空，婚姻缘分较淡，需主动经营。';
        var t = '';
        sslist.forEach(function(ss){
          if(ss.indexOf('正财')>=0) t += '正财居配偶宫，夫妻和谐，配偶贤惠顾家。';
          else if(ss.indexOf('偏财')>=0) t += '偏财坐配偶宫，配偶能力强，感情丰富。';
          else if(ss.indexOf('正官')>=0) t += '正官入配偶宫，配偶正直有地位，婚姻稳定。';
          else if(ss.indexOf('七杀')>=0) t += '七杀坐配偶宫，配偶个性强，感情有激情但需磨合。';
          else if(ss.indexOf('伤官')>=0) t += '伤官在配偶宫，感情细腻但要求高，易有矛盾。';
          else if(ss.indexOf('比肩')>=0 || ss.indexOf('劫财')>=0) t += '比劫在配偶宫，婚姻易有竞争，需多沟通。';
          else t += genDesc([ss], '');
        });
        return t || '配偶宫得吉星，婚姻质量较好。';
      }
      if(fam === '子女'){
        if(!sslist.length) return '子女宫无显著十神，子女缘分顺其自然。';
        var t = '';
        sslist.forEach(function(ss){
          if(ss.indexOf('食神')>=0 || ss.indexOf('伤官')>=0) t += '食伤在子女宫，子女聪明伶俐，才华出众。';
          else if(ss.indexOf('正官')>=0 || ss.indexOf('七杀')>=0) t += '官杀在子女宫，子女有出息，管教严格。';
          else if(ss.indexOf('正印')>=0 || ss.indexOf('偏印')>=0) t += '印星在子女宫，子女学业好，孝顺懂事。';
          else t += genDesc([ss], '子女宫得星，缘分不错。');
        });
        return t;
      }
      if(fam === '兄弟'){
        if(!sslist.length) return '兄弟宫不显，兄弟姐妹缘分平淡或独立性强。';
        var t = '';
        sslist.forEach(function(ss){
          if(ss.indexOf('比肩')>=0) t += '比肩在兄弟宫，兄弟姐妹互助，但有个性竞争。';
          else if(ss.indexOf('劫财')>=0) t += '劫财在兄弟宫，朋友多社交广，但需防财务纠葛。';
          else t += genDesc([ss], '兄弟宫得星，手足缘分不错。');
        });
        return t;
      }
      return genDesc(sslist, '');
    }
    var familyMap = {
      '父母':{gan:[ec.getYearShiShenGan(),ec.getMonthShiShenGan()],palace:'月柱',desc:'偏财为父、正印为母',explain:'年柱管祖业根基，月柱管父母家庭。正印旺者得母助，偏财旺者得父荫，父母宫吉则出身良好。'},
      '配偶':{gan:[ec.getDayShiShenZhi()],palace:'日支',desc:'男以正财为妻、女以正官为夫',explain:'日支为配偶宫，正财正官为佳配。日支坐桃花则配偶貌美，坐比劫则婚姻易有竞争。'},
      '子女':{gan:[ec.getTimeShiShenGan(),ec.getTimeShiShenZhi()],palace:'时柱',desc:'男以官杀为子女、女以食伤为子女',explain:'时柱为子女宫，食伤旺者子女聪慧，官杀旺者子女有出息。时柱吉则晚年安乐。'},
      '兄弟':{gan:[],palace:'年柱·月柱',desc:'比肩为兄弟、劫财为姐妹',explain:'比劫为兄弟姊妹，月柱为兄弟宫。比劫旺者兄弟姐妹多，但也会导致竞争。'},
    };
    for(var fam in familyMap){
      var info = familyMap[fam];
      var sslist = info.gan.filter(function(s){return s && s!=='日主';});
      h += '<div style="margin-bottom:8px;border-bottom:1px dashed #E0D5B8;padding-bottom:6px">';
      h += '<b>'+colorGZ(fam)+'</b> <span style="font-size:11px;color:#999">（'+colorGZ(info.palace)+'）</span><br>';
      h += '<span style="font-size:11px;color:#666">'+colorGZ(info.desc)+'</span><br>';
      if(sslist.length){
        h += '<span style="font-size:12px;color:#333">';
        sslist.forEach(function(s){ h += '<span style="display:inline-block;background:#F5F0E0;padding:1px 8px;border-radius:3px;margin:2px">'+colorGZ(s)+'</span> '; });
        h += '</span><br>';
      } else {
        h += '<span style="font-size:11px;color:#999">盘中不显</span><br>';
      }
      h += '<span style="font-size:11px;color:#888;line-height:1.6">💡 '+colorGZ(buildExplain(fam, sslist))+'</span>';
      h += '</div>';
    }
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+genGongWeiAnalysis(dm,gSS,zSS,pillarNames,zhis)+'</div>';
h += '</div></div>';

    // === 9. 神煞 & 流日互动细盘 ===
    h += '<div class="result-card"><div class="rc-header">🔮 神煞 · 流日互动</div>';
    // 流日查询放在第一行
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px;padding:8px;background:#f5f0e0;border-radius:4px">';
    h += '<span style="font-size:12px;color:#666">📅 流日查询：</span>';
    h += '<select id="liu-year" onchange="refreshLiuTable()" style="padding:3px 6px;border:1px solid #CC9900;border-radius:3px;font-size:12px"></select>';
    h += '<select id="liu-month" onchange="refreshLiuTable()" style="padding:3px 6px;border:1px solid #CC9900;border-radius:3px;font-size:12px"></select>';
    h += '<select id="liu-day" onchange="refreshLiuTable()" style="padding:3px 6px;border:1px solid #CC9900;border-radius:3px;font-size:12px"></select>';
    h += '</div>';
    // 神煞+流日互动表格容器（由refreshLiuTable动态生成）
    h += '<div style="margin:6px 0;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+genShenShaAnalysis(dm,zhis,gans,ec)+'</div>';
h += '<div id="liu-table-container"><div style="text-align:center;color:#999;font-size:12px;padding:8px">⬆ 选择日期查看流日互动</div></div></div>';

    // === 10. 大运走势 ===
    h += '<div class="result-card"><div class="rc-header">📈 大运走势 <span style="font-size:11px;color:#999;letter-spacing:0">（起运'+dyStartYear+'岁）</span></div><div class="dy-grid">';
    var curAge = new Date().getFullYear() - year;
    for(var di=0; di<Math.min(dayun.length,8); di++){
      var du = dayun[di];
      var sa = du.getStartAge(), ea = du.getEndAge();
      var isCur = (curAge >= sa && curAge <= ea);
      h += '<div class="dy-item'+(isCur?' cur':'')+'">';
      h += '<div class="dy-age">'+(sa===0?'0':sa)+'-'+(ea===0?'9':ea)+'岁</div>';
      h += '<div class="dy-gz">'+du.getGanZhi().replace(/[甲乙丙丁戊己庚辛壬癸]/g,function(m){return '<span style="color:'+getCharColor(m)+'">'+m+'</span>';}).replace(/[子丑寅卯辰巳午未申酉戌亥]/g,function(m){return '<span style="color:'+getCharColor(m)+'">'+m+'</span>';})+'</div></div>';
    }
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+genDaYunAnalysis(dayun,curAge,dmWx,yongShen,xiShen,jiShen,dm,ec)+'</div>';
h += '</div></div>';

    // === 11. 人生阶段 ===
    h += '<div class="result-card"><div class="rc-header">📅 人生阶段与亲属宫</div><div class="rc-text">';
    var lifeInfo = [
      {pillar:'年柱',name:'少年（~15岁）',palace:'祖业宫·祖辈根源',gan:gans[0],zhi:zhis[0],ss:gSS[0]},
      {pillar:'月柱',name:'青年（16-32岁）',palace:'父母宫·提纲兄弟',gan:gans[1],zhi:zhis[1],ss:gSS[1]},
      {pillar:'日柱',name:'中年（33-48岁）',palace:'自身宫·配偶宫',gan:gans[2],zhi:zhis[2],ss:gSS[2]},
      {pillar:'时柱',name:'晚年（49岁后）',palace:'子女宫·归宿晚景',gan:gans[3],zhi:zhis[3],ss:gSS[3]},
    ];
    var nys = [ec.getYearNaYin(), ec.getMonthNaYin(), ec.getDayNaYin(), ec.getTimeNaYin()];
    lifeInfo.forEach(function(li){
      var idx = pillarNames.indexOf(li.pillar);
      var hg = [ec.getYearHideGan(), ec.getMonthHideGan(), ec.getDayHideGan(), ec.getTimeHideGan()];
      var exp = '';
      var s = li.ss || '';
      // 天干十神 + 柱位名称
      var pillarRole = {年柱:'祖业根基',月柱:'命局提纲',日柱:'自身配偶',时柱:'晚年归宿'};
      var role = pillarRole[li.pillar]||'';
      // 藏干
      var hides = hg[idx]||[];
      var hideStr = hides.length ? '藏干'+hides.map(function(g){var gg=ganWx(GAN_LIST.indexOf(g));return g+'('+gg+')';}).join('、') : '';
      // 纳音
      var naYin = nys[idx]||'';
      if(s.indexOf('正印')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：正印护持祖上积德，少年得长辈关爱，学业顺遂。'+hideStr+'纳音'+naYin+'。此阶段宜发扬正印之仁慈好学品格。';}
      else if(s.indexOf('偏印')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：偏印坐祖上有偏业传承，早慧独立思维独特。'+hideStr+'纳音'+naYin+'。此阶段需发挥偏印之独创精神。';}
      else if(s.indexOf('劫财')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：祖业有耗早年朋友多社交广，但需防财务纷扰。'+hideStr+'纳音'+naYin+'。此阶段重在积累人脉同时守住财库。';}
      else if(s.indexOf('伤官')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：伤官透出聪颖傲气，才华外露不喜约束。'+hideStr+'纳音'+naYin+'。此阶段才华得以施展，但需注意言辞。';}
      else if(s.indexOf('七杀')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：此阶段早年早熟环境压力大，锻炼出领导力。'+hideStr+'纳音'+naYin+'。压力即动力，此阶段是锤炼意志的关键期。';}
      else if(s.indexOf('食神')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：福气深厚衣食无忧，乐观开朗有口福。'+hideStr+'纳音'+naYin+'。此阶段享受生活的同时宜发展才艺。';}
      else if(s.indexOf('正官')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：出身正统家教良好，少年有责任感，事业管理方面有天赋。'+hideStr+'纳音'+naYin+'。此阶段宜循规蹈矩打好基础。';}
      else if(s.indexOf('正财')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：家境殷实少年有财缘，踏实稳重善于理财。'+hideStr+'纳音'+naYin+'。此阶段财务稳定是最大优势。';}
      else if(s.indexOf('偏财')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：家业丰足社交广泛慷慨大方。'+hideStr+'纳音'+naYin+'。此阶段人际关系广阔，宜拓展事业版图。';}
      else if(s.indexOf('比肩')>=0){exp='<b>'+s+'</b>坐'+li.pillar+'（'+role+'）：兄弟姐妹相伴独立自主，有竞争意识。'+hideStr+'纳音'+naYin+'。此阶段在合作与竞争中成长。';}
      else{exp='<b>'+li.pillar+'</b>（'+role+'）：此柱十神不显，'+hideStr+'纳音'+naYin+'。此阶段需结合大运流年综合判断。';}
      // 柱位专属补充
      if(li.pillar==='年柱') exp += '年柱代表祖辈福荫与少年成长环境，得天于先。';
      else if(li.pillar==='月柱') exp += '月柱代表父母家庭与青年事业方向，月令为气数核心。';
      else if(li.pillar==='日柱') exp += '日柱代表自身命宫兼配偶宫，此阶段婚姻自我实现事业定型。';
      else if(li.pillar==='时柱') exp += '时柱代表归宿宫兼子女宫，晚年运势与子女成就是人生结局之象。';
      h += '<div style="margin-bottom:8px;padding:8px;background:#FAF5E8;border:1px solid #E8DCC0;border-radius:4px">';
      h += '<div style="display:flex;gap:8px;align-items:flex-start">';
      h += '<div style="min-width:60px;text-align:center"><b>'+li.pillar+'</b><br><span style="font-size:10px;color:#999">'+li.name+'</span></div>';
      h += '<div style="flex:1;font-size:12px;color:#555">';
      h += '<b style="font-size:16px;color:'+getCharColor(li.gan)+'">'+li.gan+'</b>　'+li.ss+'<br>';
      h += '<span style="font-size:11px;color:#999">'+li.palace+'　纳音：'+(nys[idx]||'')+'</span>';
      h += '</div></div>';
      h += '<div style="margin-top:4px;font-size:11px;color:#888;line-height:1.6;padding:4px 6px;background:#FFF;border-radius:3px">💡 '+exp+'</div>';
      h += '</div>';
    });
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+genLifeAnalysis(gans,zhis,gSS,zSS,ec,nys)+'</div>';
h += '</div></div>';

    // === 13. 天干留意·地支留意（参考zydx.top）===
    var HE5_check = {甲:'己',乙:'庚',丙:'辛',丁:'壬',戊:'癸',己:'甲',庚:'乙',辛:'丙',壬:'丁',癸:'戊'};
    var CHONG6_check = {子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
    var HAI6_check = {子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'};
    var XING3_check = {寅:'巳',巳:'申',申:'寅',丑:'戌',戌:'未',未:'丑',子:'卯',卯:'子'};
    var ZIXING_check = {辰:1,午:1,酉:1,亥:1};
    var ganWarns = [], zhiWarns = [];
    var GAN_WARN_DESC = {
      '合':'天干五合，和合之象，有合作、融合之意，化为五行。',
      '冲':'天干相冲，对抗之象，易有变动、冲突与压力。'
    };
    var ZHI_WARN_DESC = {
      '冲':'地支六冲，对立冲突，关系紧张，易有突发变动。',
      '害':'地支六害，暗中受害，小人是非，需防口舌。',
      '刑':'地支三刑，刑伤之象，多口舌是非，注意健康。',
      '自刑':'自刑之象，内心矛盾，易钻牛角尖，需放宽心态。'
    };
    for(var pi=0; pi<4; pi++){
      for(var pj=pi+1; pj<4; pj++){
        if(HE5_check[gans[pi]]===gans[pj]) ganWarns.push({info:gans[pi]+gans[pj]+'合',type:'合',desc:GAN_WARN_DESC['合']});
        if(CHONG6_check[zhis[pi]]===zhis[pj]) zhiWarns.push({info:zhis[pi]+zhis[pj]+'冲',type:'冲',desc:ZHI_WARN_DESC['冲']});
        if(HAI6_check[zhis[pi]]===zhis[pj]) zhiWarns.push({info:zhis[pi]+zhis[pj]+'害',type:'害',desc:ZHI_WARN_DESC['害']});
        if(XING3_check[zhis[pi]]===zhis[pj] || XING3_check[zhis[pj]]===zhis[pi]) zhiWarns.push({info:zhis[pi]+zhis[pj]+'刑',type:'刑',desc:ZHI_WARN_DESC['刑']});
      }
      if(ZIXING_check[zhis[pi]]) zhiWarns.push({info:zhis[pi]+'自刑',type:'自刑',desc:ZHI_WARN_DESC['自刑']});
    }
    h += '<div class="result-card"><div class="rc-header">⚠️ 天干留意 · 地支留意</div><div class="rc-text">';
    h += '<div style="font-size:12px;color:#555;line-height:1.8">';
    if(ganWarns.length){
      h += '<b style="color:#990000">天干：</b>';
      ganWarns.forEach(function(w){var c=w.info.replace(/[甲乙丙丁戊己庚辛壬癸]/g,function(m){return '<span style="color:'+getCharColor(m)+';font-weight:700">'+m+'</span>';});h += '<div style="margin:3px 0;padding:4px 8px;background:#FFF;border:1px solid #E8DCC0;border-radius:4px">'+c+' — '+w.desc+'</div>';});
    } else {
      h += '<b style="color:#990000">天干：</b>无冲合。<br>';
    }
    if(zhiWarns.length){
      h += '<b style="color:#990000">地支：</b>';
      zhiWarns.forEach(function(w){var c=w.info.replace(/[子丑寅卯辰巳午未申酉戌亥]/g,function(m){return '<span style="color:'+getCharColor(m)+';font-weight:700">'+m+'</span>';});h += '<div style="margin:3px 0;padding:4px 8px;background:#FFF;border:1px solid #E8DCC0;border-radius:4px">'+c+' — '+w.desc+'</div>';});
    } else {
      h += '<b style="color:#990000">地支：</b>无刑冲。';
    }
    // 动态命理分析
    var gzDesc = [];
    if(ganWarns.length){
      var heCount=0,chongCount=0;
      ganWarns.forEach(function(w){if(w.type==='合')heCount++;else chongCount++;});
      if(heCount) gzDesc.push('天干有<b>'+heCount+'组合</b>，主合作调和之象，化气五行影响命局');
      if(chongCount) gzDesc.push('天干有<b>'+chongCount+'组冲</b>，主动荡变动、需注意人际关系冲突');
    } else { gzDesc.push('天干无明显冲合关系，平和无扰'); }
    if(zhiWarns.length){
      var cCount=0,hCount=0,xCount=0,zxCount=0;
      zhiWarns.forEach(function(w){
        if(w.type==='冲')cCount++;else if(w.type==='害')hCount++;else if(w.type==='刑')xCount++;else if(w.type==='自刑')zxCount++;
      });
      if(cCount) gzDesc.push('地支有<b>'+cCount+'组冲</b>，关系紧张易变，大事不宜');
      if(hCount) gzDesc.push('地支有<b>'+hCount+'组害</b>，防小人暗算、口舌是非');
      if(xCount) gzDesc.push('地支有<b>'+xCount+'组刑</b>，注意健康与法律纠纷');
      if(zxCount) gzDesc.push('地支有<b>自刑</b>，内心矛盾纠结，建议多与人沟通');
    } else { gzDesc.push('地支无刑冲害关系'); }
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>'+gzDesc.join('；')+'。冲合刑害定性需结合十神喜忌综合判断。合则聚气为吉，冲则散气为凶，刑则伤气为灾，害则损气为耗。</div>';
h += '</div></div></div>';

    // === 命局解读（双引擎）===
    h += '<div class="result-card"><div class="rc-header">🔮 命局解读 · 双引擎</div>';
    var patternDesc = '月令格局·子平论命';
    // 滴天髓判断
    var energyDesc = '日主'+qiangText+'。';
    // 动态五行描述
    var wxDescParts = [];
    var wxOrder = ['mu','huo','tu','jin','shui'];
    var wxNames = {mu:'木',huo:'火',tu:'土',jin:'金',shui:'水'};
    var wxAdj = {mu:'偏多',huo:'过旺',tu:'适中',jin:'偏少',shui:'偏弱'};
    wxOrder.forEach(function(k){
      var cnt = wc[k] || 0;
      var total = wc.mu+wc.huo+wc.tu+wc.jin+wc.shui || 1;
      var pct = cnt/total;
      if(pct >= 0.35) wxDescParts.push(wxNames[k]+'过旺');
      else if(pct <= 0.1 && total > 1) wxDescParts.push(wxNames[k]+'偏弱');
    });
    if(wxDescParts.length) energyDesc += wxDescParts.join('、')+'。';
    var mostWx = mx ? WX_NAMES2[mx] : '';
    if(mostWx && wc[mx] > (wc.mu+wc.huo+wc.tu+wc.jin+wc.shui)/2) energyDesc += '五行偏枯，重在流通平衡。';
    else energyDesc += '五行分布较为均衡，中和为贵。';
    var mName = ['寅月','卯月','辰月','巳月','午月','未月','申月','酉月','戌月','亥月','子月','丑月'][month-1]||'';
    var isHot = [4,5,6].indexOf(month)>=0;
    var isCold = [10,11,0,1].indexOf(month)>=0;
    var tempLabel = isHot ? '偏燥' : isCold ? '偏寒' : '温和';
    var dmWxName = ganWx(GAN_LIST.indexOf(dm));
    var tiaoHou = '寒暖适宜·调候不显';
    if(isHot && dmWxName==='火') tiaoHou = '火旺炎燥，需水调候';
    else if(isHot && dmWxName==='金') tiaoHou = '火金相克，需土通关';
    else if(isCold && (dmWxName==='水'||dmWxName==='金')) tiaoHou = '寒金冷水，需火调候';
    h += '<div class="rc-text">';
    h += '<div style="display:flex;gap:10px;margin-bottom:8px">';
    h += '<div style="flex:1;text-align:center;background:#F5F0E0;border-radius:6px;padding:8px"><div style="font-size:11px;color:#999">子平格局派</div><div style="font-weight:700;color:#990000;font-size:13px">社会·职场层</div><div style="font-size:12px;color:#555;margin-top:4px">'+patternDesc+'</div></div>';
    h += '<div style="flex:1;text-align:center;background:#F5F0E0;border-radius:6px;padding:8px"><div style="font-size:11px;color:#999">滴天髓旺衰派</div><div style="font-weight:700;color:#990000;font-size:13px">自然·能量层</div><div style="font-size:12px;color:#555;margin-top:4px">日主'+qiangText+'</div></div>';
    h += '</div>';
    h += '<div style="margin-bottom:8px"><b style="font-size:13px;color:#990000">🔄 五行能量分布</b>';
    h += '<span style="font-size:11px;color:#999;margin-left:8px">寒暖燥湿：<b>'+(isHot?'🔥':'❄️')+tempLabel+'</b></span></div>';
    var yongShen = '', xiShen = '', jiShen = '';
    if(qiangText.indexOf('强')>=0){
      yongShen = dmWxName==='火'?'金':dmWxName==='金'?'水':dmWxName==='水'?'木':dmWxName==='木'?'火':'金';
      xiShen = WX_NAMES2[Object.keys(WX_NAMES2).find(function(k){return WX_SHENG[k]===yongShen;})]||'';
      jiShen = WX_NAMES2[Object.keys(WX_NAMES2).find(function(k){return WX_KE[k]===yongShen;})]||'';
    } else {
      yongShen = dmWxName==='火'?'木':dmWxName==='金'?'土':dmWxName==='水'?'金':dmWxName==='木'?'水':'火';
      xiShen = WX_NAMES2[Object.keys(WX_NAMES2).find(function(k){return WX_KE[k]===yongShen;})]||yongShen;
      jiShen = WX_NAMES2[Object.keys(WX_NAMES2).find(function(k){return WX_SHENG[k]===yongShen;})]||'';
    }
    h += '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">';
    h += '<span style="background:#CC0000;color:#fff;padding:3px 10px;border-radius:10px;font-size:11px">用神：'+yongShen+'</span>';
    h += '<span style="background:#3399CC;color:#fff;padding:3px 10px;border-radius:10px;font-size:11px">喜神：'+xiShen+'</span>';
    h += '<span style="background:#999;color:#fff;padding:3px 10px;border-radius:10px;font-size:11px">忌神：'+jiShen+'</span>';
    var aw=['金','木','水','火','土'];var xs=aw.filter(function(w){return w!==yongShen&&w!==xiShen&&w!==jiShen;}).join('、')||'无';
    h += '<span style="background:#CC9900;color:#fff;padding:3px 10px;border-radius:10px;font-size:11px">闲神：'+xs+'</span></div>';
    h += '<div style="margin-top:8px;padding:8px;background:#FFF8E8;border:1px solid #E8DCC0;border-radius:4px">';
    h += '<b style="font-size:12px;color:#990000">📋 综合诊读</b><br>';
    h += '<span style="font-size:12px;color:#555">'+energyDesc+'</span><br>';
    h += '<span style="font-size:11px;color:#888">调候：'+tiaoHou+'</span>';
    h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>';
    // 动态生成八字AI分析
    var aiParts = [];
    aiParts.push('命主为<b style="color:'+getCharColor(dm)+'">'+dm+'日</b>生人，日主<b>'+qiangText+'</b>。');
    var mostWxName = mx ? WX_NAMES2[mx] : '';
    var leastWx = '';
    var minV = 999;
    Object.keys(wc).forEach(function(k){if(wc[k] < minV){minV=wc[k];leastWx=WX_NAMES2[k];}});
    if(mostWxName && leastWx) aiParts.push('五行以<b style="color:'+getCharColor(mostWxName)+'">'+mostWxName+'</b>为最旺，<b style="color:'+getCharColor(leastWx)+'">'+leastWx+'</b>偏弱，需注意补益平衡。');
    if(yongShen) aiParts.push('以<b style="color:#CC0000">'+yongShen+'</b>为用神，<b style="color:#3399CC">'+xiShen+'</b>为喜神，<b style="color:#999">'+jiShen+'</b>为忌神。');
    aiParts.push('调候方面：'+tiaoHou+'。');
    aiParts.push('大运顺逆影响重大，用神到位则事半功倍，忌神临位则需谨慎行事。');
    h += aiParts.join(' ');
    h += '</div>';
h += '</div></div></div>';

    // === 深度解析 ===
    h += '<div class=\"result-card\"><div class=\"rc-header\">🔍 深度解析 · 总结与预测</div><div class=\"rc-text\">';
    // 综合总结
    h += '<div style=\"margin-bottom:8px\"><b style=\"font-size:13px;color:#990000\">📊 命盘总结</b></div>';
    h += '<div style=\"font-size:12px;color:#555;line-height:1.9;margin-bottom:10px\">';
    h += '此命为<b style=\\"color:'+getCharColor(dm)+'\\">'+dm+'</b>日生人（'+(dmWx||'?')+'命），八字<b>'+colorGZ(baziFull||'')+'</b>，日主<b>'+(qiangText||'?')+'</b>。';
    if(mx) h+='五行以<b style=\\"color:'+getCharColor(WX_NAMES2[mx])+'\\">'+WX_NAMES2[mx]+'</b>为最旺。';
    h += '用神为<b style=\\"color:'+getCharColor(yongShen||'金')+'\\">'+(yongShen||'?')+'</b>，喜神为<b style=\\"color:'+getCharColor(xiShen||'金')+'\\">'+(xiShen||'?')+'</b>，忌神为<b style=\\"color:'+getCharColor(jiShen||'金')+'\\">'+(jiShen||'?')+'</b>。';
    h += '命主性格'+(DMDESC[dm]||'')+'，人生格局以'+(gSS[1]||'')+'为月令基调。';
    h += '</div>';

    // 当前大运分析
    h += '<div style=\"margin-bottom:8px\"><b style=\"font-size:13px;color:#990000\">📈 当前大运</b></div>';
    h += '<div style=\"font-size:12px;color:#555;line-height:1.9;margin-bottom:10px\">';
    var curAge = new Date().getFullYear() - year;
    var curDayun = null;
    if(dayun && dayun.length){
      for(var di=0;di<dayun.length;di++){
        var sa = dayun[di].getStartAge(), ea = dayun[di].getEndAge();
        if(curAge >= sa && curAge <= ea){curDayun = dayun[di]; break;}
      }
    }
    if(curDayun){
      var dyGZ = curDayun.getGanZhi();
      var dyGan = dyGZ.charAt(0), dyZhi = dyGZ.charAt(1);
      var dyGanWx = ganWx(GAN_LIST.indexOf(dyGan));
      var isGood = (WX_SHENG[dyGanWx]===dmWx || dyGanWx===yongShen || dyGanWx===xiShen);
      h += '当前行运：<b>'+colorGZ(dyGZ)+'</b>（'+curDayun.getStartAge()+'-'+curDayun.getEndAge()+'岁），五行属<b style=\"color:'+getCharColor(dyGanWx)+'\">'+dyGanWx+'</b>。';
      h += (isGood?'此运对日主为<b style=\"color:green\">吉利</b>之运，利于事业发展，宜把握机遇。':'此运对日主为<b style=\"color:#CC0000\">挑战</b>之运，需谨慎行事，稳中求进。');
      h += '大运天干'+dyGan+'与日主'+dm+'的互动，决定此十年运势基调。';
    } else {
      h += '当前年龄'+curAge+'岁，大运信息需参考详细排盘。';
    }
    h += '</div>';

    // 2026年流年预测（当前年份+1）
    var predYear = year+1;
    try {
      var predSolar = Solar.fromYmd(predYear, 6, 1);
      var predLunar = predSolar.getLunar();
      var predYearGZ = predLunar.getYearInGanZhiExact();
      var predGan = predYearGZ.charAt(0), predZhi = predYearGZ.charAt(1);
      var predGanWx = ganWx(GAN_LIST.indexOf(predGan));
      // 流年与日主关系
      var predSS = getSS(GAN_LIST.indexOf(dm), GAN_LIST.indexOf(predGan));
      // 十二生肖
      var predAnimal = predLunar.getYearShengXiao();
      
      h += '<div style=\"margin-bottom:8px\"><b style=\"font-size:13px;color:#990000\">🔮 '+predYear+'年流年预测（'+predAnimal+'年）</b></div>';
      h += '<div style=\"font-size:12px;color:#555;line-height:1.9;margin-bottom:10px\">';
      h += '<b>流年干支：</b>'+colorGZ(predYearGZ)+'，天干五行属<b style=\"color:'+getCharColor(predGanWx)+'\">'+predGanWx+'</b>。';
      h += '<br><b>流年十神：</b>'+colorGZ(predSS)+'（日主'+dm+'见流年天干'+predGan+'）。';
      
      // 五行喜忌判断
      var wxPred = '';
      if(predGanWx === yongShen) wxPred = '流年天干<b style=\"color:green\">为用神</b>，大利事业财运，是积极进取之年。';
      else if(predGanWx === xiShen) wxPred = '流年天干<b style=\"color:green\">为喜神</b>，运势顺遂，贵人相助，宜把握机会。';
      else if(predGanWx === jiShen) wxPred = '流年天干<b style=\"color:#CC0000\">为忌神</b>，需注意保守低调，避免冒进投资。';
      else wxPred = '流年天干为闲神，运势平稳，无大起大落。';
      h += '<br>'+wxPred;
      
      // 四季运势
      var seasons = [
        {name:'春（3-5月）',wx:WX_SHENG[dmWx]||'木',desc:'开年之际，宜规划布局'},
        {name:'夏（6-8月）',wx:yongShen,desc:'年中发力，顺势而为'},
        {name:'秋（9-11月）',wx:xiShen,desc:'收获之季，见好就收'},
        {name:'冬（12-2月）',wx:jiShen,desc:'潜藏蓄力，不宜妄动'}
      ];
      h += '<div style=\"margin-top:8px\"><b>📅 四季运势：</b></div>';
      h += '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px\">';
      seasons.forEach(function(se){
        var cl = se.wx===yongShen||se.wx===xiShen?'#27ae60':se.wx===jiShen?'#e74c3c':'#f39c12';
        h += '<div style=\"background:'+cl+'15;border:1px solid '+cl+'30;border-radius:6px;padding:6px;text-align:center\">';
        h += '<div style=\"font-size:10px;color:#999\">'+se.name+'</div>';
        h += '<div style=\"font-size:11px;color:'+cl+';font-weight:600\">'+se.desc+'</div></div>';
      });
      h += '</div>';
      
      // 建议
      h += '<div style=\"margin-top:8px;padding:6px;background:#FFF8E8;border-radius:4px;font-size:11px;color:#666;line-height:1.6\">';
      h += '💡 <b>开运建议：</b>多穿戴<b style=\"color:'+getCharColor(yongShen)+'\">'+yongShen+'</b>色系，向'+(yongShen==='金'?'西':yongShen==='木'?'东':yongShen==='水'?'北':yongShen==='火'?'南':'西南')+'方发展，佩戴'+(yongShen==='金'?'金属':yongShen==='木'?'木质':yongShen==='水'?'水晶':yongShen==='火'?'红色':'玉石')+'饰品增强运势。';
      h += '</div>';
      h += '</div>';
    } catch(e) {
      h += '<div style=\"font-size:12px;color:#999;margin-bottom:10px\">流年预测数据生成中...</div>';
    }
    
    h += '<div style=\"margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6\">🤖 <b>命理分析：</b>以上深度解析结合命主八字格局、五行喜忌和大运走势综合判断。流年预测基于传统命理理论，供参考娱乐。精准度取决于出生时间的准确性。</div>';
    h += '</div></div>';

    h += '<div class="footer-note">⚠ 本测算仅供娱乐参考 · 命理玄学并非精密科学</div>';
    h += '<div class="save-bar"><button onclick="saveRecord()" id="saveBtn">💾 保存记录</button><button class="sec" onclick="showRecords()">📂 我的记录</button></div>';
    h += '</div>';
    document.getElementById('bazi-result').innerHTML = h;
    document.getElementById('bazi-result').classList.add('show');

  } catch(e) { alert('输入有误，请检查日期。\n'+e.message); }
  // 保存八字数据供流日查询使用
  window._bzDm = dm;
  window._bzDmIdx = GAN_LIST.indexOf(dm);
  window._bzGans = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()];
  window._bzZhis = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
  window._bzPillarNames = ['年柱','月柱','日柱','时柱'];
  window._bzGSS = [ec.getYearShiShenGan(), ec.getMonthShiShenGan(), '日主', ec.getTimeShiShenGan()];
  window._bzZSS = [ec.getYearShiShenZhi(), ec.getMonthShiShenZhi(), ec.getDayShiShenZhi(), ec.getTimeShiShenZhi()];
  window._bzNaYin = [ec.getYearNaYin(), ec.getMonthNaYin(), ec.getDayNaYin(), ec.getTimeNaYin()];
  window._bzDayun = dayun;
  window._bzCurAge = new Date().getFullYear() - year;
  setTimeout(function(){ refreshLiuTable(); }, 100);
  // AI 异步分析（不阻塞页面显示）
  if(window.AI_WORKER_URL){
    setTimeout(function(){
      var aiData = {
        name: name, gender: gender, bazi: baziFull, dm: dm, dmWx: dmWx,
        gans: gans, zhis: zhis, wc: wc, gSS: gSS, zSS: zSS,
        qiangText: qiangText, totalScore: totalScore,
        yongShen: yongShen, xiShen: xiShen, jiShen: jiShen,
        daYun: curDayun?curDayun.getGanZhi():'',
        predYear: new Date().getFullYear()+1
      };
      try{
        var pdSolar = Solar.fromYmd(new Date().getFullYear()+1,6,1);
        var pdLunar = pdSolar.getLunar();
        aiData.predYear = currentYear+1;
        aiData.predAnimal = pdLunar.getYearShengXiao();
        aiData.predGZ = pdLunar.getYearInGanZhiExact();
      }catch(e){}
      window._aiBaziData = aiData;
      // 逐个请求AI分析（综合、五行、十神、大运、深度）
      var sections = ['综合','五行','十神','大运','深度'];
      sections.forEach(function(sec){
        var el = document.getElementById('ai-'+sec);
        if(!el) return;
        el.innerHTML = '🤔 AI分析生成中...';
        fetch(window.AI_WORKER_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({section: sec, type: 'bazi', baziData: aiData})
        })
        .then(function(r){return r.json();})
        .then(function(d){
          if(d.success && d.text && document.getElementById('ai-'+sec)){
            document.getElementById('ai-'+sec).innerHTML = d.text;
          }
        })
        .catch(function(){
          var el2 = document.getElementById('ai-'+sec);
          if(el2) el2.innerHTML = el2.getAttribute('data-fallback') || '分析就绪';
        });
      });
    }, 200);
  }
}

// ===== 流日互动细盘（含神煞动态显示）=====
function refreshLiuTable(){
  var lyS=document.getElementById('liu-year');
  var lmS=document.getElementById('liu-month');
  var ldS=document.getElementById('liu-day');
  if(!lyS) return;
  
  if(lyS.options.length===0){
    var td=new Date();
    for(var y=td.getFullYear();y>=1900;y--){
      var o=document.createElement('option');o.value=y;o.textContent=y+'年';
      if(y===td.getFullYear())o.selected=true; lyS.appendChild(o);
    }
    for(var m=1;m<=12;m++){
      var o=document.createElement('option');o.value=m;o.textContent=m+'月';
      if(m===td.getMonth()+1)o.selected=true; lmS.appendChild(o);
    }
    var maxD=new Date(td.getFullYear(),td.getMonth()+1,0).getDate();
    for(var dd=1;dd<=maxD;dd++){
      var o=document.createElement('option');o.value=dd;o.textContent=dd+'日';
      if(dd===td.getDate())o.selected=true; ldS.appendChild(o);
    }
    function updDays(){
      var y=parseInt(lyS.value),m=parseInt(lmS.value);
      var max=new Date(y,m,0).getDate();
      var cur=parseInt(ldS.value); if(cur>max)cur=max;
      ldS.innerHTML='';
      for(var d=1;d<=max;d++){
        var o=document.createElement('option');o.value=d;o.textContent=d+'日';
        if(d===cur)o.selected=true; ldS.appendChild(o);
      }
      refreshLiuTable();
    }
    lmS.addEventListener('change',updDays);
    lyS.addEventListener('change',updDays);
  }

  var yr=parseInt(lyS.value), mo=parseInt(lmS.value), da=parseInt(ldS.value);
  var dt=new Date(yr,mo-1,da);
  var sl=Solar.fromDate(dt);
  var ln=sl.getLunar();
  var lyGZ=ln.getYearInGanZhiExact(), lmGZ=ln.getMonthInGanZhiExact(), ldGZ=ln.getDayInGanZhiExact2();

  var dmIdx=window._bzDmIdx||0;
  var gs=window._bzGans||[], zs=window._bzZhis||[];
  var pN=window._bzPillarNames||[];
  var gSS=window._bzGSS||[], zSS=window._bzZSS||[];
  var nY=window._bzNaYin||[], kg=window._bzKong||[];
  var dm=window._bzDm||'';

  // 7列: 流日/流月/流年 + 年柱/月柱/日柱/时柱
  var cols=[ldGZ,lmGZ,lyGZ].concat(gs.map(function(g,i){return g+zs[i];}));
  var colLabels=['流日','流月','流年','年柱','月柱','日柱','时柱'];

  var wxC={'金':'#CC9900','木':'#33AA33','水':'#3399CC','火':'#CC0000','土':'#BB7711'};
  var h='<table class="bz-detail" style="min-width:auto;font-size:11px"><tr style="background:#666;color:#fff"><td></td>';
  for(var ci=0;ci<7;ci++) h += '<td>'+colLabels[ci]+'</td>';
  h += '</tr>';

  // 日期行
  h += '<tr style="background:#E8DCC0"><td class="dl">日期</td>';
  h += '<td colspan="3" style="font-size:12px;font-weight:700;color:#990000">'+yr+'年'+mo+'月'+da+'日</td>';
  for(var ci=3;ci<7;ci++) h += '<td style="font-size:11px;color:#666">命盘四柱</td>';
  h += '</tr>';

  // 天干行
  h += '<tr style="background:#f5f0e0"><td class="dl">天干</td>';
  for(var ci=0;ci<7;ci++){
    var gc=colLabels[ci], gz=cols[ci];
    var gan=gz.charAt(0), zhi=gz.charAt(1);
    var idx=GAN_LIST.indexOf(gan);
    var ss=idx>0&&dmIdx>0?getSS(dmIdx,idx):'';
    var wx=ganWx(idx);
    h += '<td><span style="color:'+getCharColor(gan)+';font-weight:700;font-size:14px">'+gan+'</span> <span style="font-size:9px;color:#999">'+ss+'</span></td>';
  }
  h += '</tr>';

  // 地支行
  h += '<tr style="background:#ccc"><td class="dl">地支</td>';
  for(var ci=0;ci<7;ci++){
    var zhi=cols[ci].charAt(1);
    var ss='';
    if(ci<3){ // 流日/月/年 vs 日主
      var gzFull=cols[ci];
      var zg=gzFull.charAt(0);
      var idx=GAN_LIST.indexOf(zg);
      ss=idx>0&&dmIdx>0?getSS(dmIdx,idx):'';
    } else {
      ss=zSS[ci-3]||'';
    }
    h += '<td><span style="font-weight:700;font-size:14px;color:'+getCharColor(zhi)+'">'+zhi+'</span> <span style="font-size:9px;color:#999">'+ss+'</span></td>';
  }
  h += '</tr>';

  // 神煞行（流日/流月/流年 + 四柱都显示，带解释）
  h += '<tr style="background:#FFF8E8"><td class="dl">神煞</td>';
  for(var ci=0;ci<7;ci++){
    var gz=cols[ci];
    var gan=gz.charAt(0), zhi=gz.charAt(1);
    var yz=zs[0];
    var ssList=getPSS(gan,zhi,dm,yz);
    if(ssList.length){
      var cellHtml=[];
      ssList.forEach(function(s){
        cellHtml.push('<b>'+colorGZ(s.name)+'</b><br><span style="font-size:9px;color:#888">'+s.desc+'</span>');
      });
      h += '<td style="font-size:10px;line-height:1.4">'+cellHtml.join('<br>')+'</td>';
    } else {
      h += '<td style="font-size:10px;color:#ccc">—</td>';
    }
  }
  h += '</tr>';

  // 纳音行
  h += '<tr style="background:#f5f0e0"><td class="dl">纳音</td>';
  for(var ci=0;ci<7;ci++){
    h += '<td style="font-size:10px">'+(NAYIN[cols[ci]]||'—')+'</td>';
  }
  h += '</tr>';

  // 空亡行
  h += '<tr style="background:#ddd"><td class="dl">空亡</td>';
  for(var ci=0;ci<7;ci++){
    h += '<td style="font-size:10px">'+(getKongWang(cols[ci])||'—')+'</td>';
  }
  h += '</tr>';

  h += '</table>';
  var tc=document.getElementById('liu-table-container');
  if(tc) tc.innerHTML = h;
}
// ====================================================================
// 紫微斗数 (ZWDS) — 基于 iztro JS
// ====================================================================
var STAR_NAMES_CN = {
  ziweiMaj:'紫微',tianjiMaj:'天机',taiyangMaj:'太阳',wuquMaj:'武曲',
  tiantongMaj:'天同',lianzhenMaj:'廉贞',tianfuMaj:'天府',taiyinMaj:'太阴',
  tanlangMaj:'贪狼',jumenMaj:'巨门',tianxiangMaj:'天相',tianliangMaj:'天梁',
  qishaMaj:'七杀',pojunMaj:'破军',
  zuofuMin:'左辅',youbiMin:'右弼',wenchangMin:'文昌',wenquMin:'文曲',
  tiankuiMin:'天魁',tianyueMin:'天钺',lucunMin:'禄存',tianmaMin:'天马',
  dikongMin:'地空',dijieMin:'地劫',huoxingMin:'火星',lingxingMin:'铃星',
  qingyangMin:'擎羊',tuoluoMin:'陀罗',
  hongluan:'红鸾',tianxi:'天喜',tianyao:'天姚',xianchi:'咸池',
  jieshen:'解神',santai:'三台',bazuo:'八座',engguang:'恩光',tiangui:'天贵',
  longchi:'龙池',fengge:'凤阁',tiancai:'天才',tianshou:'天寿',
  taifu:'台辅',fenggao:'封诰',tianwu:'天巫',huagai:'华盖',
  tianguan:'天官',tianfu2:'天福',tianchu:'天厨',tianyue2:'天月',
  tiande:'天德',yuede:'月德',tiankong:'天空',xunkong:'旬空',
  jielu:'截路',kongwang:'空亡',longde:'龙德',jiekong:'解空',
  guchen:'孤辰',guasu:'寡宿',feilian:'蜚廉',posui:'破碎',
  tianxing:'天刑',yinsha:'阴煞',tianku:'天哭',tianxu:'天哭',
  tianshi:'天使',tianshang:'天伤',nianjie:'年解',
  // Changsheng
  changsheng:'长生',muyu:'沐浴',guandai:'冠带',linguan:'临官',
  diwang:'帝旺',shuai:'衰',bing:'病',si:'死',mu:'墓',jue:'绝',
  tai:'胎',yang:'养',
  // Boshi
  boshi:'博士',lishi:'力士',qinglong:'青龙',xiaohao:'小耗',
  jiangjun:'将军',zhoushu:'奏书',faylian:'飞廉',xishen:'喜神',
  bingfu:'病符',dahao:'大耗',fubing:'伏兵',guanfu:'官符',
  // Suiqian
  suijian:'岁建',huiqi:'晦气',sangmen:'丧门',guansuo:'贯索',
  gwanfu:'官符',xiaohao2:'小耗',dahao2:'大耗',longde2:'龙德',
  baihu:'白虎',tiande2:'天德',diaoke:'吊客',bingfu2:'病符',
  // Jiangqian  
  jiangxing:'将星',panan:'攀鞍',suiyi:'岁驿',xiishen:'息神',
  huagai2:'华盖',jiesha2:'劫煞',zhaisha:'灾煞',tiansha:'天煞',
  zhibei:'指背',xianchi2:'咸池',yuesha:'月煞',wangshen:'亡神',
};

var PALACE_NAMES_CN = {
  soulPalace:'命宫',parentsPalace:'父母',spiritPalace:'福德',
  propertyPalace:'田宅',careerPalace:'官禄',friendsPalace:'交友',
  surfacePalace:'迁移',healthPalace:'疾厄',wealthPalace:'财帛',
  childrenPalace:'子女',spousePalace:'夫妻',siblingsPalace:'兄弟'
};

var BRANCH_CN = {
  ziEarthly:'子',chouEarthly:'丑',yinEarthly:'寅',maoEarthly:'卯',
  chenEarthly:'辰',siEarthly:'巳',wuEarthly:'午',weiEarthly:'未',
  shenEarthly:'申',youEarthly:'酉',xuEarthly:'戌',haiEarthly:'亥'
};

var MUTAGEN_CN = {sihuaLu:'禄',sihuaQuan:'权',sihuaKe:'科',sihuaJi:'忌'};
var MUTAGEN_CLASS = {sihuaLu:'hua-lu',sihuaQuan:'hua-quan',sihuaKe:'hua-ke',sihuaJi:'hua-ji'};

var BRANCH_GRID = {
  '巳':[1,1],'午':[1,2],'未':[1,3],'申':[1,4],
  '辰':[2,1],                          '酉':[2,4],
  '卯':[3,1],                          '戌':[3,4],
  '寅':[4,1],'丑':[4,2],'子':[4,3],'亥':[4,4]
};

// Star interpretation (excerpts)
var STAR_INTERP = {
  '紫微':'帝星，领袖气质，自尊心强，不愿居人之下。统御力强，格局大，但孤高、好面子。',
  '天机':'谋士星，思维敏捷，聪明善变。善于策划分析，但想多做少，容易焦虑。',
  '太阳':'光明星，热情慷慨，乐于付出。有感染力，但易过度付出，容易 burnout。',
  '武曲':'财星将星，务实果断，执行力强。理财能力强，但过于刚硬，不善表达感情。',
  '天同':'福星，温和乐观，享受生活。人缘好心态好，但缺乏进取心，容易满足现状。',
  '廉贞':'囚星桃花星，执着有魅力，爱恨分明。有艺术天赋，但过于执着，情绪化。',
  '天府':'库星，稳重保守，善于积累。可靠包容，但过于保守，缺乏冒险精神。',
  '太阴':'月亮星，细腻感性，有艺术气质。感受力强，但过于敏感，容易焦虑。',
  '贪狼':'桃花星欲望星，多才多艺，社交能力强。善于交际，但欲望多，容易放纵。',
  '巨门':'口舌星，善于表达，思维缜密。口才好适合法律/媒体，但易招口舌是非。',
  '天相':'印星，温和善良，乐于助人。人缘好有服务精神，但容易受人影响。',
  '天梁':'荫星，正直有智慧，有长辈缘。稳重可靠适合教育/医疗，但爱管闲事。',
  '七杀':'将星，勇猛果断，有魄力。执行力强能成大业，但冲动易得罪人。',
  '破军':'破耗星，敢闯敢拼，不破不立。开创性强适合创业，但波动大不稳定。'
};

function calcZWDS(){
  autoSaveBirth('zwds');
  // 表单验证
  var errEl = document.getElementById('zwds-err');
  if(!errEl){
    errEl = document.createElement('div');
    errEl.id = 'zwds-err';
    errEl.style.cssText = 'color:#CC0000;font-size:12px;margin:8px 0;padding:8px;background:#FFF0F0;border:1px solid #CC0000;border-radius:4px;display:none';
    document.querySelector('#tab-zwds .card').appendChild(errEl);
  }
  errEl.style.display = 'none';
  
  var name = document.getElementById('zwds-name').value.trim() || '未知';
  var gender = getGender('zwds');
  var calType = window.zwds_caltype || 'solar';
  var year, month, day, hour;
  if(calType === 'lunar'){
    year = parseInt(document.getElementById('zwds-lyear').value);
    month = parseInt(document.getElementById('zwds-lmonth').value);
    day = parseInt(document.getElementById('zwds-lday').value);
    hour = parseInt(document.getElementById('zwds-lhour').value);
  } else {
    year = parseInt(document.getElementById('zwds-year').value);
    month = parseInt(document.getElementById('zwds-month').value);
    day = parseInt(document.getElementById('zwds-day').value);
    hour = parseInt(document.getElementById('zwds-hour').value);
  }
  
  // 逐项验证
  var errors = [];
  if(!name || name === '未知') errors.push('请输入姓名');
  if(!year || isNaN(year) || year < 1900 || year > 2100) errors.push('出生年份不正确');
  if(!month || isNaN(month) || month < 1 || month > 12) errors.push('出生月份不正确');
  if(!day || isNaN(day) || day < 1 || day > 31) errors.push('出生日期不正确');
  if(!hour && hour !== 0 || isNaN(hour) || hour < 0 || hour > 23) errors.push('出生时辰不正确');
  if(errors.length){
    errEl.innerHTML = '⚠ ' + errors.join('<br>⚠ ');
    errEl.style.display = 'block';
    errEl.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  
  try {
    var chart;
    var dateStr = year + '-' + month + '-' + day;
    if(calType === 'lunar'){
      chart = iztro.astro.byLunar(dateStr, hour, gender, false, true, 'zh-CN');
    } else {
      chart = iztro.astro.bySolar(dateStr, hour, gender, 'zh-CN');
    }

    var html = '<div class="card" style="background:var(--bg-card);border:1px solid rgba(0,77,77,.15);border-radius:4px;padding:12px;margin:10px 10px 0"><div class="rc-header" style="color:var(--teal)">📋 基本信息</div>';
    html += '<div class="info-item"><span class="label">姓名</span><span class="value">'+name+'</span></div>';
    html += '<div class="info-item"><span class="label">性别</span><span class="value">'+gender+'</span></div>';
    html += '<div class="info-item"><span class="label">'+ (calType==='lunar'?'农历':'公历') +'</span><span class="value">'+dateStr+'</span></div>';
    html += '<div class="info-item"><span class="label">农历</span><span class="value">'+chart.chineseDate+'</span></div>';
    var fecMap = {water2nd:'水二局',wood3rd:'木三局',metal4th:'金四局',earth5th:'土五局',fire6th:'火六局'};
    var fec = fecMap[chart.fiveElementsClass] || chart.fiveElementsClass;
    html += '<div class="info-item"><span class="label">五行局</span><span class="value">'+fec+'</span></div>';
    html += '<div class="info-item"><span class="label">命主</span><span class="value">'+chart.soul+'</span></div>';
    html += '<div class="info-item"><span class="label">身主</span><span class="value">'+chart.body+'</span></div></div>';

    // Info bar
    var soulPalace = chart.palaces.find(function(p){return p.isOriginalPalace;});
    var soulName = soulPalace ? (PALACE_NAMES_CN[soulPalace.name] || soulPalace.name) : '?';
    var soulBranch = BRANCH_CN[soulPalace.earthlyBranch] || soulPalace.earthlyBranch || '';
    var soulStars = soulPalace.majorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('·') || '空宫';
    html += '<div class="info-bar" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(0,77,77,.12);border:1px solid rgba(0,77,77,.18);margin-bottom:10px;margin-top:8px">';
    html += '<div style="text-align:center;padding:6px 4px;background:var(--bg-card)"><div style="font-size:10px;color:var(--text-dim)">五行局</div><div style="font-size:13px;font-weight:700;color:var(--teal)">'+fec+'</div></div>';
    html += '<div style="text-align:center;padding:6px 4px;background:var(--bg-card)"><div style="font-size:10px;color:var(--text-dim)">命宫</div><div style="font-size:13px;font-weight:700;color:var(--teal)">'+soulBranch+'宫</div></div>';
    html += '<div style="text-align:center;padding:6px 4px;background:var(--bg-card)"><div style="font-size:10px;color:var(--text-dim)">命主星</div><div style="font-size:13px;font-weight:700;color:var(--teal)">'+soulStars+'</div></div>';
    html += '<div style="text-align:center;padding:6px 4px;background:var(--bg-card)"><div style="font-size:10px;color:var(--text-dim)">身主</div><div style="font-size:13px;font-weight:700;color:var(--teal)">'+chart.body+'</div></div>';
    html += '</div>';

    // Tab: Birth Chart (existing content wrapper)
    html += '<div id="tab-birth" class="zwds-tab-panel">';

    // Palace grid
    html += '<div class="rc-header" style="color:var(--teal)">十二宫位分布</div><div class="palace-grid">';
    var palaceMap = {};
    chart.palaces.forEach(function(p){
      var branch = BRANCH_CN[p.earthlyBranch] || p.earthlyBranch;
      palaceMap[branch] = p;
    });
    var soulBranchB = BRANCH_CN[soulPalace.earthlyBranch] || '';
    var bodyPalace = chart.palaces.find(function(p){return p.isBodyPalace;});

    for(var row=1;row<=4;row++){
      for(var col=1;col<=4;col++){
        if((row===2||row===3)&&(col===2||col===3)){
          if(row===2&&col===2){
            html += '<div class="palace-center"><div class="center-bagua">☯</div><div class="center-title">命盘</div><div class="center-info">'+chart.lunarDate+'<br>'+fec+'</div>';
            var mutagens = [];
            chart.palaces.forEach(function(p){
              [].concat(p.majorStars).forEach(function(s){
                if(s.mutagen) mutagens.push({star:STAR_NAMES_CN[s.name]||s.name, m: MUTAGEN_CN[s.mutagen]||s.mutagen, cls: MUTAGEN_CLASS[s.mutagen]||''});
              });
            });
            if(mutagens.length){
              html += '<div class="hua-bar">';
              mutagens.forEach(function(m){ html += '<span class="hua-tag '+m.cls+'">'+m.star+m.m+'</span>'; });
              html += '</div>';
            }
            html += '</div>';
          }
          continue;
        }
        var foundBranch = '';
        for(var b in BRANCH_GRID){
          if(BRANCH_GRID[b][0]===row && BRANCH_GRID[b][1]===col){
            foundBranch = b; break;
          }
        }
        var p = palaceMap[foundBranch];
        if(p){
          var cls = 'palace';
          if(foundBranch === soulBranchB) cls += ' active';
          html += '<div class="'+cls+'">';
          html += '<div class="palace-name">'+(PALACE_NAMES_CN[p.name]||p.name)+'</div>';
          html += '<div class="palace-dizhi">'+foundBranch+'</div>';
          html += '<div class="palace-stars">';
          var hasStars = false;
          p.majorStars.forEach(function(s){
            hasStars = true;
            var sn = STAR_NAMES_CN[s.name]||s.name;
            if(s.mutagen) { html += '<span class="s hua">'+sn+(MUTAGEN_CN[s.mutagen]||'')+'</span>'; }
            else { html += '<span class="s main">'+sn+'</span>'; }
          });
          p.minorStars.forEach(function(s){
            hasStars = true;
            var sn = STAR_NAMES_CN[s.name]||s.name;
            html += '<span class="s">'+sn+'</span>';
          });
          if(!hasStars) html += '<span class="s empty">空宫</span>';
          html += '</div>';
          if(p.isOriginalPalace) html += '<div class="palace-badge badge-ming">命</div>';
          if(p.isBodyPalace) html += '<div class="palace-badge badge-body">身</div>';
          html += '</div>';
        } else {
          html += '<div class="palace"></div>';
        }
      }
    }
    html += '</div>';

    // 大限表
    html += '<div class="rc-header" style="color:var(--teal)">📈 大限走势</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
    // 大限数据来自各宫位
    var decadesList = [];
    chart.palaces.forEach(function(pal){
      if(pal.decadal && pal.decadal.range){
        decadesList.push({
          startAge: pal.decadal.range[0],
          endAge: pal.decadal.range[1],
          ganZhi: pal.decadal.heavenlyStem + pal.decadal.earthlyBranch,
          palaceName: PALACE_NAMES_CN[pal.name]||pal.name
        });
      }
    });
    decadesList.sort(function(a,b){return a.startAge - b.startAge;});
    var curAge = year > 0 ? (new Date().getFullYear() - year) : 0;
    decadesList.forEach(function(d){
      var active = (curAge >= d.startAge && curAge <= d.endAge) ? 'background:var(--teal);color:#fff;border:1px solid var(--teal)' : 'background:var(--bg-card);color:var(--text);border:1px solid rgba(0,77,77,.15)';
      html += '<div style="'+active+';padding:6px 10px;border-radius:4px;text-align:center;min-width:60px;flex:1">';
      html += '<div style="font-size:9px;'+(curAge>=d.startAge&&curAge<=d.endAge?'color:#fff':'color:var(--text-dim)')+'">'+d.startAge+'~'+d.endAge+'岁</div>';
      html += '<div style="font-size:13px;font-weight:700">'+colorGZ(d.ganZhi)+'</div>';
      html += '<div style="font-size:8px;'+(curAge>=d.startAge&&curAge<=d.endAge?'color:rgba(255,255,255,.7)':'color:var(--text-dim)')+'">'+d.palaceName+'</div>';
      html += '</div>';
    });
    if(!decadesList.length) html += '<span style="font-size:12px;color:var(--text-dim)">暂无大限数据</span>';
    html += '</div>';

    // 十二宫详表
    html += '<div class="rc-header" style="color:var(--teal)">📊 十二宫详表</div><table class="bz-detail" style="font-size:11px;margin-bottom:10px"><tr style="background:var(--teal);color:#fff"><td>宫位</td><td>地支</td><td>天干</td><td>主星</td><td>辅星</td><td>四化</td></tr>';
    chart.palaces.forEach(function(p){
      var pn = PALACE_NAMES_CN[p.name]||p.name;
      var branch = BRANCH_CN[p.earthlyBranch]||p.earthlyBranch;
      var stem = p.heavenlyStem||'';
      var mStars = p.majorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('、')||'—';
      var miStars = p.minorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('、')||'—';
      var hua = p.majorStars.filter(function(s){return s.mutagen;}).map(function(s){return (STAR_NAMES_CN[s.name]||s.name)+(MUTAGEN_CN[s.mutagen]||'');}).join('、')||'—';
      var bg = (p.isOriginalPalace||p.isBodyPalace) ? 'background:#F0ECE0' : '';
      html += '<tr style="'+bg+'"><td style="font-weight:700">'+pn+(p.isOriginalPalace?'(命)':'')+(p.isBodyPalace?'(身)':'')+'</td><td>'+colorGZ(branch)+'</td><td>'+colorGZ(stem)+'</td><td style="font-weight:600">'+mStars+'</td><td style="font-size:10px;color:var(--text-dim)">'+miStars+'</td><td style="color:var(--teal)">'+hua+'</td></tr>';
    });
    html += '</table>';

    // 命盘解读
    html += '<div class="rc-header" style="color:var(--teal)">📖 命盘解读</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
    // 命宫解读
    var soulText = '命宫在' + colorGZ(soulBranch) + '宫';
    if(soulPalace.majorStars.length){
      soulText += '，主星：' + soulPalace.majorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('、');
      soulPalace.majorStars.forEach(function(s){
        var sn = STAR_NAMES_CN[s.name]||s.name;
        if(STAR_INTERP[sn]) soulText += ' ' + STAR_INTERP[sn];
      });
    } else {
      var oppIdx = (soulPalace.index + 6) % 12;
      var oppP = chart.palaces[oppIdx];
      soulText += oppP ? '为空宫，借对宫「' + (PALACE_NAMES_CN[oppP.name]||oppP.name) + '」星曜。' : '为空宫。';
    }
    html += '<div style="grid-column:1/-1;background:var(--bg-card);border:1px solid rgba(0,77,77,.1);border-radius:4px;padding:10px"><div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:4px">💎 先天命宫</div><div style="font-size:12px;line-height:1.7;color:var(--text)"><strong>'+soulText+'</strong></div></div>';

    var keyPalaces = ['careerPalace','wealthPalace','spousePalace','healthPalace','travelPalace','friendsPalace'];
    var keyTitles = {'careerPalace':'事业·官禄','wealthPalace':'财运·财帛','spousePalace':'感情·夫妻','healthPalace':'健康·疾厄','travelPalace':'迁移·外出','friendsPalace':'人际·交友'};
    var keyColors = ['#CC6633','#B8860B','#8B0000','#336633','#336699','#663366'];
    keyPalaces.forEach(function(pn, pi){
      var p = chart.palaces.find(function(pc){return pc.name===pn;});
      if(!p) return;
      var bn = BRANCH_CN[p.earthlyBranch]||'';
      var txt = (PALACE_NAMES_CN[p.name]||p.name)+'在'+bn+'宫';
      if(p.majorStars.length){
        txt += '，主星：' + p.majorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('、');
        p.majorStars.forEach(function(s){
          var sn = STAR_NAMES_CN[s.name]||s.name;
          if(STAR_INTERP[sn]) txt += ' ' + STAR_INTERP[sn];
        });
      } else {
        txt += '为空宫。';
      }
      html += '<div style="background:var(--bg-card);border:1px solid rgba(0,77,77,.1);border-radius:4px;padding:8px"><div style="font-size:10px;font-weight:700;color:'+keyColors[pi]+';margin-bottom:3px">'+keyTitles[pn]+'</div><div style="font-size:11px;line-height:1.6;color:var(--text-dim)">'+txt+'</div></div>';
    });
    html += '</div>';
    html += '</div>'; // close tab-birth

    // ===== Tab 切换区域 =====
    html += '<div style="margin:10px 0">';
    html += '<div style="display:flex;gap:0">';
    html += '<button id="tab-btn-birth" class="zwds-tab-btn active" onclick="switchZWDS(\'birth\')" style="flex:1;padding:8px 0;border:1px solid rgba(0,77,77,.2);border-radius:4px 4px 0 0;background:var(--teal);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🏠 本命命盘</button>';
    html += '<button id="tab-btn-decade" class="zwds-tab-btn" onclick="switchZWDS(\'decade\')" style="flex:1;padding:8px 0;border:1px solid rgba(0,77,77,.15);border-radius:4px 4px 0 0;background:var(--bg-card);color:var(--text-dim);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:none">📈 大限详解</button>';
    html += '<button id="tab-btn-yearly" class="zwds-tab-btn" onclick="switchZWDS(\'yearly\')" style="flex:1;padding:8px 0;border:1px solid rgba(0,77,77,.15);border-radius:4px 4px 0 0;background:var(--bg-card);color:var(--text-dim);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:none">📅 流年运势</button>';
    html += '</div>';

    // 大限详解面板
    html += '<div id="tab-decade" class="zwds-tab-panel" style="display:none;background:var(--bg-card);border:1px solid rgba(0,77,77,.15);border-top:none;border-radius:0 0 4px 4px;padding:12px">';
    html += '<div class="rc-header" style="color:var(--teal)">📈 十二大限详解</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    var dList=[];
    chart.palaces.forEach(function(pal){
      if(pal.decadal && pal.decadal.range){
        dList.push({
          start:pal.decadal.range[0], end:pal.decadal.range[1],
          ganZhi:(pal.decadal.heavenlyStem||'')+(pal.decadal.earthlyBranch||''),
          pal:PALACE_NAMES_CN[pal.name]||pal.name,
          stars:pal.majorStars.map(function(s){return STAR_NAMES_CN[s.name]||s.name;}).join('、')||'空宫'
        });
      }
    });
    dList.sort(function(a,b){return a.start-b.start;});
    dList.forEach(function(d){
      var isActive=(curAge>=d.start&&curAge<=d.end);
      var bg=isActive?'background:linear-gradient(135deg,var(--teal),#005555);color:#fff;border:1px solid var(--teal)':'background:var(--bg-card);border:1px solid rgba(0,77,77,.1)';
      html+='<div style="'+bg+';padding:8px 10px;border-radius:6px;display:flex;align-items:center;gap:10px;font-size:11px">';
      html+='<div style="min-width:65px;text-align:center"><div style="font-size:9px;'+(isActive?'color:rgba(255,255,255,.7)':'color:var(--text-dim)')+'">年龄</div><div style="font-size:13px;font-weight:700">'+d.start+'~'+d.end+'</div></div>';
      html+='<div style="min-width:55px;text-align:center"><div style="font-size:9px;'+(isActive?'color:rgba(255,255,255,.7)':'color:var(--text-dim)')+'">干支</div><div style="font-size:14px;font-weight:700">'+colorGZ(d.ganZhi)+'</div></div>';
      html+='<div style="min-width:50px;text-align:center"><div style="font-size:9px;'+(isActive?'color:rgba(255,255,255,.7)':'color:var(--text-dim)')+'">宫位</div><div style="font-size:12px;font-weight:600">'+d.pal+'</div></div>';
      html+='<div style="flex:1;text-align:left"><div style="font-size:9px;'+(isActive?'color:rgba(255,255,255,.7)':'color:var(--text-dim)')+'">主星</div><div style="font-size:11px;font-weight:600">'+d.stars+'</div></div>';
      if(isActive) html+='<div style="font-size:9px;background:#fff;color:var(--teal);padding:2px 5px;border-radius:8px;font-weight:700;white-space:nowrap">当前</div>';
      html+='</div>';
    });
    html += '</div>';
    html += '</div>';

    // 流年运势面板
    html += '<div id="tab-yearly" class="zwds-tab-panel" style="display:none;background:var(--bg-card);border:1px solid rgba(0,77,77,.15);border-top:none;border-radius:0 0 4px 4px;padding:12px">';
    html += '<div class="rc-header" style="color:var(--teal)">📅 流年运势（未来十年）</div>';
    var curYear=new Date().getFullYear();
    var yearlyHTML='';
    try{
      for(var yi=0;yi<10;yi++){
        var ty=curYear+yi;
        try{
          var hsChart=chart.horoscope(ty,month||1);
          if(hsChart){
            var yStem=hsChart.yearly?hsChart.yearly.heavenlyStem:'';
            var yBranch=hsChart.yearly?hsChart.yearly.earthlyBranch:'';
            var yGZ=(yStem||'')+(yBranch||'');
            var yMutagens=[];
            if(hsChart.palaces){
              hsChart.palaces.forEach(function(p){
                [].concat(p.majorStars||[]).forEach(function(s){
                  if(s.mutagen) yMutagens.push((STAR_NAMES_CN[s.name]||s.name)+(MUTAGEN_CN[s.mutagen]||''));
                });
              });
            }
            var isTY=(ty===curYear);
            var ybg=isTY?'background:linear-gradient(135deg,var(--teal),#005555);color:#fff;border:1px solid var(--teal)':'background:var(--bg-card);border:1px solid rgba(0,77,77,.08)';
            yearlyHTML+='<div style="'+ybg+';padding:8px 10px;border-radius:6px;display:flex;align-items:center;gap:10px;font-size:11px">';
            yearlyHTML+='<div style="min-width:45px;text-align:center;font-size:13px;font-weight:700">'+ty+'</div>';
            yearlyHTML+='<div style="min-width:55px;text-align:center;font-size:14px;font-weight:700">'+(yGZ?colorGZ(yGZ):'—')+'</div>';
            yearlyHTML+='<div style="flex:1;font-size:11px;'+(isTY?'':'color:var(--text-dim)')+'">'+(yMutagens.length?yMutagens.join('·'):'')+'</div>';
            if(isTY) yearlyHTML+='<div style="font-size:9px;background:#fff;color:var(--teal);padding:2px 5px;border-radius:8px;font-weight:700;white-space:nowrap">今年</div>';
            yearlyHTML+='</div>';
          }
        }catch(e2){}
      }
    }catch(e1){}
    if(yearlyHTML){
      html+='<div style="display:flex;flex-direction:column;gap:6px">'+yearlyHTML+'</div>';
    } else {
      html+='<div style="text-align:center;padding:20px;color:var(--text-dim)">暂无流年数据（请检查iztro版本是否支持horoscope功能）</div>';
    }
    html += '</div>';

    html += '</div>'; // end tab wrapper
    // ===== Tab 切换区域结束 =====

    // 综合解读
    html += '<div style="background:var(--bg-card);border:1px solid rgba(0,77,77,.15);border-radius:4px;padding:12px"><div class="rc-header" style="color:var(--teal)">📖 综合解读</div><div style="font-size:.85rem;color:var(--text-dim);line-height:1.9"><p>命主为<strong style="color:var(--teal)">'+name+'</strong>，'+gender+'命，生于'+chart.chineseDate+'。';
    var huaList = [];
    chart.palaces.forEach(function(p){
      [].concat(p.majorStars).forEach(function(s){
        if(s.mutagen) huaList.push(STAR_NAMES_CN[s.name]||s.name + (MUTAGEN_CN[s.mutagen]||''));
      });
    });
    if(huaList.length) html += '<br>生年四化：<strong style="color:var(--red)">'+huaList.join('、')+'</strong>。';
    html += '<br>以上解读基于紫微斗数三合派和中州派方法论，仅供参考。</p></div></div>';

    document.getElementById('zwds-result').innerHTML = html;
    document.getElementById('zwds-result').classList.add('show');
  } catch(e) {
    alert('排盘出错：'+e.message+'。请检查输入信息是否合法。');
    console.error(e);
  }
}

// ===== Tab 切换函数 (紫微斗数) =====
function switchZWDS(tab){
  var tabs=['birth','decade','yearly'];
  tabs.forEach(function(t){
    var panel=document.getElementById('tab-'+t);
    var btn=document.getElementById('tab-btn-'+t);
    if(!panel||!btn) return;
    if(t===tab){
      panel.style.display='block';
      btn.style.background='var(--teal)';
      btn.style.color='#fff';
      btn.style.borderColor='var(--teal)';
      btn.classList.add('active');
    } else {
      panel.style.display='none';
      btn.style.background='var(--bg-card)';
      btn.style.color='var(--text-dim)';
      btn.style.borderColor='rgba(0,77,77,.15)';
      btn.classList.remove('active');
    }
  });
}

console.log('命理融合版已加载 ✅');

// ===== API 地址 (自动检测) =====
var API_BASE = 'http://localhost:3000/api';
// 如果是GitHub Pages环境,尝试使用本地服务器
(function(){
  var host = window.location.hostname;
  if(host !== 'localhost' && host !== '127.0.0.1'){
    // 部署在GitHub Pages时,尝试多种后端地址
    // 优先使用Render部署地址(替换为实际地址)
    API_BASE = 'http://localhost:3000/api'; // 本地服务器优先
  }
})();

// ===== 认证系统 =====
var _authMode = 'login';

function showAuth(mode){
  _authMode = mode;
  document.getElementById('authTitle').textContent = mode==='login' ? '邮箱登录' : '邮箱注册';
  document.getElementById('authSubmit').textContent = mode==='login' ? '登录' : '注册';
  document.getElementById('authSwitch').textContent = mode==='login' ? '没有账号？点此注册' : '已有账号？点此登录';
  document.getElementById('authErr').textContent = '';
  document.getElementById('authOk').textContent = '';
  document.getElementById('sendCodeBtn').disabled = false;
  document.getElementById('sendCodeBtn').textContent = '发送验证码';
  document.getElementById('authCode').value = '';
  document.getElementById('authOverlay').classList.add('show');
}

function toggleAuth(){
  showAuth(_authMode==='login' ? 'register' : 'login');
}

function closeAuth(){
  document.getElementById('authOverlay').classList.remove('show');
}
function showProfile(){
  document.getElementById('profileEmail').textContent = localStorage.getItem('bazi_user') || '';
  // 加载已保存的基础信息
  var saved = localStorage.getItem('bazi_base_info');
  if(saved){
    try{var d=JSON.parse(saved);
      document.getElementById('pf-name').value=d.name||'';
      document.getElementById('pf-gender').value=d.gender||'男';
      document.getElementById('pf-year').value=d.year||'';
      document.getElementById('pf-month').value=d.month||'';
      document.getElementById('pf-day').value=d.day||'';
      document.getElementById('pf-hour').value=d.hour||'';
      document.getElementById('pf-province').value=d.province||'';
      document.getElementById('pf-city').value=d.city||'';
    }catch(e){}
  }
  // 加载保存记录
  var records = JSON.parse(localStorage.getItem('bazi_records') || '[]');
  var listEl = document.getElementById('profileRecords');
  if(records.length){
    listEl.innerHTML = records.reverse().slice(0,20).map(function(r,i){
      return '<div style="padding:6px 8px;margin:4px 0;background:#FAF5E8;border-radius:4px;font-size:11px">'+
        '<span style="color:#999">'+(r.time||'')+'</span> '+
        '<span style="color:'+(r.type==='bazi'?'#CC0000':r.type==='zwds'?'#006666':'#CC9900')+'">'+(r.type==='bazi'?'八字':r.type==='zwds'?'紫微':'其他')+'</span> '+
        '<span>'+r.name+'</span></div>';
    }).join('');
  } else {
    listEl.innerHTML = '<div style="text-align:center;color:#999;padding:10px">暂无保存记录</div>';
  }
  document.getElementById('profileOverlay').classList.add('show');
}
function closeProfile(){
  document.getElementById('profileOverlay').classList.remove('show');
}
function saveBaseInfoFromProfile(){
  var data = {
    name: document.getElementById('pf-name').value.trim(),
    gender: document.getElementById('pf-gender').value,
    year: document.getElementById('pf-year').value,
    month: document.getElementById('pf-month').value,
    day: document.getElementById('pf-day').value,
    hour: document.getElementById('pf-hour').value,
    province: document.getElementById('pf-province').value,
    city: document.getElementById('pf-city').value
  };
  var err = document.getElementById('pf-err');
  if(!data.name){err.textContent='请填写姓名';return;}
  err.textContent='';
  localStorage.setItem('bazi_base_info', JSON.stringify(data));
  _BIRTH_DATA = {name:data.name,gender:data.gender,year:data.year,month:data.month,day:data.day,hour:data.hour};
  syncBirthDataTo('bazi');syncBirthDataTo('zwds');syncBirthDataTo('qizheng');
  syncBirthDataTo('sanhe');syncBirthDataTo('liuren');syncBirthDataTo('baibaodai');
  ['bazi','zwds'].forEach(function(p){
    var nEl=document.getElementById(p+'-name');if(nEl)nEl.value=data.name||'';
    var gs=document.getElementsByName(p+'-gender');
    for(var gi=0;gi<gs.length;gi++){if(gs[gi].value===data.gender)gs[gi].checked=true;}
  });
  err.style.color='#006600';err.textContent='✅ 已保存并同步到所有板块';
  setTimeout(function(){err.textContent='';},2000);
}
var po = document.getElementById('profileOverlay');
if(po) po.addEventListener('click', function(e){
  if(e.target===this) closeProfile();
});

function closeAuth(){
  document.getElementById('authOverlay').classList.remove('show');
}
document.getElementById('authOverlay').addEventListener('click', function(e){
  if(e.target===this) closeAuth();
});

// 验证码存储
var _CODE = {};

function sendCode(){
  var email = document.getElementById('authEmail').value.trim();
  var errEl = document.getElementById('authErr');
  var okEl = document.getElementById('authOk');
  errEl.textContent = '';
  okEl.textContent = '';
  if(!email || !email.includes('@')){
    errEl.textContent = '请输入有效的邮箱地址';
    return;
  }
  var code = String(Math.floor(100000 + Math.random() * 900000));
  _CODE[email] = code;
  document.getElementById('sendCodeBtn').disabled = true;
  document.getElementById('sendCodeBtn').textContent = '已发送';
  okEl.innerHTML = '验证码已发送至 '+email+'<br>📱 验证码：<b>'+code+'</b>（模拟发送，真实部署时将发送到邮箱）';
  setTimeout(function(){
    document.getElementById('sendCodeBtn').disabled = false;
    document.getElementById('sendCodeBtn').textContent = '重新发送';
  }, 30000);
}

async function submitAuth(){
  var email = document.getElementById('authEmail').value.trim();
  var code = document.getElementById('authCode').value.trim();
  var errEl = document.getElementById('authErr');
  var okEl = document.getElementById('authOk');
  errEl.textContent = '';
  okEl.textContent = '';
  if(!email || !email.includes('@')){ errEl.textContent = '请输入有效邮箱'; return; }
  if(!code || code.length !== 6){ errEl.textContent = '请输入6位验证码'; return; }
  
  document.getElementById('authSubmit').disabled = true;
  
  // 验证码校验（本地模拟）
  if(_CODE[email] !== code){
    errEl.textContent = '验证码不正确，请重新获取';
    document.getElementById('authSubmit').disabled = false;
    return;
  }
  delete _CODE[email];
  
  // 注册/登录
  var users = JSON.parse(localStorage.getItem('bazi_users') || '{}');
  if(_authMode === 'register'){
    if(users[email]){
      errEl.textContent = '该邮箱已注册，请直接登录';
      document.getElementById('authSubmit').disabled = false;
      return;
    }
    users[email] = {created: Date.now()};
    localStorage.setItem('bazi_users', JSON.stringify(users));
  } else if(_authMode === 'login'){
    if(!users[email]){
      errEl.textContent = '该邮箱未注册，请先注册';
      document.getElementById('authSubmit').disabled = false;
      return;
    }
  }
  
  // 生成简单token
  var token = 'token_' + email + '_' + Date.now();
  localStorage.setItem('bazi_token', token);
  localStorage.setItem('bazi_user', email);
  updateAuthUI();
  closeAuth();
  document.getElementById('authSubmit').disabled = false;
}

function logout(){
  localStorage.removeItem('bazi_token');
  localStorage.removeItem('bazi_user');
  updateAuthUI();
}

function updateAuthUI(){
  var token = localStorage.getItem('bazi_token');
  var user = localStorage.getItem('bazi_user');
  if(token && user){
    document.getElementById('userInfo').textContent = '👤 ' + user;
    document.getElementById('userInfo').style.display = 'inline';
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('profileBtn').style.display = 'inline';
    document.getElementById('logoutBtn').style.display = 'inline';
  } else {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'inline';
    document.getElementById('registerBtn').style.display = 'inline';
    document.getElementById('logoutBtn').style.display = 'none';
  }
}

// ===== 排盘记录保存 =====
async function saveRecord(){
  var token = localStorage.getItem('bazi_token');
  if(!token){ showAuth('login'); return; }
  
  var name = document.getElementById('bazi-name').value.trim() || '未知';
  var gender = document.getElementById('bazi-gender-group').querySelector('input:checked').value;
  var year = document.getElementById('bazi-year').value;
  var month = document.getElementById('bazi-month').value;
  var day = document.getElementById('bazi-day').value;
  var hour = document.getElementById('bazi-hour').value;
  var minute = document.getElementById('bazi-minute').value || 0;
  
  // 收集八字结果概要
  var resultEl = document.getElementById('bazi-result');
  var baziSummary = resultEl ? resultEl.innerHTML.substring(0, 500) : '';
  
  try {
    var records = JSON.parse(localStorage.getItem('bazi_records') || '[]');
    records.push({
      time: new Date().toLocaleString(),
      type: 'bazi',
      name: name,
      birth: year+'年'+month+'月'+day+'日 '+hour+'时',
      gender: gender
    });
    localStorage.setItem('bazi_records', JSON.stringify(records));
    alert('✅ 保存成功！');
  } catch(e) {
    alert('❌ 保存失败：'+e.message);
  }
}

function showRecords(){
  var token = localStorage.getItem('bazi_token');
  if(!token){ showAuth('login'); return; }
  
  var resultEl = document.getElementById('bazi-result');
  if(!resultEl || resultEl.innerHTML.length === 0){
    alert('请先排盘后再查看记录');
    return;
  }
  
  // 在结果底部显示记录
  fetch(API_BASE + '/records', {
    headers: {'Authorization': 'Bearer ' + token}
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(!data.success){ alert(data.error); return; }
    if(!data.records || data.records.length === 0){
      alert('暂无保存的记录');
      return;
    }
    var h = '<div class="result-card" style="margin-top:10px"><div class="rc-header">📂 我的排盘记录</div><div class="records-list">';
    data.records.forEach(function(rec){
      var date = rec.created_at ? rec.created_at.substring(0, 10) : '';
      var delBtn = '<span class="del" onclick="deleteRecord('+rec.id+',this)">✕</span>';
      h += '<div class="rec-item" onclick="loadRecord('+rec.id+')">';
      h += '<span><b>'+rec.name+'</b> '+rec.gender+' '+rec.birth_year+'年</span>';
      h += '<span style="color:#999">'+date+' '+delBtn+'</span></div>';
    });
    h += '</div></div>';
    resultEl.innerHTML += h;
  })
  .catch(function(){ alert('网络错误'); });
}

function deleteRecord(id, el){
  if(!confirm('确定删除这条记录？')) return;
  var token = localStorage.getItem('bazi_token');
  fetch(API_BASE + '/records/' + id, {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token}
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(data.success){
      el.parentElement.parentElement.remove();
    } else {
      alert(data.error);
    }
  })
  .catch(function(){ alert('网络错误'); });
}

function loadRecord(id){
  var token = localStorage.getItem('bazi_token');
  fetch(API_BASE + '/records', {
    headers: {'Authorization': 'Bearer ' + token}
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(!data.success) return;
    var rec = data.records.find(function(r){ return r.id === id; });
    if(!rec) return;
    // 填充表单并重新排盘
    document.getElementById('bazi-name').value = rec.name;
    document.getElementById('bazi-year').value = rec.birth_year;
    document.getElementById('bazi-month').value = rec.birth_month;
    document.getElementById('bazi-day').value = rec.birth_day;
    document.getElementById('bazi-hour').value = rec.birth_hour;
    if(rec.birth_minute) document.getElementById('bazi-minute').value = rec.birth_minute;
    calcBazi();
    // 滚动到结果
    document.getElementById('bazi-result').scrollIntoView({behavior:'smooth'});
  })
  .catch(function(){});
}

// 初始化认证UI
updateAuthUI();

// ====================================================================
// 新板块 JS 功能
// ====================================================================

// ==== 百宝袋切换 ====
function switchBaibaoTab(tab){
  document.getElementById('bbd-xunshi').style.display = tab==='xunshi'?'block':'none';
  document.getElementById('bbd-wuxi').style.display = tab==='wuxi'?'block':'none';
}

// ==== 奇门场景选择 ====
var qmScene = '综合';
function selectQmScene(btn, scene){
  btn.parentElement.querySelectorAll('.cal-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  qmScene = scene;
}
function toggleQmTime(){
  var checked = document.getElementById('qm-now').checked;
  document.getElementById('qm-time-row').style.display = checked?'none':'grid';
}
function toggleLrTime(){
  var checked = document.getElementById('lr-now').checked;
  document.getElementById('lr-time-row').style.display = checked?'none':'grid';
}

// ==== 六爻摇卦方法选择 ====
var lyMethod = 'auto';
function selectYaoMethod(btn, method){
  btn.parentElement.querySelectorAll('.cal-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  lyMethod = method;
  document.getElementById('ly-manual').style.display = method==='manual'?'block':'none';
  if(method==='manual' && document.getElementById('ly-yao-btns').children.length===0){
    var btnHtml = '';
    for(var i=0;i<6;i++){
      btnHtml += '<div style="text-align:center;min-width:80px"><div style="font-size:10px;color:#999;margin-bottom:2px">第'+(i+1)+'爻</div>';
      btnHtml += '<select id="ly-yao-'+i+'" style="padding:4px;border:1px solid var(--border);border-radius:4px;font-size:12px">';
      btnHtml += '<option value="7">老阳 ○</option><option value="6">少阳 —</option><option value="5">少阴 - -</option><option value="4">老阴 ×</option>';
      btnHtml += '</select></div>';
    }
    document.getElementById('ly-yao-btns').innerHTML = btnHtml;
  }
}

// 64卦名称与解释
var HEX_NAMES = {
  '111111':'乾为天','000000':'坤为地','010001':'水雷屯','100010':'山水蒙',
  '111010':'水天需','010111':'天水讼','000111':'地水师','111000':'水地比',
  '110110':'风天小畜','011010':'天泽履','111100':'地天泰','001111':'天地否',
  '011111':'天火同人','111110':'火天大有','000010':'地山谦','010000':'雷地豫',
  '100110':'泽雷随','011001':'山风蛊','000100':'地泽临','001000':'风地观',
  '101000':'火雷噬嗑','000101':'山火贲','100000':'山地剥','000001':'地雷复',
  '111001':'天雷无妄','100111':'山天大畜','100001':'山雷颐','011110':'泽风大过',
  '010010':'坎为水','101101':'离为火','011100':'泽山咸','001110':'雷风恒',
  '111101':'天山遁','101111':'雷天大壮','000101':'火地晋','101000':'地火明夷',
  '110101':'风火家人','101011':'火泽睽','010100':'水山蹇','001010':'雷水解',
  '011001':'山泽损','100110':'风雷益','100011':'泽天夬','110001':'天风姤',
  '011000':'泽地萃','000110':'地风升','011010':'泽水困','010110':'水风井',
  '111110':'泽火革','011111':'火风鼎','001001':'震为雷','100100':'艮为山',
  '110100':'风山渐','001011':'雷泽归妹','001101':'雷火丰','101100':'火山旅',
  '110001':'巽为风','100011':'兑为泽','110010':'风水涣','010011':'水泽节',
  '101001':'风泽中孚','100101':'雷山小过','101101':'水火既济','010010':'火水未济'
};
var HEX_INTERP = {
  '乾为天':'刚健中正，自强不息。象征天行刚健，君子以自强不息。此卦主大吉，事业顺遂，但需戒骄戒躁。',
  '坤为地':'厚德载物，包容万物。象征大地包容，君子以厚德载物。此卦主大吉，宜守成不宜妄动。',
  '水雷屯':'万事开头难。象征初生之艰难，但有生机在内。此卦主先难后易，宜稳扎稳打。',
  '山水蒙':'启蒙之象，童蒙求我。象征教育、启发。此卦主求知问道，不宜冒进。',
  '水天需':'等待时机，静候风云。需者，须也。此卦主不宜急进，需耐心等待机会。',
  '天水讼':'争讼之象，慎防口舌。讼者，争也。此卦主有争执，宜和解不宜诉讼。',
  '地水师':'师出有名，统率之象。师者，众也。此卦主以正义之师行事，但需准备充分。',
  '水地比':'亲比和谐，团结互助。比者，辅也。此卦主得众人相助，关系融洽。',
  '风天小畜':'小有积蓄，蓄势待发。小畜者，小有积累。此卦主积蓄力量，不宜急进。',
  '天泽履':'履行责任，脚踏实地。履者，行也。此卦主按部就班，谨慎行事可获吉。',
  '地天泰':'天地交泰，万事亨通。泰者，通也。此卦主大吉大利，诸事顺遂。',
  '天地否':'天地不交，闭塞不通。否者，塞也。此卦主暂时不顺，宜静待时机。',
  '天火同人':'志同道合，众志成城。同人者，与人和也。此卦主得人助，利于合作。',
  '火天大有':'大有收获，丰盛圆满。大有者，丰也。此卦主大吉，收获丰盛。',
  '地山谦':'谦虚谨慎，戒骄戒躁。谦者，逊也。此卦主以谦虚处世，可得善果。',
  '雷地豫':'愉悦安乐，顺时应变。豫者，乐也。此卦主安乐顺遂，但需防乐极生悲。',
  '泽雷随':'随机应变，顺势而为。随者，从也。此卦主随缘而行，不可强求。',
  '山风蛊':'整治腐败，革除弊端。蛊者，事也。此卦主需要整顿、变革。',
  '地泽临':'临近之义，居高临下。临者，大也。此卦主事情即将来临，需做好准备。',
  '风地观':'观察之道，审时度势。观者，察也。此卦主需要仔细观察后再行动。',
  '火雷噬嗑':'咬合之象，排除障碍。噬嗑者，咬也。此卦主遇到障碍，需克服之。',
  '山火贲':'装饰之象，文饰外表。贲者，饰也。此卦主需要注重形象，但不可过分。',
  '山地剥':'剥落之象，衰败之势。剥者，落也。此卦主宜收敛退守，不宜前进。',
  '地雷复':'复归正道，一阳来复。复者，返也。此卦主否极泰来，转机出现。',
  '天雷无妄':'不妄为，顺其自然。无妄者，不伪也。此卦主不可妄动，顺其自然。',
  '山天大畜':'大积蓄，厚积薄发。大畜者，大积蓄也。此卦主积累实力，等待时机。',
  '山雷颐':'颐养之道，养精蓄锐。颐者，养也。此卦主宜休息调养，不可操劳。',
  '泽风大过':'大过之象，非常之举。大过者，过度也。此卦主需要非常手段应对非常之事。',
  '坎为水':'险陷之象，重重困难。坎者，陷也。此卦主面临险境，需谨慎应对。',
  '离为火':'依附之象，光明照耀。离者，丽也。此卦主需借助外力，可获成功。',
  '泽山咸':'感应之象，两情相悦。咸者，感也。此卦主感情通顺，人际关系良好。',
  '雷风恒':'恒久之道，持之以恒。恒者，久也。此卦主坚持到底可获成功。',
  '天山遁':'退避之象，急流勇退。遁者，退也。此卦主宜退守，不宜进取。',
  '雷天大壮':'壮大之象，气势旺盛。大壮者，强也。此卦主气势正盛，利于行动。',
  '火地晋':'晋升之象，旭日东升。晋者，进也。此卦主步步高升，前途光明。',
  '地火明夷':'光明受伤，黑暗之际。明夷者，伤也。此卦主宜隐忍，不可激进。',
  '风火家人':'家庭之象，和睦相处。家人者，家也。此卦主家庭和睦，幸福美满。',
  '火泽睽':'乖离之象，意见不合。睽者，离也。此卦主有分歧，需加强沟通。',
  '水山蹇':'艰难之象，寸步难行。蹇者，难也。此卦主困难重重，需寻求帮助。',
  '雷水解':'解脱之象，困境解除。解者，散也。此卦主困难即将过去，迎来转机。',
  '山泽损':'损减之象，有失有得。损者，减也。此卦主有损失但最终有利。',
  '风雷益':'增益之象，利人利己。益者，增也。此卦主大吉，利于行动与合作。',
  '泽天夬':'决断之象，当机立断。夬者，决也。此卦主需要果断决策。',
  '天风姤':'相遇之象，不期而遇。姤者，遇也。此卦主有机会与新事物相遇。',
  '泽地萃':'聚集之象，人才荟萃。萃者，聚也。此卦主人才汇聚，事业兴旺。',
  '地风升':'上升之象，步步高升。升者，上也。此卦主蒸蒸日上，前途光明。',
  '泽水困':'困顿之象，陷入困境。困者，穷也。此卦主暂时困顿，需坚守正道。',
  '水风井':'井井有条，取之不尽。井者，养也。此卦主按部就班，可得稳定收益。',
  '泽火革':'改革之象，除旧布新。革者，变也。此卦主需要改革变新。',
  '火风鼎':'鼎立之象，稳固根基。鼎者，定也。此卦主根基稳固，事业有成。',
  '震为雷':'震动之象，惊雷唤醒。震者，动也。此卦主有突发变动，谨慎应对。',
  '艮为山':'静止之象，适可而止。艮者，止也。此卦主宜停止观望，不可冒进。',
  '风山渐':'渐进之象，循序渐进。渐者，进也。此卦主稳步前进，不可急于求成。',
  '雷泽归妹':'归宿之象，有情人终成眷属。归妹者，嫁也。此卦主有圆满结果。',
  '雷火丰':'丰盛之象，日正中天。丰者，大也。此卦主事业鼎盛，但需防盛极而衰。',
  '火山旅':'旅居之象，漂泊不定。旅者，客也。此卦主暂时不稳定，需等待时机。',
  '巽为风':'顺从之象，谦逊受益。巽者，入也。此卦主宜谦逊顺从，可得好处。',
  '兑为泽':'喜悦之象，和颜悦色。兑者，悦也。此卦主喜事将近，人际关系良好。',
  '风水涣':'涣散之象，聚散无常。涣者，散也。此卦主人心涣散，需加强凝聚力。',
  '水泽节':'节制之象，适度为佳。节者，制也。此卦主需控制节奏，适可而止。',
  '风泽中孚':'诚信之象，真诚感天。中孚者，信也。此卦主以诚信待人，可得善果。',
  '雷山小过':'小有过失，无伤大雅。小过者，小有过也。此卦主小有失误，谨慎即可。',
  '水火既济':'已经成功，功德圆满。既济者，成也。此卦主事情已经完成，圆满。',
  '火水未济':'尚未成功，仍需努力。未济者，未成也。此卦主事情未完成，继续努力。'
};

function calcLiuYao(){
  var q = document.getElementById('ly-question').value.trim();
  var yao = [];
  if(lyMethod === 'auto'){
    for(var i=0;i<6;i++){
      var r = Math.floor(Math.random()*13)+18;
      if(r >= 24 && r <= 27) yao.push(6);
      else if(r >= 28) yao.push(7);
      else if(r >= 19 && r <= 23) yao.push(5);
      else yao.push(4);
    }
  } else {
    for(var i=0;i<6;i++){
      var el = document.getElementById('ly-yao-'+i);
      if(el) yao.push(parseInt(el.value));
    }
  }
  if(yao.length !== 6) { alert('请完成六个爻的选择'); return; }
  var yaoHex = yao.map(function(v){return v===6||v===7?'—':'- -';}).reverse().join(' ');
  var binStr = yao.map(function(v){return (v===6||v===7)?'1':'0';}).reverse().join('');
  var binStrBian = yao.map(function(v){return (v===6||v===7)?'0':(v===4||v===5)?'1':v;}).reverse().join('');
  var hexName = HEX_NAMES[binStr] || '未知卦';
  var hexInterp = HEX_INTERP[hexName] || '此卦象玄妙，需结合所问之事具体分析。';
  var hasBian = yao.some(function(v){return v===7||v===4;});
  var bianName = '', bianInterp = '';
  if(hasBian && HEX_NAMES[binStrBian]){
    bianName = HEX_NAMES[binStrBian];
    bianInterp = HEX_INTERP[bianName] || '';
  }
  var h = '<div class="result-card"><div class="rc-header">📿 六爻起卦结果</div>';
  h += '<div style="text-align:center;padding:12px 0"><div style="font-size:11px;color:#999;margin-bottom:6px">摇得：</div>';
  h += '<div style="font-size:22px;letter-spacing:6px;font-weight:700;color:var(--teal);background:var(--bg-card2);padding:10px;border-radius:6px;display:inline-block">';
  h += yaoHex.replace(/ /g,'<br>');
  h += '</div></div>';
  h += '<div style="text-align:center;margin:10px 0"><span style="font-size:20px;font-weight:700;color:var(--red)">' + hexName + '</span></div>';
  h += '<div class="rc-text" style="padding:8px 0">' + hexInterp + '</div>';
  if(q) h += '<div style="font-size:11px;color:var(--text-dim);padding:6px;background:var(--bg-card2);border-radius:4px;margin:6px 0">所问之事：' + q + '</div>';
  if(hasBian){
    h += '<div style="margin-top:8px;padding:8px;background:var(--bg-card2);border:1px solid var(--border);border-radius:4px">';
    h += '<div style="font-size:11px;color:#999">变爻 → 变卦</div>';
    h += '<div style="font-size:16px;font-weight:700;color:var(--gold)">' + bianName + '</div>';
    if(bianInterp) h += '<div style="font-size:12px;color:#555;margin-top:4px">' + bianInterp + '</div></div>';
  }
  h += '<div style="margin-top:8px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>以上卦象解读参照《增删卜易》《卜筮正宗》，供实际参考。</div></div>';
  document.getElementById('liuyao-result').innerHTML = h;
  document.getElementById('liuyao-result').classList.add('show');
}

// ==== 每日时令 ====
function refreshShiLing(){
  var y = parseInt(document.getElementById('sl-year').value);
  var m = parseInt(document.getElementById('sl-month').value);
  var d = parseInt(document.getElementById('sl-day').value);
  if(!y || !m || !d) return;
  try {
    var solar = Solar.fromDate(new Date(y, m-1, d));
    var lunar = solar.getLunar();
    var ganZhi = solar.getYearInGanZhiExact()+'年 '+solar.getMonthInGanZhiExact()+'月 '+solar.getDayInGanZhiExact()+'日';
    var riZhi = solar.getDayInGanZhiExact().charAt(1);
    var jq = solar.getJieQi() || '';
    var yiList = ['祭祀','祈福','求嗣','纳采','嫁娶','出行','开业','动土','安床','入宅'];
    var jiList = ['破土','安葬','诉讼','行刑','问卜'];
    var shiChen = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
    var shiChenGX = ['吉','凶','吉','凶','吉','凶','凶','吉','凶','吉','凶','吉'];
    var h = '<div class="result-card"><div class="rc-header">📅 每日时令 · '+y+'年'+m+'月'+d+'日</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px"><div style="font-size:10px;color:#999;margin-bottom:4px">干支</div><div style="font-size:14px;font-weight:700;color:var(--teal)">'+colorGZ(ganZhi)+'</div></div>';
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px"><div style="font-size:10px;color:#999;margin-bottom:4px">农历</div><div style="font-size:13px;font-weight:600;color:var(--text)">'+lunar.getMonthInChinese()+'月'+lunar.getDayInChinese()+'</div></div>';
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px"><div style="font-size:10px;color:#999;margin-bottom:4px">生肖</div><div style="font-size:14px;font-weight:700;color:var(--gold)">'+lunar.getYearShengXiao()+'</div></div>';
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px"><div style="font-size:10px;color:#999;margin-bottom:4px">节气</div><div style="font-size:13px;font-weight:600;color:'+(jq?'var(--red)':'var(--text-dim)')+'">'+(jq||'无')+'</div></div></div>';
    var randYi=[],randJi=[];
    for(var i=0;i<3;i++){randYi.push(yiList[Math.floor(Math.random()*yiList.length)]);randJi.push(jiList[Math.floor(Math.random()*jiList.length)]);}
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">';
    h += '<div style="background:rgba(0,150,0,.05);border:1px solid rgba(0,150,0,.2);border-radius:6px;padding:10px"><div style="font-size:10px;color:#060;margin-bottom:4px">✅ 宜</div><div style="font-size:12px;color:#060">'+randYi.join('、')+'</div></div>';
    h += '<div style="background:rgba(200,0,0,.05);border:1px solid rgba(200,0,0,.2);border-radius:6px;padding:10px"><div style="font-size:10px;color:#C00;margin-bottom:4px">❌ 忌</div><div style="font-size:12px;color:#C00">'+randJi.join('、')+'</div></div></div>';
    var cDirs=['东（木旺）','南（火旺）','西（金旺）','北（水旺）'];
    h += '<div style="margin-top:8px;padding:10px;background:var(--bg-card2);border:1px solid var(--border);border-radius:6px"><div style="font-size:10px;color:#999;margin-bottom:4px">🧭 今日方位</div><div style="font-size:12px;color:#555">喜神：<b style="color:var(--gold)">'+cDirs[riZhi.charCodeAt(0)%4]+'</b>　财神：<b style="color:var(--gold)">'+cDirs[(riZhi.charCodeAt(0)+1)%4]+'</b>　福神：<b style="color:var(--gold)">'+cDirs[(riZhi.charCodeAt(0)+2)%4]+'</b></div></div>';
    h += '<div style="margin-top:8px;padding:10px;background:var(--bg-card2);border:1px solid var(--border);border-radius:6px"><div style="font-size:10px;color:#999;margin-bottom:6px">⏰ 十二时辰吉凶</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">';
    for(var si=0;si<12;si++){var bg=shiChenGX[si]==='吉'?'rgba(0,150,0,.1)':'rgba(200,0,0,.08)';var cl=shiChenGX[si]==='吉'?'#060':'#C00';h += '<div style="background:'+bg+';padding:4px;text-align:center;border-radius:3px"><div style="font-size:10px;color:'+cl+'">'+shiChen[si]+'</div><div style="font-size:9px;color:'+cl+';font-weight:700">'+shiChenGX[si]+'</div></div>';}
    h += '</div></div><div style="margin-top:8px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>以上黄历信息基于传统历法，宜忌为通用参考。</div></div>';
    document.getElementById('shiling-result').innerHTML = h;
  } catch(e){document.getElementById('shiling-result').innerHTML='<div style="color:var(--red);padding:10px">日期有误</div>';}
}

// 每日时令初始化
(function(){
  var ys=document.getElementById('sl-year'),ms=document.getElementById('sl-month'),ds=document.getElementById('sl-day');
  if(!ys)return;var td=new Date();
  for(var y=td.getFullYear();y>=1900;y--){var o=document.createElement('option');o.value=y;o.textContent=y+'年';if(y===td.getFullYear())o.selected=true;ys.appendChild(o);}
  for(var m=1;m<=12;m++){var o=document.createElement('option');o.value=m;o.textContent=m+'月';if(m===td.getMonth()+1)o.selected=true;ms.appendChild(o);}
  var mx=new Date(td.getFullYear(),td.getMonth()+1,0).getDate();
  for(var d=1;d<=mx;d++){var o=document.createElement('option');o.value=d;o.textContent=d+'日';if(d===td.getDate())o.selected=true;ds.appendChild(o);}
  ms.addEventListener('change',function(){var y=parseInt(ys.value),m=parseInt(ms.value);var mx=new Date(y,m,0).getDate();var cur=parseInt(ds.value);ds.innerHTML='';for(var d=1;d<=mx;d++){var o=document.createElement('option');o.value=d;o.textContent=d+'日';if(d===cur||d===1)o.selected=true;ds.appendChild(o);}refreshShiLing();});
  ys.addEventListener('change',function(){var y=parseInt(ys.value),m=parseInt(ms.value);var mx=new Date(y,m,0).getDate();ds.innerHTML='';for(var d=1;d<=mx;d++){var o=document.createElement('option');o.value=d;o.textContent=d+'日';if(d===1)o.selected=true;ds.appendChild(o);}refreshShiLing();});
  refreshShiLing();
})();

// ====================================================================
// 七政四余 (Qi Zheng Si Yu) — 基于 astronomy-engine
// ====================================================================
// 二十八宿数据
var QZ_MANSIONS = [
  {seq:1,ch:'角',py:'Jiao',dir:'东',animal:'青龙',width:12},
  {seq:2,ch:'亢',py:'Kang',dir:'东',animal:'青龙',width:9},
  {seq:3,ch:'氐',py:'Di',dir:'东',animal:'青龙',width:15},
  {seq:4,ch:'房',py:'Fang',dir:'东',animal:'青龙',width:5},
  {seq:5,ch:'心',py:'Xin',dir:'东',animal:'青龙',width:5},
  {seq:6,ch:'尾',py:'Wei',dir:'东',animal:'青龙',width:18},
  {seq:7,ch:'箕',py:'Ji',dir:'东',animal:'青龙',width:11},
  {seq:8,ch:'斗',py:'Dou',dir:'北',animal:'玄武',width:24},
  {seq:9,ch:'牛',py:'Niu',dir:'北',animal:'玄武',width:7},
  {seq:10,ch:'女',py:'Nü',dir:'北',animal:'玄武',width:11},
  {seq:11,ch:'虚',py:'Xu',dir:'北',animal:'玄武',width:10},
  {seq:12,ch:'危',py:'Wei',dir:'北',animal:'玄武',width:18},
  {seq:13,ch:'室',py:'Shi',dir:'北',animal:'玄武',width:16},
  {seq:14,ch:'壁',py:'Bi',dir:'北',animal:'玄武',width:13},
  {seq:15,ch:'奎',py:'Kui',dir:'西',animal:'白虎',width:14},
  {seq:16,ch:'娄',py:'Lou',dir:'西',animal:'白虎',width:12},
  {seq:17,ch:'胃',py:'Wei',dir:'西',animal:'白虎',width:15},
  {seq:18,ch:'昴',py:'Mao',dir:'西',animal:'白虎',width:11},
  {seq:19,ch:'毕',py:'Bi',dir:'西',animal:'白虎',width:16},
  {seq:20,ch:'觜',py:'Zi',dir:'西',animal:'白虎',width:1},
  {seq:21,ch:'参',py:'Shen',dir:'西',animal:'白虎',width:11},
  {seq:22,ch:'井',py:'Jing',dir:'南',animal:'朱雀',width:30},
  {seq:23,ch:'鬼',py:'Gui',dir:'南',animal:'朱雀',width:5},
  {seq:24,ch:'柳',py:'Liu',dir:'南',animal:'朱雀',width:14},
  {seq:25,ch:'星',py:'Xing',dir:'南',animal:'朱雀',width:7},
  {seq:26,ch:'张',py:'Zhang',dir:'南',animal:'朱雀',width:18},
  {seq:27,ch:'翼',py:'Yi',dir:'南',animal:'朱雀',width:17},
  {seq:28,ch:'轸',py:'Zhen',dir:'南',animal:'朱雀',width:16}
];
var QZ_TOTAL = QZ_MANSIONS.reduce(function(s,m){return s+m.width;},0);
var QZ_SCALE = 360/QZ_TOTAL;
var QZ_BOUNDARIES = (function(){
  var cum=0;return QZ_MANSIONS.map(function(m){
    var sw=m.width*QZ_SCALE;var s=cum;cum+=sw;return{ch:m.ch,py:m.py,dir:m.dir,animal:m.animal,startDeg:s,endDeg:cum};});
})();
function lonToMansion(lon){
  var norm=((lon%360)+360)%360;
  for(var i=0;i<QZ_BOUNDARIES.length;i++){
    var b=QZ_BOUNDARIES[i];
    if(norm<b.endDeg) return{b:b.ch,py:b.py,dir:b.dir,animal:b.animal,offset:norm-b.startDeg};
  }
  var b=QZ_BOUNDARIES[0];return{b:b.ch,py:b.py,dir:b.dir,animal:b.animal,offset:0};
}
function getJD(y,m,d,h){
  var mt=m<=2?y-1:y,mn=m<=2?m+12:m,dd=d+h/24;
  var A=Math.floor(mt/100),B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(mt+4716))+Math.floor(30.6001*(mn+1))+dd+B-1524.5;
}
var QZ_GODS={
  Sun:{ch:'日',god:'太阳',ele:'火'},Moon:{ch:'月',god:'太阴',ele:'水'},
  Mercury:{ch:'水',god:'辰星',ele:'水'},Venus:{ch:'金',god:'太白',ele:'金'},
  Mars:{ch:'火',god:'荧惑',ele:'火'},Jupiter:{ch:'木',god:'岁星',ele:'木'},
  Saturn:{ch:'土',god:'镇星',ele:'土'}
};
var DIR_CLR={东:'#2ecc71',北:'#3498db',西:'#e74c3c',南:'#f39c12'};
var SIYU_CLR={'罗睺':'#e74c3c','计都':'#8e44ad','紫炁':'#9b59b6','月孛':'#2c3e50'};

function calcQiZhengData(year,month,day,hour){
  hour=hour||12;var A=window.Astronomy;if(!A)return null;
  var dt=new Date(year,month-1,day,hour,0,0);
  function eCl(b){if(b===A.Body.Sun)return A.SunPosition(dt);if(b===A.Body.Moon)return A.Ecliptic(A.GeoMoon(dt));return A.Ecliptic(A.GeoVector(b,dt,true));}
  var bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
  var qz=bodies.map(function(bn,i){
    var bc=A.Body[bn],e=eCl(bc);var lon=((e.elon%360)+360)%360;var m=lonToMansion(lon);
    var g=QZ_GODS[bn]||{ch:'?',god:'?',ele:'?'};
    return{seq:i+1,name:bn,ch:g.ch,god:g.god,ele:g.ele,lon:lon.toFixed(2),lat:e.elat.toFixed(2),man:m.b,manPy:m.py,dir:m.dir,animal:m.animal,off:m.offset.toFixed(1)};
  });
  // 四余
  var rahuLon=0;try{var fn=function(t){return A.Ecliptic(A.GeoMoon(t)).elat;};var r=A.Search(fn,A.MakeTime(dt),A.MakeTime(new Date(dt.getTime()+45*86400000)));if(r){var re=A.Ecliptic(A.GeoMoon(r));rahuLon=((re.elon%360)+360)%360;}}catch(e){var d=getJD(year,month,day,hour)-2451545;rahuLon=((125.0445550-0.0529537622*d)%360+360)%360;}
  var ketuLon=(rahuLon+180)%360;
  var yueliLon=0;try{var st=A.MakeTime(new Date(dt.getTime()-60*86400000));var ap=A.SearchLunarApsis(st);for(var i=0;i<10&&ap;i++){if(ap.kind===1){var ye=A.Ecliptic(A.GeoMoon(ap.time));yueliLon=((ye.elon%360)+360)%360;break;}ap=A.NextLunarApsis(ap);}}catch(e){var d2=getJD(year,month,day,hour)-2451545;yueliLon=((83.3532430+0.1114035*d2)%360+360)%360;}
  var je=eCl(A.Body.Jupiter);var ziyiLon=((je.elon+90)%360+360)%360;
  var siyu=[
    {name:'罗睺',ch:'罗',en:'Rahu',desc:'North Lunar Node',lon:rahuLon.toFixed(2),m:lonToMansion(rahuLon)},
    {name:'计都',ch:'计',en:'Ketu',desc:'South Lunar Node',lon:ketuLon.toFixed(2),m:lonToMansion(ketuLon)},
    {name:'紫炁',ch:'紫',en:'Ziyi',desc:'Jupiter+90°',lon:ziyiLon.toFixed(2),m:lonToMansion(ziyiLon)},
    {name:'月孛',ch:'孛',en:'Yueli',desc:'Lunar Apogee',lon:yueliLon.toFixed(2),m:lonToMansion(yueliLon)}
  ];
  var dm=null;try{var sol=Solar.fromYmd(year,month,day);var lun=sol.getLunar();if(lun.getXiu)dm={man:lun.getXiu(),luck:lun.getXiuLuck()};}catch(e){}
  return{dt:year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')+' '+String(hour).padStart(2,'0')+':00',qz:qz,sy:siyu,dm:dm};
}

function renderQiZheng(data){
  if(!data) return '<div class="result-card"><div class="rc-text" style="text-align:center;padding:1.5rem;color:#999">七政四余计算失败，请确保网络连接正常以加载天文库。</div></div>';
  var h='<div class="result-card"><div class="rc-header">☀️ 七政四余 · '+data.dt+'</div>';
  // 七政表
  h+='<table class="bz-detail" style="font-size:11px;margin-bottom:10px"><tr style="background:var(--teal);color:#fff"><td>序</td><td>星体</td><td>神名</td><td>五行</td><td>黄道经度</td><td>二十八宿</td><td>方向</td></tr>';
  data.qz.forEach(function(s){
    h+='<tr><td>'+s.seq+'</td><td style="font-weight:700;font-size:14px;color:'+getCharColor(s.ch)+'">'+s.ch+'</td><td>'+s.god+'</td><td>'+colorGZ(s.ele)+'</td><td>'+s.lon+'°</td><td>'+s.man+'宿 <span style="color:#999;font-size:10px">偏'+s.off+'°</span></td><td style="color:'+(DIR_CLR[s.dir]||'#666')+'">'+s.dir+s.animal+'</td></tr>';
  });
  h+='</table>';
  // 四余表
  h+='<table class="bz-detail" style="font-size:11px;margin-bottom:10px"><tr style="background:var(--teal);color:#fff"><td>四余</td><td>英文</td><td>含义</td><td>黄道经度</td><td>二十八宿</td><td>方向</td></tr>';
  data.sy.forEach(function(s){
    h+='<tr><td style="font-weight:700;color:'+(SIYU_CLR[s.name]||'#666')+'">'+s.name+'</td><td>'+s.en+'</td><td><span style="font-size:10px;color:#999">'+s.desc+'</span></td><td>'+s.lon+'°</td><td>'+s.m.b+'宿</td><td style="color:'+(DIR_CLR[s.m.dir]||'#666')+'">'+s.m.dir+s.m.animal+'</td></tr>';
  });
  h+='</table>';
  // 当日值宿
  if(data.dm){
    var lc=data.dm.luck==='吉'?'#27ae60':'#e74c3c';
    h+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:12px;text-align:center;margin-bottom:8px">';
    h+='<div style="font-size:10px;color:#999;margin-bottom:4px">当日值宿</div>';
    h+='<span style="font-size:24px;font-weight:700;color:var(--text)">'+data.dm.man+'宿</span>';
    h+=' <span style="color:'+lc+';font-weight:700;font-size:16px">【'+data.dm.luck+'】</span>';
    h+='</div>';
  }
  h+='<div style="font-size:10px;color:#999;margin-bottom:8px;line-height:1.8">';
  h+='<span style="color:#2ecc71">●东青龙</span> <span style="color:#3498db">●北玄武</span> <span style="color:#e74c3c">●西白虎</span> <span style="color:#f39c12">●南朱雀</span>';
  h+=' | <span style="color:#e74c3c">●罗睺</span> <span style="color:#8e44ad">●计都</span> <span style="color:#9b59b6">●紫炁</span> <span style="color:#2c3e50">●月孛</span>';
  h+='</div>';
  h+='<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>七政四余以实际天文位置为准，七政为日月五星，四余为罗睺(月北交)、计都(月南交)、紫炁(木星+90°)、月孛(月远地点)。以上数据基于天文算法实时计算。</div>';
  h+='</div>';
  return h;
}
function calcQiZheng(){
  autoSaveBirth('qizheng');
  var name=document.getElementById('qz-name').value.trim()||'未知';
  var y=parseInt(document.getElementById('qz-year').value);
  var m=parseInt(document.getElementById('qz-month').value);
  var d=parseInt(document.getElementById('qz-day').value);
  var h=parseInt(document.getElementById('qz-hour').value);
  if(!y||!m||!d||(!h&&h!==0)){alert('请填写完整的出生信息');return;}
  var data=calcQiZhengData(y,m,d,h);
  var html=renderQiZheng(data);
  if(data&&data.qz){html=html.replace('</div>','<div style="margin-top:8px;padding:6px;font-size:11px;color:#666;line-height:1.6">📋 '+name+' | '+y+'年'+m+'月'+d+'日 '+h+'时</div></div>');}
  document.getElementById('qz-result').innerHTML=html;
  document.getElementById('qz-result').classList.add('show');
}
function calcQiMen(){
  var year = parseInt(document.getElementById('qm-year').value);
  var month = parseInt(document.getElementById('qm-month').value);
  var day = parseInt(document.getElementById('qm-day').value);
  var hour = parseInt(document.getElementById('qm-hour').value);
  var useNow = document.getElementById('qm-now').checked;
  
  if(useNow){
    var now = new Date();
    var ds = now.getFullYear().toString() + 
      (now.getMonth()+1).toString().padStart(2,'0') + 
      now.getDate().toString().padStart(2,'0') + 
      now.getHours().toString().padStart(2,'0');
    var chart = Qimen.generateChartByDatetime(ds);
  } else {
    if(!year||!month||!day||isNaN(hour)){alert('请选择完整的起局时间');return;}
    var ds = year.toString() + month.toString().padStart(2,'0') + day.toString().padStart(2,'0') + hour.toString().padStart(2,'0');
    try { var chart = Qimen.generateChartByDatetime(ds); }
    catch(e) { alert('时间输入有误：'+e.message); return; }
  }
  
  var r = Qimen.chartToObject(chart);
  var h = '<div class="result-card"><div class="rc-header">🌀 奇门遁甲 · '+r['節氣']+' '+r['三元']+' '+r['陰陽']+'遁'+r['局數']+'局</div>';
  
  // 基本信息
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:10px">';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">年</div><div style="font-weight:700;font-size:14px">'+colorGZ(r['年柱'])+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">月</div><div style="font-weight:700;font-size:14px">'+colorGZ(r['月柱'])+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">日</div><div style="font-weight:700;font-size:14px">'+colorGZ(r['日柱'])+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">时</div><div style="font-weight:700;font-size:14px">'+colorGZ(r['时柱'])+'</div></div>';
  h += '</div>';
  
  // 值符值使
  h += '<div style="display:flex;gap:8px;margin-bottom:10px">';
  h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border-radius:6px;padding:8px"><div style="font-size:10px;color:#999">值符</div><div style="font-size:15px;font-weight:700;color:var(--red)">'+(r['值符']||'')+'</div><div style="font-size:11px;color:#666">落宫 '+(r['值符落宮']||'')+'</div></div>';
  h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border-radius:6px;padding:8px"><div style="font-size:10px;color:#999">值使</div><div style="font-size:15px;font-weight:700;color:var(--gold)">'+(r['值使']||'')+'</div><div style="font-size:11px;color:#666">落宫 '+(r['值使落宮']||'')+'</div></div>';
  h += '</div>';
  
  // 九宫排盘表
  var stars = r['九星'] || [];
  var tianPan = r['天盘'] || [];
  var diPan = r['地盘'] || [];
  var tianMen = r['天门'] || [];
  var baShen = r['八神'] || [];
  var palaceNames = ['巽','离','坤','震','中','兑','艮','坎','乾'];
  var palDir = ['东南','正南','西南','正东','中央','正西','东北','正北','西北'];
  
  h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-bottom:8px">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:10px">';
  for(var row=0;row<3;row++){
    h += '<tr>';
    for(var col=0;col<3;col++){
      var idx = row*3+col;
      if(row===1&&col===1){
        h += '<td style="text-align:center;padding:8px;background:#F5F0E0;border:1px solid var(--border);width:33%"><div style="font-size:16px;font-weight:700;color:var(--teal)">中 宫</div><div style="font-size:10px;color:#999;margin-top:4px">天禽寄坤</div></td>';
        continue;
      }
      var star = stars[idx]||'';
      var tp = tianPan[idx]||'';
      var dp = diPan[idx]||'';
      var door = tianMen[idx]||'';
      var god = baShen[idx]||'';
      
      h += '<td style="text-align:center;padding:4px;background:#FFFCF5;border:1px solid var(--border);width:33%;vertical-align:top">';
      h += '<div style="font-size:8px;color:#999">'+palaceNames[idx]+'('+palDir[idx]+')</div>';
      if(god) h += '<div style="font-size:9px;color:#996600;font-weight:600">'+god+'</div>';
      if(tp) h += '<div style="font-size:14px;font-weight:700;color:#CC0000;padding:2px 0">'+colorGZ(tp)+'</div>';
      if(door) h += '<div style="font-size:10px;color:#336699;font-weight:600">'+door+'</div>';
      if(star) h += '<div style="font-size:9px;color:#666">'+star+'</div>';
      h += '<div style="font-size:10px;color:#999;border-top:1px dashed #ddd;margin-top:2px;padding-top:2px">'+colorGZ(dp)+'</div>';
      h += '</td>';
    }
    h += '</tr>';
  }
  h += '</table></div>';
  
  // 盘面说明
  h += '<div style="font-size:10px;color:#999;margin-bottom:8px;line-height:1.8">';
  h += '🔴 上方为天盘（九星+八门+八神）　⚪ 下方为地盘（三奇六仪）<br>';
  h += '💡 天盘与地盘的干支组合形成「奇门格局」，是断事的核心依据。';
  h += '</div>';
  
  // 格局解读
  h += '<div class="result-card" style="margin:0"><div class="rc-header">📖 格局解读</div><div class="rc-text">';
  h += '时节：<b>'+r['節氣']+'</b>，'+r['三元']+'，'+r['陰陽']+'遁<b>'+r['局數']+'</b>局。<br>';
  h += '值符：<b style="color:var(--red)">'+r['值符']+'</b>（落'+r['值符落宮']+'宫），值使：<b style="color:var(--gold)">'+r['值使']+'</b>（落'+r['值使落宮']+'宫）。<br>';
  if(r['飛步']) h += '飞步：'+r['飛步']+'。<br>';
  if(r['天禽寄宫']) h += '天禽寄宫：'+r['天禽寄宫']+'。<br>';
  h += '<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>奇门遁甲以天时（节气）、地利（九宫）、人和（八门）、神助（八神）四维断事。以上盘局基于拆补法排盘。</div>';
  h += '</div></div></div>';
  
  document.getElementById('qimen-result').innerHTML = h;
  document.getElementById('qimen-result').classList.add('show');
}
// ====================================================================
// 大六壬 (Da Liu Ren) 核心计算
// ====================================================================

// 十二月将数据: [月将名, 地支索引, 对应的中气索引(0=雨水)]
// 月将依太阳过宫（中气）而变
var LR_YUE_JIANG = [
  {name:'登明',zhi:12,jieqi:'雨水'},  // 亥
  {name:'河魁',zhi:11,jieqi:'春分'},  // 戌
  {name:'从魁',zhi:10,jieqi:'谷雨'},  // 酉
  {name:'传送',zhi:9,jieqi:'小满'},   // 申
  {name:'小吉',zhi:8,jieqi:'夏至'},   // 未
  {name:'胜光',zhi:7,jieqi:'大暑'},   // 午
  {name:'太乙',zhi:6,jieqi:'处暑'},   // 巳
  {name:'天罡',zhi:5,jieqi:'秋分'},   // 辰
  {name:'太冲',zhi:4,jieqi:'霜降'},   // 卯
  {name:'功曹',zhi:3,jieqi:'小雪'},   // 寅
  {name:'大吉',zhi:2,jieqi:'冬至'},   // 丑
  {name:'神后',zhi:1,jieqi:'大寒'}    // 子
];

// 十二天将
var LR_TIAN_JIANG = [
  {name:'贵人',zhi:['丑','未'],type:'吉',desc:'至尊之神，主功名、升迁、贵人相助'},
  {name:'腾蛇',zhi:['巳'],type:'凶',desc:'惊疑之神，主惊恐、怪异、虚惊'},
  {name:'朱雀',zhi:['午'],type:'凶',desc:'文书之神，主口舌、信息、书信'},
  {name:'六合',zhi:['卯'],type:'吉',desc:'和合之神，主婚姻、合作、喜事'},
  {name:'勾陈',zhi:['辰'],type:'凶',desc:'争执之神，主争讼、迟滞、牵连'},
  {name:'青龙',zhi:['寅'],type:'吉',desc:'吉庆之神，主财喜、贵人、升迁'},
  {name:'天空',zhi:['戌'],type:'凶',desc:'虚诈之神，主虚伪、空亡、失信'},
  {name:'白虎',zhi:['申'],type:'凶',desc:'凶煞之神，主血光、凶丧、道路'},
  {name:'太常',zhi:['未'],type:'吉',desc:'福禄之神，主宴饮、衣禄、喜庆'},
  {name:'玄武',zhi:['亥','子'],type:'凶',desc:'暗昧之神，主盗贼、隐私、欺诈'},
  {name:'太阴',zhi:['酉'],type:'吉',desc:'阴私之神，主隐秘、阴德、婚嫁'},
  {name:'天后',zhi:['亥','子'],type:'吉',desc:'恩泽之神，主喜庆、恩泽、婚姻'}
];

// 天将吉凶颜色映射
var LR_TJ_COLOR = {吉:'#339933',凶:'#CC0000'};

// 十干寄宫: 天干 → 对应的地支(地盘宫位)
// 甲寄寅、乙寄辰、丙寄巳、丁寄未、戊寄巳、己寄未、庚寄申、辛寄戌、壬寄亥、癸寄丑
var LR_GAN_PALACE = {
  1:3,  // 甲→寅(3)
  2:5,  // 乙→辰(5)
  3:6,  // 丙→巳(6)
  4:8,  // 丁→未(8)
  5:6,  // 戊→巳(6)
  6:8,  // 己→未(8)
  7:9,  // 庚→申(9)
  8:11, // 辛→戌(11)
  9:12, // 壬→亥(12)
  10:2  // 癸→丑(2)
};

// 贵人起例: {天干: [昼贵地支索引, 夜贵地支索引]}
// 口诀: 甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎
var LR_GUI_REN = {
  1:[2,8],   // 甲: 昼丑(2), 夜未(8)
  2:[1,9],   // 乙: 昼子(1), 夜申(9)
  3:[12,10], // 丙: 昼亥(12),夜酉(10)
  4:[12,10], // 丁: 昼亥(12),夜酉(10)
  5:[2,8],   // 戊: 昼丑(2), 夜未(8)
  6:[1,9],   // 己: 昼子(1), 夜申(9)
  7:[2,8],   // 庚: 昼丑(2), 夜未(8)
  8:[7,3],   // 辛: 昼午(7), 夜寅(3)
  9:[6,4],   // 壬: 昼巳(6), 夜卯(4)
  10:[6,4]   // 癸: 昼巳(6), 夜卯(4)
};

// 十二地支的六冲关系
var LR_LIU_CHONG = {1:7,7:1,2:8,8:2,3:9,9:3,4:10,10:4,5:11,11:5,6:12,12:6};

// 近似节气日期(月份-日),用于粗略推算
var LR_APPROX_JIEQI = [
  {name:'小寒',m:1,d:6},{name:'大寒',m:1,d:20},
  {name:'立春',m:2,d:4},{name:'雨水',m:2,d:19},
  {name:'惊蛰',m:3,d:6},{name:'春分',m:3,d:21},
  {name:'清明',m:4,d:5},{name:'谷雨',m:4,d:20},
  {name:'立夏',m:5,d:6},{name:'小满',m:5,d:21},
  {name:'芒种',m:6,d:6},{name:'夏至',m:6,d:22},
  {name:'小暑',m:7,d:7},{name:'大暑',m:7,d:23},
  {name:'立秋',m:8,d:7},{name:'处暑',m:8,d:23},
  {name:'白露',m:9,d:8},{name:'秋分',m:9,d:23},
  {name:'寒露',m:10,d:8},{name:'霜降',m:10,d:23},
  {name:'立冬',m:11,d:7},{name:'小雪',m:11,d:22},
  {name:'大雪',m:12,d:7},{name:'冬至',m:12,d:22}
];

// 中气名称列表(用于月将判断)
var LR_ZHONG_QI = ['雨水','春分','谷雨','小满','夏至','大暑','处暑','秋分','霜降','小雪','冬至','大寒'];

// --- 辅助函数 ---

// 判断某年某月某日在哪个中气区间(用于定月将)
// 返回: 中气索引(0=雨水, 11=大寒)
function lrGetQiIndex(year, month, day) {
  // 生成当年所有中气的近似日期
  var qiDates = [];
  for(var i=0; i<12; i++) {
    var qiName = LR_ZHONG_QI[i];
    // 查找近似日期
    for(var j=0; j<LR_APPROX_JIEQI.length; j++) {
      if(LR_APPROX_JIEQI[j].name === qiName) {
        qiDates.push({m: LR_APPROX_JIEQI[j].m, d: LR_APPROX_JIEQI[j].d});
        break;
      }
    }
  }
  // 将日期转为天数序数便于比较
  function dayOfYear(m,d) {
    var days = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    var isLeap = (year%4===0 && year%100!==0) || year%400===0;
    if(isLeap) days[2]=29;
    var sum=0;
    for(var i=1; i<m; i++) sum+=days[i];
    return sum+d;
  }
  var target = dayOfYear(month, day);
  var qiDays = qiDates.map(function(q){return dayOfYear(q.m, q.d);});
  
  // 如果在大寒之后雨水之前 → 索引11(大寒区间)
  // 一般: target >= qiDays[i] 且 target < qiDays[(i+1)%12] 则属于i
  // 特殊情况处理跨年
  for(var i=0; i<12; i++) {
    var next = (i+1)%12;
    var cur = qiDays[i];
    var nxt = qiDays[next];
    if(next === 0) { // 跨年: 大寒→雨水
      if(target >= cur || target < nxt) return i;
    } else {
      if(target >= cur && target < nxt) return i;
    }
  }
  // 默认返回雨水区间(如果都找不到)
  return 0;
}

// 计算月将: 返回月将对象 {name, zhi(索引)}
function lrCalcYueJiang(year, month, day) {
  var qiIdx = lrGetQiIndex(year, month, day);
  return LR_YUE_JIANG[qiIdx];
}

// 构建天盘: 月将加时
// 地盘是固定的 子丑寅卯辰巳午未申酉戌亥(索引1-12)
// 天盘 = 地盘旋转, 使得月将对准时辰位
// returns: array of 13 (index 0 unused), tianPan[diZhiIdx] = 天盘对应地支索引
function lrBuildTianPan(yueJiangZhi, hourZhi) {
  var tianPan = [0];
  // 月将(yueJiangZhi)加在时辰(hourZhi)上
  // 即: 在地盘hourZhi位置, 放天盘yueJiangZhi
  // 偏移: shift = hourZhi - yueJiangZhi (mod 12)
  var shift = ((hourZhi - yueJiangZhi) % 12 + 12) % 12;
  for(var dz=1; dz<=12; dz++) {
    var tz = ((dz - 1 - shift + 12) % 12) + 1;
    tianPan[dz] = tz;
  }
  return tianPan;
}

// 获取天盘上某地支对应的神(天盘地支)
function lrGetTianPanZhi(tianPan, diZhi) {
  return tianPan[diZhi];
}

// 计算四课
// 返回: [{upper: 天盘地支索引, lower: 地盘地支索引}, ...] 共4课
function lrCalcSiKe(tianPan, dayGanIdx, dayZhiIdx) {
  // 日干的寄宫(地盘位置)
  var ganPalace = LR_GAN_PALACE[dayGanIdx];
  // 干上神 = 天盘在寄宫位置的地支
  var ganShang = lrGetTianPanZhi(tianPan, ganPalace);
  // 支上神 = 天盘在日支位置的地支
  var zhiShang = lrGetTianPanZhi(tianPan, dayZhiIdx);
  
  // 第一课: 干阳 = (干上神, 日干寄宫)
  var ke1 = {upper: ganShang, lower: ganPalace};
  // 第二课: 干阴 = (第一课的上神的天盘, 第一课的上神)
  var ke2Upper = lrGetTianPanZhi(tianPan, ganShang);
  var ke2 = {upper: ke2Upper, lower: ganShang};
  // 第三课: 支阳 = (支上神, 日支)
  var ke3 = {upper: zhiShang, lower: dayZhiIdx};
  // 第四课: 支阴 = (第三课的上神的天盘, 第三课的上神)
  var ke4Upper = lrGetTianPanZhi(tianPan, zhiShang);
  var ke4 = {upper: ke4Upper, lower: zhiShang};
  
  return [ke1, ke2, ke3, ke4];
}

// 九宗门 - 确定发用
// 返回: [{ke: 课索引, method: 方法名, zhi: 地支索引}, ...] 最多3个(三传)
function lrCalcFaYong(tianPan, siKe, dayGanIdx, dayZhiIdx) {
  var result = [];
  var keBranchMap = [];
  
  // 收集各课的上神和下神的地支
  for(var k=0; k<4; k++) {
    keBranchMap.push({
      ke: k,
      upper: siKe[k].upper,
      lower: siKe[k].lower,
      // 上克下 or 下克上?
      keUpper: (siKe[k].upper % 2) !== (siKe[k].lower % 2), // 不同阴阳才可能克
      // 按五行生克: 上克下(上克下)或下克上(下克上)
    });
  }
  
  // 天干和地支的五行
  function ganWxIdx(ganIdx) {
    return ['','木','木','火','火','土','土','金','金','水','水'][ganIdx]||'';
  }
  function zhiWxIdx(zhiIdx) {
    return ['','水','土','木','木','土','火','火','土','金','金','土','水'][zhiIdx]||'';
  }
  var WX_SHENG = {木:'火',火:'土',土:'金',金:'水',水:'木'}; // 生
  var WX_KE = {木:'土',土:'水',水:'火',火:'金',金:'木'};     // 克
  
  // 检查: 上是否克下
  function upperKeLower(upperZhi, lowerZhi) {
    var uWx = zhiWxIdx(upperZhi);
    var lWx = zhiWxIdx(lowerZhi);
    return WX_KE[uWx] === lWx;
  }
  // 检查: 下是否克上
  function lowerKeUpper(upperZhi, lowerZhi) {
    var uWx = zhiWxIdx(upperZhi);
    var lWx = zhiWxIdx(lowerZhi);
    return WX_KE[lWx] === uWx;
  }
  
  // === 1. 贼克法 (ZeKe) ===
  // 取上克下(克)或下克上(贼)
  var keList = [];
  var zeList = [];
  for(var k=0; k<4; k++) {
    if(upperKeLower(siKe[k].upper, siKe[k].lower)) {
      keList.push({ke:k, zhi:siKe[k].upper, type:'克', desc:'上克下'});
    }
    if(lowerKeUpper(siKe[k].upper, siKe[k].lower)) {
      zeList.push({ke:k, zhi:siKe[k].lower, type:'贼', desc:'下贼上'});
    }
  }
  
  var faYongZhi = null;
  var methodName = '';
  
  if(keList.length === 1 && zeList.length === 0) {
    // 只有上克下: 重审课
    faYongZhi = keList[0].zhi;
    methodName = '贼克·重审课(上克下)';
  } else if(zeList.length === 1 && keList.length === 0) {
    // 只有下贼上: 元首课
    faYongZhi = zeList[0].zhi;
    methodName = '贼克·元首课(下贼上)';
  } else if(keList.length > 1 || zeList.length > 1 || (keList.length>0 && zeList.length>0)) {
    // === 2. 比用法 (BiYong) ===
    // 取与日干阴阳相同的
    var dayYinYang = dayGanIdx % 2; // 1=阳 0=阴
    var all = keList.concat(zeList);
    var biList = all.filter(function(item){
      var zhiYy = item.zhi % 2; // 阳支=1,阴支=0 (子=1阳,丑=2阴)
      return zhiYy === dayYinYang;
    });
    if(biList.length === 1) {
      faYongZhi = biList[0].zhi;
      methodName = '比用(与日干阴阳同)';
    } else if(biList.length > 1) {
      // === 3. 涉害法 (SheHai) 简化处理 ===
      // 取涉害最深者(比较各课上下克害深度)
      // 简化: 取与日干五行相同者
      var dayWx = ganWxIdx(dayGanIdx);
      var sheList = biList.filter(function(item){
        return zhiWxIdx(item.zhi) === dayWx;
      });
      if(sheList.length >= 1) {
        faYongZhi = sheList[0].zhi;
        methodName = '涉害(取与日干五行同)';
      } else {
        faYongZhi = biList[0].zhi;
        methodName = '涉害(取第一课)';
      }
    } else {
      // no match, fall through to yaoKe
    }
  } else if(keList.length === 0 && zeList.length === 0) {
    // === 4. 遥克法 (YaoKe) ===
    // 四课无克, 看日干与各课有无遥克关系
    // 检查日干与各课上神有无克
    var yaoList = [];
    for(var k=0; k<4; k++) {
      var shangWx = zhiWxIdx(siKe[k].upper);
      var ganWxNow = ganWxIdx(dayGanIdx);
      if(WX_KE[ganWxNow] === shangWx) {
        yaoList.push({ke:k, zhi:siKe[k].upper, type:'遥克', desc:'日干克上神'});
      }
    }
    if(yaoList.length === 1) {
      faYongZhi = yaoList[0].zhi;
      methodName = '遥克·蒿矢课(日克神)';
    } else if(yaoList.length > 1) {
      // 比用
      var dayYy = dayGanIdx % 2;
      var yaoBi = yaoList.filter(function(item){ return (item.zhi % 2) === dayYy; });
      faYongZhi = (yaoBi.length >= 1 ? yaoBi[0] : yaoList[0]).zhi;
      methodName = '遥克(比用)';
    } else {
      // 无遥克
      // === 5. 昴星法 ===
      // 看酉(昴星)所在的天盘位置
      var maoZhi = 10; // 酉
      var maoTian = lrGetTianPanZhi(tianPan, maoZhi);
      if(dayZhiIdx === 1 || dayZhiIdx === 3 || dayZhiIdx === 5 || dayZhiIdx === 7 || dayZhiIdx === 9 || dayZhiIdx === 11) {
        // 阳日: 取地盘酉上神为发用
        faYongZhi = maoTian;
        methodName = '昴星·虎视(阳日)';
      } else {
        // 阴日: 取酉下神(地盘酉位)为发用
        faYongZhi = maoZhi;
        methodName = '昴星·冬蛇掩目(阴日)';
      }
    }
  }
  
  // 如果上面都没确定,使用第一课的上神
  if(faYongZhi === null) {
    faYongZhi = siKe[0].upper;
    methodName = '默认取第一课上神';
  }
  
  // === 三传 (Three Transmissions) ===
  // 发用(初传) = faYongZhi
  // 中传 = 初传的地支在地盘上的天盘支(初传的递生/合关系)
  // 末传 = 中传的递生/合关系
  
  // 三传: 取初传、中传、末传
  // 初传(发用) = faYongZhi
  // 中传 = 天盘上初传位置的地支 → 即: 初传地支在什么位置, 这个位置上的天盘支
  // 末传 = 天盘上中传位置的地支
  
  var chu = faYongZhi;
  // 中传: 看chu在地盘上的天盘支
  var zhong = lrGetTianPanZhi(tianPan, chu);
  var mo = lrGetTianPanZhi(tianPan, zhong);
  
  // 如果三传中有重复,用三合局补足
  // 简化: 如果中传=初传, 取六冲
  if(zhong === chu) {
    zhong = LR_LIU_CHONG[chu];
  }
  if(mo === zhong || mo === chu) {
    mo = LR_LIU_CHONG[zhong];
  }
  
  return {
    chu: chu,
    zhong: zhong,
    mo: mo,
    method: methodName,
    faYongKe: siKe[0]
  };
}

// 布十二天将
// 根据日干确定贵人起例,然后顺时针/逆时针排列
function lrPlaceTianJiang(tianPan, dayGanIdx, hourZhi) {
  // 判断昼夜: 卯(4)后→申(9)前为昼, 酉(10)后→寅(3)前为夜
  var isDay = (hourZhi >= 4 && hourZhi <= 9);
  
  // 确定贵人位置
  var guiRen = LR_GUI_REN[dayGanIdx];
  var guiRenZhi = isDay ? guiRen[0] : guiRen[1];
  
  // 贵人在天盘的位置
  var guiRenTian = lrGetTianPanZhi(tianPan, guiRenZhi);
  
  // 十二天将的排列顺序(以贵人为起点, 顺/逆排列)
  // 贵人 → 腾蛇 → 朱雀 → 六合 → 勾陈 → 青龙 → 天空 → 白虎 → 太常 → 玄武 → 太阴 → 天后
  // 顺行: 贵人在地盘亥(12)-辰(5)顺行, 在地盘巳(6)-戌(11)逆行
  // 简化: 阳贵顺行, 阴贵逆行 → 实际上取决于贵人所在的地盘位置
  // 白天(阳): 贵人从丑(2)→未(8)顺行; 夜晚(阴): 贵人从未(8)→丑(2)逆行
  // 更准确: 贵人起后, 其他天将按地支顺序顺或逆排列
  
  var tianJiangOrder = [
    {name:'贵人',idx:0},
    {name:'腾蛇',idx:1},
    {name:'朱雀',idx:2},
    {name:'六合',idx:3},
    {name:'勾陈',idx:4},
    {name:'青龙',idx:5},
    {name:'天空',idx:6},
    {name:'白虎',idx:7},
    {name:'太常',idx:8},
    {name:'玄武',idx:9},
    {name:'太阴',idx:10},
    {name:'天后',idx:11}
  ];
  
  // 癸酉 onwards: simplified approach
  // 贵人顺逆规则: 亥(12)到辰(5)顺行, 巳(6)到戌(11)逆行
  // 即: 贵人临地盘亥子丑寅卯辰(12,1,2,3,4,5)为顺行
  //     贵人临地盘巳午未申酉戌(6,7,8,9,10,11)为逆行
  var isShun = (guiRenTian <= 5);
  
  var result = [];
  for(var i=0; i<12; i++) {
    var step = isShun ? i : -i;
    var tianZhi = ((guiRenTian - 1 + step + 12*12) % 12) + 1;
    // 天将在地盘上的位置 = tianZhi对应的地盘索引
    var diZhi = tianZhi;
    // 该天将在地盘的实际位置(从天盘映射回地盘)
    // 天将所在的天盘支 = tianZhi, 它对应的地盘支就是...
    // 实际上: 天盘上的tianZhi在天盘, 它对应地盘上哪个位置?
    // 天将: 天盘上的tianZhi地支, 落在地盘上就是该地支本身
    // 更准确: 天将的"落宫"是:tianZhi本身(因为天将跟随天盘转动)
    // 在地盘上的落位 = 天盘支tianZhi 在地盘上的对应位置
    // 已知 tianPan[diZhi] = tianZhi, 求 diZhi
    var diLoc = -1;
    for(var d=1; d<=12; d++) {
      if(tianPan[d] === tianZhi) {
        diLoc = d;
        break;
      }
    }
    result.push({
      name: tianJiangOrder[i].name,
      index: tianJiangOrder[i].idx,
      tianZhi: tianZhi,
      diLoc: diLoc,
      isShun: isShun
    });
  }
  return result;
}

// === 主计算函数 ===
function calcLiuRenChart(year, month, day, hour) {
  try {
    // 1. 使用lunar.js获取八字信息
    // 将小时转为时辰地支(子=1, 丑=2, ..., 亥=12)
    // 注意: 23-0为子时, 1-2为丑时, etc
    var hourPairs = [
      {h:0,zhi:1},{h:23,zhi:1},  // 子
      {h:1,zhi:2},{h:2,zhi:2},   // 丑
      {h:3,zhi:3},{h:4,zhi:3},   // 寅
      {h:5,zhi:4},{h:6,zhi:4},   // 卯
      {h:7,zhi:5},{h:8,zhi:5},   // 辰
      {h:9,zhi:6},{h:10,zhi:6},  // 巳
      {h:11,zhi:7},{h:12,zhi:7}, // 午
      {h:13,zhi:8},{h:14,zhi:8}, // 未
      {h:15,zhi:9},{h:16,zhi:9}, // 申
      {h:17,zhi:10},{h:18,zhi:10}, // 酉
      {h:19,zhi:11},{h:20,zhi:11}, // 戌
      {h:21,zhi:12},{h:22,zhi:12}  // 亥
    ];
    var hourZhi = 1; // default 子
    for(var hi=0; hi<hourPairs.length; hi++) {
      if(hour === hourPairs[hi].h) {
        hourZhi = hourPairs[hi].zhi;
        break;
      }
    }
    
    // 获取四柱
    var solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    ec.setSect(1);
    
    var yearGan = ec.getYearGan();
    var yearZhi = ec.getYearZhi();
    var monthGan = ec.getMonthGan();
    var monthZhi = ec.getMonthZhi();
    var dayGan = ec.getDayGan();
    var dayZhi = ec.getDayZhi();
    var timeGan = ec.getTimeGan();
    var timeZhi = ec.getTimeZhi();
    
    var dayGanIdx = GAN_LIST.indexOf(dayGan);
    var dayZhiIdx = ZHI_LIST.indexOf(dayZhi);
    var monthZhiIdx = ZHI_LIST.indexOf(monthZhi);
    
    // 2. 计算月将
    var yueJiang = lrCalcYueJiang(year, month, day);
    
    // 3. 构建天盘(月将加时)
    var tianPan = lrBuildTianPan(yueJiang.zhi, hourZhi);
    
    // 4. 计算四课
    var siKe = lrCalcSiKe(tianPan, dayGanIdx, dayZhiIdx);
    
    // 5. 九宗门 - 三传
    var sanChuan = lrCalcFaYong(tianPan, siKe, dayGanIdx, dayZhiIdx);
    
    // 6. 布十二天将
    var tianJiang = lrPlaceTianJiang(tianPan, dayGanIdx, hourZhi);
    
    // 7. 构建地盘信息
    var diPan = [];
    for(var d=1; d<=12; d++) {
      diPan.push({
        diZhi: d,
        diGan: ZHI_LIST[d],
        tianZhi: tianPan[d],
        tianGan: ZHI_LIST[tianPan[d]],
        yueJiang: (tianPan[d] === yueJiang.zhi) ? yueJiang.name : null
      });
    }
    
    // 构建完整结果
    return {
      datetime: year+'年'+month+'月'+day+'日 '+hour+'时',
      siZhu: {
        year: yearGan+yearZhi,
        month: monthGan+monthZhi,
        day: dayGan+dayZhi,
        time: timeGan+timeZhi
      },
      yearGan: yearGan, yearZhi: yearZhi,
      monthGan: monthGan, monthZhi: monthZhi,
      dayGan: dayGan, dayZhi: dayZhi,
      timeGan: timeGan, timeZhi: timeZhi,
      dayGanIdx: dayGanIdx,
      dayZhiIdx: dayZhiIdx,
      hourZhi: hourZhi,
      yueJiang: yueJiang,
      ganPalace: LR_GAN_PALACE[dayGanIdx],
      ganPalaceName: ZHI_LIST[LR_GAN_PALACE[dayGanIdx]],
      tianPan: tianPan,
      siKe: siKe,
      sanChuan: sanChuan,
      tianJiang: tianJiang,
      diPan: diPan
    };
  } catch(e) {
    return {error: e.message};
  }
}

// === HTML 渲染函数 ===
function renderLiuRenHTML(result) {
  if(result.error) {
    return '<div class="result-card"><div class="rc-header" style="color:var(--red)">⚠️ 排盘出错</div><div class="rc-text">'+result.error+'</div></div>';
  }
  
  var h = '';
  
  // ============ 标题 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">🔮 大六壬 · 起课结果</div>';
  
  // 基本信息
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:10px">';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">年</div><div style="font-weight:700;font-size:14px">'+colorGZ(result.siZhu.year)+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">月</div><div style="font-weight:700;font-size:14px">'+colorGZ(result.siZhu.month)+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">日</div><div style="font-weight:700;font-size:14px">'+colorGZ(result.siZhu.day)+'</div></div>';
  h += '<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">时</div><div style="font-weight:700;font-size:14px">'+colorGZ(result.siZhu.time)+'</div></div>';
  h += '</div>';
  
  // 月将
  h += '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">';
  h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border-radius:6px;padding:8px"><div style="font-size:10px;color:#999">月将</div><div style="font-size:18px;font-weight:700;color:var(--teal)">'+result.yueJiang.name+' <span style="font-size:14px;color:'+getCharColor(ZHI_LIST[result.yueJiang.zhi])+'">('+colorGZ(ZHI_LIST[result.yueJiang.zhi])+')</span></div><div style="font-size:11px;color:#666">'+result.yueJiang.jieqi+'后</div></div>';
  h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border-radius:6px;padding:8px"><div style="font-size:10px;color:#999">日干寄宫</div><div style="font-size:18px;font-weight:700;color:'+getCharColor(ZHI_LIST[result.ganPalace])+'">'+colorGZ(result.ganPalaceName)+'</div><div style="font-size:11px;color:#666">'+colorGZ(result.dayGan)+'日寄</div></div>';
  h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border-radius:6px;padding:8px"><div style="font-size:10px;color:#999">起课时辰</div><div style="font-size:18px;font-weight:700;color:'+getCharColor(ZHI_LIST[result.hourZhi])+'">'+colorGZ(ZHI_LIST[result.hourZhi])+'</div><div style="font-size:11px;color:#666">'+['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][result.hourZhi-1]+'时</div></div>';
  h += '</div>';
  
  h += '</div>'; // end result-card
  
  // ============ 天盘·地盘 十二地支盘 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">🌐 天盘·地盘</div>';
  h += '<div style="font-size:11px;color:#999;margin-bottom:6px">月将<b>'+result.yueJiang.name+'</b>加<b>'+ZHI_LIST[result.hourZhi]+'</b>时 — 天盘地支在上，地盘地支在下</div>';
  
  // 12地支盘 以圆形方式排列(子北午南)
  // 使用4x3网格: 西北方向开始排
  // 亥 子 丑
  // 戌    寅
  // 酉    卯
  // 申 未 午
  var diPalaceOrder = [12,1,2,11,0,3,10,0,4,9,8,7]; // 0表示中间跳过
  // Actually simpler: show in a 4x3 grid
  var grid = [
    [12,1,2],   // 亥 子 丑
    [11,0,3],   // 戌 空 寅
    [10,0,4],   // 酉 空 卯
    [9,8,7]     // 申 未 午
  ];
  
  h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;overflow:hidden">';
  h += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  for(var r=0; r<4; r++) {
    h += '<tr>';
    for(var c=0; c<3; c++) {
      var dz = grid[r][c];
      if(dz === 0) {
        // 中心: 显示月将信息
        h += '<td style="text-align:center;padding:12px 6px;background:#F5F0E0;border:1px solid var(--border);width:33%">';
        h += '<div style="font-size:10px;color:#999">中宫</div>';
        h += '<div style="font-size:13px;font-weight:700;color:var(--gold)">'+result.yueJiang.name+'</div>';
        h += '<div style="font-size:9px;color:#666">月将</div>';
        h += '</td>';
        continue;
      }
      var tz = result.tianPan[dz];
      var isYueJiang = (tz === result.yueJiang.zhi);
      h += '<td style="text-align:center;padding:8px 4px;background:#FFFCF5;border:1px solid var(--border);width:33%;vertical-align:middle">';
      // 天盘(上)  
      h += '<div style="font-size:18px;font-weight:700;color:'+getCharColor(ZHI_LIST[tz])+'">'+colorGZ(ZHI_LIST[tz])+'</div>';
      // 月将标记
      if(isYueJiang) {
        h += '<div style="font-size:8px;color:var(--gold);font-weight:600">★月将</div>';
      }
      // 分隔线
      h += '<div style="border-top:1px dashed #ddd;margin:4px 0"></div>';
      // 地盘(下)
      h += '<div style="font-size:14px;color:#999">'+colorGZ(ZHI_LIST[dz])+'</div>';
      h += '<div style="font-size:8px;color:#ccc">'+['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][dz-1]+'宫</div>';
      h += '</td>';
    }
    h += '</tr>';
  }
  h += '</table></div>';
  
  h += '<div style="font-size:10px;color:#aaa;margin-top:4px;text-align:center">🔴 上方为天盘(月将加时后)　⚪ 下方为地盘(固定)</div>';
  h += '</div>'; // end result-card
  
  // ============ 四课 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">📋 四课</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">';
  
  var keNames = ['第一课(干阳)','第二课(干阴)','第三课(支阳)','第四课(支阴)'];
  var keColors = ['#B8860B','#8B6914','#004D4D','#336666'];
  for(var ki=0; ki<4; ki++) {
    var ke = result.siKe[ki];
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center">';
    h += '<div style="font-size:10px;color:'+keColors[ki]+';font-weight:600;margin-bottom:4px">'+keNames[ki]+'</div>';
    // 上神
    h += '<div style="font-size:22px;font-weight:700;color:'+getCharColor(ZHI_LIST[ke.upper])+'">'+colorGZ(ZHI_LIST[ke.upper])+'</div>';
    h += '<div style="font-size:9px;color:#999">↑ 上神(天盘)</div>';
    h += '<div style="border-top:1px solid #ddd;margin:4px 20px"></div>';
    // 下神
    h += '<div style="font-size:18px;color:#777">'+colorGZ(ZHI_LIST[ke.lower])+'</div>';
    h += '<div style="font-size:9px;color:#999">↓ 下神(地盘)</div>';
    h += '</div>';
  }
  h += '</div>';
  // 四课解读
  var keDesc = '';
  for(var ki=0; ki<4; ki++) {
    var ke = result.siKe[ki];
    var uName = ZHI_LIST[ke.upper];
    var lName = ZHI_LIST[ke.lower];
    keDesc += keNames[ki]+'：<b>'+colorGZ(uName)+'</b>加<b>'+colorGZ(lName)+'</b>';
    if(ki < 3) keDesc += '　';
  }
  h += '<div style="font-size:11px;color:#666;line-height:1.8;padding:6px;background:#FAF5E8;border-radius:4px">';
  h += keDesc;
  h += '</div>';
  h += '</div>'; // end result-card
  
  // ============ 三传 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">🌀 三传 · '+result.sanChuan.method+'</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:8px;justify-content:center">';
  
  var chuanNames = ['初传(发用)', '中传', '末传'];
  var chuanZhis = [result.sanChuan.chu, result.sanChuan.zhong, result.sanChuan.mo];
  var chuanArrows = ['⬇', '⬇', '——'];
  var chuanColors = ['var(--red)', 'var(--teal)', '#666'];
  for(var ci=0; ci<3; ci++) {
    var chZhi = chuanZhis[ci];
    h += '<div style="flex:1;text-align:center;background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:10px">';
    h += '<div style="font-size:10px;color:'+chuanColors[ci]+';font-weight:600;margin-bottom:2px">'+chuanNames[ci]+'</div>';
    h += '<div style="font-size:28px;font-weight:700;color:'+getCharColor(ZHI_LIST[chZhi])+'">'+colorGZ(ZHI_LIST[chZhi])+'</div>';
    h += '<div style="font-size:10px;color:#999">'+['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][chZhi-1]+'</div>';
    if(ci < 2) {
      h += '<div style="font-size:16px;color:'+chuanColors[ci]+'">↓</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  
  // 三传五行关系和解读
  h += '<div style="font-size:11px;color:#666;line-height:1.8;padding:6px;background:#FAF5E8;border-radius:4px">';
  h += '🍃 <b>断课方向：</b>发用为事之始，中传为事之中，末传为事之终。<br>';
  // 五行生克
  var c1wx = zhiWx(result.sanChuan.chu);
  var c2wx = zhiWx(result.sanChuan.zhong);
  var c3wx = zhiWx(result.sanChuan.mo);
  h += '五行：<b>'+colorGZ(ZHI_LIST[result.sanChuan.chu])+'</b>('+c1wx+') → ';
  h += '<b>'+colorGZ(ZHI_LIST[result.sanChuan.zhong])+'</b>('+c2wx+') → ';
  h += '<b>'+colorGZ(ZHI_LIST[result.sanChuan.mo])+'</b>('+c3wx+')';
  h += '</div>';
  h += '</div>'; // end result-card
  
  // ============ 十二天将 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">⭐ 十二天将落宫</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">';
  
  for(var ti=0; ti<12; ti++) {
    var tj = result.tianJiang[ti];
    var tjInfo = LR_TIAN_JIANG[tj.index];
    var diLocZhi = ZHI_LIST[tj.diLoc] || '';
    // 天将在地盘的对应的颜色
    var locColor = getCharColor(diLocZhi);
    h += '<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:4px;padding:6px;text-align:center">';
    h += '<div style="font-size:10px;font-weight:700;color:'+LR_TJ_COLOR[tjInfo.type]+'">'+tj.name+'</div>';
    h += '<div style="font-size:9px;color:#999">('+tjInfo.type+'·'+tjInfo.desc+')</div>';
    h += '<div style="font-size:14px;font-weight:700;color:'+locColor+'">'+colorGZ(diLocZhi)+'</div>';
    h += '<div style="font-size:8px;color:#ccc">'+['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][tj.diLoc-1]+'宫</div>';
    h += '</div>';
  }
  h += '</div>';
  h += '<div style="font-size:10px;color:#999;margin-top:6px">贵人'+(result.tianJiang[0].isShun?'顺行':'逆行')+'排布</div>';
  h += '</div>'; // end result-card
  
  // ============ 完整盘式表 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">📊 大六壬排盘总表</div>';
  h += '<table style="width:100%;border-collapse:collapse;font-size:11px">';
  h += '<thead><tr style="background:var(--teal);color:#fff"><th style="padding:6px;text-align:center">地支</th><th style="padding:6px;text-align:center">月将</th><th style="padding:6px;text-align:center">天将</th><th style="padding:6px;text-align:center">天盘支</th><th style="padding:6px;text-align:center">课占</th></tr></thead><tbody>';
  
  for(var di=1; di<=12; di++) {
    var tz = result.tianPan[di];
    var isYj = (tz === result.yueJiang.zhi);
    var yjName = isYj ? result.yueJiang.name : '';
    
    // 找该地支上的天将
    var tjNames = [];
    for(var ti=0; ti<12; ti++) {
      if(result.tianJiang[ti].diLoc === di) {
        tjNames.push(result.tianJiang[ti].name);
      }
    }
    
    // 找该地支相关的课
    var keStr = '';
    for(var ki=0; ki<4; ki++) {
      if(result.siKe[ki].upper === di || result.siKe[ki].lower === di) {
        keStr += (ki+1)+'课';
      }
    }
    if(result.sanChuan.chu === di) keStr += '·发用';
    if(result.sanChuan.zhong === di) keStr += '·中传';
    if(result.sanChuan.mo === di) keStr += '·末传';
    
    h += '<tr style="border-bottom:1px solid #eee">';
    h += '<td style="padding:6px;text-align:center;font-weight:700;color:'+getCharColor(ZHI_LIST[di])+'">'+colorGZ(ZHI_LIST[di])+'</td>';
    h += '<td style="padding:6px;text-align:center;color:var(--gold)">'+(yjName||'')+'</td>';
    h += '<td style="padding:6px;text-align:center">'+tjNames.join(', ')+'</td>';
    h += '<td style="padding:6px;text-align:center;color:'+getCharColor(ZHI_LIST[tz])+';font-weight:600">'+colorGZ(ZHI_LIST[tz])+'</td>';
    h += '<td style="padding:6px;text-align:center;font-size:10px;color:#666">'+keStr+'</td>';
    h += '</tr>';
  }
  h += '</tbody></table>';
  h += '</div>'; // end result-card
  
  // ============ 总结 ============
  h += '<div class="result-card">';
  h += '<div class="rc-header">📖 排盘总结</div>';
  h += '<div class="rc-text">';
  h += '起课时间：<b>'+result.datetime+'</b><br>';
  h += '四柱：<b>'+colorGZ(result.siZhu.year+' '+result.siZhu.month+' '+result.siZhu.day+' '+result.siZhu.time)+'</b><br>';
  h += '月将：<b style="color:var(--gold)">'+result.yueJiang.name+'</b>（'+result.yueJiang.jieqi+'后，日躔'+ZHI_LIST[result.yueJiang.zhi]+'宫）<br>';
  h += '日干<b style="color:'+getCharColor(result.dayGan)+'">'+result.dayGan+'</b>寄宫：<b>'+result.ganPalaceName+'</b><br>';
  h += '起课方式：<b style="color:var(--teal)">'+result.sanChuan.method+'</b><br>';
  h += '三传：<b style="color:var(--red)">'+colorGZ(ZHI_LIST[result.sanChuan.chu])+'</b> → <b style="color:var(--teal)">'+colorGZ(ZHI_LIST[result.sanChuan.zhong])+'</b> → <b>'+colorGZ(ZHI_LIST[result.sanChuan.mo])+'</b><br>';
  h += '<div style="margin-top:8px;padding:8px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.7">';
  h += '🤖 <b>大六壬断课指引：</b>大六壬以四课三传为骨架，天将加临为血肉。发用为事之萌动，中传为事之发展，末传为事之结局。天将吉凶配合五行生克综合判断。以上排盘基于月将加时之法，供参考。';
  h += '</div>';
  h += '</div></div>'; // end result-card
  
  return h;
}

// === UI入口函数(被按钮调用) ===
function calcLiuRen() {
  autoSaveBirth('liuren');
  var resultDiv = document.getElementById('liuren-result');
  var useNow = document.getElementById('lr-now').checked;
  var year, month, day, hour;
  
  if(useNow) {
    var now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
    day = now.getDate();
    hour = now.getHours();
  } else {
    year = parseInt(document.getElementById('lr-year').value);
    month = parseInt(document.getElementById('lr-month').value);
    day = parseInt(document.getElementById('lr-day').value);
    hour = parseInt(document.getElementById('lr-hour').value);
    if(!year || !month || !day || isNaN(hour)) {
      alert('请填写完整的起课时间');
      return;
    }
  }
  
  // 显示加载
  resultDiv.innerHTML = '<div class="result-card"><div class="rc-header">🔮 大六壬排盘</div><div class="rc-text" style="text-align:center;padding:1.5rem;color:#999">⚙️ 排盘中...</div></div>';
  resultDiv.classList.add('show');
  
  try {
    var chart = calcLiuRenChart(year, month, day, hour);
    var html = renderLiuRenHTML(chart);
    resultDiv.innerHTML = html;
  } catch(e) {
    resultDiv.innerHTML = '<div class="result-card"><div class="rc-header" style="color:var(--red)">⚠️ 排盘失败</div><div class="rc-text">'+e.message+'</div></div>';
  }
}

// ==== 寻时定盘 ====
function calcXunShi(){
  var y=parseInt(document.getElementById('xs-year').value),m=parseInt(document.getElementById('xs-month').value),d=parseInt(document.getElementById('xs-day').value);
  if(!y||!m||!d){alert('请填写完整的出生日期');return;}
  var gender='男';var genders=document.getElementsByName('xs-gender');for(var i=0;i<genders.length;i++){if(genders[i].checked)gender=genders[i].value;}
  var hrs=[{h:0,l:'子时 (23:00-00:59)'},{h:2,l:'丑时 (01:00-02:59)'},{h:4,l:'寅时 (03:00-04:59)'},{h:6,l:'卯时 (05:00-06:59)'},{h:8,l:'辰时 (07:00-08:59)'},{h:10,l:'巳时 (09:00-10:59)'},{h:12,l:'午时 (11:00-12:59)'},{h:14,l:'未时 (13:00-14:59)'},{h:16,l:'申时 (15:00-16:59)'},{h:18,l:'酉时 (17:00-18:59)'},{h:20,l:'戌时 (19:00-20:59)'},{h:22,l:'亥时 (21:00-22:59)'}];
  var h='<div class="result-card"><div class="rc-header">🔍 各时辰八字一览</div><div style="font-size:11px;color:#999;margin-bottom:8px">日期：'+y+'年'+m+'月'+d+'日　'+gender+'</div><table class="bz-detail" style="font-size:11px"><tr style="background:var(--teal);color:#fff"><td>时辰</td><td>时柱</td><td>八字</td><td>日主</td></tr>';
  for(var hi=0;hi<hrs.length;hi++){try{var sf=Solar.fromYmdHms(y,m,d,hrs[hi].h,0,0);var lf=sf.getLunar();lf.getEightChar().setSect(1);var ec=lf.getEightChar();h+='<tr><td style="font-weight:600">'+hrs[hi].l+'</td><td style="color:'+getCharColor(ec.getTimeGan())+';font-weight:700">'+ec.getTimeGan()+ec.getTimeZhi()+'</td><td>'+colorGZ(ec.getYear()+ec.getMonth()+ec.getDay()+ec.getTime())+'</td><td><span style="color:'+getCharColor(ec.getDayGan())+';font-weight:700">'+ec.getDayGan()+'</span> '+ganWx(GAN_LIST.indexOf(ec.getDayGan()))+'</td></tr>';}catch(e){}}
  h+='</table><div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>不同时辰的八字差异主要体现在时柱和日主气数上。如果无法确定准确时辰，建议结合家庭情况综合判断。</div></div>';
  document.getElementById('xs-result').innerHTML=h;
}

// ==== 五行喜忌速测 ====
function calcWuXiXiJi(){
  var y=parseInt(document.getElementById('wx-year').value),m=parseInt(document.getElementById('wx-month').value),d=parseInt(document.getElementById('wx-day').value),h=parseInt(document.getElementById('wx-hour').value);
  if(!y||!m||!d||(!h&&h!==0)){alert('请填写完整的出生信息');return;}
  try {
    var sf=Solar.fromYmdHms(y,m,d,h,0,0);var lf=sf.getLunar();lf.getEightChar().setSect(1);var ec=lf.getEightChar();
    var dm=ec.getDayGan(),dmWx=ganWx(GAN_LIST.indexOf(dm));
    var gans=[ec.getYearGan(),ec.getMonthGan(),ec.getDayGan(),ec.getTimeGan()];
    var wc={jin:0,mu:0,shui:0,huo:0,tu:0};
    [ec.getYearWuXing(),ec.getMonthWuXing(),ec.getDayWuXing(),ec.getTimeWuXing()].forEach(function(w){var c=typeof w==='string'?w.split(''):[];c.forEach(function(c){var mp={金:'jin',木:'mu',水:'shui',火:'huo',土:'tu'};if(mp[c])wc[mp[c]]++;});});
    var ord=['mu','huo','tu','jin','shui'],mx='',mxc=0;ord.forEach(function(k){if(wc[k]>mxc){mxc=wc[k];mx=k;}});
    var mz=ec.getMonthZhi(),mzi=ZHI_LIST.indexOf(mz),mw=zhiWx(mzi);
    var dl=(WX_SHENG[mw]===dmWx)?22:(mw===dmWx?-5:(WX_KE[mw]===dmWx?-22:-10));
    var rc=0;ec.getYearHideGan().concat(ec.getMonthHideGan()).concat(ec.getDayHideGan()).concat(ec.getTimeHideGan()).forEach(function(c){if(ganWx(GAN_LIST.indexOf(c))===dmWx)rc++;});
    var dd=rc*10-30;var sc=0;gans.forEach(function(g){if(ganWx(GAN_LIST.indexOf(g))===dmWx)sc++;});
    var ds=sc*15-20;var tl=dl+dd+ds;var q=tl>10?'偏强':tl>-10?'中和':'偏弱';
    var ys,xs,js;
    if(q==='偏强'){ys={木:'火',火:'土',土:'金',金:'水',水:'木'}[dmWx];xs={木:'金',火:'水',土:'木',金:'火',水:'土'}[dmWx];js={木:'水',火:'木',土:'火',金:'土',水:'金'}[dmWx];}
    else{ys={木:'水',火:'木',土:'火',金:'土',水:'金'}[dmWx];xs={木:'金',火:'水',土:'木',金:'火',水:'土'}[dmWx];js={木:'火',火:'土',土:'金',金:'水',水:'木'}[dmWx];}
    var WN={jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
    var cM={金:'#CC9900·金色/米色',木:'#33AA33·绿色/青色',水:'#3399CC·蓝色/黑色',火:'#CC0000·红色/紫色',土:'#BB7711·黄色/棕色'};
    var dM={金:'西、西北',木:'东、东南',水:'北',火:'南',土:'中'};
    var caM={金:'金融、法律、科技、机械、军警',木:'教育、文化、创意、医疗、环保',水:'艺术、传媒、贸易、物流、旅游',火:'销售、演艺、餐饮、能源、电子',土:'房地产、农业、建筑、管理、珠宝'};
    var Html='<div class="result-card"><div class="rc-header">🪨 五行喜忌速测结果</div>';
    Html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"><div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px;text-align:center"><div style="font-size:10px;color:#999">日主</div><div style="font-size:22px;font-weight:700;color:'+getCharColor(dm)+'">'+dm+'</div><div style="font-size:11px;color:#666">'+dmWx+'命</div></div><div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px;text-align:center"><div style="font-size:10px;color:#999">日主强弱</div><div style="font-size:18px;font-weight:700;color:var(--red)">'+q+'</div><div style="font-size:11px;color:#666">综合分'+tl+'</div></div></div>';
    Html+='<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;justify-content:center"><span style="background:var(--red);color:#fff;padding:5px 12px;border-radius:10px;font-size:13px">🟢 用神：<b>'+WN[ys]+'</b></span><span style="background:#3399CC;color:#fff;padding:5px 12px;border-radius:10px;font-size:13px">🔵 喜神：<b>'+WN[xs]+'</b></span><span style="background:#999;color:#fff;padding:5px 12px;border-radius:10px;font-size:13px">⚫ 忌神：<b>'+WN[js]+'</b></span></div>';
    Html+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px;margin-bottom:8px"><div style="font-size:11px;color:#999;margin-bottom:6px">🎨 专属色彩与方位</div><table style="width:100%;font-size:12px"><tr><td style="padding:4px 0;color:#666">幸运色</td><td style="font-weight:700">'+cM[ys]+'</td></tr><tr><td style="padding:4px 0;color:#666">宜用色</td><td style="font-weight:700">'+cM[xs]+'</td></tr><tr><td style="padding:4px 0;color:#666">避用色</td><td style="font-weight:700">'+cM[js]+'</td></tr><tr><td style="padding:4px 0;color:#666">吉利方位</td><td style="font-weight:700;color:var(--teal)">'+dM[ys]+'</td></tr></table></div>';
    Html+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px;margin-bottom:8px"><div style="font-size:11px;color:#999;margin-bottom:4px">💼 推荐行业</div><div style="font-size:12px;color:#555">'+caM[ys]+'</div></div>';
    Html+='<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">🤖 <b>命理分析：</b>五行喜忌速测基于日主旺衰和五行生克制化原理。以上建议供日常生活参考。</div></div>';
    document.getElementById('wx-result').innerHTML=Html;
  } catch(e){document.getElementById('wx-result').innerHTML='<div style="color:var(--red);padding:10px">日期有误：'+e.message+'</div>';}
}

// ==== 藏经阁 ====
var CANG_JING_DATA=[
  {id:'bazi1',cat:'bazi',title:'阴阳五行',desc:'阴阳五行、天干地支——八字推演的最底层概念'},
  {id:'bazi2',cat:'bazi',title:'十天干',desc:'十天干的属性、五行、阴阳与基本含义'},
  {id:'bazi3',cat:'bazi',title:'十二地支',desc:'十二地支的五行、生肖、时辰对应关系'},
  {id:'bazi4',cat:'bazi',title:'干支关系',desc:'天干地支间的冲合刑害破等互动关系'},
  {id:'bazi5',cat:'bazi',title:'宫位与根苗花果',desc:'四柱宫位对应的人生阶段与六亲'},
  {id:'bazi6',cat:'bazi',title:'日干旺衰判定法',desc:'滴天髓四层考核：得令·得地·得势·得气'},
  {id:'bazi7',cat:'bazi',title:'用神总论',desc:'如何根据日主旺衰选取用神、喜神、忌神'},
  {id:'bazi8',cat:'bazi',title:'排盘与节气',desc:'八字排盘与二十四节气的对应关系'},
  {id:'ss1',cat:'bazi',title:'十神总论',desc:'正官、七杀、正印、偏印、正财、偏财等十神定义'},
  {id:'zwds1',cat:'zwds',title:'安星法则与排盘基础',desc:'紫微斗数排盘的基本原理与步骤'},
  {id:'zwds2',cat:'zwds',title:'命宫',desc:'命宫的意义、定位与主星的影响'},
  {id:'zwds3',cat:'zwds',title:'三方四正与夹宫法则',desc:'三方四正的推算与解读方法'},
  {id:'zwds4',cat:'zwds',title:'天干四化底层逻辑',desc:'禄权科忌四化的基本原理'},
  {id:'ly1',cat:'liuyao',title:'阴阳八卦与装卦法',desc:'六爻起卦的阴阳爻组成与装卦方法'},
  {id:'ly2',cat:'liuyao',title:'六亲与世应',desc:'六爻中的六亲关系与世应位置的确定'},
  {id:'ly3',cat:'liuyao',title:'六神',desc:'青龙朱雀勾陈腾蛇白虎玄武的象义'},
  {id:'ly4',cat:'liuyao',title:'六爻神煞废存定论',desc:'六爻中神煞的使用规范与争议'},
  {id:'qm1',cat:'qimen',title:'三奇六仪总论',desc:'奇门遁甲中乙丙丁三奇与六仪'},
  {id:'qm2',cat:'qimen',title:'旬空与驿马',desc:'奇门遁甲中的旬空与驿马的应用'},
  {id:'qm3',cat:'qimen',title:'阴阳遁与定局法',desc:'奇门遁甲阴遁阳遁的定局方法'},
  {id:'lrn1',cat:'liuren',title:'十干寄宫法则',desc:'大六壬中十天干寄十二宫的规则'},
  {id:'lrn2',cat:'liuren',title:'月将与占时定地盘',desc:'大六壬起课中月将加时的基本原理'},
  {id:'lrn3',cat:'liuren',title:'九宗门发用诀总览',desc:'大六壬九种课体发用的方法'},
  {id:'lrn4',cat:'liuren',title:'三传演进逻辑',desc:'大六壬中三传的演进原理'},
  {id:'lrn5',cat:'liuren',title:'四课总论',desc:'大六壬四课的主客关系与判断方法'}
];
var CANG_JING_CONTENT={
  'bazi1':'<h3>阴阳五行</h3><p>阴阳是中国古代哲学的核心概念。阳代表积极、刚健、光明；阴代表消极、柔顺、黑暗。五行即木、火、土、金、水。相生：木生火、火生土、土生金、金生水、水生木。相克：木克土、土克水、水克火、火克金、金克木。</p>',
  'bazi2':'<h3>十天干</h3><p>甲（阳木）、乙（阴木）、丙（阳火）、丁（阴火）、戊（阳土）、己（阴土）、庚（阳金）、辛（阴金）、壬（阳水）、癸（阴水）。天干代表天道运行规律，在八字中年月日时各配一个天干。</p>',
  'bazi3':'<h3>十二地支</h3><p>子（水·鼠）、丑（土·牛）、寅（木·虎）、卯（木·兔）、辰（土·龙）、巳（火·蛇）、午（火·马）、未（土·羊）、申（金·猴）、酉（金·鸡）、戌（土·狗）、亥（水·猪）。</p>',
  'zwds1':'<h3>安星法则与排盘基础</h3><p>紫微斗数排盘以出生年月日时为依据，标定十二宫地支，定五行局，安主星辅星四化。安星口诀：紫微天机星逆行，隔一阳武天同行，天同隔二是廉贞。</p>',
  'ly1':'<h3>阴阳八卦与装卦法</h3><p>六爻以三枚铜钱摇六次。全正为老阳○，两正一反为少阳—，一正两反为少阴- -，三反为老阴×。从下往上记，下三爻为内卦，上三爻为外卦。</p>'
};
function filterCangJing(cat,btn){
  if(btn){btn.parentElement.querySelectorAll('.cal-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');}
  document.getElementById('cangjing-detail').style.display='none';document.getElementById('cangjing-list').style.display='block';
  var items=cat==='all'?CANG_JING_DATA:CANG_JING_DATA.filter(function(x){return x.cat===cat;});
  var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  items.forEach(function(item){h+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:10px;cursor:pointer" onclick="showCangJing(\''+item.id+'\')"><div style="font-size:12px;font-weight:700;color:var(--teal);margin-bottom:4px">'+item.title+'</div><div style="font-size:11px;color:#888">'+item.desc+'</div></div>';});
  h+='</div>';if(!items.length)h='<div style="text-align:center;color:#999;padding:2rem">暂无该分类词条</div>';
  document.getElementById('cangjing-list').innerHTML=h;
}
function showCangJing(id){
  document.getElementById('cangjing-list').style.display='none';document.getElementById('cangjing-detail').style.display='block';
  var item=CANG_JING_DATA.find(function(x){return x.id===id;});
  var content=CANG_JING_CONTENT[id]||'<p>内容完善中...</p>';
  var h='<div class="result-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:13px;font-weight:700;color:var(--teal)">'+(item?item.title:'')+'</span><span style="font-size:11px;color:var(--gold);cursor:pointer" onclick="filterCangJing(\'all\')">← 返回列表</span></div><div class="rc-text" style="line-height:1.9">'+content+'</div></div>';
  document.getElementById('cangjing-detail').innerHTML=h;
}

// 三术合参
function calcSanHe(){
  autoSaveBirth('sanhe');
  var name=document.getElementById('sh-name').value.trim()||'未知';
  var y=parseInt(document.getElementById('sh-year').value);
  var m=parseInt(document.getElementById('sh-month').value);
  var d=parseInt(document.getElementById('sh-day').value);
  var h=parseInt(document.getElementById('sh-hour').value);
  if(!y||!m||!d||(!h&&h!==0)){alert('请填写完整的出生信息');return;}
  var gender='男';var gs=document.getElementsByName('sh-gender');for(var i=0;i<gs.length;i++){if(gs[i].checked)gender=gs[i].value;}
  
  try {
    // === 八字数据 ===
    var sf=Solar.fromYmdHms(y,m,d,h,0,0);var lf=sf.getLunar();lf.getEightChar().setSect(1);var ec=lf.getEightChar();
    var bazi=ec.getYear()+ec.getMonth()+ec.getDay()+ec.getTime();
    var dm=ec.getDayGan();var gans=[ec.getYearGan(),ec.getMonthGan(),ec.getDayGan(),ec.getTimeGan()];
    var zhis=[ec.getYearZhi(),ec.getMonthZhi(),ec.getDayZhi(),ec.getTimeZhi()];
    var ss=[ec.getYearShiShenGan(),ec.getMonthShiShenGan(),'日主',ec.getTimeShiShenGan()];
    // 五行统计
    var wc={jin:0,mu:0,shui:0,huo:0,tu:0};
    [ec.getYearWuXing(),ec.getMonthWuXing(),ec.getDayWuXing(),ec.getTimeWuXing()].forEach(function(w){
      var cs=typeof w==='string'?w.split(''):[];cs.forEach(function(c){var mp={金:'jin',木:'mu',水:'shui',火:'huo',土:'tu'};if(mp[c])wc[mp[c]]++;});
    });
    var wxNames={jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
    var mxc='',mxv=0;['mu','huo','tu','jin','shui'].forEach(function(k){if(wc[k]>mxv){mxv=wc[k];mxc=k;}});

    // === 紫微数据 ===
    var ds=y+'-'+m+'-'+d;
    var chart=iztro.astro.bySolar(ds,h,gender,'zh-CN');
    var soulPalace=chart.palaces.find(function(p){return p.isOriginalPalace;});
    var soulName=soulPalace?chart.soul:'?';
    var bodyName=chart.body||'?';
    var fecMap={water2nd:'水二局',wood3rd:'木三局',metal4th:'金四局',earth5th:'土五局',fire6th:'火六局'};

    // === 七政数据 ===
    var qzData=calcQiZhengData(y,m,d,h);

    // === 渲染 ===
    var h='<div class="result-card"><div class="rc-header">☯ 三术合参 · '+name+'</div>';
    
    // 基本信息
    h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:10px">';
    h+='<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">姓名</div><div style="font-weight:700;color:var(--teal)">'+name+'</div></div>';
    h+='<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">性别</div><div style="font-weight:700;color:var(--teal)">'+gender+'</div></div>';
    h+='<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">生辰</div><div style="font-weight:700;color:var(--teal);font-size:12px">'+y+'年'+m+'月'+d+'日</div></div>';
    h+='<div style="background:var(--bg-card2);padding:6px;text-align:center;border-radius:4px"><div style="font-size:9px;color:#999">日主</div><div style="font-weight:700;font-size:16px;color:'+getCharColor(dm)+'">'+dm+'</div></div>';
    h+='</div>';
    
    // 三盘对比
    h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">';
    
    // 八字
    h+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:8px">';
    h+='<div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:4px;text-align:center">📜 八字</div>';
    h+='<div style="text-align:center;font-size:16px;font-weight:700;letter-spacing:3px">'+colorGZ(bazi)+'</div>';
    h+='<div style="text-align:center;font-size:10px;color:#666;margin-top:4px">日主：<b style="color:'+getCharColor(dm)+'">'+dm+'</b> | 最旺：<b>'+wxNames[mxc]+'</b></div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;justify-content:center">';
    ['mu','huo','tu','jin','shui'].forEach(function(k){h+='<span style="font-size:9px;color:'+getCharColor(wxNames[k])+'">'+wxNames[k]+wc[k]+'</span> ';});
    h+='</div></div>';
    
    // 紫微
    h+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:8px">';
    h+='<div style="font-size:10px;font-weight:700;color:var(--teal);margin-bottom:4px;text-align:center">⭐ 紫微斗数</div>';
    h+='<div style="text-align:center;font-size:12px;font-weight:600">命宫：<b>'+soulName+'</b></div>';
    h+='<div style="text-align:center;font-size:11px;color:#666;margin-top:2px">身主：'+bodyName+'</div>';
    h+='<div style="text-align:center;font-size:11px;color:#666">五行局：'+(fecMap[chart.fiveElementsClass]||chart.fiveElementsClass)+'</div>';
    h+='<div style="font-size:9px;color:#999;margin-top:4px;text-align:center">命宫主星：'+(soulPalace?colorGZ(soulPalace.majorStars.map(function(s){return s.name;}).join('、')||'空宫'):'')+'</div>';
    h+='</div>';
    
    // 七政
    h+='<div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:6px;padding:8px">';
    h+='<div style="font-size:10px;font-weight:700;color:var(--gold);margin-bottom:4px;text-align:center">☀️ 七政四余</div>';
    if(qzData&&qzData.qz){
      h+='<div style="text-align:center;font-size:11px">日：<b>'+qzData.qz[0].man+'宿</b> | 月：<b>'+qzData.qz[1].man+'宿</b></div>';
      h+='<div style="text-align:center;font-size:10px;color:#666;margin-top:2px">木：'+qzData.qz[5].man+'宿 | 土：'+qzData.qz[6].man+'宿</div>';
      h+='<div style="font-size:9px;color:#999;margin-top:4px;text-align:center">当日值宿：'+(qzData.dm?qzData.dm.man+'宿':'—')+'</div>';
    } else {h+='<div style="text-align:center;font-size:10px;color:#999">天文库未加载</div>';}
    h+='</div></div>';
    
    // 三盘互证解读
    h+='<div class="result-card" style="margin:0"><div class="rc-header">🔍 三盘互证解读</div><div class="rc-text">';
    var dmWx=ganWx(GAN_LIST.indexOf(dm));
    h+='<div style="margin-bottom:6px"><b>📜 八字层面：</b>命主为<b style="color:'+getCharColor(dm)+'">'+dm+'</b>日生人（'+dmWx+'命），八字<b>'+colorGZ(bazi)+'</b>。';
    if(mxc) h+='五行以<b style="color:'+getCharColor(wxNames[mxc])+'">'+wxNames[mxc]+'</b>为最旺。';
    h+='</div>';
    h+='<div style="margin-bottom:6px"><b>⭐ 紫微层面：</b>命宫在<b>'+soulName+'</b>，五行局为'+(fecMap[chart.fiveElementsClass]||chart.fiveElementsClass)+'。';
    if(soulPalace&&soulPalace.majorStars.length){
      var mainStars=soulPalace.majorStars.map(function(s){return s.name;}).join('、');
      h+='命宫主星为<b>'+colorGZ(mainStars)+'</b>。';
    } else {h+='命宫为空宫，借对宫星曜。';}
    h+='</div>';
    if(qzData&&qzData.qz){
      h+='<div style="margin-bottom:6px"><b>☀️ 七政层面：</b>太阳在<b>'+qzData.qz[0].man+'宿</b>，太阴在<b>'+qzData.qz[1].man+'宿</b>。';
      h+='当年值宿为<b>'+qzData.qz[0].man+'宿</b>。';
      h+='</div>';
    }
    // 综合
    h+='<div style="margin-top:6px;padding:6px;background:#FAF5E8;font-size:11px;color:#666;line-height:1.6">';
    h+='🤖 <b>命理分析：</b>三术合参从三个维度分析命盘——八字看气数格局，紫微看十二宫星曜分布，七政看天文星象。三盘互证可相互补充印证，提供更全面的解读视角。';
    h+='</div></div></div></div>';
    
    document.getElementById('sanhe-result').innerHTML=h;
    document.getElementById('sanhe-result').classList.add('show');
  } catch(e){
    document.getElementById('sanhe-result').innerHTML='<div class="result-card"><div style="color:var(--red);padding:10px">排盘出错：'+e.message+'</div></div>';
    document.getElementById('sanhe-result').classList.add('show');
  }
}

// 初始化
filterCangJing('all');
(function(){
  var cy=new Date().getFullYear();
  ['qz','wx','sh'].forEach(function(p){
    ['year','lyear'].forEach(function(f){var dl=document.getElementById(p+'-'+f+'-list');if(dl){for(var y=cy;y>=1900;y--){var o=document.createElement('option');o.value=y;dl.appendChild(o);}}});
    ['month','lmonth'].forEach(function(f){var dl=document.getElementById(p+'-'+f+'-list');if(dl){for(var m=1;m<=12;m++){var o=document.createElement('option');o.value=m;dl.appendChild(o);}}});
    ['day','lday'].forEach(function(f){var dl=document.getElementById(p+'-'+f+'-list');if(dl){for(var d=1;d<=31;d++){var o=document.createElement('option');o.value=d;dl.appendChild(o);}}});
  });
})();
if(typeof WX_NAMES2==='undefined')var WX_NAMES2={jin:'金',mu:'木',shui:'水',huo:'火',tu:'土'};
['qizheng','sanhe','qimen','liuren','liuyao','shiling','baibaodai','cangjing'].forEach(function(n){registerSection(n,function(){});});
// AI 分析 Worker 地址（部署Cloudflare Worker后填写）
// 格式: https://你的worker名称.你的用户名.workers.dev
window.AI_WORKER_URL = ''; // 留空=使用规则分析，填入URL=启用AI分析
console.log('命理融合版·全板块加载完成 ✅');
