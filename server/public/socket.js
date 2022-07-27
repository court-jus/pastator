function bootstrap() {


}

if (typeof io !== "undefined") {
	var socket = io();
    var playing = false;
	socket.on('connected', function(msg) {
        console.log(msg);
        document.addEventListener('keydown', (evt) => {
            if (playing) return;
            playing = true;
            socket.emit("beep", "no data");
        });
    
        document.addEventListener('keyup', (evt) => {
            socket.emit("stopbeep", "no data");
            playing = false;
        });
    });
}

else { bootstrap(); }
