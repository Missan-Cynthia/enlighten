(() => {
  const views = [
    ["body", "全身", [
      ["head", "頭", 49, 14], ["neck", "脖子", 49, 39],
      ["shoulder", "肩膀", 40, 40], ["shoulder", "肩膀", 58, 40],
      ["arm", "手臂", 32, 47], ["arm", "手臂", 66, 47],
      ["hand", "手", 21, 56], ["hand", "手", 77, 56],
      ["chest", "胸口", 49, 46], ["belly", "肚子", 49, 56],
      ["knee", "膝蓋", 40, 77], ["knee", "膝蓋", 58, 77],
      ["leg", "小腿", 39, 84], ["leg", "小腿", 59, 84],
      ["foot", "腳", 36, 95], ["foot", "腳", 62, 95],
    ]],
    ["face", "臉部", [
      ["hair", "頭髮", 47, 26], ["eyebrow", "眉毛", 34, 48], ["eyebrow", "眉毛", 66, 48],
      ["eye", "眼睛", 35, 62], ["eye", "眼睛", 64, 62],
      ["ear", "耳朵", 15, 67], ["ear", "耳朵", 83, 67],
      ["nose", "鼻子", 50, 69], ["mouth", "嘴巴", 50, 77],
      ["cheek", "臉頰", 29, 74], ["cheek", "臉頰", 69, 74],
    ]],
    ["hand", "手", [
      ["thumb", "大拇指", 17, 53], ["index", "食指", 31, 22],
      ["middle", "中指", 51, 16], ["ring", "無名指", 70, 23],
      ["pinky", "小指", 83, 38], ["palm", "手掌", 51, 61],
      ["wrist", "手腕", 49, 85],
    ]],
    ["foot", "腳", [
      ["big-toe", "大腳趾", 34, 14], ["second-toe", "第二腳趾", 47, 16],
      ["third-toe", "第三腳趾", 56.5, 19], ["fourth-toe", "第四腳趾", 64, 24],
      ["little-toe", "小腳趾", 71, 31], ["instep", "腳背", 49, 50], ["ankle", "腳踝", 48, 87],
    ]],
  ];
  const nav = document.querySelector("#views");
  const diagram = document.querySelector("#diagram");
  const picture = document.querySelector("#picture");
  const caption = document.querySelector("#part-name");
  const audio = new Audio();
  let selectedPoint;
  const controls = views.map(([image, title, parts]) => {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = title;
    control.setAttribute("aria-pressed", "false");
    control.addEventListener("click", () => {
      audio.pause();
      controls.forEach(button => button.setAttribute("aria-pressed", String(button === control)));
      selectedPoint = undefined;
      picture.src = `output/body/${image}.png`;
      picture.alt = title;
      caption.textContent = "";
      const points = parts.map(([id, label, x, y]) => {
        const point = document.createElement("button");
        point.type = "button";
        point.className = "point";
        point.style.left = `${x}%`;
        point.style.top = `${y}%`;
        point.setAttribute("aria-label", label);
        point.setAttribute("aria-pressed", "false");
        point.addEventListener("click", () => {
          selectedPoint?.setAttribute("aria-pressed", "false");
          selectedPoint = point;
          point.setAttribute("aria-pressed", "true");
          caption.textContent = label;
          audio.src = `audio/body/${id}.wav`;
          audio.play().catch(() => {});
        });
        return point;
      });
      diagram.replaceChildren(picture, ...points);
    });
    nav.append(control);
    return control;
  });
  controls[0].click();
  window.addEventListener("pagehide", () => audio.pause());
})();
