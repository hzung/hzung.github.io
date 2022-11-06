const TTS = (text, volume = 1, rate = 1, pitch = 1) => {
    let synthesis = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = synthesis.getVoices().filter(voice => voice.name == "Google US English")[0];
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    synthesis.cancel();
    return synthesis.speak(utterance);
}