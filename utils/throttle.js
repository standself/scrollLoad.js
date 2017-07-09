// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
function throttle(func, wait, options) {
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
        // 当 timerout为真时，表面前一次尚未执行。需要清空
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
};

function throttle(fn, wait) {
    var context, args, result;
    var timer = null;
    var previous = 0;
    var later = function () {
        previous = Date.now();
        timer = null;
        result = fn.apply(context, args);
        if (!timer) context = args = null;
    }

    return function() {
        let now = Date.now();
        let remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            previous = now;
            result = fn.apply(context, args);
            if (timer) {
                clearTimeout(timer);
            }
            if (!timer) context = args = null;
        } else if (!timerout && remaining == wait) {
            timer = setTimeout(later, remaining);
        }
    }
}