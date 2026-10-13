# Texto da rotina na nuvem (cole na rotina agendada)

Agenda sugerida: 1 vez por dia, às 10h (America/Sao_Paulo).
Repositório: o repositório privado `dna-web-stories`.
Segredos da rotina: WP_URL, WP_USER, WP_APP_PASSWORD (cadastrados por Eric, nunca em arquivo).

---

Tarefa: criar Web Stories das notícias novas do DNA Motociclista.

1. No repositório, rode: `node publish-stories.mjs --new --limit 3`
2. O script só considera posts da categoria Notícias (id 52) dos últimos 3 dias que ainda não têm story, e publica no máximo 3 por execução.
3. Confira a saída. Para cada story criada, o script mostra o link. Se aparecer "ERRO", registre o motivo e não tente de novo mais de uma vez.
4. Se nenhuma notícia nova existir, apenas encerre (não é erro).
5. Notifique Eric apenas se houver erro ou se alguma story tiver sido publicada, com o título e o link.
6. Nunca escreva a senha do WordPress em arquivos, mensagens ou logs. Nunca altere posts, só crie stories.
