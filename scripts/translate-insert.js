/*
注入式的翻译功能
本js会被注入到每一个tab页面中;
 */
+function() {
	if (!document.documentElement || !document.documentElement.appendChild || window.qidiziToolTranslate) {
		return;
	}

	window.qidiziToolTranslate = 1; //防止多次注入重复绑定
	var _O = {};
	function html2text(html) {
		return html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	//因为insert js与tab网页的window不是同一对象,就像运行于不同的sanbox中,所以,只能使用pm来通知
	//var port = chrome.extension.connect();
	window.addEventListener("message", function (event) {
		//发给自己才接
		if (event.source != window)
			return;

		if (event.data.youDao) {
			youDaoCallBack(event.data.youDao);
			//port.postMessage(event.data.text);//可以使用这个方法通知给插件,在插件的图标处显示结果?
		}
	}, false);
	//创建面板

	_O.shower = document.createElement('DIV');
	_O.shower.style.position = 'fixed';
	_O.shower.style.left = '50px';
	_O.shower.style.bottom = '0px';
	_O.shower.style.border = '1px solid lightgray';
	_O.shower.style.borderRadius = '5px';
	_O.shower.style.padding = '0px';
	_O.shower.style.paddingRight = '30px';
	_O.shower.style.backgroundColor = 'white';
	_O.shower.style.color = 'black';
	_O.shower.style.zIndex = '999999999999999';
	_O.shower.style.maxHeight = '100%';
	_O.shower.style.fontSize = '12px';
	_O.shower.style.overflow = 'auto';
	_O.shower.style.whiteSpace = 'nowrap';
	_O.shower.style.display = 'none';
	_O.shower.title = '点击框外关闭';
	document.documentElement.appendChild(_O.shower);
	_O.shower.innerHTML = '<span style="display:block;overflow:hidden;height:1px;width:1px;"><input name="focuser" /></span><input placeholder="输入单词反选翻译" style="display:block;line-height:12px;font-size:12px;color:blue;width:99%;border:1px solid gray;background-color:transparent;border-radius:3px;" onmouseover="this.focus;this.select();" /></div><div></div>';
	_O.showContext = _O.shower.getElementsByTagName('DIV')[0];
	_O.focuser = _O.shower.getElementsByTagName('INPUT')[0];
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

		var html = '<a href="https://www.baidu.com/s?ie=utf-8&wd=' + encodeURIComponent(obj.query) + '" target="_blank" title="这是有道词典的结果;点击百度查询">' + html2text(obj.query) + '</a>';
		var voiceSrc = '';

		if (obj.basic) {

			if (obj.basic['phonetic']) { //默认发音:应该是英式
				voiceSrc = 'http://dict.youdao.com/dictvoice?type=1&audio=' + encodeURIComponent(obj.query);
				html += ' UK[<a style="color:blue;font-size:16px;font-weight:bold;" href="javascript:void(0);" data-voice="' + voiceSrc + '">' + obj.basic['phonetic'] + '</a>]';
			}

			if (obj.basic['us-phonetic']) { //us发音
				html += ' US[<a style="color:blue;font-size:16px;" href="javascript:void(0);" data-voice="http://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(obj.query) + '">' + obj.basic['us-phonetic'] + '</a>] ';
			}
		}

		html += '<hr>';

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

		show(html, voiceSrc);
	}
	//有道结果
	function youDaoJSONP(txt) {
		if (!_O.youDaoScript) {
			_O.youDaoScript = document.createElement('DIV');
			_O.youDaoScript.style.display = 'none';
			document.documentElement.appendChild(_O.youDaoScript);
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
	function show(html, voiceSrc) {

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
		row.innerHTML = '<audio id="chromeQidiziTranslateVoice" default-src="' + (voiceSrc || '') + '" src="' + (voiceSrc || '') + '" autoplay="autoplay" style="display:none;"></audio>' + html;
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

	// 开始查询
	function getTrans() {
		var text = window.getSelection().toString().replace(/^\s+|\s+$/g, '').replace(/[_,]/g, ' ');

		if (!text.length) {
			return;
		}

		if (text.length > 300) {
			return show('选择字数过多', 1);
		}

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
		youDaoJSONP(text); //获取有道的
	}
	//播放声音:防止重复加载相同音源
	function playVoice(src) {
		var v = document.getElementById('chromeQidiziTranslateVoice');

		function replay() {
			v.pause();
			v.currentTime = 0;
			v.play();
		}
        
        function playSrc (src) {
            v.pause();
            v.src = src;
            v.load();
            v.play();
        }

		if (!v) {
			return;
		}

		var defaultSrc = v.getAttribute('default-src');
		var currentSrc = v.currentSrc;

		if (src) {
			if (src == currentSrc) { //新音源与播放器中相同
				replay();
				return;
			}

			playSrc(src);
			return;
		}

		if (currentSrc == defaultSrc) {// 播放器就是默认的
			replay();
			return;
		}

		playSrc(defaultSrc);
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

	//是否panel中dom
	function inPanel(dom) {
		var loop = 10; //自己的box的标签层级
		while (--loop > 0 && _O.shower !== dom && dom && dom.parentElement) {
			dom = dom.parentElement;
		}

		return _O.shower === dom;
	}

	window.addEventListener('blur', function () {

		//窗口失去焦点,隐藏show
		_O.showerShow && panelSwitch(0);
	});
    document.addEventListener('click', function(ev){
        isClickVoice(ev);
    });
	//绑定up事件
	document.addEventListener('mouseup', function (ev) {
		//点击非show区域,隐藏show
		!inPanel(ev.srcElement) && _O.showerShow && panelSwitch(0); ;
		// 移动结束了再判断是否需要翻译
		_O.selectionState && getTrans(ev);
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
();
