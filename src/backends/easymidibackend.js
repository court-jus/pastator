"use strict";
exports.__esModule = true;
exports.stopNote = exports.playNote = void 0;
var easymidiPlayNote = function (port, channel, note, velocity) {
    var noteEvt = {
        channel: channel,
        note: note,
        velocity: velocity
    };
    if (note > -1 && note < 128) {
        port.send("noteon", noteEvt);
    }
};
var easymidiStopNote = function (port, channel, note) {
    var noteEvt = {
        channel: channel,
        note: note,
        velocity: 0
    };
    if (note > -1 && note < 128) {
        port.send("noteoff", noteEvt);
    }
    ;
};
var playNote = function (port) { return function (channel, note, velocity) {
    easymidiPlayNote(port, channel, note, velocity);
}; };
exports.playNote = playNote;
var stopNote = function (port) { return function (channel, note) {
    easymidiStopNote(port, channel, note);
}; };
exports.stopNote = stopNote;
