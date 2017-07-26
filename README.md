# scrollLoad.js

 一个原生的JavaScript滚动加载库。核心功能有：
- 滚动加载远程数据
- 滚动加载静态数据
- 滚动加载图片，可预加载。
- 可设定初始滚动加载次数，超过次数将以分页形式显示

### 参数 options

| 参数 | 类型 | 默认值 | 说明 |
| ----- | ----- | ----- | ----- |
| loading | HTMLString | '<div class="ScrollLoad-loading">Loading...</div>' | 加载数据时的提示语 |
| threhold | Number | 50 | 滚动条在距离底部多远响应加载，单位为px |
| container | Dom/selector | document.body |监听滚动的元素 |
| template | function/boolean | false | 返回数据后,格式化数据的函数,返回HTMLString，用以添加新加载的内容;如果为假，直接添加数据到页面; 如果为真，外部包裹'<div class="ScrollLoad"></div>' |
| throttle | Number | 50 | 返回数据后，格式化数据的函数，应该返回HTML string，用以添加新加载的内容 |
| reload | boolean | true | 在数据加载失败后，是否显示重新加载提示语 |
| nonStaticData | Object | { urls: [], requestType: 'get', dataType: 'data' } | 需要向服务器请求的数据，数据url放在urls中。请求类型分为get、jsonp。dataType分为data和img。如果为img，将会预加载前一张image |
| staticData | Array | [] | 无需向服务器请求的数据。|
| pagination | Object | {times: 0, pages: 0} | 是否展示分页。times设置后，将在首页响应times次滚动加载;然后显示pages+1个分页按钮（含首页）。|

### 其他可用接口
```
var scroll = new ScrollLoad(ops);
// 可以手动启动监听滚动事件，结合unbindEvent()事件使用
scroll.bindEvent();
// 可以手动取消监听滚动事件。
scroll.unbindEvent();
// 以ajax形式请求数据
scroll.ajax(url, type, success, error);
// 以jsonp的形式请求数据
scroll.jsonp(url, success, error)
// 预加载图片，url可为链接数组。当trigger为真时，不论加载成功与否，都会调用callback函数。
scroll.preloadImg(url, callback = function () {}, trigger = true)
```

### 使用 usage
[demo](http://standself.github.io/scrollLoad.js/scrollLoad.tests.html)

```
var urls = [];
// 当作为nonStaticData的属性值时，urls为链接数组; 当作为staticData的值时，urls为数据数组。
urls = [];

var scroll = new ScrollLoad({
    threhold: 60,
    container: document.querySelector('.js-modal-rule'),
    template: function(datas) {
        datas = JSON.parse(JSON.stringify(datas));
        let str = '<ul>';
        str += '<li>' + datas.title + '</li>';
        str += '<li>' + '-------分割-------' + '</li>';
        str += '</ul>';
        return str;
    },
    nonStaticData: {
        urls: urls,
        requestType: 'jsonp',
        dataType: 'data',
        reload: true,
    },
    // staticData: urls,
    pagination: {
        times: 3,
        pages: 4
    },
    callback: function(data) {
        //每响应一次滚动、请求一次数据的回调函数。执行次数等于urls.length;
    }
});
</script>
```