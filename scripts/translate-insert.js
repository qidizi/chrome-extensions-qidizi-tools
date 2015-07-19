/*
注入式的翻译功能
*/
+function() {
    if (!document.documentElement || !document.documentElement.appendChild || window.qidiziToolTranslate) {
        return;
    }
    
    window.qidiziToolTranslate = 1;//防止多次注入重复绑定
    var _O = {};
    function html2text (html) {
        return html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    //因为insert js与tab网页的window不是同一对象,就像运行于不同的sanbox中,所以,只能使用pm来通知
    //var port = chrome.extension.connect();
    window.addEventListener("message", function(event) {
        //发给自己才接
        if (event.source != window)
          return;
      
        if (event.data.youDao) {
            youDaoCallBack(event.data.youDao);
            //port.postMessage(event.data.text);//可以使用这个方法通知给插件,在插件的图标处显示结果?
        }
    }, false);
    //有道的回调
    function youDaoCallBack (obj) {
        if (obj.errorCode) {
            var error = {20:'要翻译的文本过长',
                          30:'无法进行有效的翻译',
                        　40:'不支持的语言类型',
                        　50:'开发的API的key已经失效,请重新申请',
                        　60:'无词典结果，仅在获取词典结果生效'
            };
            return show('获取有道翻译出错:' + error[obj.errorCode]);
        }    
        
        var html = '<a href="https://www.baidu.com/s?ie=utf-8&wd=' +encodeURIComponent(obj.query)+ '" target="_blank" title="点击百度查询">' +html2text(obj.query) +'</a><hr>';
        
        if (obj.translation) {
            html += obj.translation;
        }        
        
        //尝试发音,注意这个并非官方文档,百度出来的,不保证后期也可以使用
        html += ' <audio src="http://dict.youdao.com/dictvoice?audio=' +encodeURIComponent(obj.query)+ '" autoplay="autoplay" style="width:46px;" controls="controls" ></audio> ';
        
        if (obj.basic) {            
            if (obj.basic['phonetic']) {
                html += ' [<strong style="color:blue;">' +obj.basic['phonetic']+ '</strong>]';
            }      
            
            if (obj.basic['us-phonetic']) {
                html += ' US[<strong style="color:blue;">' +obj.basic['us-phonetic']+ '</strong>]';
            }  
            
            if (obj.basic['uk-phonetic']) {
                html += ' UK[<strong style="color:blue;">' +obj.basic['uk-phonetic']+ '</strong>]';
            }
        
            if (obj.basic.explains && obj.basic.explains.length) {
                html += '<br>' +obj.basic.explains.join('<br>')
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
                
                html += list.key +':<br>'
                     + list.value.join(';&nbsp;')
                     + '<br><br>';
            }
        }
        
        show(html);
    }
    //有道结果
    function youDaoJSONP (txt) {
        if (!_O.youDaoScript) {
            _O.youDaoScript = document.createElement('DIV');
            _O.youDaoScript.style.display = 'none';
            document.documentElement.appendChild(_O.youDaoScript); 
        }
        
        txt = encodeURIComponent(txt);
        var cb = encodeURIComponent('+function(o){window.postMessage({youDao:o},"*");}');
        var proto = String(document.location.protocol).toLowerCase().indexOf ('https')  > -1 ? 'https:' : 'http:' ;
        
        _O.youDaoScript.innerHTML = '';
        var js = document.createElement('SCRIPT');
        js.src = proto +'//fanyi.youdao.com/openapi.do?keyfrom=chrome-plugin&key=985650714&type=data&doctype=jsonp&callback=' +cb+ '&version=1.1&q=' + txt+ '&_=' + +new Date;
        _O.youDaoScript.appendChild(js);
    }
    //获取选中文字
    function getSelectedText () {
        var text = window.getSelection().toString();
        text = text.replace(/^\s+|\s+$/g, '');
        return text;
    }
    
    //显示
    function show (html, cls) {
        if (!_O.shower) {
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
            _O.shower.title = '点击框外关闭';
            document.documentElement.appendChild(_O.shower);
            _O.showContext = _O.shower;
        } else {
            _O.shower.style.display = 'block';
            
            if (_O.showCLS) {
                _O.showContext.innerHTML = '';
                _O.showCLS = 0;
            }
        }
        
        var row = document.createElement('DIV');
        row.style.padding =  "10px";
        row.innerHTML = html;
        _O.showContext.appendChild(row);  
        _O.showerShow = 1;        
    }
    
    //绑定鼠标抬起事件,如果是输入框中虽然可以使用onselect来启动
    document.addEventListener('mouseup',function(ev){
        var ev=ev||window.event, text;
        
        if (!ev.altKey || 1 !== ev.which || !(text = getSelectedText()).length ) {//要按下alt键,且是左键
            return;
        }
        
        if (text.length > 500) {
            return show ('选择字数过多', 1);
        }
        
        _O.showCLS = 1;
        youDaoJSONP(text);//获取有道的
    }, false);
    document.addEventListener('click',function(ev){
        if (!_O.showerShow) {
            return;
        }
        
        var el = ev.srcElement
        var loop = 10;//自己的box的标签层级
        
        while (--loop > 0 && _O.shower !== el && el && el.parentElement) {
            el = el.parentElement;
        }
        
        //点击其它位置,隐藏
        if (_O.shower !== el) {
            _O.shower.style.display = 'none';
            _O.showerShow = 0;
        }
    }, false);
}();