import fs from "node:fs";
import { countInteractive } from "../src/lib/content/interactive";
const u = JSON.parse(fs.readFileSync("public/content/4th/s1/removable/lecture/13.json", "utf8"));
const n = countInteractive(u);
console.log(`removable 13 interactive blocks: ${n}`);
process.exit(n === 6 ? 0 : 1);
