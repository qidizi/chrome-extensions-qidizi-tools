+function(){    
  chrome.webRequest.onCompleted.addListener(function(details) {
    //在当前tab页面显示当前的ip信息
    var ip = details.ip;
    var tid = details.tabId;
    chrome.tabs.executeScript(tid, {
      code: '+function(){\
            var ip=document.createElement("div");\
            ip.innerHTML=\'<div style="position: fixed;bottom: 10px;left: 10px;font-size: 20px;color: black;padding: 10px;border: 1px solid darkgray;z-index: 9999999999;background-color: white;border-radius: 15px;opacity: 0.7;">IP: ' + ip + '</div>\';\
            document.body.appendChild(ip);\
            setTimeout(function(){\
              ip.parentNode.removeChild(ip);\
            }, 3000);\
        }()'
    });
  }, {
    urls: [ 'http://*/*', 'https://*/*' ],
    types: [ 'main_frame' ]
  });
}();