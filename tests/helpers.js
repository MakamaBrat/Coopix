import crypto from "crypto";

export const TOK = "1:TEST";
export const sign = (fields, tok = TOK) => {
  const p = new URLSearchParams(fields);
  const d = [...p.entries()].map(([k, x]) => `${k}=${x}`).sort().join("\n");
  const s = crypto.createHmac("sha256", "WebAppData").update(tok).digest();
  p.set("hash", crypto.createHmac("sha256", s).update(d).digest("hex"));
  return p.toString();
};
