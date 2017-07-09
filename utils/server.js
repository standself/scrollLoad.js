var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('./express');
var app = express();

 var arr = [
    "第2章公路工程概算预算编制", 
    "第3章公路工程工程量清单计量", 
    "第4章公路工程预算定额介绍", 
    "第5章路基工程定额工程量的计算", 
    "第6章路面工程定额工程量的计算", 
    "第7章隧道工程预算定额的计算", 
    "第8章桥涵工程定额工程量的计算", 
    "第9章防护工程定额工程量的计算", 
    "第10章交通工程沿线设施定额工程量计算", 
    "第11章其他工程定额工程量计算", 
    "第12章公路工程施工图预算的编制与审查", 
    "第13章公路工程结算与竣工决算"
];
var brr = arr.map((item, index) => { return { chapter: index+1, content: item}});


app.use(function(req, res, next) {
    console.log('middleware 01');
    // console.log(req);
    next();
});

app.use(function(req, res, next) {
    console.log('middleware 02');
    // console.log(req);
    next();
});

brr.forEach((item, index) => {
    var pathname = '/chapter' + (index+1);
    app.use(pathname, function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('charset', 'utf-8');
        res.writeHead(200, 'ok');
        res.write(JSON.stringify(item));
        res.end();
    });
});

app.use('/test.html', function(req, res) {
    var pathname = path.join(__dirname, req.url.trim());
    res.setHeader('contentType', 'text/html');
    fs.readFile(pathname, 'binary', function(err, content) {
        console.log(err)
        res.writeHead(200, 'ok');
        res.write(content, 'binary');
        res.end();
    });
});

app.use('/scrollLoad.test.html', function(req, res) {
    var pathname = path.join(__dirname, req.url.trim());
    res.setHeader('contentType', 'text/html');
    fs.readFile(pathname, 'binary', function(err, content) {
        // console.log(err)
        res.writeHead(200, 'ok');
        res.write(content, 'binary');
        res.end();
    });
});
app.use('/scrollLoad.js', function(req, res) {
    var pathname = path.join(__dirname, req.url.trim());
    res.setHeader('contentType', 'text/html');
    fs.readFile(pathname, 'binary', function(err, content) {
        // console.log(err)
        res.writeHead(200, 'ok');
        res.write(content, 'binary');
        res.end();
    });
});

app.use(function(req, res, next) {
    res.writeHead(404, 'you can\'t see it');
    res.write('not found');
    res.end();
})


http.createServer(app).listen(8091);
console.log('listen on port: 8080');