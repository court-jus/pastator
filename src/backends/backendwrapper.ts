import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { WsMessage } from "@/model/types";
import { isMIDIInput } from "./webmidibackend";
import { playNote, stopNote } from "./webmidibackend";

export type MidiWrapperConfig = {
  midiDevice?: MIDIInput | MIDIOutput;
  otherDevice?: string;
  wsUrl?: string;
};

export class MidiWrapper {
  midiDevice?: MIDIInput | MIDIOutput;
  otherDevice?: string;
  active: boolean;
  isMidi: boolean;
  id: string;
  name: string;
  listeners: any[];
  intervals: any[];
  socket?: any;
  wsUrl: string;

  constructor(config: MidiWrapperConfig) {
    this.midiDevice = config.midiDevice;
    this.otherDevice = config.otherDevice;
    this.active = (!!config.midiDevice || !!config.otherDevice);
    this.isMidi = (!!config.midiDevice);
    this.id = (
      (this.isMidi && this.midiDevice)
        ? this.midiDevice.id
        : (this.otherDevice ? this.otherDevice : "unknown")
    );
    this.name = (
      (this.isMidi && this.midiDevice)
        ? (this.midiDevice.name ? this.midiDevice.name : this.midiDevice.id)
        : (this.otherDevice ? this.otherDevice : "unknown")
    );
    this.listeners = [];
    this.intervals = [];
    this.wsUrl = config.wsUrl ? config.wsUrl : "http://localhost:8080/";
    if (this.otherDevice === "InternalClock") {
      this.runClock(128);
    }
    if (this.isWS()) {
      this.socket = io(this.wsUrl);
      this.socket.on('connected', () => {
        console.debug(this.id, "Connected to ws server");
        this.socket?.emit("hello server");
        for (const messageType of ["midimessage", "setSong", "setTrack"]) {
          this.socket.on(messageType, (msg: any) => {
            this.broadcastMidiMessageFromWS({
              messageType,
              messageData: msg
            });
          });
        }
      });
    }
  }

  isMidiInput() {
    if (!this.isMidi) return false;
    return (isMIDIInput(this.midiDevice));
  }

  isWS() {
    return (this.otherDevice?.startsWith("ws:"));
  }

  isActiveWS() {
    return (this.isWS() && this.socket);
  }

  remoteMessage(messageType: string, messageData: any) {
    if (this.isActiveWS()) {
      try {
        this.socket?.emit(messageType, messageData);
      } catch (e) {
        console.error(e);
        console.error("Could not send", messageType, messageData);
      }
    }
  }

  playNote(channel: number, note: number, velocity: number) {
    // this.remoteMessage("noteon", { channel, note, velocity });
    if (!this.isMidi || !this.midiDevice || isMIDIInput(this.midiDevice)) return;
    playNote(this.midiDevice)(channel, note, velocity);
  }

  stopNote(channel: number, note: number) {
    // this.remoteMessage("noteoff", { channel, note });
    if (!this.isMidi || !this.midiDevice || isMIDIInput(this.midiDevice)) return;
    stopNote(this.midiDevice)(channel, note);
  }

  runClock(tempo: number) {
    const tick = () => {
      for (const [eventType, listener] of this.listeners) {
        if (eventType === "midimessage") {
          listener("clock");
        }
      }
    }
    this.intervals.push(window.setInterval(tick, 60000 / (tempo * 24)));
  }

  broadcastMidiMessageFromWS(message: WsMessage) {
    for (const [eventType, listener] of this.listeners) {
      if (eventType === message.messageType) {
        listener(message);
      }
    }
  }

  close() {
    this.closeListeners();
    if (this.isMidiInput()) {
      this.midiDevice?.close();
    }
    for (const interval of this.intervals) {
      window.clearInterval(interval);
    }
  }

  closeListeners() {
    for (const [eventType, listener] of this.listeners) {
      this.midiDevice?.removeEventListener(eventType, listener);
    }
  }

  addEventListener(eventType: string, listener: (message: any) => void) {
    if (this.isMidiInput()) {
      this.midiDevice?.addEventListener(eventType, listener);
    }
    console.log(this.id, "Adding listener for", eventType, "to", this);
    this.listeners.push([eventType, listener]);
  }
};
