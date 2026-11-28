import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

const page = new URL('../index.html', import.meta.url);
export const html = readFileSync(page, 'utf8');
export const { imports } = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
const addons = 'three/addons/';
registerHooks({ resolve(id, context, next) {
  if (Object.hasOwn(imports, id)) return { url: new URL(imports[id], page).href, shortCircuit: true };
  if (id.startsWith(addons)) {
    return { url: new URL(imports[addons] + id.slice(addons.length), page).href, shortCircuit: true };
  }
  return next(id, context);
} });
