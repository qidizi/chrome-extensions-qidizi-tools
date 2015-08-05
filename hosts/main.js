/*
实现hosts管理功能
*/
define(function (require, exports, module) {
	var hostsOn = 'proxy.hosts.on';
	var hostsKey = 'proxy.hosts';
	var $ = require('$');
	var _O = {};
	var tparse = require('handlebars');
	var dialog = require('dialog/dialog-plus');
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
	function cleanDomain (array, domain){//移除已经存在的域名,只保留当前添加的域名对应关系
		var tmp = [];
		$.each(array, function(i,v){
			if (v.domain === domain) {
				return;
			}
			
			tmp.push(v);
		});		
		return tmp;
	}
	function insertHosts(ip, domain){//插入到store
		getHosts(function(array){	
            // 允许重复关系存在
			//array = cleanDomain(array, domain);
			array.push({
				ip:ip,
				domain:domain
			});
			setHosts(array);
		});
	}
	function showLists(array){//显现列表
		function todo(array){
			var html = $('#hostsTplLists').html();
			html = tparse.compile(html)(array);
			$('#hostsLists').html(html);
		}
		
		array ? todo(array) : getHosts(todo);
	}
	function addSubmit() {//增加提交
		var iper = this.elements.ip;
		var ip = $.trim(iper.value);
		var domainer = this.elements.domain;
		var domain = $.trim(domainer.value);
		
		if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
			dialog({align: 'top',content:'ip格式不正确',quickClose: true}).show(iper);
			return false;
		}
		
		$.each(ip.split('.'), function(i, v){
			if (v < 0 || v > 255) {
				dialog({align: 'top',content:'ip格式不正确:节点' +v+ '不在0-255之间',quickClose: true}).show(iper);
				ip = 0;
				return false;
			}
		});
		
		if (!ip) {
			return false;
		}
		
		
		if ('' === domain) {
			dialog({content:'请输入域名',quickClose:true}).show(domainer);
			return false;
		}
		
		insertHosts(ip, domain);
		$(this.elements.save).show(function(){$(this).text('已保存!')}).delay(1000).show(function(){$(this).text('新增影射')});
		this.reset();		
		return false;
	}
	$(function(){		
		$.get('/hosts/popup.htm', function(html){
			$('#switchs').append(html);		
			chrome.storage.sync.get(hostsOn, function(obj){
				if (obj[hostsOn]) {
					$('#hostsSwitch').attr('checked', 'checked');
				}
			});
			$('#hostsSwitch').click(function(){	
				var setObj = {};
				setObj[hostsOn] = +this.checked;
				chrome.storage.sync.set(setObj);
			});	
		});
		$('body').click4FNS({
			hostsListsShow:function(){//显示列表
				if (!$('#hostsSwitch:checked').val()) {
					return dialog({content:'请先启用管理',quickClose:true}).show(this);
				}
				
				var html = $('#hostsTplBox').html();
				html = tparse.compile(html)();
				dialog({
					title:'hosts影射列表管理',
					quickClose:true,
					content:html
				}).show($('#topLeftDot').get(0));
				showLists();
				$('#hostsAdd').submit(addSubmit);
			},
			hostsDel:function(){//删除关系
				var index = $(this).attr('data-index');
				dialog({
					quickClose:true,
					okValue:'删除?!',
					ok:function(){
						getHosts(function(array){	
							array.splice(index, 1);
							setHosts(array);
						});
					}
				}).show(this);
			},
			hostsHostOn:function(){
				$(this).toggleClass('enabled');
				var index = $(this).attr('data-index');
				var on = $(this).hasClass('enabled');
				$(this).attr('title', on ? '点击禁用' : '点击启用');
				getHosts(function(array){	
					array[index].on = on;
					setHosts(array);
				});
			}
		});
	});	
	function hosts4proxy(obj){//转化成proxy专用格式
		if (!obj) {
			return null;
		}
		
		var tmp = {};
		
		for (var fori = 0; fori < obj.length; fori++){
			if (!obj[fori].on) {
				continue;
			}
			
			tmp[obj[fori].domain] = obj[fori].ip;
		}
		
		return tmp;
	}
	chrome.storage.onChanged.addListener(function (obj, type) { //变更时
		if ('sync' !== type || !obj['hosts']) {
			return;
		}
		
		var nval = obj['hosts']['newValue'];
		//更新proxy的hosts
		var setObj = {};
		setObj[hostsKey] = hosts4proxy(nval);
		chrome.storage.sync.set(setObj);
		//更新列表显示
		showLists(nval);
	});
});