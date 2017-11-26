const request = require('request');
Promise = require('es6-promise').Promise;
const baseUrl = "http://lvh.me:1337/api/";

const ROUTES = {
    SAVE_CONVERSATION: {
        path: baseUrl + 'conversation',
        method: 'POST'
    }
};

let saveMessage = (data) => {
    return new Promise((resolve, reject) => {
        let req = request(ROUTES.SAVE_CONVERSATION.path, 
                { method: ROUTES.SAVE_CONVERSATION.method, json: true, body: data }, 
                (e, r, b) => {
            if(!e && r.statusCode === 200) {
                resolve(r);
            } else {
                console.log("ERROR ", b);
            }
        });
    });
}

module.exports = {
    saveMessage
}