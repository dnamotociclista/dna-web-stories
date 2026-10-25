# Texto da rotina na nuvem (cole na rotina agendada)

Agenda sugerida: de hora em hora, das 8h às 23h (America/Sao_Paulo), no minuto 5.
Repositório: o repositório privado `dna-web-stories`.
Segredos da rotina: WP_URL, WP_USER, WP_APP_PASSWORD (cadastrados por Eric, nunca em arquivo).

---

Tarefa: criar Web Stories das notícias novas do DNA Motociclista, com texto PRÓPRIO.

Regra principal: o texto da story nunca pode ser copiado nem parafraseado de perto do texto do post. O Google e o AdSense tratam isso como conteúdo duplicado. O script recusa a story se achar 6 palavras seguidas iguais às do post.

1. No repositório, rode: `node publish-stories.mjs --new`
2. O script lista as notícias dos últimos 30 dias que ainda não têm story. As que não têm roteiro aparecem como `FALTA ROTEIRO: post ID "título"`.
3. Para cada `FALTA ROTEIRO`, leia o post (título e texto) e escreva o arquivo `stories-text/ID.json` neste formato:

```json
{
  "capa": { "t": "gancho curto, diferente do título do post (até 60 caracteres)", "d": "uma frase de abertura (até 130 caracteres)" },
  "paginas": [
    { "t": "título curto da página (até 52 caracteres)", "d": "uma ideia só, com palavras suas (até 130 caracteres)" }
  ]
}
```

   - De 3 a 6 páginas. Cada página traz um dado, uma explicação ou uma pergunta, nunca o parágrafo do post encurtado.
   - Reescreva com outras palavras e outra ordem. Números, preços e nomes podem repetir, a frase não.
   - Só use fatos que estão no post. Nunca invente dado novo.
   - Sem links externos. Tom de jornalista de moto, frases curtas.
4. Rode de novo `node publish-stories.mjs --new`. Se aparecer `roteiro inválido: copiado do post: "..."`, reescreva só aquele trecho com palavras diferentes e rode outra vez (no máximo 3 tentativas por post).
5. Confira a saída. Para cada story criada, o script mostra o link. Se aparecer "ERRO" que não seja de roteiro, registre o motivo e não tente de novo mais de uma vez.
6. Se nenhuma notícia nova existir, apenas encerre (não é erro).
7. Notifique Eric apenas se houver erro ou se alguma story tiver sido publicada, com o título e o link.
8. Nunca escreva a senha do WordPress em arquivos, mensagens ou logs. Nunca altere posts, só crie stories.
9. Faça poucas requisições ao site. O firewall da hospedagem bloqueia o IP (erro 403) quando há muitas em sequência.
