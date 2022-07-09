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
  console.debug("Saving preferences...", toSave);
  localStorage.setItem("preferences", JSON.stringify(toSave));
};

const download = (filename, data) => {
  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8, " + encodeURIComponent(data));
  element.setAttribute("download", filename);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const dumpPreferences = () => {
  const preferences = loadPreferences();
  download("pastator.json", JSON.stringify(preferences));
};

export const handlePrefsFileSelected = (evt) => {
  const files = evt.target.files; // FileList object

  // use the 1st file from the list
  const f = files[0];

  const reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = ((theFile) => {
    return (e) => {
      importPreferences(JSON.parse(e.target.result));
    };
  })(f);

  // Read in the image file as a data URL.
  reader.readAsText(f);
};

export const importPreferences = (preferences) => {
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
