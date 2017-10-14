var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('lodash');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
require('./moduls/SocketManager').init(io);

app.get('/', function(request, response) {
  response.render('pages/index');
});

server.listen(app.get('port'), function() {
  console.log('Up and running on port', app.get('port'));
});
