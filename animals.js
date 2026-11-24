(() => {
  const groups = [
    ["農場動物", [
      ["horse", "馬", "乾草", "🌾"],
      ["cow", "牛", "青草", "🌿"],
      ["sheep", "綿羊", "青草", "🌿"],
      ["pig", "豬", "豬飼料", "🥣"],
      ["rabbit", "兔子", "乾草", "🌾"],
      ["hen", "雞", "穀粒", "🌾"],
      ["farm-duck", "鴨子", "鴨飼料", "🥣"],
      ["farm-pigeon", "鴿子", "穀粒", "🌾"],
    ]],
    ["鳥類朋友", [
      ["chick", "小雞", "小雞飼料", "🥣"],
      ["bluebird", "小鳥", "種子", "🌾", "我餵鳥吃飯。"],
      ["garden-duck", "鴨子", "鴨飼料", "🥣"],
      ["garden-pigeon", "鴿子", "穀粒", "🌾"],
      ["owl", "貓頭鷹", "小老鼠", "🐭", "貓頭鷹發現小老鼠了。"],
      ["sparrow", "麻雀", "種子", "🌾"],
      ["peacock", "孔雀", "穀粒", "🌾"],
      ["woodpecker", "啄木鳥", "小蟲", "🐛", "啄木鳥找到小蟲了。"],
    ]],
  ];
  const main = document.querySelector("#animals");
  const announcement = document.querySelector("#announcement");
  const progress = document.querySelector("#progress");
  const speech = window.speechSynthesis;
  const cards = [];
  let current = 0;
  let finishFeeding;

  function speak(phrase) {
    if (!speech || !window.SpeechSynthesisUtterance) return;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "zh-TW";
    const voice = speech.getVoices().find(({ lang }) => lang.toLowerCase() === "zh-tw");
    if (voice) utterance.voice = voice;
    speech.speak(utterance);
  }

  for (const [title, animals] of groups) {
    for (const [id, name, food, icon, phrase = `我餵${name}吃飯。`] of animals) {
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
      const meal = document.createElement("span");
      meal.className = "meal";
      meal.hidden = true;
      meal.setAttribute("aria-hidden", "true");
      meal.textContent = `${icon} ${food}`;
      button.append(picture, label, meal);
      button.addEventListener("click", (event) => {
        if (event.detail && performance.now() < suppressClickUntil) return;
        finishFeeding?.();
        meal.hidden = false;
        button.classList.add("eating");
        announcement.textContent = `${phrase}${food}`;
        speak(phrase);
        const reset = () => {
          meal.hidden = true;
          button.classList.remove("eating");
        };
        const timer = setTimeout(reset, 2400);
        finishFeeding = () => {
          clearTimeout(timer);
          reset();
        };
      });
      cards.push(button);
      main.append(button);
    }
  }

  function showCard(offset) {
    finishFeeding?.();
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
