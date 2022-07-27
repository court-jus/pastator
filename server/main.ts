const path = require("path");
const easymidi = require("easymidi");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const app = express();

console.log(easymidi.getInputs());
console.log(easymidi.getOutputs());

const output = new easymidi.Output('loopMIDI Port 2');
console.log(output);
output.send('noteon', {
    channel: 2,
    velocity: 100,
    note: 48
})
setTimeout(() => {
    output.send('noteoff', {
        channel: 2,
        velocity: 100,
        note: 48
    })
}, 500);


app.use(express.static(path.join(__dirname, "public")));
app.get('/socket.io.js', function(req, res) {
    res.sendFile('socket.io.js', {
        root: path.join(__dirname, '..', 'node_modules', 'socket.io-client', 'dist')
    });
});

const server = http.Server(app)
const io = socketio(server);

io.sockets.on('connection', function(socket) {
    console.log("user connected");
    socket.emit('connected', 'yo toi');

    socket.on('beep', function(data) {
        console.log("user did send a noteon", data)
        output.send('noteon', {
            channel: 2,
            velocity: 100,
            note: 48
        })
    })    
    socket.on('stopbeep', function(data) {
        console.log("user did send a noteoff", data)
        output.send('noteoff', {
            channel: 2,
            velocity: 100,
            note: 48
        })
    })    
})


server.listen(8080, function() {
    console.log('listening àn 8080')
})