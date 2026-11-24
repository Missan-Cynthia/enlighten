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
  const speech = window.speechSynthesis;
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
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = title;
    const cards = document.createElement("div");
    cards.className = "cards";

    for (const [id, name, food, icon, phrase = `我餵${name}吃飯。`] of animals) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "animal";
      const picture = document.createElement("img");
      picture.src = `output/animals/${id}.png`;
      picture.alt = "";
      const label = document.createElement("span");
      label.className = "name";
      label.textContent = name;
      const meal = document.createElement("span");
      meal.className = "meal";
      meal.hidden = true;
      meal.setAttribute("aria-hidden", "true");
      meal.textContent = `${icon} ${food}`;
      button.append(picture, label, meal);
      button.addEventListener("click", () => {
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
      cards.append(button);
    }

    section.append(heading, cards);
    main.append(section);
  }

  window.addEventListener("pagehide", () => speech?.cancel());
})();
