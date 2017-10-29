let io = null,
    users = [],
    me = null;

const USER_TYPES = {
    VISITOR: 0,
    SITE: 1
};

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

let signalPresense = (socket, data, online) => {
    let eventType = online ? 'online' : 'offline';
    if(data.type === USER_TYPES.SITE) {
        socket.to(data.license + '_' + USER_TYPES.VISITOR).emit(eventType, data);
    } else {
        socket.to(data.license + '_' + USER_TYPES.SITE).emit(eventType, data);
    }
}

let listeners = function() {
    console.log('SOCKET LISTENERS ON ........');
    io.on('connection', function(socket) {
        me = socket
        console.log("NEW USER CONNECTED : " + me.id);

        /**
         * Identification of both front and backend Users
         */
        socket.on('identify', function(data) {
            data.sock_id = socket.id;
            users.push(data);

            //socket.token = data.token; // For client
            socket.userKey = data.license;
            socket.userType = data.type;

            console.log("IDENTIFICATION ", data);

            let room_id = data.license + '_' + data.type;

            socket.join(room_id)

            signalPresense(socket, data, true);

            _log("ALL USERS [" + users.length + "]", users);
        })

        socket.on('message', function(msg) {
            console.log(msg);
            socket.to(socket.userKey).emit('message', msg);
        })

        socket.on('disconnect', function(){
            console.log("USER DISCONNECTED : " + me.id)
           /* let myKey = users.filter(u => u.sock_id === me.id)[0];
            myKey = myKey && myKey.length ? myKey[0].key : null;
            if(myKey)
                socket.leave(myKey, function (r) {
                    _log('LEFT ROOM ', r);
                })*/
            let myData = users.filter(u => u.sock_id == socket.id)[0];

            users = users.filter(u => u.sock_id !== socket.id);

            console.debug('USER GONE ', myData);

            signalPresense(socket, myData, false);

            _log("New USERS", users)
        })
    });
}

module.exports = {
    init
}