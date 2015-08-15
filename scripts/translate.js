/*
翻译功能
 */
define(function (require, exports, module) {
	var stkey = 'translate';
	function todo(tid) {
		//把翻译功能js插入tab页面
		chrome.tabs.executeScript(tid, {
			file : 'scripts/translate-insert.js',
			allFrames : true, //必须所有的框架都加才得
			runAt : 'document_end'
		});
	}
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) { //有效的情况下才加入翻译功能;
		if (
			'|complete|loading|'.indexOf('|' + changeInfo.status + '|') < 0 ||
			!tab.url ||
			!/^(?:https?\:|file\:)/i.test(tab.url)) {
			return;
		}

		chrome.storage.sync.get(stkey, function (obj) { //总是返回包含key的对象
			obj[stkey] && todo(tabId); //打开了开关才翻译
		});
	});
});
