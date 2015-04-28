define(function(require, exports, module) {
	var $ = require('jquery');
    var click4FNS = { len: 0 };
    var type = 'data-click4';

    function getDOMKey() {
        return $(this).attr(type);
    }
    //返回click4FNS
    $.fn.click4FNS = function (object) {
        var myIndex;

        if (!$(this).attr('data-click4-bind')) {//防止重复绑定
            myIndex = ++click4FNS.len;
            $(this).attr('data-click4-bind', myIndex);
            $(this).click(function (event) {
                var mxLoop = +click4FNS[getKey('@loopParents')] || 10;//向上查询顶级
                var srce = event.target;
                var gk = 'function' === typeof click4FNS[getKey('@getDOMKey')] ? click4FNS[getKey('@getDOMKey')] : getDOMKey;//获取funcname的方法

                while (mxLoop-- > 0) {
                    if (!$(srce).length) {
                        break;
                    }

                    var clk4 = gk.call(srce);

                    if (clk4 && 'function' === typeof click4FNS[getKey(clk4)]) {
                        click4FNS[getKey(clk4)].call(srce);
                        break;
                    }

                    if ('body' === $(srce).get(0).tagName.toLowerCase()) {
                        break;
                    }

                    srce = $(srce).parent();

                }
            });
        } else {
            myIndex = $(this).attr('data-click4-bind');
        }

        if ('object' === $.type(object)) {//加上id防止不同对象同名冲突
            $.each(object, function (i,v) {
                click4FNS[getKey(i)] = v;
            });
        }

        function getKey(i) {
            return myIndex + ':' + i;
        }
        return click4FNS;
    };

    if (! $('#ajaxLoading').length) {
        $('body').append('<div id="ajaxLoading" style="position:relative;top:0;left:0;z-index:99999999;color:red;background-color:black;opacity:0.7;">加载中...</div>');
        $(document).ajaxStart(function(){
            $('#ajaxLoading').show();
        }).ajaxStop(function(){
            $('#ajaxLoading').hide();
        });  
    }
    module.exports = $;
});
