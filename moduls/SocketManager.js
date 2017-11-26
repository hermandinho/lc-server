let io = null,
    api = null,
    users = [],
    me = null;

const USER_TYPES = {
    VISITOR: 0,
    SITE: 1
};

let init = function(_io, _api) {
    if(!io) {
        io = _io;
    }
    if(!api) {
        api = _api
    }

    listeners();
}

let _log = (title, data) => {
    let allowedLogs = ['_ALL_USERS', '_LISTENERS_ON', '_RECONNECTED', '_GONE', '_IDENTIFICATION_', '_TYPING'];
    title = title || "";
    data = data || "";
    if(allowedLogs.indexOf(title) === -1) return;
    console.log(title, data);
}

let waitTime = 5000;

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
let addUser = (user) => {
    let check = users.filter(u => {
        if(user.type === USER_TYPES.SITE) {
            return u.id === user.id
        } else {
            return u.token === user.token && u.license === user.license;
        }
    })

    if(!check || check.length === 0) {
        users.push(user);
    } else {
        //console.log('CANNOT ADD NEW USER');
    }
}

let removeUser = (user) => {
    let check = users.filter(u => {
        if(user.type === USER_TYPES.SITE) {
            return u.id === user.id
        } else {
            return u.token === user.token && u.license === user.license;
        }
    })

    if(check && check.length === 1) {
        users = users.filter(u => {
            if(user.type === USER_TYPES.SITE) {
                return u.id !== user.id
            } else {
                return u.token !== user.token && u.license !== user.license;
            }
        })
        //console.log('REMOVED USER', JSON.stringify(user));
    } else {
        //console.log('CANNOT REMOVE ', user);
    }
}

let updateData = (data) => {
    users.map(u => {
        if(data.type === USER_TYPES.SITE && data.id === u .id) {
            console.log('UPDATE SITE');
        } else {
            console.log('UPDATE CLIENT');
            u.title = data.title;
            u.url = data.url;
        }
    })
}

let listeners = function() {
    _log('LISTENERS_ON');
    io.on('connection', function(socket) {
        //me = socket;

        /**
         * Identification of both front and backend Users
         */
        socket.on('identify', function(data) {
            socket.userKey = data.id;
            socket.license = data.license;
            socket.userType = data.type;
            socket.userToken = data.token;

            data.sock_id = socket.id;
            addUser(data);
            _log("IDENTIFICATION", users.length);
            //_log("IDENTIFICATION", users);
            me = data;
          
            let room_id = data.license + '_' + data.type;

            socket.join(room_id)
            
            signalPresense(socket, data, true);

            _log("ALL_USERS [" + users.length + "]", users);
        })

        socket.on('get-my-online-clients', function(data) {
            pushOnlineClients(socket, data.license);
        })

        socket.on('is-site-online', function(data) {
            let check = users.filter((u) => u.type === USER_TYPES.SITE && u.license === data.license)

            if(check.length > 0) {
                socket.emit('online', check[0])
            } else {
                socket.emit('offline', check[0], data, users);
            }
        });

        socket.on('typing', function(data) {
            _log('TYPING', data);
            socket.to(data.license + '_' + USER_TYPES.SITE).emit('typing', data);
        })

        socket.on('message', function(msg) {
            _log("MESSAGE ", msg);
            api.saveMessage(msg);
            socket.to(socket.userKey).emit('message', msg);
            socket.in(socket.license + '_' + USER_TYPES.SITE).emit('message', msg);
            
        })

        socket.on('disconnect', function(){
            users = users.filter((u) => u.sock_id !== socket.sock_id);
            //removeUser(me);
            
            setTimeout(() => {
                //console.log("GONE", socket.userKey, socket.userType, socket.userToken, me.userType);
                let hasReconnected = users.filter(u => {
                    if(socket.userType === USER_TYPES.SITE)
                        return socket.userKey === u.id;
                    else
                        return u.license === socket.license && socket.userToken === u.token;
                })
                
                if(hasReconnected.length > 0) {
                    updateData(me);
                    if(socket.userType === USER_TYPES.VISITOR) {
                        io.to(socket.license + '_' + USER_TYPES.SITE).emit('refresh-user', me);
                    } else {
                        io.to(socket.license + '_' + USER_TYPES.VISITOR).emit('refresh-user', me);
                    }
                } else {
                    signalPresense(socket, me, false)
                }
            }, waitTime);
        })
    });
}

module.exports = {
    init
}