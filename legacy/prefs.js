import { download } from "./utils.js";

export const loadPreferences = () => {
  const loaded = localStorage.getItem("preferences");
  if (loaded)
    return {
      ...DefaultPreferences,
      ...JSON.parse(loaded),
    };
  return DefaultPreferences;
};

export const savePreferences = (preferences) => {
  const toSave = {
    ...preferences,
    midiIn: window.receiveDevice?.id,
    midiOut: window.sendDevice?.id,
  };
  localStorage.setItem("preferences", JSON.stringify(toSave));
};

export const dumpPreferences = () => {
  const preferences = loadPreferences();
  download("pastator.json", JSON.stringify(preferences, undefined, 2));
};

export const handlePrefsFileSelected = (evt) => {
  const files = evt.target.files;
  const f = files[0];
  const reader = new FileReader();

  reader.onload = (() => {
    return (e) => {
      importPreferences(JSON.parse(e.target.result));
    };
  })(f);

  reader.readAsText(f);
};

const importPreferences = (preferences) => {
  localStorage.setItem("preferences", JSON.stringify(preferences));
  if (confirm("Refresh the page to apply imported preferences")) {
    window.location.reload();
  }
};

export const clearPreferences = () => {
  window.sendDevice = null;
  window.receiveDevice = null;
  localStorage.clear();
};

export const DefaultPreferences = {
  midiIn: null,
  midiOut: null,
  seqPlaying: false,
  tracksPlaying: true,
};
