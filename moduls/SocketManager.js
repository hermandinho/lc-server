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
    let allowedLogs = ['ALL_USERS', 'LISTENERS_ON', 'RECONNECTED'];
    title = title || "";
    data = data || "";
    if(allowedLogs.indexOf(title) === -1) return;
    console.log(title, data);
}

let waitTime = 5000;

let signalPresense = (socket, data, online) => {
    let eventType = online ? 'online' : 'offline';

    //setTimeout(() => {
        if(!data) return;

        if(data.type === USER_TYPES.SITE) {
            socket.to(data.license + '_' + USER_TYPES.VISITOR).emit(eventType, data);
            setTimeout(() => {
                pushOnlineClients(socket, data.license);
            },1000);
        } else {
            let check = users.filter(u => u.type == USER_TYPES.SITE && u.license === data.license);
            socket.to(data.license + '_' + USER_TYPES.SITE).emit(eventType, data);

            if(check.length > 0) {
                setTimeout(function() {
                    io.to(socket.id).emit(eventType, check[0]);
                    //socket.to(check[0].license + '_' + USER_TYPES.VISITOR).emit(eventType, check[0]);
                });
            } else {
                // Site offline
            }
        }
    //}, waitTime)
}

let pushOnlineClients = (socket, license) => {
    let clients = users.filter(u => u.license === license && u.type === USER_TYPES.VISITOR);
    if(socket && license) {
        socket.emit("online-clients", clients);
    } else {
        //
    }
}

let listeners = function() {
    _log('LISTENERS_ON');
    io.on('connection', function(socket) {
        me = socket
        _log("NEW USER CONNECTED : " + me.id);

        /**
         * Identification of both front and backend Users
         */
        socket.on('identify', function(data) {
            data.sock_id = socket.id;
            users.push(data);

            //socket.token = data.token; // For client
            me.userKey = data.license;
            me.userType = data.type;
            me.site_id = data.id;

            _log("IDENTIFICATION ", data);

            let room_id = data.license + '_' + data.type;

            socket.join(room_id)

            signalPresense(socket, data, true);

            _log("ALL_USERS [" + users.length + "]", users);
        })

        socket.on('get-my-online-clients', function(data) {
            pushOnlineClients(socket, data.license);
        })

        socket.on('message', function(msg) {
            _log("MESSAGE ", msg);
            socket.to(socket.userKey).emit('message', msg);
        })

        socket.on('disconnect', function(){
            let myData = users.filter(u => u.sock_id === me.id)[0];
            _log('GONE ', myData);

            users = users.filter(u => u.sock_id !== socket.id);

            setTimeout(() => {
                if(!myData) return;
                let hasReconnected = users.filter((u) => {
                    if(myData.type === USER_TYPES.SITE) {
                       return u.license === myData.license && myData.id === me.site_id && myData.type === USER_TYPES.SITE;
                    } else {
                        return u.license === myData.license && myData.token === u.token
                    }
                });

                if(hasReconnected.length > 0) {
                    _log('RECONNECTED:');
                    if(myData.type === USER_TYPES.VISITOR) {
                        hasReconnected[0].url = myData.url;
                        hasReconnected[0].protocol = myData.protocol;
                        hasReconnected[0].origin = myData.origin;
                        hasReconnected[0].pathname = myData.pathname;
                        hasReconnected[0].lang = myData.lang;
                        hasReconnected[0].token = myData.token;
                        io.to(myData.license + '_' + USER_TYPES.SITE).emit('refresh-user', hasReconnected[0]);
                    }
                    return;
                }
                signalPresense(socket, myData, false);
            }, waitTime);
        })
    });
}

module.exports = {
    init
}