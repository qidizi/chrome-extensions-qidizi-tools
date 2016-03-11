/*
实现代理配置的管理功能
*/
define(function (require, exports, module) {
	var serverKey = 'proxy.server';
	var domainsKey = 'proxy.proxys';
	var proxyOn = 'proxy.on';
	var $ = require('$');
	var _O = {};
	var tparse = require('handlebars');
	var dialog = require('dialog/dialog-plus');
	function getProxys(todo){//获取store中的proxys
		chrome.storage.sync.get(domainsKey, function(obj){//总是返回包含key的对象
			todo(obj[domainsKey]||{});
		});
	}
	function setProxys(array, todo) {//保存proxys到store
		var obj = {};
		obj[domainsKey] = array;
		chrome.storage.sync.set(obj, todo);
	}
	function insertProxys(domain){//插入到store
		getProxys(function(array){	
			delete array[domain];
			array[domain] = 1;
			setProxys(array);
		});
	}
	function showLists(array){//显现列表
		function todo(array){
			var html = $('#proxysTplLists').html();
			html = tparse.compile(html)(array);
			$('#proxysLists').html(html);
		}
		
		array ? todo(array) : getProxys(todo);
	}
	function addSubmit() {//增加提交
		var domainer = this.elements.domain;
		var domain = $.trim(domainer.value);		
		/* 暂时无法确定shExpMatch的匹配细节,所以这块无法校验,只是非空检查*/
		if ('' === domain) {
			dialog({content:'请输入域名',quickClose:true}).show(domainer);
			return false;
		}
		
		insertProxys(domain);
		$(this.elements.save).show(function(){$(this).text('已保存!')}).delay(1000).show(function(){$(this).text('新增域名')});
		this.reset();		
		return false;
	}
	$(function(){		
		$.get('/proxys/popup.htm', function(html){
			$('#switchs').append(html);	
			chrome.storage.sync.get(proxyOn, function(obj){
				if (obj[proxyOn]) {
					$('#proxysSwitch').attr('checked', 'checked');
				}
			});
			$('#proxysSwitch').click(function(){	
				var setObj = {};
				setObj[proxyOn] = +this.checked;
				chrome.storage.sync.set(setObj);
			});
		});
		$('body').click4FNS({
			proxysListsShow:function(){//显示列表
				if (!$('#proxysSwitch:checked').val()) {
					return dialog({content:'请先启用管理',quickClose:true}).show(this);
				}
				
				var html = $('#proxysTplBox').html();
				html = tparse.compile(html)();
				dialog({
					title:'走代理域名列表管理',
					quickClose:true,
					content:html
				}).show($('#topLeftDot').get(0));
				chrome.storage.sync.get(serverKey, function(obj){
					$('#proxysServer').val(obj[serverKey]||'');
				});
				showLists();
				$('#proxysAdd').submit(addSubmit);
			},
			proxysDel:function(){//删除关系
				var index = $(this).attr('data-index');
				dialog({
					quickClose:true,
					okValue:'删除?!',
					ok:function(){
						getProxys(function(array){	
							delete array[index];
							setProxys(array);
						});
					}
				}).show(this);
			},
			proxysServerApply:function(){//应用代理配置
				var server = $.trim($('#proxysServer').val());
				
				if ('' !== server.replace(/(?:PROXY|SOCKS\d?)\s+\d{1,3}(?:\.\d{1,3}){3}\:\d+;\s*|DIRECT;\s*/g, '')) {
					return dialog({
						content:'格式有误,必须是"PROXY ip:端口;","SOCKS[5] ip:端口;","DIRECT;"三者之一,或组合,请参考proxy pac语法;',
						quickClose:true
					}).show($('#proxyServer')[0]);
				}
				
				if (!server) {
					chrome.storage.sync.remove(serverKey);
				} else {
					var obj = {};
					obj[serverKey] = server;
					chrome.storage.sync.set(obj);
				}
			}
		});
	});	
	chrome.storage.onChanged.addListener(function (obj, type) { //变更时
		if ('sync' !== type || !obj[domainsKey]) {
			return;
		}
		
		var nval = obj[domainsKey]['newValue'];
		//更新列表显示
		showLists(nval);
	});
});