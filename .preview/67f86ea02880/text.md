<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="0 册藏书 · 0 册已读完">
  <title>封面墙 — 阅读书房</title>
  <!-- Preconnect to external origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.weread.qq.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <!-- Preload critical fonts -->
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"></noscript>
  <!-- Main stylesheet -->
  <link rel="stylesheet" href="file:///C:/Users/huang/Documents/Projects/reading-room/public/css/main.css?v=76">
  <!-- Classics pages stylesheet -->
  <link rel="stylesheet" href="file:///C:/Users/huang/Documents/Projects/reading-room/public/css/classics.css?v=1">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='2' fill='%231a2744'/><text x='16' y='22' text-anchor='middle' font-size='16' fill='white'>读</text></svg>">
</head>
<body>
  <!-- Page Loader -->
  <div class="page-loader" id="page-loader">
    <div class="loader-ring"></div>
    <span class="loader-text">阅读书房</span>
  </div>

  <!-- Reading Progress Bar -->
  <div class="reading-progress-bar" id="reading-progress"></div>

  <div class="site-wrapper" id="site-wrapper" style="opacity:0;">
    <!-- Navigation -->
    <nav class="nav" id="main-nav">
      <div class="nav-inner">
        <a href="/" class="nav-brand">阅读书房</a>
        <div class="nav-links">
          <a href="/bookshelf" class="nav-link ">万卷楼</a>
          <a href="/authors" class="nav-link ">文友录</a>
          <a href="/notebooks" class="nav-link ">札记</a>
          <a href="/quotes" class="nav-link ">珠玉集</a>
          <a href="/booklists" class="nav-link ">书单卷</a>
          <a href="/cards" class="nav-link ">识卡集</a>
          <a href="/stats" class="nav-link ">读书纪</a>
          <a href="/covers" class="nav-link active">书衣墙</a>
          <a href="/badges" class="nav-link ">功勋录</a>
          <a href="/timeline" class="nav-link ">阅读年轮</a>
          <a href="/report" class="nav-link ">报告</a>
          <a href="/search" class="nav-link " title="搜索">🔍</a>
          <button id="theme-toggle" class="theme-toggle" aria-label="切换主题">◐</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <!-- ═══════════════════════════════════════════
   COVER WALL — Book Cover Gallery
   书衣墙 = 封面画廊（视觉优先） / 万卷楼 = 管理书架（信息优先）
   ═══════════════════════════════════════════ -->

