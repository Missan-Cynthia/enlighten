(() => {
"use strict";

const cards = [
  { name: "門", art: '<span class="frame"></span>', phrases: ["開門", "關門"], active: "open" },
  { name: "窗", art: '<span class="frame window"></span>', phrases: ["開窗", "關窗"], active: "open" },
  { name: "燈", art: '<span class="lamp"></span>', phrases: ["開燈", "關燈"], active: "lit",
    effect: '<span class="effect glow"></span>' },
  { name: "水", art: '<span class="faucet"></span>', phrases: ["開水", "關水"], active: "flowing",
    effect: '<span class="effect stream"></span>' },
  { name: "白飯", food: "rice", image: "01-白飯.png", alt: "一碗白飯", phrases: ["吃白飯"] },
  { name: "可樂", food: "cola", image: "21-可樂.png", alt: "一杯可樂", phrases: ["喝可樂"] },
  { name: "珍珠", food: "pearls", image: "23-珍珠.png", alt: "一堆珍珠", phrases: ["吃珍珠"] },
];

const screen = document.querySelector("#life-actions");
const home = document.querySelector("#home");
const entry = document.querySelector("#actions-entry");
const main = screen.querySelector("main");
const dialog = screen.querySelector("dialog");
const phrase = screen.querySelector("#phrase");
const record = screen.querySelector("#record");
const preview = screen.querySelector("#preview");
const save = screen.querySelector("#save");
const reset = screen.querySelector("#reset");
const status = screen.querySelector("#status");
const recordings = new Map();
let database;
let audio;
let audioUrl;
let recorder;
let recordTimer;
let draft;
let busy = false;

function stopVoice() {
  window.speechSynthesis?.cancel();
  if (audio) {
    audio.pause();
    URL.revokeObjectURL(audioUrl);
    audio = null;
  }
}

function speak(text, clip = recordings.get(text)) {
  stopVoice();
  if (clip) {
    audioUrl = URL.createObjectURL(clip);
    audio = new Audio(audioUrl);
    audio.play().catch(() => {
      if (dialog.open) status.textContent = "目前無法播放這段錄音。";
    });
    return;
  }
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.9;
  const voices = speechSynthesis.getVoices();
  const mandarin = voices.find(voice => /^zh[-_]TW$/i.test(voice.lang))
    ?? voices.find(voice => /^zh[-_]CN$/i.test(voice.lang));
  if (mandarin) utterance.voice = mandarin;
  speechSynthesis.speak(utterance);
}

function foodArt(card) {
  const src = `output/food/${card.image}`;
  const image = className => `<img class="${className}" src="${src}" alt="" draggable="false">`;
  if (card.food === "rice") {
    return `<span class="food rice">
      <span class="bowl-inside"></span>
      ${image("rice-contents")}
      ${image("bowl-front")}
      ${image("full-food")}
    </span>`;
  }
  if (card.food === "cola") {
    return `<span class="food cola">
      <span class="glass"></span>
      ${image("cola-contents")}
      <span class="glass-rim"></span>
      ${image("full-food")}
    </span>`;
  }
  return `<span class="food pearls" style="--pearls: url('${src}')">
    ${Array.from({ length: 8 }, () => '<span class="pearl"></span>').join("")}
    ${image("full-food")}
  </span>`;
}

for (const card of cards) {
  const tile = document.createElement("article");
  tile.className = "action-card";
  tile.innerHTML = `
    <div class="scene">
      <button class="object" type="button" aria-label="${card.alt ?? card.name}"><span aria-hidden="true">${card.food ? foodArt(card) : card.art}</span></button>
    </div>
    <h2>${card.name}</h2>`;
  const scene = tile.querySelector(".scene");
  const target = tile.querySelector(".object");
  if (card.food) {
    const food = tile.querySelector(".food");
    const pearls = [...food.querySelectorAll(".pearl")];
    const stages = pearls.length || 6;
    let eating = false;
    target.addEventListener("click", () => {
      if (eating) return;
      eating = true;
      food.dataset.stage = "0";
      food.style.setProperty("--remaining", 1);
      pearls.forEach(pearl => { pearl.hidden = false; });
      target.setAttribute("aria-label", card.alt);
      speak(card.phrases[0]);

      // Leave the full picture visible while the action word begins.
      let stage = 0;
      const timer = setInterval(() => {
        food.dataset.stage = String(++stage);
        if (pearls.length) pearls[stage - 1].hidden = true;
        food.style.setProperty("--remaining", 1 - stage / stages);
        if (stage === stages) {
          clearInterval(timer);
          eating = false;
          const result = { rice: "空碗", cola: "空杯", pearls: "珍珠吃完了" };
          target.setAttribute("aria-label", `${result[card.food]}，再點一次重來`);
        }
      }, 420);
    });
  } else {
    scene.insertAdjacentHTML("afterbegin", card.effect ?? "");
    target.setAttribute("aria-pressed", "false");
    target.addEventListener("click", () => {
      const active = tile.classList.toggle(card.active);
      target.setAttribute("aria-pressed", String(active));
      speak(card.phrases[active ? 0 : 1]);
    });
  }
  main.append(tile);
}

for (const text of cards.flatMap(card => card.phrases)) {
  phrase.add(new Option(text, text));
}

function openRecordings() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("life-actions-audio", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("clips");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function changeRecording(text, clip) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("clips", "readwrite");
    const store = transaction.objectStore("clips");
    if (clip) store.put(clip, text);
    else store.delete(text);
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error);
  });
}

