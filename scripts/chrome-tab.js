/*
chrome tab
 */
define(function (require, exports, module) {
    return; //因为会导致控制面板中的network响应信息不能显示，临时不使用，后期可以使用点击测试的方式来确认当前域名是否指向本地
	function todo(details) {
		//console.log(arguments);return;
		//在当前tab页面显示当前的ip信息
		var ip = details.ip;
		var tid = details.tabId;

        if (tid < 1) {
            return;
        }
        
		chrome.tabs.executeScript(tid, {
			code : '+function(){\
						            var ip=document.createElement("div");\
						            ip.innerHTML=\'<div title="点击隐藏" onclick="this.remove();" style="position: fixed;bottom: 20px;left: 10px;font-size: 20px;color: black;padding: 10px;border: 1px solid darkgray;z-index: 9999999999;background-color: white;border-radius: 15px;opacity: 0.7;">IP: ' + ip + '</div>\';\
						            document.body.appendChild(ip);\
						            setTimeout(function(){\
                                        if (!ip || !ip.parentNode) {\
                                            return;\
                                        }\
                                        \
                                        ip.parentNode.removeChild(ip);\
						            }, 3000);\
						        }()'
		});
	}
	chrome.webRequest.onCompleted.addListener(todo, {
		urls : ["<all_urls>"],
		types : ['main_frame']
	});	
});
