-- =========================================================================
--  Dados iniciais
--
--  Traz o professor administrador, a UC, os 6 topicos da apostila e UMA
--  questao de cada um dos 6 tipos, mais uma avaliacao de teste ja publicada.
--  Serve para validar renderizacao e correcao antes de popular as 30 questoes.
--
--  Login inicial:  professor@senai.br  /  Senai@2026   (troque no painel)
-- =========================================================================

SET NAMES utf8mb4;

-- -------------------------------------------------------------------------
INSERT INTO professor (id, nome, email, senha_hash) VALUES
  (1, 'Professor', 'professor@senai.br',
   '$2b$10$WvcQQAQrzGM0qC/ziyg/cuWPd7j7WTkS1AzSNg.lTQG9cn/9bcn2u');

-- -------------------------------------------------------------------------
INSERT INTO uc (id, codigo, nome, descricao, carga_horaria) VALUES
  (1, 'INT-API', 'Integração com APIs',
   'JavaScript do zero ao consumo de APIs: da primeira linha de código até buscar dados de uma API e exibi-los na página.',
   40);

INSERT INTO topico (id, uc_id, nome, ordem) VALUES
  (1, 1, 'Primeiros passos: variáveis e tipos',    1),
  (2, 1, 'Tomando decisões: condições e loops',    2),
  (3, 1, 'Guardando dados: arrays, objetos e funções', 3),
  (4, 1, 'Mexendo na página: DOM e eventos',       4),
  (5, 1, 'Formulários: leitura e validação',       5),
  (6, 1, 'Consumindo a API: fetch, JSON e erros',  6);

-- =========================================================================
--  Questão 1 - múltipla escolha
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
  (1, 1, 6, 'multipla_escolha', 'media',
   'Você está montando a Pokédex da aula. O código abaixo funciona e mostra "pikachu" no console.',
   'Um colega resolveu "simplificar" o código: apagou a linha do resposta.json() e trocou dados.name por resposta.name. O que passa a acontecer?',
   'async function buscar() {\n  const resposta = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu");\n  const dados = await resposta.json();\n  console.log(dados.name); // pikachu\n}',
   'O fetch devolve um objeto Response, que descreve a resposta (status, cabeçalhos) mas ainda não os dados. Quem transforma o corpo da resposta em objeto JavaScript é o .json(). Sem ele, resposta.name não existe e o console mostra undefined.',
   1.00);

INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
  (101, 1, 'O console mostra undefined, porque resposta é o objeto Response e não os dados da API.', 1, 1),
  (102, 1, 'Nada muda: resposta.name funciona igual, o .json() era opcional.', 0, 2),
  (103, 1, 'O navegador acusa erro de rede e o fetch nunca completa.', 0, 3),
  (104, 1, 'O fetch passa a ser síncrono e trava a página até a resposta chegar.', 0, 4);

-- =========================================================================
--  Questão 2 - múltipla resposta
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
  (2, 1, 5, 'multipla_resposta', 'media',
   'No formulário do ViaCEP, alguns alunos relataram que a tela "trava" ou recarrega sozinha quando o CEP é digitado errado.',
   'Quais medidas abaixo realmente ajudam a evitar esses problemas? Marque todas as corretas.',
   'Validar antes de chamar a API evita pedidos inúteis; o try/catch protege contra queda de rede e erro do servidor; e type="button" impede o recarregamento da página. Já type="submit" é justamente a causa do recarregamento, e == compara com conversão de tipo, escondendo erros.',
   1.00);

INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
  (201, 2, 'Usar .trim() no valor do campo e conferir se ele não ficou vazio antes de buscar.', 1, 1),
  (202, 2, 'Conferir se o CEP tem 8 dígitos antes de montar a URL e chamar a API.', 1, 2),
  (203, 2, 'Envolver a chamada do fetch em um try/catch e avisar o usuário na falha.', 1, 3),
  (204, 2, 'Trocar o botão para type="submit", assim a página recarrega e limpa o erro.', 0, 4),
  (205, 2, 'Comparar o resultado com == em vez de ===, porque aceita mais formatos.', 0, 5);

-- =========================================================================
--  Questão 3 - verdadeiro ou falso (itens fixos, sem embaralhar)
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
  (3, 1, 1, 'verdadeiro_falso', 'facil',
   'Julgue a afirmação: o código abaixo roda sem erro, porque const impede apenas a troca do tipo do valor, não a troca do valor em si.',
   'const idade = 16;\nidade = 17;',
   'Falso. const cria uma constante: o valor não pode ser reatribuído, seja para um número, seja para qualquer outro tipo. A segunda linha lança TypeError. Quando o valor precisa mudar, use let.',
   1.00, 0);

INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
  (301, 3, 'Verdadeiro', 0, 1),
  (302, 3, 'Falso',      1, 2);

-- =========================================================================
--  Questão 4 - completar lacunas ({{1}} e {{2}} viram listas de opções)
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
  (4, 1, 4, 'lacunas', 'facil',
   'A página tem um <h1 id="titulo">Olá</h1> e você precisa trocar esse texto pelo nome que voltou da API.',
   'Complete o código escolhendo o que falta em cada lacuna.',
   '// 1) achar o elemento pelo id\nconst titulo = document.{{1}}("titulo");\n\n// 2) trocar o texto que aparece na tela\ntitulo.{{2}} = "Novo título!";',
   'São sempre os mesmos dois passos: selecionar o elemento com getElementById e depois alterar o conteúdo com textContent. É exatamente assim que os dados da API chegam à tela.',
   1.00);

INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
  (401, 4, 'getElementById',   1, 1, 1),
  (402, 4, 'createElement',    0, 1, 2),
  (403, 4, 'appendChild',      0, 1, 3),
  (404, 4, 'addEventListener', 0, 1, 4),
  (405, 4, 'textContent',      1, 2, 1),
  (406, 4, 'value',            0, 2, 2),
  (407, 4, 'setAttribute',     0, 2, 3),
  (408, 4, 'classList',        0, 2, 4);

-- =========================================================================
--  Questão 5 - ordenação
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
  (5, 1, 6, 'ordenacao', 'dificil',
   'Você vai escrever a função buscarCep() do projeto final, aquela que preenche o endereço sozinho.',
   'Coloque as etapas na ordem em que elas precisam acontecer dentro da função.',
   'A ordem importa: validar antes economiza um pedido inútil à API; a URL só pode ser montada depois que o CEP está limpo; o .json() só faz sentido depois que a resposta chegou; e a tela só é preenchida no fim, com os dados já convertidos.',
   2.00);

INSERT INTO questao_item (id, questao_id, texto, posicao_correta, ordem) VALUES
  (501, 5, 'Ler campoCep.value e limpar o CEP, deixando só os números.',        1, 1),
  (502, 5, 'Conferir se sobraram 8 dígitos e interromper a função se não tiver.', 2, 2),
  (503, 5, 'Montar a URL do ViaCEP concatenando o CEP limpo.',                   3, 3),
  (504, 5, 'Chamar o fetch com await e esperar a resposta da API.',              4, 4),
  (505, 5, 'Converter a resposta com await resposta.json().',                    5, 5),
  (506, 5, 'Preencher rua, bairro, cidade e o select de estado na tela.',        6, 6);

-- =========================================================================
--  Questão 6 - associação de colunas
-- =========================================================================
INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, enunciado, explicacao, pontos) VALUES
  (6, 1, 3, 'associacao', 'media',
   'Ligue cada recurso do JavaScript à tarefa que ele cumpre no consumo de uma API.',
   'Esses cinco recursos aparecem juntos no projeto final: o evento dispara a busca, o .value informa o que buscar, o await espera a API, o .json() converte a resposta e o .trim() limpa a digitação do usuário.',
   2.00);

INSERT INTO questao_item (id, questao_id, texto, texto_par, ordem) VALUES
  (601, 6, 'await',             'Pausa a função até a resposta da API chegar, sem travar a página.', 1),
  (602, 6, 'resposta.json()',   'Transforma o corpo da resposta em um objeto JavaScript.',           2),
  (603, 6, 'campo.value',       'Lê o texto que a pessoa digitou no campo do formulário.',           3),
  (604, 6, 'texto.trim()',      'Remove os espaços sobrando das pontas do texto.',                   4),
  (605, 6, 'addEventListener',  'Faz o elemento ficar escutando um evento, como o clique.',          5);

-- =========================================================================
--  Avaliação de teste, já publicada
-- =========================================================================
INSERT INTO avaliacao (id, uc_id, titulo, descricao, instrucoes, slug, exibir_resultado,
                       nota_minima, tentativa_unica, status, criado_por) VALUES
  (1, 1, 'Prova de teste - todos os tipos',
   'Seis questões, uma de cada tipo, para conferir se tudo funciona antes da prova valendo.',
   'Você verá uma questão por vez e não poderá voltar. Leia o enunciado com calma e responda antes de avançar.',
   'teste', 'nota_gabarito', 6.00, 0, 'publicada', 1);

INSERT INTO avaliacao_questao (avaliacao_id, questao_id, ordem) VALUES
  (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5), (1, 6, 6);
