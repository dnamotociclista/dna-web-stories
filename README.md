# DNA Motociclista: Web Stories automáticas

Gera e publica uma Web Story (plugin oficial Web Stories) para cada notícia nova da categoria Notícias do site.

## Como rodar

```
node publish-stories.mjs --new --limit 3
```

- Procura notícias dos últimos 3 dias (categoria Notícias, id 52) que ainda não têm story.
- Cria a story e publica (máximo de `--limit` por execução, padrão 3).
- Não duplica: confere `stories-map.json` e os títulos das stories já publicadas.
- Posts de outras categorias (ex.: Recomendo, produtos) são ignorados.

Outros modos: `node publish-stories.mjs <postId>` (rascunho de um post) e `--all` (todas as notícias, em rascunho).

## Credenciais (variáveis de ambiente, nunca no código)

- `WP_URL` (https://dnamotociclista.com.br)
- `WP_USER` (usuário do WordPress)
- `WP_APP_PASSWORD` (senha de aplicativo do WordPress)

## Requisitos

Node 18 ou mais novo. Sem dependências.
