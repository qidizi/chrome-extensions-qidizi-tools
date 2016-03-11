/*
实现翻译开头管理功能
*/
define(function (require, exports, module) {
	var storeKey = 'translate';
	var $ = require('$');
	function getHosts(todo){//获取store中的hosts
		chrome.storage.sync.get('hosts', function(obj){//总是返回包含key的对象
			todo(obj['hosts']||[]);
		});
	}
	function setHosts(array, todo) {//保存hosts到store
		array.sort(function(a,b){//根据domain来排序
			a = a.domain;
			b = b.domain;
			
			if (a > b) {
				return 1;
			}
			
			return a === b ? 0 : -1;
		});
		chrome.storage.sync.set({'hosts': array}, todo);
	}
	$(function(){		
		$.get('/translate/popup.htm', function(html){
			$('#switchs').append(html);//显示控制开头
			chrome.storage.sync.get(storeKey, function(obj){//初始上轮选中状态
				if (obj[storeKey]) {
					$('#translateSwitch').attr('checked', 'checked');
				}
			});
			$('#translateSwitch').click(function(){//绑定点击事件
				var setObj = {};
				setObj[storeKey] = +this.checked;
				chrome.storage.sync.set(setObj);
			});	
		});
	});	
	chrome.storage.onChanged.addListener(function (obj, type) { //变更事件过滤处理,如果是自己就同步
		if ('sync' !== type || !obj[storeKey]) {//只取自己的事件
			return;
		}
	});
});