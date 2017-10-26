let io = null,
    users = [],
    me = null;

let init = function(_io) {
    if(!io) {
        io = _io;
    }

    listeners();
}

let _log = (title, data) => {
    title = title || "";
    data = data || "";
    console.log(title, data);
}

let listeners = function() {
    console.log('SOCKET LISTENERS ON ........');
    io.on('connection', function(socket) {
        me = socket
        console.log("NEW USER CONNECTED");

        socket.on('message', function(msg) {
            console.log(msg);
        })

        socket.on('identify', function(data) {
            data.sock_id = socket.id;
            users.push(data);
            console.log("IDENTIFICATION ", users);

            _log("ALL USERS", data)
        })

        socket.on('disconnect', function(){
            console.log("USER DISCONNECTED")
            users = users.filter(u => u.sock_id !== me.id);

            _log("New USERS", users)
        })
    });
}

module.exports = {
    init
}