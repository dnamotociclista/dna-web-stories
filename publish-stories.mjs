// Cria Web Stories (rascunho) no WordPress a partir de posts.
// Uso: node publish-stories.mjs <postId> [postId...]   |   node publish-stories.mjs --all [--limit N]
// Credenciais: WP_URL, WP_USER, WP_APP_PASSWORD (variáveis de ambiente). Nunca imprime a senha.
import fs from 'node:fs';
import crypto from 'node:crypto';

const SITE = (process.env.WP_URL || 'https://dnamotociclista.com.br').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64');
const MAP = new URL('./stories-map.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};
const NEWS_CAT = 52; // só categoria Notícias
let STATUS = process.env.STORY_STATUS || 'draft';

const dec = s => s.replace(/<[^>]+>/g, '').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8211;/g, '–')
  .replace(/&#8220;|&#8221;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const short = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
const uid = () => crypto.randomUUID();
const api = (p, o = {}) => fetch(`${SITE}/wp-json/${p}`, { ...o, headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...(o.headers || {}) } });

const W = 412, H = 732;
const imgEl = (src, bg) => {
  const w = Math.round(H * 16 / 9), h = H; // fotos dos posts são 16:9; cobrem a tela vertical
  return { id: uid(), type: 'image', x: Math.round((W - w) / 2), y: 0, width: w, height: h, rotationAngle: 0, scale: 100, focalX: 50, focalY: 50,
    isBackground: bg, resource: { type: 'image', mimeType: 'image/jpeg', src, width: 1280, height: 720, alt: '', id: 0, sizes: {} } };
};
const txtEl = (text, y, size, bold, align = 'left', xo = 24) => ({ id: uid(), type: 'text', x: align === 'right' ? W - 20 - 60 : xo, y, width: align === 'right' ? 60 : W - 2 * xo, height: Math.round(size * 1.3 * Math.ceil(text.length * size * 0.62 / (W - 48))) + 4,
  rotationAngle: 0, fontSize: size, lineHeight: 1.2, textAlign: align, font: { family: 'Arial', service: 'system', fallbacks: ['Helvetica Neue', 'Helvetica', 'sans-serif'] },
  padding: { vertical: 0, horizontal: 0, locked: true }, backgroundColor: { color: { r: 0, g: 0, b: 0, a: 0 } },
  content: `<span style="color:#fff;${bold ? 'font-weight:700' : ''}">${esc(text)}</span>`, marginOffset: 0 });
const shade = () => ({ id: uid(), type: 'shape', x: 0, y: 260, width: W, height: H - 260, rotationAngle: 0, mask: { type: 'rectangle' },
  flip: { vertical: false, horizontal: false }, backgroundColor: { type: 'linear', rotation: 0, stops: [{ color: { r: 0, g: 0, b: 0, a: 0 }, position: 0 }, { color: { r: 0, g: 0, b: 0, a: 0.85 }, position: 0.7 }] } });