<div class="cw-container">

  <header class="cw-hero">
    <div class="cw-hero-ornament" aria-hidden="true">封面</div>
    <h1 class="cw-hero-title">书衣墙</h1>
    <p class="cw-hero-lede">
      <span>232 册藏书</span>
      <span class="cw-hero-sep">·</span>
      <span>81 册已读完</span>
    </p>
    <div class="cw-hero-rule"></div>
  </header>

  <!-- 画廊工具条：纯封面索引，不承担筛选进度等管理职责 -->
  <div class="cw-toolbar">
    <p class="cw-toolbar-note">以封面为索引，一眼望尽整座书房。</p>
    <div class="cw-filter" id="cw-filter">
      <button class="cw-filter-tag active" data-f="all">全部 <span class="cw-filter-count">232</span></button>
      <button class="cw-filter-tag" data-f="finished">已读完 <span class="cw-filter-count">81</span></button>
    </div>
  </div>

  <div class="cw-grid" id="cw-grid">
    
    <div class="cw-item finished">
      <a href="/book/3300062490" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/33/cpplatform_vj9tybqkzue1oaqhueqxur/t7_cpplatform_vj9tybqkzue1oaqhueqxur1687682069.jpg" alt="德国古典哲学讲演录" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">德国古典哲学讲演录</div>
          <div class="cw-overlay-author">邓晓芒</div>
          
          <div class="cw-overlay-time">22h 45m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/31808219" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/28/YueWen_31808219/t7_YueWen_31808219.jpg" alt="卡拉马佐夫兄弟（套装上下册）（陀思妥耶夫斯基文集2015）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">卡拉马佐夫兄弟（套装上下册）（陀思妥耶夫斯基文集2015）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">23h 33m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/547153" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/35/YueWen_547153/t7_YueWen_547153.jpg" alt="欧亨利短篇小说精选（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">欧亨利短篇小说精选（果麦经典）</div>
          <div class="cw-overlay-author">[美]欧·亨利</div>
          
          <div class="cw-overlay-time">6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/38243628" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/24/YueWen_38243628/t7_YueWen_38243628.jpg" alt="中国古代文学作品选（二）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">中国古代文学作品选（二）</div>
          <div class="cw-overlay-author">袁世硕主编</div>
          
          <div class="cw-overlay-time">10h 10m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/31808223" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/223/31808223/t7_31808223.jpg" alt="白痴（陀思妥耶夫斯基文集2015）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">白痴（陀思妥耶夫斯基文集2015）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">23h 50m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/31855607" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/71/YueWen_31855607/t7_YueWen_31855607.jpg" alt="浮士德（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">浮士德（果麦经典）</div>
          <div class="cw-overlay-author">歌德</div>
          
          <div class="cw-overlay-time">11h 15m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/813306" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/306/813306/t7_813306.jpg" alt="诗经（彩图精装）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">诗经（彩图精装）</div>
          <div class="cw-overlay-author">沐言非</div>
          
          <div class="cw-overlay-time">9h 19m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/934396" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/396/934396/t7_934396.jpg" alt="另一个，同一个" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">另一个，同一个</div>
          <div class="cw-overlay-author">[阿根廷]豪尔赫·路易斯·博尔赫斯</div>
          
          <div class="cw-overlay-time">3h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/934395" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/85/YueWen_934395/t7_YueWen_934395.jpg" alt="深沉的玫瑰" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">深沉的玫瑰</div>
          <div class="cw-overlay-author">[阿根廷]豪尔赫·路易斯·博尔赫斯</div>
          
          <div class="cw-overlay-time">1h 43m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/546339" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/46/yuewen_546339/t7_yuewen_5463391747707629.jpg" alt="追风筝的人（珍藏纪念版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">追风筝的人（珍藏纪念版）</div>
          <div class="cw-overlay-author">卡勒德·胡赛尼</div>
          
          <div class="cw-overlay-time">8h 21m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/31808213" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/22/YueWen_31808213/t7_YueWen_31808213.jpg" alt="被伤害与侮辱的人们（陀思妥耶夫斯基文集2015）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">被伤害与侮辱的人们（陀思妥耶夫斯基文集2015）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">12h 29m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24931147" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/79/YueWen_24931147/t7_YueWen_24931147.jpg" alt="罪与罚（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">罪与罚（果麦经典）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">11h 15m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_3EkFgsFedAR56yN6xNAhC7JN" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_4Ah8Mp8Nf3Ec6xq6x2GQH0gu_parsecover" alt="Notes from Underground" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">Notes from Underground</div>
          <div class="cw-overlay-author">Fyodor Dostoevsky</div>
          
          <div class="cw-overlay-time">41m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/35010008" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/23/YueWen_35010008/t7_YueWen_35010008.jpg" alt="地下室手记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">地下室手记</div>
          <div class="cw-overlay-author">[俄]陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">13h 16m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300020505" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/5/3300020505/t7_3300020505.jpg" alt="苦妓回忆录" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">苦妓回忆录</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">2h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/41077542" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/36/yuewen_41077542/t7_yuewen_410775421677481318.jpg" alt="群魔（全集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">群魔（全集）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">21h 39m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/32847310" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/310/32847310/t7_32847310.jpg" alt="包法利夫人（译文经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">包法利夫人（译文经典）</div>
          <div class="cw-overlay-author">[法]福楼拜</div>
          
          <div class="cw-overlay-time">14h 59m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/931848" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/65/YueWen_931848/t7_YueWen_931848.jpg" alt="诗经（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">诗经（果麦经典）</div>
          <div class="cw-overlay-author">骆玉明解注 细井徇撰绘</div>
          
          <div class="cw-overlay-time">12m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300124239" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/34/cpplatform_9gqryhwrursus8t8hxixjq/t7_cpplatform_9gqryhwrursus8t8hxixjq1733479654.jpg" alt="麦克白" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">麦克白</div>
          <div class="cw-overlay-author">[英]莎士比亚</div>
          
          <div class="cw-overlay-time">1h 40m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300177485" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/56/cpplatform_bjjn1i32y65zfxql2gbabm/t7_cpplatform_bjjn1i32y65zfxql2gbabm1763345062.jpg" alt="刀锋" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">刀锋</div>
          <div class="cw-overlay-author">[英]威廉·萨默赛特·毛姆</div>
          
          <div class="cw-overlay-time">16h 23m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300041002" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/9/cpPlatform_jfyqjvugCc6VkE689iyfiL/t7_cpPlatform_jfyqjvugCc6VkE689iyfiL.jpg" alt="面纱（珍藏版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">面纱（珍藏版）</div>
          <div class="cw-overlay-author">[英]W.毛姆·萨默塞特</div>
          
          <div class="cw-overlay-time">5h 17m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/25352935" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/34/YueWen_25352935/t7_YueWen_25352935.jpg" alt="T. S. 艾略特文集（全5卷）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">T. S. 艾略特文集（全5卷）</div>
          <div class="cw-overlay-author">托·斯·艾略特</div>
          
          <div class="cw-overlay-time">1h 18m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/26435427" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/79/yuewen_26435427/t7_yuewen_264354271701758059.jpg" alt="生死疲劳【中国诺奖得主代表作】" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">生死疲劳【中国诺奖得主代表作】</div>
          <div class="cw-overlay-author">莫言</div>
          
          <div class="cw-overlay-time">18h 57m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/25561846" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/9/YueWen_25561846/t7_YueWen_25561846.jpg" alt="一九八四（译文经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">一九八四（译文经典）</div>
          <div class="cw-overlay-author">乔治·奥威尔</div>
          
          <div class="cw-overlay-time">8m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/41128921" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/38/yuewen_41128921/t7_yuewen_411289211747281306.jpg" alt="未来形而上学导论（注释本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">未来形而上学导论（注释本）</div>
          <div class="cw-overlay-author">[德]康德</div>
          
          <div class="cw-overlay-time">34m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/823008" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/27/YueWen_823008/t7_YueWen_823008.jpg" alt="浮士德" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">浮士德</div>
          <div class="cw-overlay-author">歌德</div>
          
          <div class="cw-overlay-time">10h 12m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/40223839" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/839/40223839/t7_40223839.jpg" alt="新摄影笔记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">新摄影笔记</div>
          <div class="cw-overlay-author">宁思潇潇</div>
          
          <div class="cw-overlay-time">2h 13m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/40870009" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/12/YueWen_40870009/t7_YueWen_40870009.jpg" alt="摄影的起点：人像摄影必练的96个技法" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">摄影的起点：人像摄影必练的96个技法</div>
          <div class="cw-overlay-author">视觉中国500px社区六合视界部落编著</div>
          
          <div class="cw-overlay-time">25m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300190310" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/62/cpplatform_jtfcmoz5v39peytatusmsn/t7_cpplatform_jtfcmoz5v39peytatusmsn1767596736.jpg" alt="基督山伯爵" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">基督山伯爵</div>
          <div class="cw-overlay-author">[法]大仲马</div>
          
          <div class="cw-overlay-time">12h 23m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300010685" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/85/3300010685/t7_3300010685.jpg" alt="一地鸡毛（典藏版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">一地鸡毛（典藏版）</div>
          <div class="cw-overlay-author">刘震云</div>
          
          <div class="cw-overlay-time">8h 51m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/29963814" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/96/YueWen_29963814/t7_YueWen_29963814.jpg" alt="死魂灵" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">死魂灵</div>
          <div class="cw-overlay-author">果戈里</div>
          
          <div class="cw-overlay-time">7h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300062286" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/35/cpplatform_fjtyw82jznn4crpdunuvut/t7_cpplatform_fjtyw82jznn4crpdunuvut1687257945.jpg" alt="当代英雄（经典译林）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">当代英雄（经典译林）</div>
          <div class="cw-overlay-author">莱蒙托夫</div>
          
          <div class="cw-overlay-time">4h 49m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/25658417" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/76/YueWen_25658417/t7_YueWen_25658417.jpg" alt="叶甫盖尼·奥涅金" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">叶甫盖尼·奥涅金</div>
          <div class="cw-overlay-author">[俄]普希金</div>
          
          <div class="cw-overlay-time">16h 47m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300096053" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/88/cpplatform_82d2fe6ofrq6c2uuz3csjf/t7_cpplatform_82d2fe6ofrq6c2uuz3csjf1713776743.jpg" alt="庄子今注今译（全两册）（最新修订版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">庄子今注今译（全两册）（最新修订版）</div>
          <div class="cw-overlay-author">陈鼓应</div>
          
          <div class="cw-overlay-time">18h 32m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/38957076" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/5/YueWen_38957076/t7_YueWen_38957076.jpg" alt="“丰饶之海”四部曲：《春雪》+《奔马》+《晓寺》+《天人五衰》" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">“丰饶之海”四部曲：《春雪》+《奔马》+《晓寺》+《天人五衰》</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">2h 6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23303827" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/4/YueWen_23303827/t7_YueWen_23303827.jpg" alt="务虚笔记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">务虚笔记</div>
          <div class="cw-overlay-author">史铁生</div>
          
          <div class="cw-overlay-time">1h 0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/32324371" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/47/YueWen_32324371/t7_YueWen_32324371.jpg" alt="李煜词（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">李煜词（果麦经典）</div>
          <div class="cw-overlay-author">[五代]李煜</div>
          
          <div class="cw-overlay-time">5h 44m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24953426" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/75/YueWen_24953426/t7_YueWen_24953426.jpg" alt="宇宙奇趣全集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">宇宙奇趣全集</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          <div class="cw-overlay-time">14h 41m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300024943" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/43/3300024943/t7_3300024943.jpg" alt="一句顶一万句（2022新版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">一句顶一万句（2022新版）</div>
          <div class="cw-overlay-author">刘震云</div>
          
          <div class="cw-overlay-time">9h 34m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24953415" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/415/24953415/t7_24953415.jpg" alt="树上的男爵" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">树上的男爵</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          <div class="cw-overlay-time">12h 17m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300029509" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/93/cpplatform_n6pygzvohhlz6ptzuqc71t/t7_cpplatform_n6pygzvohhlz6ptzuqc71t1677499045.jpg" alt="宋词鉴赏辞典（新一版）（套装共2册）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">宋词鉴赏辞典（新一版）（套装共2册）</div>
          <div class="cw-overlay-author">上海辞书出版社文学鉴赏辞典编纂中心</div>
          
          <div class="cw-overlay-time">7h 41m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/40400902" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/7/YueWen_40400902/t7_YueWen_40400902.jpg" alt="我孤独地漫游，如一朵云：华兹华斯抒情诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">我孤独地漫游，如一朵云：华兹华斯抒情诗选</div>
          <div class="cw-overlay-author">华兹华斯</div>
          
          <div class="cw-overlay-time">1h 23m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300003479" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/14/cpPlatform_3300003479/t7_cpPlatform_3300003479.jpg" alt="仲夏之死" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">仲夏之死</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300193074" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/54/cpplatform_5tdxeh9dnfhd775o6xuwrv/t7_cpplatform_5tdxeh9dnfhd775o6xuwrv1769046909.jpg" alt="人性的枷锁" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人性的枷锁</div>
          <div class="cw-overlay-author">[英]威廉·萨默塞特·毛姆</div>
          
          <div class="cw-overlay-time">18h 0m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/34632166" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/166/34632166/t7_34632166.jpg" alt="断头王后：玛丽·安托瓦内特传" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">断头王后：玛丽·安托瓦内特传</div>
          <div class="cw-overlay-author">斯·茨威格</div>
          
          <div class="cw-overlay-time">17h 28m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/25445345" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/38/YueWen_25445345/t7_YueWen_25445345.jpg" alt="文心雕龙（中华国学经典精粹）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">文心雕龙（中华国学经典精粹）</div>
          <div class="cw-overlay-author">[南朝梁]刘勰</div>
          
          <div class="cw-overlay-time">7m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/41597181" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/20/YueWen_41597181/t7_YueWen_41597181.jpg" alt="道林·格雷的画像" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">道林·格雷的画像</div>
          <div class="cw-overlay-author">[英]奥斯卡·王尔德</div>
          
          <div class="cw-overlay-time">3h 53m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/813482" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/92/YueWen_813482/t7_YueWen_813482.jpg" alt="通往奴役之路（珍藏版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">通往奴役之路（珍藏版）</div>
          <div class="cw-overlay-author">[英]弗里德里希·奥古斯特·冯·哈耶克</div>
          
          <div class="cw-overlay-time">21m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/23358839" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/97/YueWen_23358839/t7_YueWen_23358839.jpg" alt="庄子（中华经典指掌文库）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">庄子（中华经典指掌文库）</div>
          <div class="cw-overlay-author">孙通海译注</div>
          
          <div class="cw-overlay-time">18h 27m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/794267" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/73/yuewen_794267/t7_yuewen_7942671679654585.jpg" alt="竹山词" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">竹山词</div>
          <div class="cw-overlay-author">蒋捷</div>
          
          <div class="cw-overlay-time">10m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300070773" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/74/cpplatform_ccxtcbletjadrw7otwyyzd/t7_cpplatform_ccxtcbletjadrw7otwyyzd1694158220.jpg" alt="千只鹤" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">千只鹤</div>
          <div class="cw-overlay-author">川端康成</div>
          
          <div class="cw-overlay-time">2m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/38818166" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/55/YueWen_38818166/t7_YueWen_38818166.jpg" alt="卡拉马佐夫兄弟" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">卡拉马佐夫兄弟</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          <div class="cw-overlay-time">18h 12m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300114090" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/63/cpplatform_2az6tjsiewaxkmj3h1tvqk/t7_cpplatform_2az6tjsiewaxkmj3h1tvqk1725445781.jpg" alt="叶尔绍夫兄弟" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">叶尔绍夫兄弟</div>
          <div class="cw-overlay-author">[苏]柯切托夫</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/CB_BK053s56i9hi72Y71U3zjGvR" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_5IeEMCEKN4Vb72V71F6nS8f3_parsecover" alt="第一哲学沉思集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">第一哲学沉思集</div>
          <div class="cw-overlay-author">笛卡尔</div>
          
          <div class="cw-overlay-time">9h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/41923699" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/49/YueWen_41923699/t7_YueWen_41923699.jpg" alt="鱼没有脚" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">鱼没有脚</div>
          <div class="cw-overlay-author">约恩·卡尔曼·斯特凡松</div>
          
          <div class="cw-overlay-time">17h 0m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/35458101" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/37/YueWen_35458101/t7_YueWen_35458101.jpg" alt="春雪（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">春雪（果麦经典）</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">52m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/25912993" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/4/YueWen_25912993/t7_YueWen_25912993.jpg" alt="荷马史诗《伊利亚特》（罗念生全集·第六卷）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">荷马史诗《伊利亚特》（罗念生全集·第六卷）</div>
          <div class="cw-overlay-author">[古希腊]荷马</div>
          
          <div class="cw-overlay-time">48m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/935536" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/49/yuewen_935536/t7_yuewen_9355361682243599.jpg" alt="百年孤独" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">百年孤独</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">19h 1m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300118695" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/61/cpplatform_5wxycrvfybgsw8itfpvd3f/t7_cpplatform_5wxycrvfybgsw8itfpvd3f1729677220.jpg" alt="雪国" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">雪国</div>
          <div class="cw-overlay-author">[日]川端康成</div>
          
          <div class="cw-overlay-time">1h 30m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300020475" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/75/3300020475/t7_3300020475.jpg" alt="族长的秋天" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">族长的秋天</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">13h 55m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300059718" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/74/cpplatform_kkhuhxbytjvbrrmy9sasbc/t7_cpplatform_kkhuhxbytjvbrrmy9sasbc1684983414.jpg" alt="隧道" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">隧道</div>
          <div class="cw-overlay-author">埃内斯托·萨瓦托</div>
          
          <div class="cw-overlay-time">2h 5m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26392183" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/96/yuewen_26392183/t7_yuewen_263921831724826980.jpg" alt="康德三大批判合集（注释版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">康德三大批判合集（注释版）</div>
          <div class="cw-overlay-author">康德</div>
          
          <div class="cw-overlay-time">14m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300170859" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/75/cpplatform_8zijuuyjqzrkrez4mhl794/t7_cpplatform_8zijuuyjqzrkrez4mhl7941761039889.jpg" alt="宋词三百首鉴赏辞典(新一版)" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">宋词三百首鉴赏辞典(新一版)</div>
          <div class="cw-overlay-author">上海辞书出版社文学鉴赏辞典编纂中心</div>
          
          <div class="cw-overlay-time">27m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_0RU7Ee7EK9Uz6y56xN3V8F6G" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_5iN4qh4ptF2c6iU6gk1Xb3DS_parsecover" alt="Meditations on First Philosophy" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">Meditations on First Philosophy</div>
          <div class="cw-overlay-author">René Descartes</div>
          
          <div class="cw-overlay-time">12h 40m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300142142" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/65/cpplatform_dfth123rxbbu6ki2utnqsz/t7_cpplatform_dfth123rxbbu6ki2utnqsz1745389220.jpg" alt="人类理解研究" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人类理解研究</div>
          <div class="cw-overlay-author">[英]大卫·休谟</div>
          
          <div class="cw-overlay-time">15h 46m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300048646" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/95/cpplatform_u4p5habtcaxxjanfqnmvwy/t7_cpplatform_u4p5habtcaxxjanfqnmvwy1676355720.jpg" alt="逻辑学导论（第15版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">逻辑学导论（第15版）</div>
          <div class="cw-overlay-author">欧文·M.柯匹 卡尔·科恩 维克多·罗迪奇</div>
          
          <div class="cw-overlay-time">24m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33617200" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/200/33617200/t7_33617200.jpg" alt="人类理解论（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人类理解论（英文版）</div>
          <div class="cw-overlay-author">[英]约翰·洛克</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26392111" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/111/26392111/t7_26392111.jpg" alt="人类理解论（上、下）（中文导读插图版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人类理解论（上、下）（中文导读插图版）</div>
          <div class="cw-overlay-author">[英]约翰·洛克</div>
          
          <div class="cw-overlay-time">2m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/34631923" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/19/yuewen_34631923/t7_yuewen_346319231678861063.jpg" alt="堂吉诃德（全集）（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">堂吉诃德（全集）（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">[西]塞万提斯</div>
          
          <div class="cw-overlay-time">18h 3m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300161182" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/10/cpplatform_famqgwrc44wfwhplqnvs5f/t7_cpplatform_famqgwrc44wfwhplqnvs5f1756785269.jpg" alt="古都" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">古都</div>
          <div class="cw-overlay-author">[日]川端康成</div>
          
          <div class="cw-overlay-time">4h 46m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300036849" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/65/cpPlatform_sYggdNx9F8W1nkfT1BwFYC/t7_cpPlatform_sYggdNx9F8W1nkfT1BwFYC.jpg" alt="假面的告白（三岛由纪夫作品系列）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">假面的告白（三岛由纪夫作品系列）</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">19m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/35523626" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/626/35523626/t7_35523626.jpg" alt="潮骚" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">潮骚</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">12m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300003470" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/5/cpPlatform_3300003470/t7_cpPlatform_3300003470.jpg" alt="金阁寺" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">金阁寺</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          <div class="cw-overlay-time">15h 57m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300161084" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/53/cpplatform_6bfrscerekw9xcxjt4ynfu/t7_cpplatform_6bfrscerekw9xcxjt4ynfu1756867293.jpg" alt="加缪情书集：全2册（完整集结首次出版！）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">加缪情书集：全2册（完整集结首次出版！）</div>
          <div class="cw-overlay-author">[法]阿尔贝·加缪  [西]玛丽亚·卡萨雷斯</div>
          
          <div class="cw-overlay-time">6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300145296" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/96/cpplatform_cngee56vdmazkh8zxkwtja/t7_cpplatform_cngee56vdmazkh8zxkwtja1752237727.jpg" alt="与妻书（轻古籍）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">与妻书（轻古籍）</div>
          <div class="cw-overlay-author">林觉民著 杨福廷解读</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300141115" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/38/cpplatform_hv3yybck28arlqw1quyjex/t7_cpplatform_hv3yybck28arlqw1quyjex1752237723.jpg" alt="兰亭集序（轻古籍）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">兰亭集序（轻古籍）</div>
          <div class="cw-overlay-author">[东晋]王羲之著 徐若央解读</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300137659" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/65/cpplatform_czyil47wlay2tedcfobink/t7_cpplatform_czyil47wlay2tedcfobink1752237732.jpg" alt="表象与现实（轻经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">表象与现实（轻经典）</div>
          <div class="cw-overlay-author">[英]毛姆</div>
          
          <div class="cw-overlay-time">26m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/853104" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/99/YueWen_853104/t7_YueWen_853104.jpg" alt="自深深处" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">自深深处</div>
          <div class="cw-overlay-author">[英]奥斯卡·王尔德</div>
          
          <div class="cw-overlay-time">9h 26m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300168701" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/80/cpplatform_w2usy2fmqk4c3a7unpub5y/t7_cpplatform_w2usy2fmqk4c3a7unpub5y1760181009.jpg" alt="唐璜" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">唐璜</div>
          <div class="cw-overlay-author">[英]拜伦</div>
          
          <div class="cw-overlay-time">3h 40m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300024284" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/84/3300024284/t7_3300024284.jpg" alt="毛泽东选集（全四卷）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">毛泽东选集（全四卷）</div>
          <div class="cw-overlay-author"></div>
          
          <div class="cw-overlay-time">10h 53m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/34631900" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/30/YueWen_34631900/t7_YueWen_34631900.jpg" alt="巨人传（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">巨人传（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">[法]拉伯雷</div>
          
          <div class="cw-overlay-time">8h 34m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33617120" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/71/YueWen_33617120/t7_YueWen_33617120.jpg" alt="唐璜（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">唐璜（英文版）</div>
          <div class="cw-overlay-author">[英]拜伦</div>
          
          <div class="cw-overlay-time">8m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26392031" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/31/26392031/t7_26392031.jpg" alt="亚里士多德关于本体的学说" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">亚里士多德关于本体的学说</div>
          <div class="cw-overlay-author">汪子嵩</div>
          
          <div class="cw-overlay-time">5h 0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33820335" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/87/YueWen_33820335/t7_YueWen_33820335.jpg" alt="喧哗与骚动（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">喧哗与骚动（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">威廉·福克纳</div>
          
          <div class="cw-overlay-time">5m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300056212" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/75/cpplatform_1q8ewfn7gggvddjbln9b6c/t7_cpplatform_1q8ewfn7gggvddjbln9b6c1681900091.jpg" alt="西方哲学史（增补修订版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">西方哲学史（增补修订版）</div>
          <div class="cw-overlay-author">弗兰克·梯利</div>
          
          <div class="cw-overlay-time">8h 25m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/855327" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/68/YueWen_855327/t7_YueWen_855327.jpg" alt="悉达多（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">悉达多（果麦经典）</div>
          <div class="cw-overlay-author">[德]赫尔曼·黑塞</div>
          
          <div class="cw-overlay-time">3h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300151384" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/48/cpplatform_bxripgsmchfc2hwuxk5wsg/t7_cpplatform_bxripgsmchfc2hwuxk5wsg1751535923.jpg" alt="要么孤独要么庸俗" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">要么孤独要么庸俗</div>
          <div class="cw-overlay-author">[德]叔本华</div>
          
          <div class="cw-overlay-time">11h 53m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24987279" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/38/YueWen_24987279/t7_YueWen_24987279.jpg" alt="拿破仑传（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">拿破仑传（果麦经典）</div>
          <div class="cw-overlay-author">[德]路德维希</div>
          
          <div class="cw-overlay-time">21h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/25136619" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/41/YueWen_25136619/t7_YueWen_25136619.jpg" alt="审判（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">审判（果麦经典）</div>
          <div class="cw-overlay-author">弗兰茨·卡夫卡</div>
          
          <div class="cw-overlay-time">11h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/23976188" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/188/23976188/t7_23976188.jpg" alt="克林索尔的最后夏天（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">克林索尔的最后夏天（果麦经典）</div>
          <div class="cw-overlay-author">[德]赫尔曼·黑塞</div>
          
          <div class="cw-overlay-time">6h 53m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33209731" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/731/33209731/t7_33209731.jpg" alt="作为意志和表象的世界（汉译世界学术名著丛书）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">作为意志和表象的世界（汉译世界学术名著丛书）</div>
          <div class="cw-overlay-author">阿图尔·叔本华</div>
          
          <div class="cw-overlay-time">10m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33889253" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/253/33889253/t7_33889253.jpg" alt="历史与阶级意识（汉译世界学术名著丛书）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">历史与阶级意识（汉译世界学术名著丛书）</div>
          <div class="cw-overlay-author">格奥尔格·卢卡奇</div>
          
          <div class="cw-overlay-time">3m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/42724927" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/67/YueWen_42724927/t7_YueWen_42724927.jpg" alt="西方哲学史讲演录" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">西方哲学史讲演录</div>
          <div class="cw-overlay-author">赵林</div>
          
          <div class="cw-overlay-time">24h 13m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300141119" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/25/cpplatform_i1tww2q8awqbv5z5udoii8/t7_cpplatform_i1tww2q8awqbv5z5udoii81752237723.jpg" alt="前赤壁赋（轻古籍）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">前赤壁赋（轻古籍）</div>
          <div class="cw-overlay-author">[宋]苏轼著 徐若央解读</div>
          
          <div class="cw-overlay-time">1m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33617050" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/50/33617050/t7_33617050.jpg" alt="伊利亚特（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">伊利亚特（英文版）</div>
          <div class="cw-overlay-author">[古希腊]荷马</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33617009" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/57/YueWen_33617009/t7_YueWen_33617009.jpg" alt="奥德赛（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">奥德赛（英文版）</div>
          <div class="cw-overlay-author">[古希腊]荷马</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300133919" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/97/cpplatform_6tkjoxe46deqp23tw49pjj/t7_cpplatform_6tkjoxe46deqp23tw49pjj1739845276.jpg" alt="海德格尔哲学概论" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">海德格尔哲学概论</div>
          <div class="cw-overlay-author">陈嘉映</div>
          
          <div class="cw-overlay-time">6h 6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/38243626" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/626/38243626/t7_38243626.jpg" alt="中国古代文学作品选（一）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">中国古代文学作品选（一）</div>
          <div class="cw-overlay-author">袁世硕主编</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/33627988" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/74/YueWen_33627988/t7_YueWen_33627988.jpg" alt="爱情笔记（阿兰·德波顿作品集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">爱情笔记（阿兰·德波顿作品集）</div>
          <div class="cw-overlay-author">阿兰·德波顿</div>
          
          <div class="cw-overlay-time">9h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/22478614" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/0/YueWen_22478614/t7_YueWen_22478614.jpg" alt="伏尔泰小说精选（读客三个圈经典文库）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">伏尔泰小说精选（读客三个圈经典文库）</div>
          <div class="cw-overlay-author">[法]伏尔泰</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24953399" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/34/YueWen_24953399/t7_YueWen_24953399.jpg" alt="不存在的骑士" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">不存在的骑士</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          <div class="cw-overlay-time">3h 48m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/34357450" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/450/34357450/t7_34357450.jpg" alt="变形记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">变形记</div>
          <div class="cw-overlay-author">卡夫卡</div>
          
          <div class="cw-overlay-time">53m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300161299" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/19/cpplatform_7vofkszbhjvln9v1vddo7b/t7_cpplatform_7vofkszbhjvln9v1vddo7b1756805718.jpg" alt="叔本华论道德与自由" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">叔本华论道德与自由</div>
          <div class="cw-overlay-author">[德]叔本华</div>
          
          <div class="cw-overlay-time">6h 0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300101268" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/53/cpplatform_bt7pvcxn2hemonc2wwha7b/t7_cpplatform_bt7pvcxn2hemonc2wwha7b1716880263.jpg" alt="我喜欢你是寂静的：聂鲁达情诗集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">我喜欢你是寂静的：聂鲁达情诗集</div>
          <div class="cw-overlay-author">[智利]巴勃罗·聂鲁达</div>
          
          <div class="cw-overlay-time">16m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300111137" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/11/cpplatform_nqjnrwlb4ck3kv6bpsgjv8/t7_cpplatform_nqjnrwlb4ck3kv6bpsgjv81723542987.jpg" alt="二十首情诗与一首绝望的歌" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">二十首情诗与一首绝望的歌</div>
          <div class="cw-overlay-author">[智利]巴勃罗·聂鲁达</div>
          
          <div class="cw-overlay-time">5m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300059024" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/1/cpplatform_nppdm9ec6arktuohykt3cr/t7_cpplatform_nppdm9ec6arktuohykt3cr1684312138.jpg" alt="沉思（卡夫卡中短篇作品德文直译全集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">沉思（卡夫卡中短篇作品德文直译全集）</div>
          <div class="cw-overlay-author">弗朗茨·卡夫卡</div>
          
          <div class="cw-overlay-time">13m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/161682" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/682/161682/t7_161682.jpg" alt="凤逆天下北月篇" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">凤逆天下北月篇</div>
          <div class="cw-overlay-author">路非</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/22354423" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/15/YueWen_22354423/t7_YueWen_22354423.jpg" alt="钦差大臣（世界文学名著）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">钦差大臣（世界文学名著）</div>
          <div class="cw-overlay-author">果戈理</div>
          
          <div class="cw-overlay-time">8h 21m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300059396" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/98/cpplatform_hcntirepcbkjziwsodcqnt/t7_cpplatform_hcntirepcbkjziwsodcqnt1684726492.jpg" alt="飞鸟集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">飞鸟集</div>
          <div class="cw-overlay-author">[印度]泰戈尔</div>
          
          <div class="cw-overlay-time">4m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23303652" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/70/YueWen_23303652/t7_YueWen_23303652.jpg" alt="普希金诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">普希金诗选</div>
          <div class="cw-overlay-author">[俄]普希金</div>
          
          <div class="cw-overlay-time">31m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/30448641" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/56/YueWen_30448641/t7_YueWen_30448641.jpg" alt="啊！那往昔的幸福幻想：莱蒙托夫诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">啊！那往昔的幸福幻想：莱蒙托夫诗选</div>
          <div class="cw-overlay-author">莱蒙托夫</div>
          
          <div class="cw-overlay-time">2h 39m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/29600048" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/48/29600048/t7_29600048.jpg" alt="夜莺与玫瑰" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">夜莺与玫瑰</div>
          <div class="cw-overlay-author">[英]奥斯卡·王尔德</div>
          
          <div class="cw-overlay-time">2h 0m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300152962" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/91/cpplatform_jfy136prcdxut1khwimth6/t7_cpplatform_jfy136prcdxut1khwimth61752566487.jpg" alt="叔本华：活出人生的意义" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">叔本华：活出人生的意义</div>
          <div class="cw-overlay-author">[德]叔本华</div>
          
          <div class="cw-overlay-time">5h 59m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/40527638" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/41/YueWen_40527638/t7_YueWen_40527638.jpg" alt="无聊的魅力（阿兰·德波顿作品集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">无聊的魅力（阿兰·德波顿作品集）</div>
          <div class="cw-overlay-author">阿兰·德波顿</div>
          
          <div class="cw-overlay-time">28m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300096125" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/16/cpplatform_hhwqha5pfpack9gtbvyxmv/t7_cpplatform_hhwqha5pfpack9gtbvyxmv1713859385.jpg" alt="宇宙来我手中啄食：维多夫罗诗选（俄耳甫斯诗译丛）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">宇宙来我手中啄食：维多夫罗诗选（俄耳甫斯诗译丛）</div>
          <div class="cw-overlay-author">[智利]比森特•维多夫罗</div>
          
          <div class="cw-overlay-time">37m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/23736455" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/35/YueWen_23736455/t7_YueWen_23736455.jpg" alt="窄门（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">窄门（果麦经典）</div>
          <div class="cw-overlay-author">[法]纪德</div>
          
          <div class="cw-overlay-time">1h 45m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300149941" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/17/cpplatform_1tfvkfmbekvgwr9lrmsf5e/t7_cpplatform_1tfvkfmbekvgwr9lrmsf5e1750674247.jpg" alt="傲慢与偏见（知书经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">傲慢与偏见（知书经典）</div>
          <div class="cw-overlay-author">[英]简·奥斯汀</div>
          
          <div class="cw-overlay-time">8h 47m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300144024" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/37/cpplatform_2a7w8c3x9zsbxqkuza3sub/t7_cpplatform_2a7w8c3x9zsbxqkuza3sub1746773905.jpg" alt="加缪情书集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">加缪情书集</div>
          <div class="cw-overlay-author">[法]阿尔贝·加缪</div>
          
          <div class="cw-overlay-time">1m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24953428" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/77/YueWen_24953428/t7_YueWen_24953428.jpg" alt="分成两半的子爵" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">分成两半的子爵</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          <div class="cw-overlay-time">1h 42m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/37700262" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/87/YueWen_37700262/t7_YueWen_37700262.jpg" alt="反与正·婚礼集·夏天集（郭宏安译加缪文集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">反与正·婚礼集·夏天集（郭宏安译加缪文集）</div>
          <div class="cw-overlay-author">[法]阿尔贝·加缪</div>
          
          <div class="cw-overlay-time">2m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/857770" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/42/YueWen_857770/t7_YueWen_857770.jpg" alt="亨利四世" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">亨利四世</div>
          <div class="cw-overlay-author">莎士比亚</div>
          
          <div class="cw-overlay-time">0m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/934377" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/25/YueWen_934377/t7_YueWen_934377.jpg" alt="沙之书" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">沙之书</div>
          <div class="cw-overlay-author">[阿根廷]豪尔赫·路易斯·博尔赫斯</div>
          
          <div class="cw-overlay-time">3h 16m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/855774" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/64/YueWen_855774/t7_YueWen_855774.jpg" alt="欧也妮·葛朗台（经典译林）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">欧也妮·葛朗台（经典译林）</div>
          <div class="cw-overlay-author">[法]巴尔扎克</div>
          
          <div class="cw-overlay-time">6h 33m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300020498" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/98/3300020498/t7_3300020498.jpg" alt="没有人给他写信的上校" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">没有人给他写信的上校</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">2h 10m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/36557721" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/721/36557721/t7_36557721.jpg" alt="西西弗神话" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">西西弗神话</div>
          <div class="cw-overlay-author">[法]阿尔贝·加缪</div>
          
          <div class="cw-overlay-time">4h 16m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/912325" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/44/YueWen_912325/t7_YueWen_912325.jpg" alt="局外人" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">局外人</div>
          <div class="cw-overlay-author">[法]加缪</div>
          
          <div class="cw-overlay-time">4h 20m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/674044" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/44/674044/t7_674044.jpg" alt="我与地坛" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">我与地坛</div>
          <div class="cw-overlay-author">史铁生</div>
          
          <div class="cw-overlay-time">5h 17m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300019667" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/67/3300019667/t7_3300019667.jpg" alt="必有人重写爱情" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">必有人重写爱情</div>
          <div class="cw-overlay-author">北岛</div>
          
          <div class="cw-overlay-time">3h 6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/22737189" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/3/YueWen_22737189/t7_YueWen_22737189.jpg" alt="病隙碎笔" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">病隙碎笔</div>
          <div class="cw-overlay-author">史铁生</div>
          
          <div class="cw-overlay-time">8h 32m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/33820311" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/311/33820311/t7_33820311.jpg" alt="幻灭（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">幻灭（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">[法]巴尔扎克</div>
          
          <div class="cw-overlay-time">24h 9m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/932090" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/15/YueWen_932090/t7_YueWen_932090.jpg" alt="危险的关系（译文名著精选）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">危险的关系（译文名著精选）</div>
          <div class="cw-overlay-author">皮埃尔·拉克洛</div>
          
          <div class="cw-overlay-time">13h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24223823" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/92/YueWen_24223823/t7_YueWen_24223823.jpg" alt="哲学的慰藉（译文经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">哲学的慰藉（译文经典）</div>
          <div class="cw-overlay-author">阿兰·德波顿</div>
          
          <div class="cw-overlay-time">2h 55m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300080650" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/98/cpplatform_7sfazcdorfvc3gpcb4wmam/t7_cpplatform_7sfazcdorfvc3gpcb4wmam1701917798.jpg" alt="雌犬（关于控制的爱与压抑的暴力，拉美文学锋利之作）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">雌犬（关于控制的爱与压抑的暴力，拉美文学锋利之作）</div>
          <div class="cw-overlay-author">皮拉尔·金塔纳</div>
          
          <div class="cw-overlay-time">1h 3m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/934374" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/374/934374/t7_934374.jpg" alt="小径分岔的花园" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">小径分岔的花园</div>
          <div class="cw-overlay-author">[阿根廷]豪尔赫·路易斯·博尔赫斯</div>
          
          <div class="cw-overlay-time">2h 35m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/24953405" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/405/24953405/t7_24953405.jpg" alt="看不见的城市" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">看不见的城市</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          <div class="cw-overlay-time">4h 28m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/40933502" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/58/yuewen_40933502/t7_yuewen_409335021737010373.jpg" alt="红与黑" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">红与黑</div>
          <div class="cw-overlay-author">[法]司汤达</div>
          
          <div class="cw-overlay-time">10h 36m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/34619903" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/903/34619903/t7_34619903.jpg" alt="尘埃落定（同名电视剧原著）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">尘埃落定（同名电视剧原著）</div>
          <div class="cw-overlay-author">阿来</div>
          
          <div class="cw-overlay-time">8h 32m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300060662" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/44/cpplatform_pj2scixu5w6submfiffyao/t7_cpplatform_pj2scixu5w6submfiffyao1685943601.jpg" alt="宇宙重建了自身：佩索阿诗精选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">宇宙重建了自身：佩索阿诗精选</div>
          <div class="cw-overlay-author">费尔南多·佩索阿</div>
          
          <div class="cw-overlay-time">6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26314575" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/575/26314575/t7_26314575.jpg" alt="拉丁美洲被切开的血管" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">拉丁美洲被切开的血管</div>
          <div class="cw-overlay-author">爱德华多·加莱亚诺</div>
          
          <div class="cw-overlay-time">7m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/749913" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/3/YueWen_749913/t7_YueWen_749913.jpg" alt="罗生门（精选芥川28篇代表作）（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">罗生门（精选芥川28篇代表作）（果麦经典）</div>
          <div class="cw-overlay-author">[日]芥川龙之介</div>
          
          <div class="cw-overlay-time">1h 1m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/855325" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/325/855325/t7_855325.jpg" alt="恶之花（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">恶之花（果麦经典）</div>
          <div class="cw-overlay-author">[法]波德莱尔</div>
          
          <div class="cw-overlay-time">17m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/25375893" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/72/YueWen_25375893/t7_YueWen_25375893.jpg" alt="人鼠之间（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人鼠之间（果麦经典）</div>
          <div class="cw-overlay-author">约翰·斯坦贝克</div>
          
          <div class="cw-overlay-time">6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/932071" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/71/932071/t7_932071.jpg" alt="黑桃皇后：普希金中短篇小说选（译文名著精选）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">黑桃皇后：普希金中短篇小说选（译文名著精选）</div>
          <div class="cw-overlay-author">亚历山大·普希金</div>
          
          <div class="cw-overlay-time">12m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/24137190" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/190/24137190/t7_24137190.jpg" alt="Notes From The Underground（I） 地下室手记（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">Notes From The Underground（I） 地下室手记（英文版）</div>
          <div class="cw-overlay-author">Fyodor Dostoyevsky</div>
          
          <div class="cw-overlay-time">12m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_0qA9AI99V9IW6y06xNBtfA9E" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_0qA9AI99V9IW6y06xNBtfA9E_parsecover" alt="Metaphysics" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">Metaphysics</div>
          <div class="cw-overlay-author">Aristotle</div>
          
          <div class="cw-overlay-time">30m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23303656" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/656/23303656/t7_23303656.jpg" alt="契诃夫短篇小说选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">契诃夫短篇小说选</div>
          <div class="cw-overlay-author">[俄]契诃夫</div>
          
          <div class="cw-overlay-time">1h 27m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/812443" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/78/YueWen_812443/t7_YueWen_812443.jpg" alt="白鹿原" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">白鹿原</div>
          <div class="cw-overlay-author">陈忠实</div>
          
          <div class="cw-overlay-time">13h 36m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/41129377" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/52/YueWen_41129377/t7_YueWen_41129377.jpg" alt="形而上学" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">形而上学</div>
          <div class="cw-overlay-author">[古希腊]亚里士多德</div>
          
          <div class="cw-overlay-time">12h 21m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_GTJECvECDFV56yZ6xN2kqEMT" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_GTJECvECDFV56yZ6xN2kqEMT_parsecover" alt="The Cartesian Fallacy Fallacy" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">The Cartesian Fallacy Fallacy</div>
          <div class="cw-overlay-author"></div>
          
          <div class="cw-overlay-time">3m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/42755178" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/13/yuewen_42755178/t7_yuewen_427551781701247818.jpg" alt="社会契约论 = THE SOCIAL CONTRACT" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">社会契约论 = THE SOCIAL CONTRACT</div>
          <div class="cw-overlay-author">[法]让·卢梭</div>
          
          <div class="cw-overlay-time">4m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_F8X98v99VAVC6yM6xN1866O1" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_F8X98v99VAVC6yM6xN1866O1_parsecover" alt="The Reveries of the Solitary Walker" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">The Reveries of the Solitary Walker</div>
          <div class="cw-overlay-author">Jean Jacques Rousseau</div>
          
          <div class="cw-overlay-time">3m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/28394090" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/47/YueWen_28394090/t7_YueWen_28394090.jpg" alt="哈姆雷特" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">哈姆雷特</div>
          <div class="cw-overlay-author">莎士比亚</div>
          
          <div class="cw-overlay-time">2h 45m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/41978296" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/296/41978296/t7_41978296.jpg" alt="叶卡特琳娜女皇" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">叶卡特琳娜女皇</div>
          <div class="cw-overlay-author">杜查理</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/906850" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/80/YueWen_906850/t7_YueWen_906850.jpg" alt="理想国" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">理想国</div>
          <div class="cw-overlay-author">[古希腊]柏拉图</div>
          
          <div class="cw-overlay-time">8h 51m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/858742" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/42/YueWen_858742/t7_YueWen_858742.jpg" alt="作为意志和表象的世界" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">作为意志和表象的世界</div>
          <div class="cw-overlay-author">叔本华</div>
          
          <div class="cw-overlay-time">6m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300063154" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/5/cpplatform_8kztpkkf5vbkvdrjdgjbg3/t7_cpplatform_8kztpkkf5vbkvdrjdgjbg31688372390.jpg" alt="胡塞尔现象学" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">胡塞尔现象学</div>
          <div class="cw-overlay-author">丹.扎哈维</div>
          
          <div class="cw-overlay-time">35m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/41507093" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/23/yuewen_41507093/t7_yuewen_415070931718692881.jpg" alt="理想国" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">理想国</div>
          <div class="cw-overlay-author">[古希腊]柏拉图</div>
          
          <div class="cw-overlay-time">1h 57m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/810654" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/50/YueWen_810654/t7_YueWen_810654.jpg" alt="人性论" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">人性论</div>
          <div class="cw-overlay-author">大卫·休谟</div>
          
          <div class="cw-overlay-time">2m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/29196153" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/32/YueWen_29196153/t7_YueWen_29196153.jpg" alt="现代西方哲学十五讲" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">现代西方哲学十五讲</div>
          <div class="cw-overlay-author">张汝伦</div>
          
          <div class="cw-overlay-time">21m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300082668" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/61/cpplatform_9rxu26ck1khaq39bs1tiul/t7_cpplatform_9rxu26ck1khaq39bs1tiul1703664059.jpg" alt="虚无主义【刘擎周濂推荐 | 直面虚无，找到意义：写给当代人的反“空虚”指南！】" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">虚无主义【刘擎周濂推荐 | 直面虚无，找到意义：写给当代人的反“空虚”指南！】</div>
          <div class="cw-overlay-author">[荷兰]诺伦·格尔茨</div>
          
          <div class="cw-overlay-time">9m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/41077554" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/554/41077554/t7_41077554.jpg" alt="新爱洛伊丝（全集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">新爱洛伊丝（全集）</div>
          <div class="cw-overlay-author">让-雅克·卢梭</div>
          
          <div class="cw-overlay-time">2h 20m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/932498" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/498/932498/t7_932498.jpg" alt="存在主义咖啡馆：自由、存在和杏子鸡尾酒" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">存在主义咖啡馆：自由、存在和杏子鸡尾酒</div>
          <div class="cw-overlay-author">莎拉·贝克韦尔</div>
          
          <div class="cw-overlay-time">8h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/40509897" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/36/YueWen_40509897/t7_YueWen_40509897.jpg" alt="莱蒙托夫诗选（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">莱蒙托夫诗选（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">莱蒙托夫</div>
          
          <div class="cw-overlay-time">47m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/25658405" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/43/YueWen_25658405/t7_YueWen_25658405.jpg" alt="城堡" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">城堡</div>
          <div class="cw-overlay-author">卡夫卡</div>
          
          <div class="cw-overlay-time">6h 52m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300020485" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/85/3300020485/t7_3300020485.jpg" alt="一起连环绑架案的新闻" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">一起连环绑架案的新闻</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">3m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/31580171" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/171/31580171/t7_31580171.jpg" alt="古文观止译注" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">古文观止译注</div>
          <div class="cw-overlay-author">[清]吴楚材 [清]吴调侯编选 李梦生等译注</div>
          
          <div class="cw-overlay-time">37m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26357452" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/32/YueWen_26357452/t7_YueWen_26357452.jpg" alt="《存在与时间》读本" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">《存在与时间》读本</div>
          <div class="cw-overlay-author">陈嘉映编著</div>
          
          <div class="cw-overlay-time">1h 55m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300102744" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/4/cpplatform_r5gebjidfaarpcl1gme5rm/t7_cpplatform_r5gebjidfaarpcl1gme5rm1717671544.jpg" alt="哲学导论：综合原典教程（第11版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">哲学导论：综合原典教程（第11版）</div>
          <div class="cw-overlay-author">[美]罗伯特•C. 所罗门 凯瑟琳•M.希金斯 克兰西•马丁</div>
          
          <div class="cw-overlay-time">9h 52m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/27256060" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/60/27256060/t7_27256060.jpg" alt="父与子" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">父与子</div>
          <div class="cw-overlay-author">屠格涅夫</div>
          
          <div class="cw-overlay-time">1h 34m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300111774" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/8/cpplatform_4ojszdvz8pnmkz93sy8ii5/t7_cpplatform_4ojszdvz8pnmkz93sy8ii51724066555.jpg" alt="犬儒主义【每个人或许都有自己的“犬儒时刻”| 认清时代，直面自我！】" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">犬儒主义【每个人或许都有自己的“犬儒时刻”| 认清时代，直面自我！】</div>
          <div class="cw-overlay-author">[英]安斯加尔·艾伦</div>
          
          <div class="cw-overlay-time">4h 14m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_BFvEaNEap2T06ve6xNB4e3WG" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_6RN96X94M8Kc6jW6ku8NMBLu_parsecover" alt="受活" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">受活</div>
          <div class="cw-overlay-author">阎连科</div>
          
          <div class="cw-overlay-time">15m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300079930" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/63/cpplatform_ck6bw1elsjwwpifr4yl3cr/t7_cpplatform_ck6bw1elsjwwpifr4yl3cr1701246527.jpg" alt="恶心" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">恶心</div>
          <div class="cw-overlay-author">[法]让-保尔·萨特</div>
          
          <div class="cw-overlay-time">1h 22m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/27598497" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/71/yuewen_27598497/t7_yuewen_275984971677071958.jpg" alt="白银时代诗歌金库（全集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">白银时代诗歌金库（全集）</div>
          <div class="cw-overlay-author">曼德尔施塔姆 马雅可夫斯基等 阿赫玛托娃 茨维塔耶娃等</div>
          
          <div class="cw-overlay-time">48m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300100596" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/31/cpplatform_wh1zfifabbqfsqm1jm7ehh/t7_cpplatform_wh1zfifabbqfsqm1jm7ehh1716190442.jpg" alt="卡利古拉（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">卡利古拉（果麦经典）</div>
          <div class="cw-overlay-author">[法]加缪</div>
          
          <div class="cw-overlay-time">1h 44m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300102923" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/77/cpplatform_7zgcczeqbdajhpt9s67ser/t7_cpplatform_7zgcczeqbdajhpt9s67ser1718186750.jpg" alt="温德米尔夫人的扇子" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">温德米尔夫人的扇子</div>
          <div class="cw-overlay-author">[爱尔兰]王尔德</div>
          
          <div class="cw-overlay-time">1h 48m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300037072" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/43/cpPlatform_wTd5peWWNuPsh7hRbvjxQq/t7_cpPlatform_wTd5peWWNuPsh7hRbvjxQq.jpg" alt="基督教史(上下册)" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">基督教史(上下册)</div>
          <div class="cw-overlay-author">胡斯托·L.冈萨雷斯</div>
          
          <div class="cw-overlay-time">1h 11m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300122255" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/20/cpplatform_pezrxysxsklpk5htna1zea/t7_cpplatform_pezrxysxsklpk5htna1zea1732269021.jpg" alt="李尔王" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">李尔王</div>
          <div class="cw-overlay-author">[英]莎士比亚</div>
          
          <div class="cw-overlay-time">48m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/3300020482" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/82/3300020482/t7_3300020482.jpg" alt="一桩事先张扬的凶杀案" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">一桩事先张扬的凶杀案</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          <div class="cw-overlay-time">2h 7m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23796502" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/16/YueWen_23796502/t7_YueWen_23796502.jpg" alt="存在主义是一种人道主义" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">存在主义是一种人道主义</div>
          <div class="cw-overlay-author">[法]让-保罗·萨特</div>
          
          <div class="cw-overlay-time">2h 24m</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/815156" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/2/YueWen_815156/t7_YueWen_815156.jpg" alt="鼠疫" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">鼠疫</div>
          <div class="cw-overlay-author">[法]加缪</div>
          
          <div class="cw-overlay-time">4h 17m</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300225589" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/99/cpplatform_cxdnejsrrs6i5lpfmrzc53/t7_cpplatform_cxdnejsrrs6i5lpfmrzc531786936416.jpg" alt="诗经（全析全译版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">诗经（全析全译版）</div>
          <div class="cw-overlay-author">佚名</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300138282" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/57/cpplatform_c8hjstsscqiuluyjqqrk9v/t7_cpplatform_c8hjstsscqiuluyjqqrk9v1742884239.jpg" alt="庄子集释" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">庄子集释</div>
          <div class="cw-overlay-author">[清]郭庆藩著 尹小林等审校</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/232883" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/18/YueWen_232883/t7_YueWen_232883.jpg" alt="春秋左传" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">春秋左传</div>
          <div class="cw-overlay-author">[春秋]左丘明 [春秋]孔子</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300208131" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/77/cpplatform_kqh1vac3afqabl21sw4zoc/t7_cpplatform_kqh1vac3afqabl21sw4zoc1780398088.jpg" alt="曹植诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">曹植诗选</div>
          <div class="cw-overlay-author">[三国]曹植</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300140866" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/61/cpplatform_3w5jtiqkvx9ynh8wc1z8r9/t7_cpplatform_3w5jtiqkvx9ynh8wc1z8r91752237724.jpg" alt="阿房宫赋（轻古籍）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">阿房宫赋（轻古籍）</div>
          <div class="cw-overlay-author">[唐]杜牧 著 / 徐若央 解读</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300203333" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/79/cpplatform_9qoghuv1dyj4wcqfphliqx/t7_cpplatform_9qoghuv1dyj4wcqfphliqx1777348174.jpg" alt="西方哲学批判：哲学本质的反思" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">西方哲学批判：哲学本质的反思</div>
          <div class="cw-overlay-author">程志敏</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26318970" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/52/YueWen_26318970/t7_YueWen_26318970.jpg" alt="追忆似水年华（全集）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">追忆似水年华（全集）</div>
          <div class="cw-overlay-author">[法]普鲁斯特</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/912824" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/84/yuewen_912824/t7_yuewen_9128241776069077.jpg" alt="爱你就像爱生命" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">爱你就像爱生命</div>
          <div class="cw-overlay-author">王小波</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_3dQ8RU6QY9Qs6yd71V3w48GB" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_A3d2jR2m94456jF6kl9Jx3jt_parsecover" alt="黑格尔《精神现象学》句读  第五卷.pdf" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">黑格尔《精神现象学》句读  第五卷.pdf</div>
          <div class="cw-overlay-author">邓晓芒</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300010494" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/94/3300010494/t7_3300010494.jpg" alt="穷人" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">穷人</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/934400" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/400/934400/t7_934400.jpg" alt="铁币" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">铁币</div>
          <div class="cw-overlay-author">[阿根廷]豪尔赫·路易斯·博尔赫斯</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/790141" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/80/yuewen_790141/t7_yuewen_7901411679648191.jpg" alt="廿一史弹词" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">廿一史弹词</div>
          <div class="cw-overlay-author">[明]杨慎</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300142473" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/64/cpplatform_e5bb36cmh6pl2y2glsdasq/t7_cpplatform_e5bb36cmh6pl2y2glsdasq1745475480.jpg" alt="论老年 论友谊 论责任" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">论老年 论友谊 论责任</div>
          <div class="cw-overlay-author">[古罗马]西塞罗</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300128481" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/55/cpplatform_16n3ql2fjqejepzstvbjng/t7_cpplatform_16n3ql2fjqejepzstvbjng1735553553.jpg" alt="情迷翡冷翠" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">情迷翡冷翠</div>
          <div class="cw-overlay-author">[英]威廉·萨默塞特·毛姆</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300188311" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/76/cpplatform_1dvrsamj25bal7eurrsz8k/t7_cpplatform_1dvrsamj25bal7eurrsz8k1766455653.jpg" alt="罗念生译古希腊戏剧（中国翻译家译丛）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">罗念生译古希腊戏剧（中国翻译家译丛）</div>
          <div class="cw-overlay-author">[希腊]埃斯库罗斯等</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300132104" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/78/cpplatform_tr2xdpc5rsp2fjhgvf5rbh/t7_cpplatform_tr2xdpc5rsp2fjhgvf5rbh1737600225.jpg" alt="理想丈夫" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">理想丈夫</div>
          <div class="cw-overlay-author">[爱尔兰]奥斯卡.王尔德</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300075248" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/2/cpplatform_9rufaccz9buidx8zqvwxgf/t7_cpplatform_9rufaccz9buidx8zqvwxgf1698128783.jpg" alt="存在主义心理治疗" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">存在主义心理治疗</div>
          <div class="cw-overlay-author">[美]亚隆</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300118138" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/80/cpplatform_n89pmgpublqiavfhxast64/t7_cpplatform_n89pmgpublqiavfhxast641729240120.jpg" alt="浮士德（第一部）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">浮士德（第一部）</div>
          <div class="cw-overlay-author">[德]歌德</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300055324" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/86/cpplatform_o4afqxrmsl5ehuteynv9xt/t7_cpplatform_o4afqxrmsl5ehuteynv9xt1681375385.jpg" alt="纯粹理性批判(精装本)" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">纯粹理性批判(精装本)</div>
          <div class="cw-overlay-author">[德]康德</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300095643" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/17/cpplatform_cqgzq5rgq9ofoqklzw2b3l/t7_cpplatform_cqgzq5rgq9ofoqklzw2b3l1713346737.jpg" alt="费尔巴哈文集 第5卷：宗教的本质" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">费尔巴哈文集 第5卷：宗教的本质</div>
          <div class="cw-overlay-author">[德]费尔巴哈</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300126456" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/12/cpplatform_ahxixk26bsnkwasyxm3rsc/t7_cpplatform_ahxixk26bsnkwasyxm3rsc1734591883.jpg" alt="论法律（中拉英三语版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">论法律（中拉英三语版）</div>
          <div class="cw-overlay-author">[古罗马]西塞罗</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/854111" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/18/YueWen_854111/t7_YueWen_854111.jpg" alt="纳兰词" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">纳兰词</div>
          <div class="cw-overlay-author">[清]纳兰容若</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_CKF8rl261FdJ7zc71F8LjA9O" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_9b8F3iF6J9Uz6y56x75xS6SL_parsecover" alt="镜中世界" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">镜中世界</div>
          <div class="cw-overlay-author">柯奈莉亚·冯克</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/37699083" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/25/yuewen_37699083/t7_yuewen_376990831701316500.jpg" alt="朦胧诗选新编" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">朦胧诗选新编</div>
          <div class="cw-overlay-author">食指 海子</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item finished">
      <a href="/book/834464" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/1/yuewen_834464/t7_yuewen_8344641758521403.jpg" alt="活着" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">活着</div>
          <div class="cw-overlay-author">余华</div>
          
          
          <div class="cw-overlay-badge">已读完</div>
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26441414" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/2/yuewen_26441414/t7_yuewen_264414141682244020.jpg" alt="霍乱时期的爱情" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">霍乱时期的爱情</div>
          <div class="cw-overlay-author">[哥]加西亚•马尔克斯</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/34363135" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/76/YueWen_34363135/t7_YueWen_34363135.jpg" alt="拜伦经典诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">拜伦经典诗选</div>
          <div class="cw-overlay-author">[英]拜伦</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/37700235" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/97/YueWen_37700235/t7_YueWen_37700235.jpg" alt="马可瓦尔多（卡尔维诺作品）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">马可瓦尔多（卡尔维诺作品）</div>
          <div class="cw-overlay-author">伊塔洛·卡尔维诺</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/935992" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/39/YueWen_935992/t7_YueWen_935992.jpg" alt="猎人笔记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">猎人笔记</div>
          <div class="cw-overlay-author">屠格涅夫</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300026456" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/75/cpPlatform_uMDop1Vq8smjWrCP5S3Umr/t7_cpPlatform_uMDop1Vq8smjWrCP5S3Umr.jpg" alt="给一个青年诗人的十封信（冯至文存）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">给一个青年诗人的十封信（冯至文存）</div>
          <div class="cw-overlay-author">[奥]里尔克</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/34127267" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/86/YueWen_34127267/t7_YueWen_34127267.jpg" alt="老子今注今译" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">老子今注今译</div>
          <div class="cw-overlay-author">陈鼓应</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/43102026" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/60/YueWen_43102026/t7_YueWen_43102026.jpg" alt="红书" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">红书</div>
          <div class="cw-overlay-author">[瑞士]荣格原著  [英]索努·沙姆达萨尼编译</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/33820349" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/349/33820349/t7_33820349.jpg" alt="萌芽（人文社外国文学名著经典·网格本）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">萌芽（人文社外国文学名著经典·网格本）</div>
          <div class="cw-overlay-author">左拉</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/CB_7mU0808zJ48L86O6x66LIBpH" class="cw-cover-link">
        <img src="https://res.weread.qq.com/wrepub/CB_2w08KS8KmFO16az6cW_parsecover" alt="庄子今注今译(套装上下册)(最新修订版)" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">庄子今注今译(套装上下册)(最新修订版)</div>
          <div class="cw-overlay-author">陈鼓应</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/35150058" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/58/35150058/t7_35150058.jpg" alt="王尔德奇异故事集（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">王尔德奇异故事集（果麦经典）</div>
          <div class="cw-overlay-author">[英]奥斯卡·王尔德</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/31144005" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/82/YueWen_31144005/t7_YueWen_31144005.jpg" alt="面纱（毛姆长篇作品精选）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">面纱（毛姆长篇作品精选）</div>
          <div class="cw-overlay-author">毛姆</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300124393" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/54/cpplatform_dwdvmdmphqqh8e3axrqgxu/t7_cpplatform_dwdvmdmphqqh8e3axrqgxu1733737788.jpg" alt="皆大欢喜" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">皆大欢喜</div>
          <div class="cw-overlay-author">[英]莎士比亚</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300110727" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/56/cpplatform_chhqlmfzxnbcjswuxrxysd/t7_cpplatform_chhqlmfzxnbcjswuxrxysd1723174404.jpg" alt="永存我的话语：曼德尔施塔姆沃罗涅日诗集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">永存我的话语：曼德尔施塔姆沃罗涅日诗集</div>
          <div class="cw-overlay-author">[俄]奥西普·曼德尔施塔姆</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/35458097" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/61/YueWen_35458097/t7_YueWen_35458097.jpg" alt="潮骚（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">潮骚（果麦经典）</div>
          <div class="cw-overlay-author">三岛由纪夫</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/820807" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/41/YueWen_820807/t7_YueWen_820807.jpg" alt="莫泊桑短篇小说精选（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">莫泊桑短篇小说精选（果麦经典）</div>
          <div class="cw-overlay-author">莫泊桑</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/920624" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/65/YueWen_920624/t7_YueWen_920624.jpg" alt="红字（果麦经典）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">红字（果麦经典）</div>
          <div class="cw-overlay-author">纳撒尼尔·霍桑</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/27775298" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/298/27775298/t7_27775298.jpg" alt="拉封丹寓言" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">拉封丹寓言</div>
          <div class="cw-overlay-author">[法]拉封丹</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/34853565" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/27/YueWen_34853565/t7_YueWen_34853565.jpg" alt="尤利西斯（全2册）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">尤利西斯（全2册）</div>
          <div class="cw-overlay-author">[爱尔兰]詹姆斯·乔伊斯</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23881660" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/72/YueWen_23881660/t7_YueWen_23881660.jpg" alt="浮士德（英文版）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">浮士德（英文版）</div>
          <div class="cw-overlay-author">歌德</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/164524" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/524/164524/t7_164524.jpg" alt="微微一笑很倾城" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">微微一笑很倾城</div>
          <div class="cw-overlay-author">顾漫</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/26357870" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/870/26357870/t7_26357870.jpg" alt="草叶集：惠特曼诞辰200周年纪念版诗全集" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">草叶集：惠特曼诞辰200周年纪念版诗全集</div>
          <div class="cw-overlay-author">惠特曼</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/23796192" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/192/23796192/t7_23796192.jpg" alt="普希金抒情诗选" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">普希金抒情诗选</div>
          <div class="cw-overlay-author">[俄]普希金</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/43090117" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/117/43090117/t7_43090117.jpg" alt="死屋手记" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">死屋手记</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/932087" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/87/932087/t7_932087.jpg" alt="远大前程（译文名著精选）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">远大前程（译文名著精选）</div>
          <div class="cw-overlay-author">[英]狄更斯</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/31808221" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/51/YueWen_31808221/t7_YueWen_31808221.jpg" alt="罪与罚（陀思妥耶夫斯基文集2015）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">罪与罚（陀思妥耶夫斯基文集2015）</div>
          <div class="cw-overlay-author">陀思妥耶夫斯基</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/932117" class="cw-cover-link">
        <img src="https://wfqqreader-1252317822.image.myqcloud.com/cover/117/932117/t7_932117.jpg" alt="羊脂球（译文名著精选）" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">羊脂球（译文名著精选）</div>
          <div class="cw-overlay-author">莫泊桑</div>
          
          
        </div>
      </a>
    </div>
    
    <div class="cw-item ">
      <a href="/book/3300054378" class="cw-cover-link">
        <img src="https://cdn.weread.qq.com/weread/cover/70/cpplatform_nzg5xjzbyvzbhsumlzluxt/t7_cpplatform_nzg5xjzbyvzbhsumlzluxt1680504664.jpg" alt="鱼没有脚2" class="cw-cover" loading="lazy">
        <div class="cw-overlay">
          <div class="cw-overlay-title">鱼没有脚2</div>
          <div class="cw-overlay-author">约恩·卡尔曼·斯特凡松</div>
          
          
        </div>
      </a>
    </div>
    
  </div>

