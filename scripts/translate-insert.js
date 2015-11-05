/*
注入式的翻译功能
本js会被注入到每一个tab页面中;
 */
+function() {
	if (window.qidiziToolTranslate) {
		return;
	}

	window.qidiziToolTranslate = 1; //防止多次注入重复绑定
	var _O = {
		isTop : window.top === window.self
	};
	createPanel();

	function postText(text) {
		//请求翻译选中文字
		top.postMessage({
			transText : text
		}, "*");
	}

	function bindEvents() {
		//因为insert js与tab网页的window不是同一对象,就像运行于不同的sanbox中,所以,只能使用pm来通知
		//var port = chrome.extension.connect();
		// 监听只在top
		_O.isTop && window.addEventListener("message", function (event) {
			if (event.data.youDao) {
				youDaoCallBack(event.data.youDao);
				//port.postMessage(event.data.text);//可以使用这个方法通知给插件,在插件的图标处显示结果?
			}

			if (event.data.transText) {
				//新翻译文字请求
				getTrans(event.data.transText);
			}
		}, false);
		_O.isTop && window.addEventListener('blur', function () {
			//窗口失去焦点,隐藏show
			_O.showerShow && panelSwitch(0);
		});
		_O.isTop && document.addEventListener('click', function (ev) {
			isClickVoice(ev);
		});
		//绑定up事件
		document.addEventListener('mouseup', function (ev) {
			//点击非show区域,隐藏show
			_O.isTop && !inPanel(ev.srcElement) && _O.showerShow && panelSwitch(0);
			// 移动结束了再判断是否需要翻译
			_O.selectionState && getText();
			_O.selectionState = 0;
		}, false);
		//绑定选择文字的事件
		document.addEventListener('mousedown', function (ev) {
			_O.selectionState = 0;
		}, false);
		//绑定选择文字的事件
		document.addEventListener('selectionchange', function (ev) {
			_O.selectionState++;
		}, false);
	}
	function html2text(html) {
		return html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	//是否panel中dom
	function inPanel(dom) {
		var loop = 10; //自己的box的标签层级
		while (--loop > 0 && _O.shower !== dom && dom && dom.parentElement) {
			dom = dom.parentElement;
		}

		return _O.shower === dom;
	}
	//有道的回调
	function youDaoCallBack(obj) {
		if (obj.errorCode) {
			var error = {
				20 : '要翻译的文本过长',
				30 : '无法进行有效的翻译',
				　40 : '不支持的语言类型',
				　50 : '开发的API的key已经失效,请重新申请',
				　60 : '无词典结果，仅在获取词典结果生效'
			};
			_O.requestError = 1;
			return show('获取有道翻译出错:' + error[obj.errorCode]);
		}

		var html = '<a href="http://cn.bing.com/dict/dict?q=' + encodeURIComponent(obj.query) + '" target="_bing" title="点击必应词典查询">' + html2text(obj.query) + '</a>';
		var voiceSrc = '';

		if (obj.basic) {

			if (obj.basic['phonetic']) { //默认发音:应该是英式
				_O.defaultVoiceSrc = voiceSrc = 'http://dict.youdao.com/dictvoice?type=1&audio=' + encodeURIComponent(obj.query);
				html += ' UK[<a class="voice" href="javascript:void(0);" data-voice="' + voiceSrc + '" title="点击这里播放发音">' + obj.basic['phonetic'] + '</a>]';
			}

			if (obj.basic['us-phonetic']) { //us发音
				html += ' US[<a class="voice" href="javascript:void(0);" data-voice="http://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(obj.query) + '" title="点击这里播放发音">' + obj.basic['us-phonetic'] + '</a>] ';
			}
		}

		html += '<div style="border-top:1px solid gray;"></div>';

		// 最准确的一个中文翻译
		if (obj.translation) {
			html += obj.translation;
		}

		if (obj.basic) {

			if (obj.basic.explains && obj.basic.explains.length) { //更加展开中文解释
				html += '<br>' + obj.basic.explains.join('<br>')
				 + '<br>';
			}
		}

		if (obj.web && obj.web.length) {
			html += '<br>';

			for (var i = 0; i < obj.web.length; i++) {
				var list = obj.web[i];

				if (!list.key) {
					continue;
				}

				html += list.key + ':<br>'
				 + list.value.join(';&nbsp;')
				 + '<br><br>';
			}
		}

		show(html);
		//voiceSrc && playVoice(voiceSrc);
	}
	//有道结果
	function youDaoJSONP(txt) {
		if (!_O.youDaoScript) {
			_O.youDaoScript = document.createElement('DIV');
			_O.youDaoScript.style.display = 'none';
			document.body.appendChild(_O.youDaoScript);
		}

		txt = encodeURIComponent(txt);
		var cb = encodeURIComponent('+function(o){window.postMessage({youDao:o},"*");}');
		var proto = String(document.location.protocol).toLowerCase().indexOf('https') > -1 ? 'https:' : 'http:';

		_O.youDaoScript.innerHTML = '';
		var js = document.createElement('SCRIPT');
		js.src = proto + '//fanyi.youdao.com/openapi.do?keyfrom=chrome-plugin&key=985650714&type=data&doctype=jsonp&callback=' + cb + '&version=1.1&q=' + txt + '&_=' + +new Date;
		_O.youDaoScript.appendChild(js);
	}

	//显示
	function show(html) {

		if (_O.showCLS) {
			_O.showContext.innerHTML = '';
			_O.showCLS = 0;
		}

		_O.showerShow = 1;

		if ('' === html) {
			return;
		}

		var row = document.createElement('DIV');
		row.style.padding = "0px 10px 10px 10px";
		row.innerHTML = html;
		_O.showContext.appendChild(row);
		panelSwitch(1);
	}

	//隐/显面板
	function panelSwitch(show) {
		clearTimeout(_O.panelSwitchTimer);

		if (show) {
			_O.shower.style.display = 'block';
			_O.showerShow = 1;
		} else {
			_O.shower.style.display = 'none';
			_O.showerShow = 0;
		}
	}

	//获取选中文件,如果有,就请求翻译
	function getText() {

		var text = window.getSelection().toString().replace(/^\s+|\s+$/g, '').replace(/[_,]/g, ' ');

		if (!text.length) {
			return;
		}

		if (text.length > 300) {
			text = text.substr(0, 300);
		}

		postText(text);
	}
	// 开始查询
	function getTrans(text) {
		//选中相同的字,重复的翻译,不需要再请求,除非上轮发生请求错误

		if (_O.previousText == text && !_O.requestError) {
			panelSwitch(1);
			playVoice();
			return;
		}

		_O.previousText = text;
		requestAPI(text);
	}

	//远程请求翻译
	function requestAPI(text) {
		_O.requestError = 0;
		_O.showCLS = 1;
		getBing(text);
		//youDaoJSONP(text); //获取有道的, 鉴于有道的词典结果不正确,禁用,有需要的,可以直接去掉注释启用;
	}
	//播放声音:防止重复加载相同音源
	function playVoice(src) {
		var v = document.getElementById('chromeQidiziTranslateVoice');

		function replay() {
			v.pause();
			v.currentTime = 0;
			v.play();
		}

		function playSrc(src) {
			v.pause();
			v.src = src;
			v.load();
			v.play();
		}

		if (!v) {
			return;
		}

		var currentSrc = v.currentSrc;

		if (src) {
			if (src == currentSrc) { //新音源与播放器中相同
				replay();
				return;
			}

			playSrc(src);
			return;
		}

		if (currentSrc == _O.defaultVoiceSrc) { // 播放器就是默认的
			replay();
			return;
		}

		playSrc(_O.defaultVoiceSrc);
	}
	//点击声音a时处理
	function isClickVoice(ev) {
		var el = ev.srcElement;
		var src = el.getAttribute('data-voice');

		if (el.tagName.toLowerCase() !== 'a' || !src) {
			return;
		}

		playVoice(src);
	}

	function xhr(url, callBack) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4) { // 4 = "loaded"
				if (xmlhttp.status == 200) { // 200 = OK
					callBack(xmlhttp.responseText);
				} else {
					show('翻译插件通过xhr获取数据出错:' + url);
				}
			}
		};
		var async = true; //异步
		var method = "get";
		xmlhttp.open(method, url, async);
		var postData = null;
		xmlhttp.send(postData);
	}
	//必应的词典
	// 并不提供api,只能使用html来自己提取
	function getBing(text) {
		xhr('http://cn.bing.com/dict/search?q=' + encodeURIComponent(text), function (data) {
			var voiceSrc = '';
			var html = '<style>div.bing{border-top:1px solid darkgray;}div.bing div.se_div,div.bing div.wd_div, div.bing div.df_div,div.bing div.img_area,div.bing li span.web{display:none;}div.bing div.in_tip{background-color:#f9f5dd;padding:5px;}div.bing div.hd_div h1{font-size:14px;margin:0px;line-height:14px;padding:0px;}div.bing a.bigaud,div.bing a.bigaud_f{background:url(http://cn.bing.com/s/live/icon.png?v=2) no-repeat -358px 0;display:inline-block;width:20px;height:20px;}div.bing div.hd_pr,div.bing div.hd_tf,div.bing div.hd_prUS{display:inline;}div.bing li{list-style:none;}div.bing ul{margin-left:0px;}</style>';
			html += '<div class="bing"><div>必应词典: <a href="http://cn.bing.com/dict/search?q=' + encodeURIComponent(text)+ '" target="_bing" title="点击查看必应网页结果">' +text+ '</a></div>';
			//提取整个翻译部分,然后再去掉不需要的
			var ma = data.match(/<div\s+class\="lf_area">([\s\S]+?)<\/div>\s*<div\s+class\="sidebar">/i);

			if (ma) {
				var ma = ma[1];
				ma = ma.replace(/onmouseover|onmouseout/gi, 'mo').replace(/\sonclick[^>]+?(http\:.+?\.mp3)/gi, function ($0, $1) {
						voiceSrc = $1;
						return 'data-voice="' + $1 + '" oc="';
					});
				//console.log(ma)
				html += ma;
			}

			html += '</div>';
			show(html);
			voiceSrc && playVoice(voiceSrc);
		});
	}
	function id(id) {
		return document.getElementById(id);
	}
	//去掉标签
	function trimHtml(text) {
		return text.replace(/<[^>]+>/g, '');
	}
	function createPanel() {

		//延后插入,防止body不存在.出现相对定位变绝对定位问题
		if (!document.body) {
			return setTimeout(createPanel, 100);
		}

		bindEvents();

		if (!_O.isTop) {
			return;
		}

		_O.shower = document.createElement('DIV');
		_O.shower.className = 'chromeQidiziTranslatePanel';
		_O.shower.title = '点击框外关闭';
		document.body.appendChild(_O.shower);
		_O.shower.innerHTML = '<style> \
																																										.chromeQidiziTranslatePanel{position:fixed;left:50px;bottom:0;border:1px solid lightgray;border-radius:5px;padding-right:0px;background-color:white;color:black;z-index:999999999999999;max-height:100%;font-size:12px;overflow:auto;white-space:nowrap;display:none;} \
																																										.chromeQidiziTranslatePanel *{float:none!important;position:static!important;} \
																																										.chromeQidiziTranslatePanel .voice{color:blue;font-size:16px;font-weight:bold;} \
																																										.chromeQidiziTranslatePanel .query{display:block;line-height:12px;font-size:12px;color:blue;width:100%;border:1px solid gray;background-color:transparent;border-radius:3px;} \
																																										    </style> \
																																										    <audio id="chromeQidiziTranslateVoice"  autoplay="autoplay" style="display:none;"></audio>\
																																										    <span style="display:block;overflow:hidden;height:1px;width:1px;">\
																																										    <input name="focuser" />\
																																										    </span>\
																																										    </div><div></div>\
																																										    <input class="query" placeholder="输入单词反选翻译" onmouseover="this.focus;this.select();" />\
																																										    ';
		_O.showContext = _O.shower.getElementsByTagName('DIV')[0];
		_O.focuser = _O.shower.getElementsByTagName('INPUT')[0];
	}
}
();
