// Confere sobreposição entre textos/formas de cada página das stories (formato do editor).
const S = process.env.WP_URL, auth = 'Basic ' + Buffer.from(process.env.WP_USER + ':' + process.env.WP_APP_PASSWORD).toString('base64');
const W = 412, H = 732;
let bad = 0;
for (const id of process.argv.slice(2)) {
  const j = await (await fetch(`${S}/wp-json/web-stories/v1/web-story/${id}?context=edit`, { headers: { Authorization: auth } })).json();
  j.story_data.pages.forEach((pg, pi) => {
    const t = pg.elements.filter(e => e.type === 'text').sort((a, b) => a.y - b.y);
    for (let k = 0; k < t.length; k++) {
      const e = t[k], txt = e.content.replace(/<[^>]+>/g, '');
      if (e.y + e.height > H - 2) { bad++; console.log(`story ${id} p${pi + 1}: "${txt.slice(0, 30)}" passa do fim da página (${e.y + e.height})`); }
      for (let m = k + 1; m < t.length; m++) {
        const o = t[m];
        const ox = e.x < o.x + o.width && o.x < e.x + e.width, oy = e.y < o.y + o.height && o.y < e.y + e.height;
        if (ox && oy) { bad++; console.log(`story ${id} p${pi + 1}: "${txt.slice(0, 28)}" (${e.y}-${e.y + e.height}) sobrepõe "${o.content.replace(/<[^>]+>/g, '').slice(0, 28)}" (${o.y}-${o.y + o.height})`); }
      }
    }
  });
}
console.log(bad ? `${bad} problema(s)` : 'nenhuma sobreposição');
