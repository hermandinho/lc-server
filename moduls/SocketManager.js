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
    let allowedLogs = ['ALL_USERS', 'LISTENERS_ON', 'RECONNECTED', 'GONE', 'IDENTIFICATION_'];
    title = title || "";
    data = data || "";
    if(allowedLogs.indexOf(title) === -1) return;
    console.log(title, data);
}

let waitTime = 3000;

let signalPresense = (socket, data, online) => {
    let eventType = online ? 'online' : 'offline';

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
            });
        } else {
            // Site offline
        }
    }
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
        //me = socket;

        /**
         * Identification of both front and backend Users
         */
        socket.on('identify', function(data) {
            data.sock_id = socket.id;
            _log("IDENTIFICATION", data);
            users.push(data);
            me = data;

            //socket.token = data.token; // For client
            /*me.userKey = data.license;
            me.userType = data.type;
            me.token = data.token;
            me.site_id = data.id;*/
          
            let room_id = data.license + '_' + data.type;

            socket.join(room_id)

            //signalPresense(socket, data, true);

            _log("ALL_USERS [" + users.length + "]", users);
        })

        socket.on('get-my-online-clients', function(data) {
            //pushOnlineClients(socket, data.license);
        })

        socket.on('is-site-online', function(data) {
            let check = users.filter((u) => u.type === USER_TYPES.SITE && u.license === data.license)

            if(check.length > 0) {
                //socket.emit('online', check[0])
            }
        });

        socket.on('message', function(msg) {
            _log("MESSAGE ", msg);
            socket.to(socket.userKey).emit('message', msg);
        })

        socket.on('disconnect', function(){
            //let myData = users.filter((u) => u.sock_id === me.id);
            users = users.filter((u) => u.sock_id !== me.sock_id);

            //if(myData.length === 0) return;
            
            setTimeout(() => {
                console.log("NOW ALL USERS : " + users.length + " => ", users);
                let hasReconnected = users.filter(u => {
                    if(me.type == USER_TYPES.SITE)
                        return me.id == u.id;
                    else
                        return u.license == me.license && me.token == u.token;
                })

                if(hasReconnected.length > 0) {
                    console.log("SENDING REFRESH EVENT")
                    //io.to(me.license + '_' + me.type).emit('refresh-user', hasReconnected[0]);
                    if(me.type === USER_TYPES.VISITOR) {
                        io.to(me.license + '_' + USER_TYPES.SITE).emit('refresh-user', hasReconnected[0]);
                    } else {
                        /**
                         * TODO NOTIFY CLIENT THAT SITE HAS RECONNECTED
                         */
                        io.to(me.license + '_' + USER_TYPES.VISITOR).emit('refresh-user', hasReconnected[0]);
                    }
                } else {
                    console.log("FAILED SENDING REFRESH EVENT")
                    signalPresense(socket, me, false)
                }
            }, waitTime);
            return;
            
            
            

            setTimeout(() => {
                if(!myData || myData.length === 0) {
                    //_log('GONE','GONE BUT myData Not Found')
                    return;
                }
                myData = myData[0];
                let hasReconnected = users.filter((u) => {
                    if(myData.type == USER_TYPES.SITE)
                        return myData.id == u.id;
                    else
                        return u.license == myData.license && myData.token == u.token;
                });

                if(hasReconnected.length > 0) {                    
                    if(myData.type === USER_TYPES.VISITOR) {
                        _log('RECONNECTED', 'VISITOR');
                        /*hasReconnected[0].url = myData.url;
                        hasReconnected[0].protocol = myData.protocol;
                        hasReconnected[0].origin = myData.origin;
                        hasReconnected[0].pathname = myData.pathname;
                        hasReconnected[0].lang = myData.lang;
                        hasReconnected[0].token = myData.token;*/
                        io.to(myData.license + '_' + USER_TYPES.SITE).emit('refresh-user', hasReconnected[0]);
                    } else {
                        _log('RECONNECTED', 'SITE') 
                    }
                } else {
                    _log('GONE', myData);
                }
                //signalPresense(socket, myData, false);
            }, waitTime);
        })
    });
}

module.exports = {
    init
}