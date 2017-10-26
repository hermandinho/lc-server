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

        socket.on('identify', function(data) {
            data.sock_id = socket.id;
            users.push(data);
            console.log("IDENTIFICATION ", data);
            socket.join(data.key)
            _log("ALL USERS", users)
        })

        socket.on('message', function(msg) {
            console.log(msg);
        })

        socket.on('disconnect', function(){
            console.log("USER DISCONNECTED")
            users = users.filter(u => u.sock_id !== me.id);
            let myKey = users.filter(u => u.sock_id === me.id)[0];
            myKey = myKey.length ? myKey[0].key : null;

            if(myKey)
                socket.leave(myKey)

            _log("New USERS", users)
        })
    });
}

module.exports = {
    init
}