let io = null,
    users = [];

let init = function(_io) {
    if(!io) {
        io = _io;
    }

    listeners();
}

let listeners = function() {
    console.log('SOCKET LISTENERS ON ........');
    io.on('connection', function(socket) {
        console.log("NEW USER CONNECTED");

        socket.on('message', function(msg) {
            console.log(msg);
        })

        socket.on('identify', function(data) {
            console.log("IDENTIFICATION ", data);
        })

        socket.on('disconnect', function(){
            console.log("USER DISCONNECTED")
        })
    });
}

module.exports = {
    init
}