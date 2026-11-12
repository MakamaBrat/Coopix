// Нейросетевая озвучка (Microsoft Edge «Читать вслух»): node promo/tts.mjs
// Без зависимостей: свой мини-клиент WebSocket поверх TLS. Отправляется только текст сценария.
// Результат: promo/vo/<id>.mp3 и promo/vo/lines.json (длительности для таймлайна ролика).
import tls from "node:tls";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "vo");
const VOICE = process.env.VOICE || "ru-RU-DmitryNeural";
const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4", GECV = "1-130.0.2849.68";
// реплики: rate/pitch — подача (короче, с паузами под шутку)
const LINES = [ // темп ~1.5x: короткие фразы, быстрая подача
  { id: "c1", t: "Апокалипсис. Связи нет. Заряда — семь процентов.", rate: "+35%", pitch: "-4Hz" },
  { id: "c2", t: "Пока ловит — жмёшь «Скачать все игры».", rate: "+45%" },
  { id: "c3", t: "Бот присылает их файлами. Интернет больше не нужен.", rate: "+45%" },
  { id: "c4", t: "Играешь офлайн. С друзьями — по локальному вай-фаю.", rate: "+45%" },
  { id: "c5", t: "Серёга пошёл за водой.", rate: "+40%" },
  { id: "c6", t: "Не дошёл.", rate: "+20%", pitch: "-6Hz" },
  { id: "c7", t: "Если и умрёте — то точно не от скуки.", rate: "+30%" },
  { id: "c8", t: "Coopix Market. Ищи в Телеграме.", rate: "+40%" },
];

function gec() { // токен Sec-MS-GEC: SHA-256 от (время Windows, округлённое до 5 минут) + токен клиента
  let s = Math.floor(Date.now() / 1000) + 11644473600; s -= s % 300;
  return crypto.createHash("sha256").update(BigInt(s) * 10000000n + TOKEN, "ascii").digest("hex").toUpperCase();
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function synth(line) {
  return new Promise((resolve, reject) => {
    const host = "speech.platform.bing.com", cid = crypto.randomUUID().replace(/-/g, "");
    const pathq = `/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}&Sec-MS-GEC=${gec()}&Sec-MS-GEC-Version=${GECV}&ConnectionId=${cid}`;
    const key = crypto.randomBytes(16).toString("base64");
    const sock = tls.connect({ host, port: 443, servername: host }, () => {
      sock.write([`GET ${pathq} HTTP/1.1`, `Host: ${host}`, "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Key: ${key}`, "Sec-WebSocket-Version: 13",
        "Origin: chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold", "Pragma: no-cache", "Cache-Control: no-cache",
        "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0", "", ""].join("\r\n"));
    });
    let buf = Buffer.alloc(0), upgraded = false, audio = [], done = false;
    const send = (text) => { // клиентский текстовый кадр с маской
      const p = Buffer.from(text, "utf8"), mask = crypto.randomBytes(4); let hdr;
      if (p.length < 126) hdr = Buffer.from([0x81, 0x80 | p.length]);
      else if (p.length < 65536) { hdr = Buffer.alloc(4); hdr[0] = 0x81; hdr[1] = 0x80 | 126; hdr.writeUInt16BE(p.length, 2); }
      else { hdr = Buffer.alloc(10); hdr[0] = 0x81; hdr[1] = 0x80 | 127; hdr.writeBigUInt64BE(BigInt(p.length), 2); }
      const m = Buffer.alloc(p.length); for (let i = 0; i < p.length; i++) m[i] = p[i] ^ mask[i & 3];
      sock.write(Buffer.concat([hdr, mask, m]));
    };
    const ts = () => new Date().toISOString();
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      if (!upgraded) {
        const e = buf.indexOf("\r\n\r\n"); if (e < 0) return;
        const head = buf.slice(0, e).toString(); if (!/ 101 /.test(head.split("\r\n")[0])) { sock.destroy(); return reject(new Error("handshake: " + head.split("\r\n")[0])); }
        upgraded = true; buf = buf.slice(e + 4);
        send(`X-Timestamp:${ts()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" }, outputFormat: "audio-24khz-96kbitrate-mono-mp3" } } } }));
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ru-RU'><voice name='${VOICE}'><prosody pitch='${line.pitch || "+0Hz"}' rate='${line.rate || "+0%"}' volume='+0%'>${esc(line.t)}</prosody></voice></speak>`;
        send(`X-RequestId:${cid}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts()}Z\r\nPath:ssml\r\n\r\n` + ssml);
      }
      while (buf.length >= 2) { // разбор серверных кадров (без маски)
        const op = buf[0] & 0x0f; let len = buf[1] & 0x7f, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; } else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + len) return;
        const pl = buf.slice(off, off + len); buf = buf.slice(off + len);
        if (op === 2) { const hl = pl.readUInt16BE(0), h = pl.slice(2, 2 + hl).toString(); if (h.includes("Path:audio")) audio.push(pl.slice(2 + hl)); }
        else if (op === 1) { if (pl.toString().includes("Path:turn.end")) { done = true; sock.end(); resolve(Buffer.concat(audio)); return; } }
        else if (op === 8) { sock.end(); if (!done) reject(new Error("closed")); return; }
      }
    });
    sock.on("error", reject); sock.setTimeout(20000, () => { sock.destroy(); reject(new Error("timeout")); });
  });
}

fs.mkdirSync(DIR, { recursive: true });
const out = [];
for (const l of LINES) {
  const mp3 = await synth(l); fs.writeFileSync(path.join(DIR, l.id + ".mp3"), mp3);
  out.push({ id: l.id, text: l.t, file: l.id + ".mp3", dur: +(mp3.length / 12000).toFixed(2) }); // 96 кбит/с = 12 000 байт в секунду
  console.log(l.id, out.at(-1).dur + "s", l.t);
}
fs.writeFileSync(path.join(DIR, "lines.json"), JSON.stringify(out, null, 1));
