(() => {
  const animals = window.zooAnimals;
  const main = document.querySelector("#animals");
  const announcement = document.querySelector("#announcement");
  const progress = document.querySelector("#progress");
  const credit = document.querySelector("#photo-credit");
  const speech = window.speechSynthesis;
  const audio = new Audio();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cards = [];
  let current = 0;
  let wiggle;
  let playbackRequest = 0;

  function stopPronunciation() {
    playbackRequest++;
    audio.pause();
    speech?.cancel();
  }

  function pronounce(id, name) {
    stopPronunciation();
    const request = playbackRequest;
    audio.src = `audio/zoo/${id}.wav`;
    audio.play().catch(() => {
      if (request === playbackRequest) speak(name);
    });
  }

  function speak(name) {
    if (!speech || !window.SpeechSynthesisUtterance) return;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.lang = "zh-TW";
    const voice = speech.getVoices().find(({ lang }) => lang.toLowerCase() === "zh-tw");
    if (voice) utterance.voice = voice;
    speech.speak(utterance);
  }

  for (const { id, name, file } of animals) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "animal";
    button.hidden = true;
    const picture = document.createElement("img");
    picture.src = `output/zoo/${file}`;
    picture.alt = "";
    picture.draggable = false;
    const label = document.createElement("span");
    label.className = "name";
    label.textContent = name;
    button.append(picture, label);
    button.addEventListener("click", (event) => {
      if (event.detail && performance.now() < suppressClickUntil) return;
      pronounce(id, name);
      if (reducedMotion.matches) return;
      wiggle?.cancel();
      wiggle = picture.animate([
        { transform: "translateX(0) rotate(0)" },
        { transform: "translateX(-8px) rotate(-4deg)" },
        { transform: "translateX(8px) rotate(4deg)" },
        { transform: "translateX(-4px) rotate(-2deg)" },
        { transform: "translateX(0) rotate(0)" },
      ], { duration: 800, easing: "ease-in-out" });
    });
    cards.push(button);
    main.append(button);
  }

  function showCard(offset) {
    wiggle?.cancel();
    stopPronunciation();
    const wasFocused = document.activeElement === cards[current];
    cards[current].hidden = true;
    current = (current + offset + cards.length) % cards.length;
    const card = cards[current];
    card.hidden = false;
    const { author, license, licenseUrl, source } = animals[current];
    const photoSource = document.createElement("a");
    photoSource.href = source;
    photoSource.textContent = author || "Wikimedia Commons";
    const photoLicense = document.createElement(licenseUrl ? "a" : "span");
    if (licenseUrl) photoLicense.href = licenseUrl;
    photoLicense.textContent = license;
    credit.replaceChildren("照片：", photoSource, " · ", photoLicense, " · 縮圖");
    progress.textContent = `${current + 1} / ${cards.length}`;
    announcement.textContent = `${card.querySelector(".name").textContent}，第 ${current + 1} 張，共 ${cards.length} 張。`;
    if (wasFocused) card.focus();
  }

  let touchStart;
  let suppressClickUntil = 0;
  main.addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1 ? event.touches[0] : undefined;
  }, { passive: true });
  main.addEventListener("touchend", (event) => {
    if (!touchStart || event.touches.length) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.clientX;
    const dy = end.clientY - touchStart.clientY;
    touchStart = undefined;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
    suppressClickUntil = performance.now() + 300;
    showCard(dx < 0 ? 1 : -1);
  }, { passive: true });
  main.addEventListener("touchcancel", () => { touchStart = undefined; });
  document.querySelector("#previous").addEventListener("click", () => showCard(-1));
  document.querySelector("#next").addEventListener("click", () => showCard(1));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showCard(event.key === "ArrowLeft" ? -1 : 1);
  });
  showCard(0);
  window.addEventListener("pagehide", stopPronunciation);
})();