async function build(id) {
  const post = await (await fetch(`${SITE}/wp-json/wp/v2/posts/${id}?_embed=wp:featuredmedia`)).json();
  if (!post.id) throw new Error(`post ${id} não encontrado`);
  if (!post.categories?.includes(NEWS_CAT)) throw new Error(`post ${id} não é da categoria Notícias, ignorado`);
  const title = dec(post.title.rendered);
  const cover = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const imgs = [...post.content.rendered.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
  const pool = [cover, ...imgs].filter(Boolean);
  if (!pool.length) throw new Error(`post ${id} sem imagem`);
  const sections = post.content.rendered.split(/<h2[^>]*>/i).slice(1).map(p => {
    const [h, ...rest] = p.split(/<\/h2>/i);
    return { h: dec(h), p: dec((rest.join('').match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '') };
  }).filter(s => s.h && s.p && !/^(faq|perguntas|conclus)/i.test(s.h) && !/compr|preço|preco|oferta|desconto|cupom|shopee|frete|onde (achar|encontrar)/i.test(s.h + " " + s.p)).slice(0, 6);
  const desc = short(dec(post.excerpt.rendered) || sections[0]?.p || title, 150);

  const pages = [{ t: short(title, 90), d: short(desc, 110), cover: true }, ...sections.map(s => ({ t: short(s.h, 52), d: short(s.p, 130) })),
    { t: 'Leia a notícia completa', d: 'Todos os detalhes no DNA Motociclista.', last: true }];
  if (pages.length < 4) throw new Error(`post ${id} gera só ${pages.length} páginas`);

  const icon = (await (await fetch(`${SITE}/wp-json/`)).json()).site_icon_url;
  const LOGO = SITE + '/wp-content/uploads/2026/09/dna-logo.png';
  const RED = '#E00000';
  const F = 'Arial,Helvetica,sans-serif';
  const n = pages.length;
  const date = new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const U = n => `calc(var(--story-page-vh) * ${+(n * 100 / H).toFixed(4)})`;
  const abs = (css, inner) => `<div style="position:absolute;${css}">${inner}</div>`;
  const fillImg = (src, alt) => `<amp-img src="${src}" width="720" height="1280" layout="fill" object-fit="cover" alt="${esc(alt)}"></amp-img>`;
  const logoImg = w => `<div style="width:${U(w)}"><amp-img src="${LOGO}" width="500" height="186" layout="responsive" alt="DNA Motociclista"></amp-img></div>`;
  const bar = () => abs(`top:0;left:0;right:0;height:${U(97)};padding:${U(30)} ${U(20)} 0;background:#000;border-bottom:${U(3)} solid ${RED};display:flex;align-items:center`, logoImg(104));
  const chip = t => `<span style="display:inline-block;background:${RED};color:#fff;font:700 ${U(12)} ${F};letter-spacing:.06em;padding:${U(5)} ${U(10)};margin-bottom:${U(14)}">${t}</span>`;
  const h = (tag, sz, txt, color) => `<${tag} style="font:800 ${U(sz)}/1.14 ${F};margin:0 0 ${U(14)};color:${color}">${esc(txt)}</${tag}>`;
  const para = (txt, color) => `<p style="font:400 ${U(18)}/1.45 ${F};margin:0;color:${color}">${esc(txt)}</p>`;
  const layer = (inner, style = '') => `<amp-story-grid-layer template="fill"${style ? ` style="${style}"` : ''}>${inner}</amp-story-grid-layer>`;
  const wrapLayer = inner => layer(`<div style="position:absolute;top:0;left:0;right:0;bottom:0">${inner}</div>`);
  const markup = pages.map((p, i) => {
    const img = pool[i % pool.length];
    let body;
    if (p.cover) {
      body = layer(fillImg(img, title)) +
        layer('', 'background:linear-gradient(180deg,rgba(0,0,0,.15) 12%,rgba(0,0,0,.55) 30%,rgba(0,0,0,.88) 46%,rgba(0,0,0,.97) 64%)') +
        wrapLayer(bar() + abs(`left:${U(22)};right:${U(22)};bottom:${U(76)}`, chip('NOTÍCIAS') + h('h1', 33, p.t, '#fff') + para(p.d, '#e6e6e6')));
    } else if (p.last) {
      body = layer('', 'background:#111') +
        wrapLayer(abs(`top:0;bottom:${U(70)};left:${U(26)};right:${U(26)};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center`,
          `<div style="margin:0 auto ${U(30)};width:${U(220)}">${logoImg(220)}</div>` + chip('CONTINUE LENDO') + h('h2', 30, 'Leia a notícia completa no site', '#fff') + para('Todos os detalhes e fotos em dnamotociclista.com.br', '#d9d9d9')));
    } else {
      body = layer('', 'background:#fff') +
        wrapLayer(bar() +
          abs(`top:${U(97)};left:0;right:0;height:${U(290)};overflow:hidden`, fillImg(img, title)) +
          abs(`top:${U(407)};left:${U(22)};right:${U(22)}`, chip('NOTÍCIAS') + h('h2', 26.4, p.t, '#111') + para(p.d, '#333')) +
          abs(`left:${U(22)};right:${U(22)};bottom:${U(36)};border-top:${U(3)} solid ${RED};padding-top:${U(10)};color:#777;font:700 ${U(12)} ${F};letter-spacing:.06em`, 'DNAMOTOCICLISTA.COM.BR'));
    }
    return `<amp-story-page id="p${i}">${body}${p.last ? `<amp-story-page-outlink layout="nodisplay" cta-text="Ler notícia"><a href="${post.link}">Ler notícia</a></amp-story-page-outlink>` : ''}</amp-story-page>`;
  }).join('');
  const content = `<amp-story standalone title="${esc(short(title, 80))}" publisher="DNA Motociclista" publisher-logo-src="${icon}" poster-portrait-src="${cover || pool[0]}">${markup}</amp-story>`;

  const rect = (x, y, w, h, c) => ({ id: uid(), type: 'shape', x, y, width: w, height: h, rotationAngle: 0, mask: { type: 'rectangle' }, flip: { vertical: false, horizontal: false }, backgroundColor: { color: { r: c[0], g: c[1], b: c[2], a: c[3] ?? 1 } } });
  const grad = (y, h) => ({ id: uid(), type: 'shape', x: 0, y, width: W, height: h, rotationAngle: 0, mask: { type: 'rectangle' }, flip: { vertical: false, horizontal: false }, backgroundColor: { type: 'linear', rotation: 0, stops: [{ color: { r: 0, g: 0, b: 0, a: 0.1 }, position: 0 }, { color: { r: 0, g: 0, b: 0, a: 0.55 }, position: 0.3 }, { color: { r: 0, g: 0, b: 0, a: 0.88 }, position: 0.5 }, { color: { r: 0, g: 0, b: 0, a: 0.97 }, position: 0.7 }, { color: { r: 0, g: 0, b: 0, a: 0.97 }, position: 1 }] } });
  const logo = (x, y, w) => ({ id: uid(), type: 'image', x, y, width: w, height: Math.round(w * 186 / 500), rotationAngle: 0, scale: 100, focalX: 50, focalY: 50, resource: { type: 'image', mimeType: 'image/png', src: LOGO, width: 500, height: 186, alt: 'DNA Motociclista', id: 0, sizes: {} } });
  const cropImg = (src, y, h) => { const w = Math.round(h * 16 / 9); return { id: uid(), type: 'image', x: Math.round((W - w) / 2), y, width: Math.max(w, W), height: h, rotationAngle: 0, scale: 100, focalX: 50, focalY: 50, resource: { type: 'image', mimeType: 'image/jpeg', src, width: 1280, height: 720, alt: title, id: 0, sizes: {} } }; };
  const lines = (t, size, wd) => Math.max(1, Math.ceil(t.length * size * 0.6 / wd));
  const tx = (text, x, y, wd, size, color, bold, align = 'left') => ({ id: uid(), type: 'text', x, y, width: wd, height: Math.round(lines(text, size, wd) * size * 1.3) + 4, rotationAngle: 0, fontSize: size, lineHeight: 1.25, textAlign: align,
    font: { family: 'Arial', service: 'system', fallbacks: ['Helvetica Neue', 'Helvetica', 'sans-serif'] }, padding: { vertical: 0, horizontal: 0, locked: true }, backgroundColor: { color: { r: 0, g: 0, b: 0, a: 0 } },
    content: `<span style="color:${color};${bold ? 'font-weight:800' : ''}">${esc(text)}</span>`, marginOffset: 0 });
  const header = i => [rect(0, 0, W, 94, [0, 0, 0]), rect(0, 94, W, 3, [224, 0, 0]), logo(20, 42, 104)];
  const story_data = { version: 50, pages: pages.map((p, i) => {
    let els;
    if (p.cover) {
      const ts = 33, ds = 18, wd = W - 44, tl = lines(p.t, ts, wd), dl = lines(p.d, ds, wd);
      const dY = H - 76 - (dl * ds * 1.4 + 4), tY = dY - 14 - (tl * ts * 1.15 + 4), chipY = tY - 14 - 24;
      els = [cropImg(pool[0], 0, H), grad(90, H - 90), ...header(i), rect(22, chipY, 96, 24, [224, 0, 0]), tx('NOTÍCIAS', 32, chipY + 6, 80, 12, '#ffffff', true),
        tx(p.t, 22, tY, wd, ts, '#ffffff', true), tx(p.d, 22, dY, wd, ds, '#e6e6e6', false)];
    } else if (p.last) {
      els = [rect(0, 0, W, H, [17, 17, 17]), logo(96, 190, 220), rect(140, 330, 132, 24, [224, 0, 0]), tx('CONTINUE LENDO', 148, 336, 120, 12, '#ffffff', true, 'center'),
        tx('Leia a notícia completa no site', 26, 372, W - 52, 30, '#ffffff', true, 'center'), tx('Todos os detalhes e fotos em dnamotociclista.com.br', 26, 450, W - 52, 18, '#d9d9d9', false, 'center')];
    } else {
      const ts = 26, ds = 18, wd = W - 44, chipY = 97 + 290 + 20, tY = chipY + 24 + 14, tH = lines(p.t, ts, wd) * ts * 1.2 + 4, dY = tY + tH + 12;
      els = [rect(0, 0, W, H, [255, 255, 255]), cropImg(pool[i % pool.length], 97, 290), ...header(i), rect(22, chipY, 96, 24, [224, 0, 0]), tx('NOTÍCIAS', 32, chipY + 6, 80, 12, '#ffffff', true),
        tx(p.t, 22, tY, wd, ts, '#111111', true), tx(p.d, 22, dY, wd, ds, '#333333', false), rect(22, H - 36 - 30, W - 44, 3, [224, 0, 0]), tx('DNAMOTOCICLISTA.COM.BR', 22, H - 36 - 18, wd, 12, '#777777', true)];
    }
    return { id: uid(), type: 'page', backgroundColor: { color: { r: 255, g: 255, b: 255 } }, elements: els };
  }), autoAdvance: true, defaultPageDuration: 7, currentStoryStyles: { colors: [] } };
  return { post, title, body: { title, status: STATUS, content, story_data, excerpt: desc, featured_media: post.featured_media } };
}

let ids = process.argv.slice(2).filter(a => /^\d+$/.test(a));
if (process.argv.includes('--all')) {
  const lim = +(process.argv[process.argv.indexOf('--limit') + 1]) || 1000;
  for (let pg = 1; ids.length < lim; pg++) {
    const r = await fetch(`${SITE}/wp-json/wp/v2/posts?categories=${NEWS_CAT}&per_page=100&page=${pg}&_fields=id`);
    if (!r.ok) break;
    ids.push(...(await r.json()).map(x => x.id));
  }
  ids = ids.slice(0, lim);
}
// --new: notícias dos últimos 3 dias que ainda não têm story; publica (no máx. --limit, padrão 3, por execução)
if (process.argv.includes('--new')) {
  const lim = +(process.argv[process.argv.indexOf('--limit') + 1]) || 3;
  const since = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 19);
  const posts = await (await fetch(`${SITE}/wp-json/wp/v2/posts?categories=${NEWS_CAT}&after=${since}&per_page=50&orderby=date&order=asc&_fields=id,title`)).json();
  const have = new Set((await (await fetch(`${SITE}/wp-json/web-stories/v1/web-story?per_page=100&_fields=title`)).json()).map(x => dec(x.title.rendered)));
  ids = posts.filter(p => !map[p.id] && !have.has(dec(p.title.rendered))).map(p => p.id).slice(0, lim);
  STATUS = process.env.STORY_STATUS || 'publish';
  console.log(`--new: ${posts.length} notícias recentes, ${ids.length} sem story`);
}
for (const id of ids) {
  if (map[id] && !process.env.REDO) { console.log(`post ${id}: já tem story ${map[id]}, pulando`); continue; }
  try {
    const { title, body } = await build(id);
    const r = await api('web-stories/v1/web-story' + (map[id] ? '/' + map[id] : ''), { method: 'POST', body: JSON.stringify(map[id] ? { ...body, status: undefined } : body) });
    const j = await r.json();
    if (!r.ok) { console.log(`post ${id}: ERRO ${r.status} ${j.code}: ${j.message}`); continue; }
    map[id] = j.id; fs.writeFileSync(MAP, JSON.stringify(map, null, 1));
    console.log(`post ${id} -> story ${j.id} [${j.status}] "${short(title, 50)}" ${j.preview_link || j.link}`);
  } catch (e) { console.log(`post ${id}: ERRO ${e.message}`); }
}
