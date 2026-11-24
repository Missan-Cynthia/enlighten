(() => {
  const groups = [
    ["農場動物", [
      ["horse", "馬"],
      ["cow", "牛"],
      ["sheep", "綿羊"],
      ["pig", "豬"],
      ["rabbit", "兔子"],
      ["hen", "雞"],
      ["farm-duck", "鴨子"],
      ["farm-pigeon", "鴿子"],
    ]],
    ["鳥類朋友", [
      ["chick", "小雞"],
      ["bluebird", "小鳥"],
      ["garden-duck", "鴨子"],
      ["garden-pigeon", "鴿子"],
      ["owl", "貓頭鷹"],
      ["sparrow", "麻雀"],
      ["peacock", "孔雀"],
      ["woodpecker", "啄木鳥"],
    ]],
  ];
  const main = document.querySelector("#animals");
  const announcement = document.querySelector("#announcement");
  const progress = document.querySelector("#progress");
  const speech = window.speechSynthesis;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cards = [];
  let current = 0;
  let wiggle;

  function speak(name) {
    if (!speech || !window.SpeechSynthesisUtterance) return;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.lang = "zh-TW";
    const voice = speech.getVoices().find(({ lang }) => lang.toLowerCase() === "zh-tw");
    if (voice) utterance.voice = voice;
    speech.speak(utterance);
  }

  for (const [title, animals] of groups) {
    for (const [id, name] of animals) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "animal";
      button.dataset.kind = title;
      button.hidden = true;
      const picture = document.createElement("img");
      picture.src = `output/animals/${id}.png`;
      picture.alt = "";
      picture.draggable = false;
      const label = document.createElement("span");
      label.className = "name";
      label.textContent = name;
      button.append(picture, label);
      button.addEventListener("click", (event) => {
        if (event.detail && performance.now() < suppressClickUntil) return;
        speak(name);
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
  }

  function showCard(offset) {
    wiggle?.cancel();
    speech?.cancel();
    const wasFocused = document.activeElement === cards[current];
    cards[current].hidden = true;
    current = (current + offset + cards.length) % cards.length;
    const card = cards[current];
    card.hidden = false;
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
  window.addEventListener("pagehide", () => speech?.cancel());
})();
