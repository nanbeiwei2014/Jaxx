/**
 * Created by Vlad on 10/18/2016.
 */
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/'));
var port = process.env.PORT || 3000;
app.listen(port);
console.log('started at ' + port);