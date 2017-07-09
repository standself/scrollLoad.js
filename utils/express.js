function express(req, res) {
    var tasks = [];

    var app = function (req, res) {
        var id = 0;
        function next() {
            var task = tasks[id++];
            if (!task) return;
            if (task[0]) {
                //  有监听router时，若url与router不对应，还要显式调用next();
                let url = req.url.match(/(\/[\d\w\D\W]*)\?/i) && req.url.match(/(\/[\d\w\D\W]*)\?/i)[1];
                console.log(url, '   url');

                url || req.url === task[0] ? task[1](req, res, next) : next();
            } else {
                task[1](req, res, next);
            }
            // next();
        }
        next();
    }

    app.use = function(route, fn) {
        if (typeof route == 'string') {
            tasks.push([route, fn]);
        } else if (typeof route == 'function') {
            tasks.push([null, route]);
        }
    }
    return app;
}

module.exports = express;