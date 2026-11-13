// Собирает мини-игры бота из api/_lib/widgets/*.html в модуль api/_lib/widgets.js (Vercel упаковывает только импортируемый код).
// Запуск после правки любой игры: node scripts/build-widgets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "api/_lib/widgets");
// id файла -> название в подписи; casino: подпись «игровые монеты»
export const META = {
  shashki: { title: "Шашки" },
  durak: { title: "Дурак" },
  kot: { title: "Говорящий кот" },
  pitomec: { title: "Питомец" },
  frukty: { title: "Рубка фруктов" },
  bloger: { title: "Симулятор блогера" },
  ruletka: { title: "Рулетка", casino: true },
  blekdzhek: { title: "Блэкджек", casino: true },
  sloty: { title: "Слоты", casino: true },
  pticy: { title: "Птичья катапульта" },
  samodelkin: { title: "Самоделкин" },
};
const list = Object.entries(META).map(([id, m]) => ({ id, ...m, html: fs.readFileSync(path.join(dir, id + ".html"), "utf8") }));
const out = "// СГЕНЕРИРОВАНО scripts/build-widgets.mjs из api/_lib/widgets/*.html — правьте исходники и пересоберите.\n" +
  "export const WIDGET_GAMES = " + JSON.stringify(list, null, 1) + ";\n";
fs.writeFileSync(path.join(root, "api/_lib/widgets.js"), out);
console.log("widgets:", list.map((w) => w.id + " " + w.html.length).join(", "));