</div>

<script>
(function() {
  var filter = document.getElementById('cw-filter');
  if (!filter) return;
  filter.addEventListener('click', function(e) {
    var btn = e.target.closest('.cw-filter-tag');
    if (!btn) return;
    filter.querySelectorAll('.cw-filter-tag').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    var f = btn.dataset.f;
    document.querySelectorAll('.cw-item').forEach(function(item) {
      item.style.display = (f === 'all' || (f === 'finished' && item.classList.contains('finished'))) ? '' : 'none';
    });
  });
})();
</script>

    </main>

    <!-- Back to Top -->
    <button class="back-to-top" id="back-to-top" aria-label="回到顶部">↑</button>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <span>数据来自 <a href="https://weread.qq.com" target="_blank" rel="noopener">微信读书</a></span>
        <span>阅读书房 &copy; 2026</span>
      </div>
    </footer>
  </div>

  <!-- Share Card Host (hidden) -->
  <div id="share-card-host" style="position:fixed;left:-9999px;top:0;z-index:0;"></div>

  <!-- Share Preview Modal -->
  <div id="share-modal" class="share-modal" aria-hidden="true">
    <div class="share-modal-backdrop"></div>
    <div class="share-modal-body">
      <div class="share-modal-header">
        <span class="share-modal-title">分享卡片预览</span>
        <button class="share-modal-close" id="share-modal-close" aria-label="关闭">&times;</button>
      </div>
      <div class="share-modal-preview">
        <img id="share-preview-img" src="" alt="分享卡片预览">
      </div>
      <div class="share-modal-actions">
        <button class="share-modal-btn" id="share-download-btn">下载图片</button>
        <button class="share-modal-btn share-modal-btn-outline" id="share-copy-btn">复制图片</button>
      </div>
    </div>
  </div>

  <script src="file:///C:/Users/huang/Documents/Projects/reading-room/public/js/main.js?v=12" defer></script>
  
  
</body>
</html>
