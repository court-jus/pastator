import { MidiWrapper } from "./backendwrapper";

export const getInternalClock = (tempo: number): MidiWrapper => {
  return new MidiWrapper({ otherDevice: "InternalClock" });
}