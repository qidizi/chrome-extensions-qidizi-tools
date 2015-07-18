# chrome-extensions-qidizi-tools
chrome的扩展插件

## 功能:

* 通过代理方式实现的hosts切换功能,只影响chrome,不对其它浏览器影响;
* 高自由度的chrome代理管理,可以配合任何代理工具使用;
* 按ALT+反选翻译功能;


## 提示:

* chrome的hosts管理扩展有 [hosts管理工具](https://github.com/qidizi/chrome-hosts-manager)  ,而代理插件有其它扩展,这二个功能都是使用代理来实现的,如果需要同时使用二个功能就无法实现,因为代理只允许一个;所以我就干脆自己弄了个:整合hosts和代理吧,因为hosts和代理我都需要同时在开发时用到;
* chrome扩展获取当前域名的ip时,我只找到一个实现方案,但是无法兼顾chrome扩展开发建议,后台页面由事件启动,因为webrequest不允许事件触发式的使用,只能长时间运行在后台才允许,也不太想再开发一个扩展来实现获取ip来显示,就先暂时这么处理了;