function updateControls() {
  const recording = Boolean(recorder);
  phrase.disabled = busy || recording;
  record.disabled = busy;
  preview.disabled = busy || recording;
  save.disabled = busy || recording || !draft || !database;
  reset.disabled = busy || recording || !recordings.has(phrase.value);
  record.textContent = recording ? "停止錄音" : "開始錄音";
}

async function loadRecordings() {
  try {
    database = await openRecordings();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("clips");
      const cursor = transaction.objectStore("clips").openCursor();
      cursor.onsuccess = () => {
        if (!cursor.result) return;
        recordings.set(cursor.result.key, cursor.result.value);
        cursor.result.continue();
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    database = undefined;
  }
  updateControls();
}

function showCurrentVoice() {
  status.textContent = recordings.has(phrase.value) ? "目前使用你的錄音。" : "目前使用預設華語。";
  if (!database) status.textContent += " 瀏覽器目前無法儲存錄音。";
}

screen.querySelector("#settings").onclick = async () => {
  stopVoice();
  dialog.showModal();
  await ready;
  if (dialog.open && !busy && !recorder) showCurrentVoice();
};
screen.querySelector("#close").onclick = () => dialog.close();
dialog.addEventListener("close", () => {
  if (recorder?.state === "recording") recorder.stop();
  draft = undefined;
  stopVoice();
  updateControls();
});
phrase.onchange = () => {
  draft = undefined;
  stopVoice();
  showCurrentVoice();
  updateControls();
};
preview.onclick = () => speak(phrase.value, draft ?? recordings.get(phrase.value));
record.onclick = async () => {
  if (recorder) {
    if (recorder.state === "recording") recorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status.textContent = "此瀏覽器無法使用麥克風。請用 localhost 或 HTTPS 開啟本頁。";
    return;
  }
  stopVoice();
  busy = true;
  updateControls();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!dialog.open) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    const session = new MediaRecorder(stream);
    const chunks = [];
    recorder = session;
    let failed = false;
    session.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    session.onerror = () => {
      failed = true;
    };
    session.onstop = () => {
      clearTimeout(recordTimer);
      stream.getTracks().forEach(track => track.stop());
      recorder = undefined;
      if (dialog.open) {
        draft = !failed && chunks.length ? new Blob(chunks, { type: session.mimeType }) : undefined;
        status.textContent = draft ? "錄音完成，可以試聽或套用。" : "沒有錄到聲音，請再試一次。";
      }
      updateControls();
    };
    session.start();
    recordTimer = setTimeout(() => {
      if (session.state === "recording") session.stop();
    }, 10_000);
    draft = undefined;
    status.textContent = "錄音中，最長 10 秒。";
  } catch {
    recorder = undefined;
    stream?.getTracks().forEach(track => track.stop());
    status.textContent = "無法開始錄音，請確認瀏覽器允許使用麥克風。";
  } finally {
    busy = false;
    updateControls();
  }
};

async function applyRecording(clip) {
  const text = phrase.value;
  busy = true;
  updateControls();
  try {
    await changeRecording(text, clip);
    if (clip) recordings.set(text, clip);
    else recordings.delete(text);
    draft = undefined;
    showCurrentVoice();
  } catch {
    status.textContent = "未能更新錄音，請再試一次。";
  } finally {
    busy = false;
    updateControls();
  }
}
save.onclick = () => applyRecording(draft);
reset.onclick = () => applyRecording(undefined);
const ready = loadRecordings();




function openActions() {
  home.classList.remove("active");
  screen.classList.add("active");
  screen.scrollTop = 0;
  screen.querySelector("#actions-back").focus();
}

function closeActions() {
  stopVoice();
  screen.classList.remove("active");
  home.classList.add("active");
  if (location.hash === "#life-actions") history.replaceState(null, "", location.pathname + location.search);
  entry.focus();
}

entry.addEventListener("click", openActions);
screen.querySelector("#actions-back").addEventListener("click", closeActions);
window.addEventListener("keydown", event => {
  if (event.key === "Escape" && screen.classList.contains("active") && !dialog.open) closeActions();
});
if (location.hash === "#life-actions") openActions();
})();
