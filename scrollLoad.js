;(function(win, doc) {
    /*  scrollLoad version 0.1 
     *  参考 https://github.com/fa-ge/Scrollload/blob/master/src/Scrollload.js
     * options：
     *      loading     HTML string     正在加载数据的提示语（用户需要调用createNewDom 才能显示新加载的内容; ）
     *      threhold    Number          滚动条在距底部多远响应加载
     *      container   Dom/selector    监听滚动的元素
     *      template    function        返回数据后，格式化数据的函数，应该返回HTML string，用以添加新加载的内容
     *      throttle    Number          函数节流的时间周期
     *      callback    function        响应滚动的回调函数。你需要在该函数中显式地调用createNewDom(data)才能添加到container中。
    */

    /*
     * api              参数         说明
     * unbindEvent                   使用该函数后，停止监听scroll事件
     * bindEvent                     在使用unbindEvent以后，可以使用该函数重新监听
     * ajax         (url, type, suc, err) ajax请求数据
     * jsonp        (url, suc, err)  jsonp请求数据
     * preloadImg   (url/urls, suc, err, boolean) 预加载图片
    */

    class ScrollLoad {
        constructor (options = {}) {
            this.default = {
                loading: `<div class="ScrollLoad-loading">Loading...</div>`,
                threhold: 0,
                container: doc.body,
                template: false,
                throttle: 50,
                nonStaticData: {
                    urls: [],
                    requestType: 'get',// jsonp
                    dataType: 'data',// img
                },
                reload: true,
                staticData: [],
                pagination: {
                    times: 0,
                    pages: 0,
                },
                callback: function () {},
            };

            this.options = Object.assign({}, this.default, options);
            this.status = {
                isLoading: false,
                nowLoad: 0,
                preloadImg: false,
                currentPage: 0,
            };
            this.paginationData = null;
            this.paginationDoms = [];
            this.init();
        }

        init () {
            // 加载的数据类型是图片时，预加载首张图片
            if (this.options.nonStaticData.dataType == 'img' && this.options.nonStaticData.urls.length > 0) this.preloadImg(this.options.nonStaticData.urls[0]);
            if (this.options.pagination.pages) {
                this.paginationData = this.formateDataForPagination(this.options.nonStaticData, this.options.staticData);
            }
            this.scrollListener = this.throttle(this.scrollEvent, this.options.throttle).bind(this);
            this.bindEvent();
        }

        changeStatus(key, value) {
            this.status[key] = value;
        }
        getStatus(key) {
            return this.status[key];
        }

        showLoadingDom () {
            this.changeStatus('isLoading', true);
            let currentPage = this.getStatus('currentPage');
            this.options.container.insertAdjacentHTML('beforeend', this.options.loading);
            this.$loading = this.options.container.querySelector('.ScrollLoad-loading');
        }
        hideLoadingDom () {
            if (this.$loading) this.options.container.removeChild(this.$loading);
        }

        showErrorDom () {
            this.$loading.innerHTML = this.options.reload
                    ? '数据加载失败, <span class="ScrollLoad-reload">重新加载</span>'
                    : '数据加载失败';
            this.$reload = this.$loading.querySelector('.ScrollLoad-reload');
            this.$reload && (this.$reload.onclick = () => {
                let preloadResult = this.getStatus('preloadImg');
                this.changeStatus('isLoading', false);
                this.hideLoadingDom();
                if (preloadResult.length > 0) {
                    // 处理数据类型是图片时的reload
                    let urls = preloadResult.map((item) => {
                        return item.src;
                    });
                    this.preloadImg(urls);
                }
                this.loadData();
            });
        }
        showPaginationDom () {
            let pages = this.options.pagination.pages;
            let currentPage = this.getStatus('currentPage');
            let str = '';
            for (let i = 0; i <= pages; i++) {
                str += `<li class="ScrollLoad-pageId ${i === currentPage && 'current'}">${i+1}</li>`;
            }
            str = '<ul class="ScrollLoad-pagination">' + str + '</ul>'
            this.options.container.insertAdjacentHTML('beforeend', str);
            this.$paginating = this.options.container.querySelector('.ScrollLoad-pagination');
            this.paginationDoms[currentPage] = this.options.container.innerHTML;
        }

        changeContainerDom (innerHTML) {
            if (innerHTML) {
                this.options.container.innerHTML = innerHTML;
                return;
            }
            let currentPage = this.getStatus('currentPage');
            this.options.container.innerHTML = '';
        }

        createNewDom (data) {
            // ①提供了模版函数的话，用返回的数据填充模版；②template为true，表明用户自己进行模版化。③template为false，直接创建一个div子元素，填充数据
            if (!this.options.template) {
                this.options.container.insertAdjacentHTML('beforeend', `<div class="ScrollLoad">${data}</div>`);
            } else if (typeof this.options.template === 'function') {
                let str = this.options.template.call(this, data);
                if (typeof str == 'string') {
                    this.options.container.insertAdjacentHTML('beforeend', str);
                } else {
                    throw new Error('function template must return a HTML string.');
                }
            } else {
                this.options.container.insertAdjacentHTML('beforeend', data);
            }
            this.hideLoadingDom();
            this.changeStatus('isLoading', false);
        }

        scrollEvent () {
            if (this.getStatus('isLoading') || this.$paginating) return;
            let ele = this.options.container;
            let h = ele.scrollHeight - ele.clientHeight;
            if (h - ele.scrollTop <= this.options.threhold) {
                this.loadData();
            }
        }

        loadData () {
            let current = this.getStatus('nowLoad');
            let data = this.options.nonStaticData;
            let staticData = this.options.staticData;
            
            if (this.options.pagination.pages) {
                this.loadDataForPagination(this.options.callback);
            } else if (data && data.urls && data.urls.length > 0) {
                this.loadDataFromServer(data, this.options.callback);
            } else if (staticData && staticData.length > 0) {
                this.loadDataFromLocal(staticData, this.options.callback);
            } else {
                this.options.callback.apply(this);
            }
        }
        // 动态请求数据。分get、jsonp; 请求的数据类型分别数据和图片;
        // 请求的返回的数据里面若含有图片，不做预加载；可以在template函数里面自定义预加载。
        loadDataFromServer (nonStaticData, callback) {
            let requestType = nonStaticData.requestType;
            let dataType = nonStaticData.dataType;
            let current = this.getStatus('nowLoad');
            if (nonStaticData.urls.length === 0 || current == nonStaticData.urls.length) {
               return;
            }
            this.showLoadingDom();
            if (requestType === 'get' && dataType === 'data') {
                this.ajax(
                    requestType,
                    nonStaticData.urls[current],
                    (data) => {
                        this.changeStatus('nowLoad', (current+1));
                        this.createNewDom(data);
                        typeof callback == 'function' && callback(data);
                    },
                    () => {
                        this.showErrorDom();
                    });
            } else if (requestType === 'get' && dataType === 'img') {
                let nowUrl = nonStaticData.urls[current];
                let img = `<img class="ScrollLoad-img" src="${nowUrl}">`;
                let preloadResult = this.getStatus('preloadImg');
                if (!preloadResult || preloadResult.length === 0) {
                    this.showErrorDom();
                    return;
                }
                this.changeStatus('nowLoad', (current+1));
                this.createNewDom(img);
                typeof callback === 'function' && callback(img);
                if ((current+1) < nonStaticData.urls.length) {
                    let nextUrl = nonStaticData.urls[current+1];
                    this.preloadImg(nextUrl);
                }
            } else if (requestType === 'jsonp') {
                var script = this.jsonp(nonStaticData.urls[current], (data) => {
                    this.createNewDom(data);
                    this.changeStatus('nowLoad', (current+1));
                    (typeof callback === 'function') && callback(data);
                    doc.querySelector('head').removeChild(script);
                }, () => {
                    this.showErrorDom();
                });
            }
        }

        loadDataFromLocal (staticData, callback) {
            let current = this.getStatus('nowLoad');
            if (!staticData[current]) return;
            this.showLoadingDom();
            this.createNewDom(staticData[current]);
            this.changeStatus('nowLoad', (current+1));
            typeof callback === 'function' && callback(staticData[current]);
        }

        loadDataForPagination (callback) {
            let currentPage = this.getStatus('currentPage');
            let current = this.getStatus('nowLoad');
            let { dataForScroll, formateResult} = this.paginationData;
            if (this.paginationDoms[currentPage]) {
                this.changeContainerDom(this.paginationDoms[currentPage]);
                return;
            }
            if (dataForScroll.urls) {
                if (currentPage === 0) {
                    if (current === dataForScroll.urls.length) {
                        this.showPaginationDom();
                        this.changeStatus('currentPage', currentPage+1);
                        this.changeStatus('nowLoad', 0);
                        return;
                    }
                    this.loadDataFromServer(dataForScroll, callback);
                } else {
                    this.changeContainerDom();
                    this.changeStatus('nowLoad', 0);
                    let i = 0;
                    let len = formateResult[currentPage-1].urls.length;
                    var recursion = () => {
                        // loadDataFromServer有异步更改current，用for循环会导致current与循环的i不能对应。改用递归。
                        this.loadDataFromServer(formateResult[currentPage-1], () => {
                            callback[arguments[0]];
                            if (i == (len -1)) {
                                this.options.container.scrollTop = 0;
                                this.showPaginationDom();
                                return;
                            } else {
                                i++;
                                recursion();
                            }
                        });
                    };
                    recursion();
                    // for (let i = 0, len = formateResult[currentPage-1].urls.length; i < len; i++) {
                    //     this.loadDataFromServer(formateResult[currentPage-1], () => {
                    //         callback(arguments[0]);
                    //         if (i === (len-1)) {
                    //             this.options.container.scrollTop = 0;
                    //             this.showPaginationDom();
                    //         }
                    //     });
                    // }
                }
            } else {
                if (currentPage === 0) {
                    if (current === dataForScroll.length) {
                        this.showPaginationDom();
                        this.changeStatus('currentPage', currentPage+1);
                        this.changeStatus('nowLoad', 0);
                        return;
                    }
                    this.loadDataFromLocal(dataForScroll, callback);
                } else {
                    this.changeContainerDom();
                    this.changeStatus('nowLoad', 0);
                    for (let i = 0, len = formateResult[currentPage-1].length; i < len; i++) {
                        this.loadDataFromLocal(formateResult[currentPage-1], () => {
                            callback(arguments[0]);
                            if (i === (len-1)) {
                                this.options.container.scrollTop = 0;
                                this.showPaginationDom();
                            }
                        });
                    }
                }
            }
        }

        formateDataForPagination (nonStaticData, staticData) {
            // 要把对应的data进行分页并格式化为nonStaticData或staticData的结构，再循环调用对应的loadDataFrom**方法。
            let allowScrollTimes = this.options.pagination.times;
            let pages = this.options.pagination.pages;
            let dataForScroll;
            let dataForPagination = [];
            let dataLengthPerPage = 0;
            let formateResult = [];
            if (nonStaticData.urls.length > 0) {
                dataForScroll = {
                    urls: nonStaticData.urls.slice(0, allowScrollTimes),
                    requestType: nonStaticData.requestType,
                    dataType: nonStaticData.dataType
                };
                dataForPagination = nonStaticData.urls.slice(allowScrollTimes);
            } else if (staticData.length > 0) {
                dataForScroll = staticData.slice(0, allowScrollTimes);
                dataForPagination = staticData.slice(allowScrollTimes);
            }

            dataLengthPerPage = dataForPagination.length % pages === 0
                ? dataForPagination.length / pages
                : dataForPagination.length / pages + 1;
            while (formateResult.length !==  pages) {
                let start = formateResult.length * dataLengthPerPage,
                    end = (formateResult.length+1) * dataLengthPerPage;
                let temp = dataForScroll.urls && dataForScroll.urls.length > 0 ?
                    {   urls: dataForPagination.slice(start, end),
                        requestType: dataForScroll.requestType,
                        dataType: dataForScroll.dataType
                    } : dataForPagination.slice(start, end);
                formateResult.push(temp);
            } 
            return {
                dataForScroll,
                formateResult,
            };
        }

        ajax (type, url, success, error) {
            let xhr = new XMLHttpRequest();
            xhr.open(type, url, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    success(xhr.responseText);
                    // this.changeStatus('nowLoad', (current+1));
                    // this.createNewDom(xhr.responseText);
                    // typeof callback == 'function' && callback(xhr.responseText);
                }
            };
            xhr.timeout = 10000;
            xhr.onerror = error;
            xhr.ontimeout = error;
            xhr.send();
        }

        jsonp (url, success, error) {
            let num = '';
            while (num.length < 8) {
                num += (Math.random() * 10).toFixed();
            }
            let callbackName = '_ScrollLoadJsonp' in win ? ('_ScrollLoadJsonp' + num)  : '_ScrollLoadJsonp';
            let script = doc.createElement('script');
            script.src = url + '?callback=' + callbackName;
            script.setAttribute('type', 'text/javascript');
            script.onerror = error;
            win[callbackName] = success;
            doc.querySelector('head').appendChild(script);
            return script;
        }

        preloadImg (url, callback = function () {}, trigger = true) {
            let urls = [];
            let loaded = 0;
            let timer = null;
            let timeout = 10000;
            let current = 0;
            let images = [];
            if (Array.isArray(url)) {
                urls = urls.concat(url);
            } else if (typeof url === 'string') {
                urls.push(url);
            }
            urls.forEach((url) => {
                let img = new Image();
                img.src = url;
                img.onload = () => {
                    loaded++;
                    images.push(img);
                }
                img.onerror = (event) => {
                    // callback(event);
                    this.changeStatus('preloadImg', []);
                }
            });
            timer = setInterval(() => {
                current += 50;
                if (loaded === urls.length) {
                    clearInterval(timer);
                    this.changeStatus('preloadImg', images);
                    typeof callback == 'function' && callback();
                }
                if (current === timeout) {
                    clearInterval(timer);
                    if (trigger) {
                        typeof callback == 'function' && callback();
                    }
                } 
            }, 50);
        }

        bindEvent () {
            console.log('binded', this);
            this.options.container.addEventListener('scroll', this.scrollListener);
            this.options.container.addEventListener('click', (e) => {
                let $pageIds = [].slice.apply(this.options.container.querySelectorAll('.ScrollLoad-pageId'));

                let target = e.target;
                if (target.tagName == 'LI'
                    && target.classList.contains('ScrollLoad-pageId') 
                    && !target.classList.contains('current')) {
                    this.changeStatus('currentPage',Number(target.innerText)-1);
                    this.loadData();
                }
            });
        }
        unbindEvent () {
            this.options.container.removeEventListener('scroll', this.scrollListener);
        }

        throttle (func, wait, options) {
            // 来自 网络，underscore.js 里面的throttle。
            // Returns a function, that, when invoked, will only be triggered at most once
            // during a given window of time. Normally, the throttled function will run
            // as much as it can, without ever going more than once per `wait` duration;
            // but if you'd like to disable the execution on the leading edge, pass
            // `{leading: false}`. To disable execution on the trailing edge, ditto.
            var context, args, result;
            var timeout = null;
            var previous = 0;
            if (!options) options = {};
            var later = function() {
                // 执行func，记录执行时间点
                previous = options.leading === false ? 0 : Date.now();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            };
            return function() {
                var now = Date.now();
                if (!previous && options.leading === false) previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    // 如果剩余时间小于0 或者大于等待时间
                    if (timeout) {
                    // 当 timerout为真时，已有计时器。需要清空
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    // 清空后立即执行一次目标函数
                    result = func.apply(context, args);
                  // 执行后把上下文和参数清空
                    if (!timeout) context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        }
    }
    win.ScrollLoad = ScrollLoad;
})(window, document);