//代理功能
// 用途1 hosts功能
// 用途2 代理功能
/*
代理脚本可以使用的方法
timeRange(8, 18) 当前时间是否位于8-18点?
dateRange("JAN", "MAR") 当前日期位于jan与mar之间?
weekdayRange("MON", "FRI") 位于星期之间?
dnsDomainLevels(host) host == q.com 返回1,也就是点个数
isResolvable: 使用dns来解析域名,如果成功.
localHostOrDomainIs(host, ".google.com"): 域名中主机和域名部分都匹配?

---------
The following statement is true (exact match):

localHostOrDomainIs("www.example.com", "www.example.com")
The following statement is true (host name match, domain name not specified):

localHostOrDomainIs("www", "www.example.com")
The following statement is false (domain name mismatch):

localHostOrDomainIs("www.mcom.com", "www.example.com")
The following statement is false (host name mismatch):

localHostOrDomainIs("home.example.com", "www.example.com")
----------------


isPlainHostName(host) host中不包含任何.(点)?
dnsResolve(host) 解析得到ip
myIpAddress() 得到本地的主机ip,也就是网卡上的地址
isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") isInNet( host, pattern, mask )　　host 主机名称，可以是 Domain Name 或 IP。如果是 Domain Name，则会透过 DNS 查出 IP。　　pattern IP。　　mask对应于 pattern 的屏蔽。　　此 Function 会 host 是否在指定的 IP 范围内，如果是，则 return true；否则 return false。
shExpMatch(host, '*.qq.com') 字符匹配,使用shell形式的匹配,如*,?号
dnsDomainIs(host, '.qq.com') 后缀匹配
 */
define(function (require, exports, module) {
	var serverKey = 'proxy.server';
	var hostsKey = 'proxy.hosts';
	var domainsKey = 'proxy.proxys';
	var proxyOn = 'proxy.on';
	var hostsOn = 'proxy.hosts.on';
	
	function proxySet(obj) { //配置proxy
		var funs = [
			'var serverKey=' + JSON.stringify(serverKey),
			'var hostsKey=' + JSON.stringify(hostsKey),
			'var domainsKey=' + JSON.stringify(domainsKey),
			'var proxyOn=' + JSON.stringify(proxyOn),
			'var hostsOn=' + JSON.stringify(hostsOn),
			
			function pacAlert(str) { //my alert
				var dbg;
				dbg["proxy.pac-debug:" + str];
			},

			function getPort(url) {
				var url = url.match(/^(?:\w+[\:\/]+)[^\:\/]+(\:\d+)/);
				return url ? url[1] : 80;
			},

			function http(hostname, url) {
				return 'PROXY ' + hostname + ':' + getPort(url);
			},
			
			function FindProxyForURL(url, host) { //host:only hostname,not include port; url:not include hash
				//hosts hight level
				var tmp;
				
				if (cfg[hostsOn] && cfg[hostsKey]) {
					if (tmp = cfg[hostsKey][host]) {
						return http(tmp, url);//string full match 
					}
					
					for (tmp in cfg[hostsKey]) {//shell match ;like '*.qq.com'
						if (shExpMatch(host, tmp)) { 
							return http(cfg[hostsKey][tmp], url);
						}
					}
				}
				
				//proxys low level
				if (cfg[proxyOn] && cfg[serverKey] && cfg[domainsKey]) {
					for (tmp in cfg[domainsKey]) {
						if (shExpMatch(host, tmp)) { //lik '*.qq.com'
							if (0 === cfg[domainsKey]) {//black list
								return 'DIRECT;';
							}
							
							return cfg[serverKey];//white list;
						}
					}
				}
				
				return 'DIRECT;';
			}
		];

		//因为pacjs在一个sandbox中运行,无法跟这里的变量共享,只能把变量放入pacjs;
		//也就是说,需要改变pacjs时,都需要重新加载一次;
		var pacJS = 'var cfg = '+JSON.stringify(obj)+'||{};\n';
		//console.log(pacJS)
		for (var i = 0; i < funs.length; i++) {
			pacJS += funs[i] + ';\n';
		}

		chrome.proxy.settings.set({
			value : {
				mode : "pac_script", //pac脚本模式
				pacScript : {
					data : pacJS, //注意不允许包含非 ASCII,也就是不能放中文
					mandatory : false //代理脚本失败时,是否直接联网?
				}
			},
			scope : 'regular' //普通与隐私模式通用
		});
	}
	function initSet() {
		chrome.storage.sync.get([serverKey,hostsKey, domainsKey, proxyOn, hostsOn], function(obj){//为了方便其它组件更新,必须独立储存
			proxySet(obj); //立刻绑定
		});
	}
	chrome.storage.onChanged.addListener(function (obj, type) { //变更时,重新配置proxy
		if ('sync' !== type) {
			return;
		}
		
		if (!obj[serverKey] && !obj[hostsKey] && !obj[domainsKey] && !obj[proxyOn] && !obj[hostsOn]) {
			return;
		}
		
		initSet(); //重置proxy处理代码
	});
	initSet();
});
