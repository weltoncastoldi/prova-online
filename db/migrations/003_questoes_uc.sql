-- =========================================================================
--  Banco de questoes da UC Integracao com APIs - 30 questoes
--
--  Conteudo tirado da apostila "JavaScript do zero ao consumo de APIs".
--  Distribuicao por topico:
--    1 Primeiros passos ............ 4
--    2 Condicoes e loops ........... 4
--    3 Arrays, objetos e funcoes ... 5
--    4 DOM e eventos ............... 5
--    5 Formularios ................. 4
--    6 fetch, JSON e erros ......... 8
--
--  Distribuicao por tipo: 10 multipla escolha, 6 V/F, 5 lacunas,
--  3 multipla resposta, 3 ordenacao, 3 associacao. Total: 40 pontos.
--
--  Depende de 01-schema.sql e de a UC 1 e os topicos 1-6 existirem
--  (criados em 02-seed.sql).
-- =========================================================================

SET NAMES utf8mb4;

-- #########################################################################
-- TOPICO 1 - Primeiros passos: variaveis e tipos
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(101, 1, 1, 'multipla_escolha', 'media',
 'A API devolveu o nome e o número do Pokémon, e você precisa montar a frase que vai aparecer na tela.',
 'Sobre as duas linhas de console.log, qual afirmação está correta?',
 'const nome = "Pikachu";\nconst numero = 25;\n\nconsole.log(nome + " tem o número " + numero);\nconsole.log(`${nome} tem o número ${numero}`);',
 'As duas imprimem exatamente o mesmo texto. A segunda usa template string: crase no lugar das aspas e a variável dentro de ${ }. Quando a frase tem várias variáveis, ela fica bem mais legível do que a soma com +.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10101, 101, 'As duas imprimem o mesmo texto; a segunda usa template string, que fica mais legível quando há variáveis no meio da frase.', 1, 1),
(10102, 101, 'A segunda linha dá erro, porque crase não é aspas e o JavaScript não aceita.', 0, 2),
(10103, 101, 'A primeira imprime a frase montada e a segunda imprime literalmente ${nome} tem ${numero}.', 0, 3),
(10104, 101, 'A segunda transforma numero em texto antes de juntar, então o resultado sai diferente da primeira.', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(102, 1, 1, 'verdadeiro_falso', 'facil',
 'Tudo que vem de um campo de formulário chega como texto, mesmo quando parece número.',
 'Julgue a afirmação: no código abaixo, idade guarda um valor do tipo number e nota guarda um valor do tipo string.',
 'let idade = 16;\nlet nota = "8.5";',
 'Verdadeiro. O que define o tipo são as aspas: 16 sem aspas é number, "8.5" com aspas é string, mesmo parecendo número. É esse detalhe que faz somas darem errado com valores vindos de formulário.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10201, 102, 'Verdadeiro', 1, 1),
(10202, 102, 'Falso', 0, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(103, 1, 1, 'lacunas', 'facil',
 'Você está comentando o código de um colega para explicar o tipo de cada valor.',
 'Complete cada comentário com o tipo correto do valor guardado na variável.',
 'const idade = 16;        // tipo: {{1}}\nconst nome = "Ana";      // tipo: {{2}}\nconst aprovado = true;   // tipo: {{3}}',
 'São os três tipos básicos da unidade: number para números sem aspas, string para texto entre aspas e boolean para os dois únicos valores true e false.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
(10301, 103, 'number',    1, 1, 1),
(10302, 103, 'string',    0, 1, 2),
(10303, 103, 'boolean',   0, 1, 3),
(10304, 103, 'undefined', 0, 1, 4),
(10305, 103, 'string',    1, 2, 1),
(10306, 103, 'number',    0, 2, 2),
(10307, 103, 'boolean',   0, 2, 3),
(10308, 103, 'texto',     0, 2, 4),
(10309, 103, 'boolean',   1, 3, 1),
(10310, 103, 'string',    0, 3, 2),
(10311, 103, 'number',    0, 3, 3),
(10312, 103, 'logico',    0, 3, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(104, 1, 1, 'multipla_escolha', 'media',
 'Um aluno chamou você: o navegador parou o script com a mensagem "TypeError: Assignment to constant variable".',
 'O contador precisa aumentar a cada busca feita pelo usuário. Qual é a correção certa, mantendo essa intenção?',
 'const tentativas = 0;\ntentativas = tentativas + 1;',
 'const cria uma constante: o valor não pode ser reatribuído depois. Como o contador precisa mudar a cada busca, a declaração correta é com let. A regra prática: use const por padrão e troque para let só quando o valor realmente for mudar.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10401, 104, 'Trocar const por let na primeira linha, porque o valor precisa mudar ao longo do programa.', 1, 1),
(10402, 104, 'Apagar a segunda linha, porque não se pode somar um valor a uma variável já criada.', 0, 2),
(10403, 104, 'Colocar o nome da variável entre aspas na declaração: const "tentativas" = 0;', 0, 3),
(10404, 104, 'Repetir const na segunda linha: const tentativas = tentativas + 1;', 0, 4);

-- #########################################################################
-- TOPICO 2 - Tomando decisoes: condicoes e loops
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(105, 1, 2, 'multipla_escolha', 'dificil',
 'A pessoa digitou 18 no campo de idade do formulário e clicou em enviar. A mensagem esperada não apareceu na tela.',
 'Por que o bloco do if não executou?',
 'const idade = campo.value; // a pessoa digitou 18\n\nif (idade === 18) {\n  console.log("Pode dirigir");\n}',
 'campo.value devolve sempre texto: aqui, a string "18". Como === compara valor E tipo, "18" === 18 é false. A saída é converter antes, com Number(campo.value). Esse é o erro mais comum ao ligar formulário com lógica.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10501, 105, 'campo.value devolve a string "18", e "18" === 18 é false porque os tipos são diferentes.', 1, 1),
(10502, 105, 'O operador === só funciona entre textos, nunca entre números.', 0, 2),
(10503, 105, 'Faltou o else: sem ele, o bloco do if é ignorado pelo JavaScript.', 0, 3),
(10504, 105, 'O if precisa sempre de ==, porque === compara apenas se as variáveis ocupam a mesma posição na memória.', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(106, 1, 2, 'verdadeiro_falso', 'media',
 'Esse loop vai percorrer a lista de resultados que a API devolveu.',
 'Julgue a afirmação: o código abaixo imprime três linhas, "Rodada 1", "Rodada 2" e "Rodada 3".',
 'for (let i = 0; i < 3; i++) {\n  console.log("Rodada " + i);\n}',
 'Falso. São três linhas, mas começando do zero: "Rodada 0", "Rodada 1" e "Rodada 2". O i começa em 0 e o loop para quando i vira 3. Conferir onde o contador começa é o que evita o erro clássico de perder o primeiro ou o último item de uma lista.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10601, 106, 'Verdadeiro', 0, 1),
(10602, 106, 'Falso', 1, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
(107, 1, 2, 'ordenacao', 'dificil',
 'Você vai escrever a função que decide se vale a pena chamar a API ou se é melhor avisar o usuário.',
 'Coloque as etapas na ordem em que o código precisa executá-las.',
 'A ordem protege a API: primeiro pega o que foi digitado, depois limpa, só então testa. Testar antes de limpar deixaria passar um campo com espaços; buscar antes de testar mandaria um pedido vazio para o servidor.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, posicao_correta, ordem) VALUES
(10701, 107, 'Ler o que foi digitado, com campo.value.',                        1, 1),
(10702, 107, 'Aplicar .trim() para remover os espaços das pontas do texto.',    2, 2),
(10703, 107, 'Testar com if se o texto ficou vazio depois da limpeza.',         3, 3),
(10704, 107, 'Se estiver vazio, mostrar o alerta e não seguir adiante.',        4, 4),
(10705, 107, 'Se tiver conteúdo, chamar a função que consulta a API.',          5, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, enunciado, explicacao, pontos) VALUES
(108, 1, 2, 'associacao', 'media',
 'Ligue cada operador do JavaScript ao que ele faz.',
 'Os operadores de comparação sempre respondem true ou false. O detalhe que mais confunde no começo: para comparar igualdade use três iguais (===), que confere valor e tipo juntos.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, texto_par, ordem) VALUES
(10801, 108, '===',  'Responde true só quando o valor e o tipo são iguais nos dois lados.', 1),
(10802, 108, '!==',  'Responde true quando os dois lados são diferentes.', 2),
(10803, 108, '>=',   'Responde true quando o lado esquerdo é maior ou igual ao direito.', 3),
(10804, 108, '+',    'Entre dois textos, junta os dois em um só.', 4),
(10805, 108, 'i++',  'Soma 1 à variável de controle a cada volta do loop.', 5);

-- #########################################################################
-- TOPICO 3 - Guardando dados: arrays, objetos e funcoes
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(109, 1, 3, 'multipla_escolha', 'media',
 'A API devolveu a lista de tipos de um Pokémon e você quer conferir o conteúdo no console antes de mostrar na tela.',
 'O que aparece no console, nesta ordem?',
 'const tipos = ["fogo", "água", "grama"];\n\nconsole.log(tipos[1]);\nconsole.log(tipos.length);',
 'A posição começa no zero: tipos[0] é "fogo" e tipos[1] é "água". Já .length conta quantos itens existem de verdade, ou seja, 3. Confundir os dois é o que causa o famoso "undefined" no último item da lista.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(10901, 109, 'água e depois 3', 1, 1),
(10902, 109, 'fogo e depois 3', 0, 2),
(10903, 109, 'água e depois 2', 0, 3),
(10904, 109, 'fogo e depois 2', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(110, 1, 3, 'lacunas', 'media',
 'O JSON que veio da API virou este objeto. Agora você precisa jogar os dados na tela.',
 'Complete o código para mostrar o nome do Pokémon e o primeiro tipo da lista.',
 'const pokemon = {\n  nome: "Pikachu",\n  numero: 25,\n  tipos: ["elétrico"]\n};\n\n// mostra Pikachu no título\ntitulo.textContent = pokemon.{{1}};\n\n// mostra elétrico no subtítulo\nsubtitulo.textContent = pokemon.tipos{{2}};',
 'Dentro do objeto, o valor se pega pelo nome da chave, com ponto: pokemon.nome. Quando o valor é uma lista, a posição vai entre colchetes e começa no zero: pokemon.tipos[0]. O dado que vem da API é um objeto igualzinho a este.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
(11001, 110, 'nome',   1, 1, 1),
(11002, 110, 'numero', 0, 1, 2),
(11003, 110, 'tipos',  0, 1, 3),
(11004, 110, 'chave',  0, 1, 4),
(11005, 110, '[0]',    1, 2, 1),
(11006, 110, '[1]',    0, 2, 2),
(11007, 110, '.0',     0, 2, 3),
(11008, 110, '(0)',    0, 2, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(111, 1, 3, 'multipla_resposta', 'dificil',
 'Duas funções que parecem iguais, mas só uma devolve alguma coisa para quem a chamou.',
 'Marque todas as afirmações corretas sobre o código.',
 'function somarA(a, b) {\n  return a + b;\n}\n\nfunction somarB(a, b) {\n  const total = a + b;\n}\n\nconst x = somarA(2, 3);\nconst y = somarB(2, 3);',
 'Sem return, a função até executa, mas devolve undefined para quem a chamou. A variável total existe apenas dentro de somarB e desaparece quando a função termina. Esse é o motivo mais comum de um valor chegar undefined na tela.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11101, 111, 'x vale 5, porque somarA devolve o resultado com return.', 1, 1),
(11102, 111, 'y vale undefined, porque somarB não tem return.', 1, 2),
(11103, 111, 'a e b são os parâmetros: os dados que a função recebe para trabalhar.', 1, 3),
(11104, 111, 'somarB dá erro de sintaxe e o navegador nem carrega o arquivo.', 0, 4),
(11105, 111, 'y vale 5, porque a variável total guardou o resultado dentro da função.', 0, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(112, 1, 3, 'verdadeiro_falso', 'media',
 'Você vai encontrar as duas formas por aí, em códigos diferentes.',
 'Julgue a afirmação: as duas versões abaixo produzem o mesmo resultado quando chamadas com dobro(5).',
 '// versão 1, em um arquivo\nfunction dobro(n) { return n * 2; }\n\n// versão 2, em outro arquivo\nconst dobro = (n) => n * 2;',
 'Verdadeiro. A seta => substitui a palavra function e, quando o corpo é uma única expressão, o return fica subentendido. As duas devolvem 10 para dobro(5). A arrow function é só uma forma mais curta de escrever a mesma coisa.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11201, 112, 'Verdadeiro', 1, 1),
(11202, 112, 'Falso', 0, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(113, 1, 3, 'multipla_escolha', 'dificil',
 'Onde a variável nasce define quem consegue enxergá-la depois.',
 'O que acontece ao executar este código, na ordem?',
 'let curso = "SENAI";\n\nfunction saudar() {\n  let nome = "Ana";\n  console.log(nome, curso);\n}\n\nsaudar();\nconsole.log(nome);',
 'Dentro da função dá certo: nome é local e curso é global, então os dois são visíveis ali. A última linha quebra, porque nome só existe dentro das chaves da função e some quando ela termina. Preferir variáveis locais é o que evita conflito de nomes em código grande.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11301, 113, 'Imprime Ana SENAI e, em seguida, dá erro: nome não existe fora da função.', 1, 1),
(11302, 113, 'Imprime Ana SENAI e, em seguida, imprime Ana de novo.', 0, 2),
(11303, 113, 'Dá erro já dentro da função, porque uma função não enxerga variável global.', 0, 3),
(11304, 113, 'Imprime Ana SENAI e, em seguida, imprime undefined.', 0, 4);

-- #########################################################################
-- TOPICO 4 - Mexendo na pagina: DOM e eventos
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(114, 1, 4, 'multipla_escolha', 'media',
 'A página tem <h1 id="titulo">Olá</h1>. O console acusa: "Cannot set properties of null (setting textContent)".',
 'Onde está o erro?',
 'const titulo = document.getElementById("#titulo");\ntitulo.textContent = "Bem-vindo!";',
 'getElementById recebe apenas o id, sem o # na frente. Como nenhum elemento tem id igual a "#titulo", a função devolve null, e null não tem textContent. Sempre que aparecer "of null", desconfie do seletor: o JavaScript não achou o elemento.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11401, 114, 'getElementById recebe só o id, sem o #; o certo é getElementById("titulo").', 1, 1),
(11402, 114, 'O id precisa estar entre aspas simples, não duplas.', 0, 2),
(11403, 114, 'A propriedade textContent não existe; o correto seria titulo.text.', 0, 3),
(11404, 114, 'O h1 precisa ter class em vez de id para ser encontrado pelo JavaScript.', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, enunciado, explicacao, pontos) VALUES
(115, 1, 4, 'associacao', 'media',
 'Ligue cada instrução ao efeito que ela produz na página.',
 'O caminho é sempre o mesmo: primeiro achar o elemento, depois ler ou alterar alguma coisa nele, e registrar eventos para reagir ao usuário. É com essas peças que os dados da API chegam à tela.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, texto_par, ordem) VALUES
(11501, 115, 'document.getElementById("cep")',        'Encontra na página o elemento que tem aquele id.', 1),
(11502, 115, 'elemento.textContent = "Olá"',          'Troca o texto que aparece dentro do elemento.', 2),
(11503, 115, 'campo.value',                            'Lê o que a pessoa digitou no campo.', 3),
(11504, 115, 'botao.addEventListener("click", fn)',   'Manda executar uma função quando o botão for clicado.', 4),
(11505, 115, 'new Option("Acre", "AC")',              'Cria uma opção para ser colocada dentro de um select.', 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(116, 1, 4, 'verdadeiro_falso', 'dificil',
 'Um aluno reclama: a busca do CEP dispara sozinha assim que a página carrega, sem ninguém clicar em nada.',
 'Julgue a afirmação: o problema está nos parênteses depois de buscarCep. Eles fazem a função executar na hora, em vez de ficar guardada para o momento do clique.',
 'btnBuscar.addEventListener("click", buscarCep());',
 'Verdadeiro. Escrever buscarCep() executa a função imediatamente e entrega o RESULTADO dela para o addEventListener. O certo é passar o nome sem parênteses, buscarCep, para que ela só rode quando o evento acontecer.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11601, 116, 'Verdadeiro', 1, 1),
(11602, 116, 'Falso', 0, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
(117, 1, 4, 'ordenacao', 'dificil',
 'No projeto do ViaCEP o select de estados nasce vazio no HTML: quem cria as 27 opções é o JavaScript, a partir de um array.',
 'Coloque as etapas na ordem correta.',
 'Escrever 27 options na mão seria repetitivo. O array guarda sigla e nome, o forEach percorre item por item, o new Option monta cada opção e o appendChild pendura no select. Só depois de o select estar preenchido é que atribuir selectUf.value = dados.uf encontra a opção certa.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, posicao_correta, ordem) VALUES
(11701, 117, 'Criar o array de objetos com a sigla e o nome de cada estado.',      1, 1),
(11702, 117, 'Percorrer esse array com forEach, um estado por vez.',               2, 2),
(11703, 117, 'Para cada estado, criar a opção com new Option(nome, sigla).',       3, 3),
(11704, 117, 'Pendurar cada opção criada dentro do select, com appendChild.',      4, 4),
(11705, 117, 'Com o select já preenchido, marcar a UF que veio da API em selectUf.value.', 5, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(118, 1, 4, 'lacunas', 'facil',
 'O botão já existe no HTML com id="meuBotao". Falta o JavaScript fazer ele reagir ao clique.',
 'Complete o código para que a mensagem apareça quando o botão for clicado.',
 'const botao = document.{{1}}("meuBotao");\n\nbotao.{{2}}("click", () => {\n  console.log("Você clicou!");\n});',
 'São os dois passos de sempre: achar o elemento pelo id com getElementById e depois registrar o ouvinte com addEventListener. Lê-se assim: no botão, fique escutando o clique; quando acontecer, execute isto.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
(11801, 118, 'getElementById',    1, 1, 1),
(11802, 118, 'createElement',     0, 1, 2),
(11803, 118, 'appendChild',       0, 1, 3),
(11804, 118, 'textContent',       0, 1, 4),
(11805, 118, 'addEventListener',  1, 2, 1),
(11806, 118, 'addEvent',          0, 2, 2),
(11807, 118, 'onClick',           0, 2, 3),
(11808, 118, 'listen',            0, 2, 4);

-- #########################################################################
-- TOPICO 5 - Formularios: leitura e validacao
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(119, 1, 5, 'multipla_escolha', 'facil',
 'O HTML tem <input id="campoNome" type="text"> e a pessoa digitou Pikachu.',
 'Qual é a diferença entre as duas linhas de console.log?',
 'const campo = document.getElementById("campoNome");\n\nconsole.log(campo);\nconsole.log(campo.value);',
 'A variável campo guarda o elemento inteiro, a caixinha do formulário. O texto que a pessoa escreveu fica na propriedade .value. Esquecer o .value é o erro que faz a URL da API sair com [object HTMLInputElement] no lugar do termo buscado.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(11901, 119, 'A primeira mostra o elemento input inteiro; a segunda mostra o texto digitado, Pikachu.', 1, 1),
(11902, 119, 'As duas mostram Pikachu; o .value é opcional e serve só para deixar o código mais claro.', 0, 2),
(11903, 119, 'A primeira mostra Pikachu e a segunda dá erro, porque input não tem value.', 0, 3),
(11904, 119, 'A primeira mostra o id do campo, campoNome, e a segunda mostra o texto digitado.', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(120, 1, 5, 'multipla_resposta', 'media',
 'Antes de mandar o que o usuário digitou para a API, uma conferência simples evita pedido vazio e resposta de erro.',
 'Marque todas as afirmações corretas sobre este trecho.',
 'const texto = campo.value.trim();\n\nif (texto === "") {\n  alert("Digite alguma coisa!");\n} else {\n  buscar(texto);\n}',
 'O .trim() remove os espaços das pontas, e só das pontas. Com ele, um campo preenchido apenas com espaços vira texto vazio e cai no aviso, em vez de virar um pedido inútil para a API.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12001, 120, 'O .trim() remove os espaços das pontas, então digitar apenas espaços cai no aviso.', 1, 1),
(12002, 120, 'A busca só acontece quando existe texto de verdade, o que evita um pedido inútil à API.', 1, 2),
(12003, 120, 'Sem o .trim(), um campo com três espaços passaria pela validação e iria para a API.', 1, 3),
(12004, 120, 'O .trim() também apaga os espaços entre as palavras, no meio da frase.', 0, 4),
(12005, 120, 'Se texto for vazio, a função buscar roda assim mesmo, só que sem receber parâmetro.', 0, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(121, 1, 5, 'verdadeiro_falso', 'media',
 'O botão Buscar CEP está dentro de um elemento form. O aluno relata que, ao clicar, a página pisca e o endereço some antes de dar para ler.',
 'Julgue a afirmação: o problema é o type="submit", que faz o formulário recarregar a página; trocar por type="button" resolve.',
 '<button type="submit" id="btnBuscar">Buscar CEP</button>',
 'Verdadeiro. Dentro de um form, o botão submit envia o formulário e recarrega a página, apagando o que o JavaScript tinha acabado de escrever na tela. Com type="button" o botão não envia nada e só dispara a função do addEventListener.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12101, 121, 'Verdadeiro', 1, 1),
(12102, 121, 'Falso', 0, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(122, 1, 5, 'lacunas', 'media',
 'O usuário pode digitar o CEP com traço, com ponto ou com espaços. Antes de montar a URL, o código precisa limpar e conferir.',
 'Complete o código de limpeza e validação do CEP.',
 '// deixa só os números do que foi digitado\nconst cep = campoCep.value.{{1}}(/\\D/g, "");\n\n// o CEP brasileiro tem 8 dígitos\nif (cep.{{2}} !== 8) {\n  alert("CEP inválido");\n  {{3}};\n}',
 'O replace troca tudo que não é dígito por nada, deixando só os números. O .length conta quantos sobraram. E o return interrompe a função ali mesmo: sem ele, o código seguiria e chamaria a API com um CEP inválido.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
(12201, 122, 'replace',  1, 1, 1),
(12202, 122, 'trim',     0, 1, 2),
(12203, 122, 'split',    0, 1, 3),
(12204, 122, 'slice',    0, 1, 4),
(12205, 122, 'length',   1, 2, 1),
(12206, 122, 'size',     0, 2, 2),
(12207, 122, 'count',    0, 2, 3),
(12208, 122, 'total',    0, 2, 4),
(12209, 122, 'return',   1, 3, 1),
(12210, 122, 'break',    0, 3, 2),
(12211, 122, 'continue', 0, 3, 3),
(12212, 122, 'next',     0, 3, 4);

-- #########################################################################
-- TOPICO 6 - Consumindo a API: fetch, JSON e erros
-- #########################################################################

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
(123, 1, 6, 'multipla_escolha', 'media',
 'A resposta da internet não chega na hora: depende da rede, do servidor e do tamanho do dado. E o código não pode ficar parado esperando.',
 'O que as palavras async e await resolvem nesse cenário?',
 'Elas tratam da espera. O await pausa apenas aquela função até a resposta chegar, enquanto o resto da página continua respondendo normalmente ao usuário. Não deixam nada mais rápido nem garantem que a API responda: só organizam a espera.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12301, 123, 'Permitem esperar a resposta chegar sem congelar a tela: o resto da página continua funcionando.', 1, 1),
(12302, 123, 'Deixam o pedido mais rápido, porque abrem várias conexões com o servidor ao mesmo tempo.', 0, 2),
(12303, 123, 'Garantem que a API nunca devolva erro, repetindo o pedido automaticamente.', 0, 3),
(12304, 123, 'Convertem o JSON em objeto sozinhas, dispensando a chamada do .json().', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(124, 1, 6, 'lacunas', 'media',
 'Esta é a estrutura que você vai repetir em toda consulta a uma API.',
 'Complete as três lacunas da função de busca.',
 '{{1}} function buscar() {\n  const resposta = {{2}} fetch("https://viacep.com.br/ws/01001000/json/");\n  const dados = await resposta.{{3}}();\n\n  console.log(dados.localidade); // São Paulo\n}',
 'A função precisa ser async para poder usar await dentro dela. O await espera a resposta da rede. E o .json() transforma o corpo da resposta em um objeto JavaScript, que aí sim dá para acessar com ponto.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, grupo_lacuna, ordem) VALUES
(12401, 124, 'async',    1, 1, 1),
(12402, 124, 'await',    0, 1, 2),
(12403, 124, 'const',    0, 1, 3),
(12404, 124, 'return',   0, 1, 4),
(12405, 124, 'await',    1, 2, 1),
(12406, 124, 'async',    0, 2, 2),
(12407, 124, 'new',      0, 2, 3),
(12408, 124, 'return',   0, 2, 4),
(12409, 124, 'json',     1, 3, 1),
(12410, 124, 'text',     0, 3, 2),
(12411, 124, 'parse',    0, 3, 3),
(12412, 124, 'objeto',   0, 3, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, explicacao, pontos) VALUES
(125, 1, 6, 'ordenacao', 'dificil',
 'A caixa de busca da Pokédex: a pessoa digita um nome, clica no botão e o resultado aparece na tela.',
 'Coloque as etapas na ordem em que elas acontecem, do clique até o dado aparecer.',
 'É o encontro de tudo que a unidade ensinou: o evento dispara, o formulário informa o que buscar, o fetch busca, o .json() converte e o DOM mostra. Cada peça só pode agir depois que a anterior terminou.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, posicao_correta, ordem) VALUES
(12501, 125, 'A pessoa clica no botão e o addEventListener dispara a função.',        1, 1),
(12502, 125, 'A função lê o termo digitado com campo.value.',                         2, 2),
(12503, 125, 'O fetch é chamado com a URL montada e o await espera a resposta.',      3, 3),
(12504, 125, 'A resposta é convertida em objeto com await resposta.json().',          4, 4),
(12505, 125, 'O textContent do título recebe o dado e ele aparece na tela.',          5, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(126, 1, 6, 'multipla_escolha', 'dificil',
 'Durante a aula o wi-fi caiu no meio de uma busca. Na tela dos alunos que não tinham try/catch, nada aconteceu: nenhum dado, nenhuma mensagem.',
 'O que este trecho garante que a versão sem try/catch não garantia?',
 'try {\n  const resp = await fetch(API + nome);\n  if (!resp.ok) throw new Error();\n\n  const dados = await resp.json();\n  titulo.textContent = dados.name;\n} catch (erro) {\n  alert("Não deu para carregar. Tente de novo.");\n}',
 'try significa tente; catch significa se falhar, capture o erro e avise. Rede caindo, nome inexistente e servidor fora do ar deixam de quebrar a página em silêncio e viram uma mensagem clara. O try/catch não conserta a falha: ele garante que o usuário saiba que ela aconteceu.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12601, 126, 'Que uma falha de rede ou um erro do servidor virem um aviso na tela, em vez de a página parar sem explicação.', 1, 1),
(12602, 126, 'Que o fetch tente de novo sozinho, quantas vezes forem necessárias, até dar certo.', 0, 2),
(12603, 126, 'Que a API sempre responda com status 200, porque o try trata a resposta antes.', 0, 3),
(12604, 126, 'Que os dados sejam convertidos em objeto mesmo sem chamar o .json().', 0, 4);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(127, 1, 6, 'multipla_resposta', 'dificil',
 'Esta é a resposta do ViaCEP para o CEP 01001-000, já convertida com .json() e guardada na variável dados.',
 'Marque todas as afirmações corretas.',
 '{\n  "logradouro": "Praça da Sé",\n  "bairro": "Sé",\n  "localidade": "São Paulo",\n  "uf": "SP"\n}',
 'O JSON da API é um objeto igual aos que você já criava na mão: à esquerda dos dois-pontos está a chave, à direita o valor, e o acesso é com ponto. Vale decorar que a cidade se chama localidade no ViaCEP: inventar o nome da chave devolve undefined.',
 1.50);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12701, 127, 'dados.localidade vale São Paulo.', 1, 1),
(12702, 127, 'logradouro, bairro, localidade e uf são as chaves; os textos à direita são os valores.', 1, 2),
(12703, 127, 'Para preencher o campo da rua, escreve-se campoRua.value = dados.logradouro.', 1, 3),
(12704, 127, 'dados.cidade também vale São Paulo, porque cidade é sinônimo de localidade.', 0, 4),
(12705, 127, 'Para ler qualquer valor é preciso usar colchetes numéricos, como dados[0].', 0, 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos, embaralhar_itens) VALUES
(128, 1, 6, 'verdadeiro_falso', 'dificil',
 'Quando o CEP digitado não existe, o ViaCEP não devolve erro de rede: ele responde normalmente, com status 200 e este conteúdo.',
 'Julgue a afirmação: por isso o try/catch sozinho não basta, e é preciso testar if (dados.erro) antes de preencher os campos.',
 '{ "erro": true }',
 'Verdadeiro. O try/catch pega falha de rede e erro de servidor, mas aqui o pedido deu certo do ponto de vista técnico: quem avisa que o CEP não existe é o próprio conteúdo da resposta. Sem esse if, os campos do formulário seriam preenchidos com undefined.',
 1.00, 0);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(12801, 128, 'Verdadeiro', 1, 1),
(12802, 128, 'Falso', 0, 2);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, enunciado, explicacao, pontos) VALUES
(129, 1, 6, 'associacao', 'media',
 'No projeto final, ligue cada informação que o ViaCEP devolve ao que o seu código faz com ela.',
 'Cada chave da resposta tem um destino na tela. Repare que a cidade chega como localidade e o estado como uf, que é a sigla, exatamente o valor usado nas options do select.',
 2.00);
INSERT INTO questao_item (id, questao_id, texto, texto_par, ordem) VALUES
(12901, 129, 'dados.logradouro', 'Preenche o campo Rua.', 1),
(12902, 129, 'dados.bairro',     'Preenche o campo Bairro.', 2),
(12903, 129, 'dados.localidade', 'Preenche o campo Cidade.', 3),
(12904, 129, 'dados.uf',         'Marca a option certa no select de estados.', 4),
(12905, 129, 'dados.erro',       'Avisa que o CEP não foi encontrado e interrompe o preenchimento.', 5);

INSERT INTO questao (id, uc_id, topico_id, tipo, dificuldade, contexto, enunciado, codigo, explicacao, pontos) VALUES
(130, 1, 6, 'multipla_escolha', 'media',
 'No projeto do ViaCEP a busca precisa acontecer de dois jeitos: quando a pessoa sai do campo do CEP e quando clica no botão Buscar.',
 'Qual é a vantagem de os dois eventos chamarem exatamente a mesma função?',
 'campoCep.addEventListener("blur", buscarCep);\nbtnBuscar.addEventListener("click", buscarCep);',
 'A regra da busca fica escrita uma única vez. Se amanhã o CEP passar a aceitar outro formato, você corrige em um lugar só e os dois caminhos passam a funcionar igual. Código repetido é código que você vai esquecer de corrigir pela metade.',
 1.00);
INSERT INTO questao_item (id, questao_id, texto, correta, ordem) VALUES
(13001, 130, 'A regra da busca fica escrita uma única vez: corrigir em um lugar vale para os dois eventos.', 1, 1),
(13002, 130, 'O código roda duas vezes mais rápido, porque a função já fica carregada na memória.', 0, 2),
(13003, 130, 'O evento blur só funciona se houver também um evento de clique registrado.', 0, 3),
(13004, 130, 'Passar a mesma função duas vezes é o que a torna global e visível em qualquer arquivo.', 0, 4);

-- =========================================================================
--  Avaliacao com as 30 questoes, em rascunho
--  (publique pelo painel depois de revisar)
-- =========================================================================

INSERT INTO avaliacao (id, uc_id, titulo, descricao, instrucoes, slug, tempo_limite_min,
                       exibir_resultado, nota_minima, tentativa_unica, permite_voltar, status, criado_por) VALUES
(2, 1, 'Avaliação - Integração com APIs',
 'Trinta questões sobre JavaScript, do primeiro console.log ao consumo de uma API real.',
 'A prova tem 30 questões e você verá uma por vez, em ordem diferente para cada aluno. Não é possível voltar depois de responder, então leia o contexto e o código com calma antes de avançar. Nas questões de múltipla resposta é preciso marcar TODAS as alternativas corretas para pontuar.',
 'integracao-apis', 60, 'nota', 6.00, 1, 0, 'rascunho', 1);

INSERT INTO avaliacao_questao (avaliacao_id, questao_id, ordem) VALUES
(2, 101,  1), (2, 102,  2), (2, 103,  3), (2, 104,  4), (2, 105,  5),
(2, 106,  6), (2, 107,  7), (2, 108,  8), (2, 109,  9), (2, 110, 10),
(2, 111, 11), (2, 112, 12), (2, 113, 13), (2, 114, 14), (2, 115, 15),
(2, 116, 16), (2, 117, 17), (2, 118, 18), (2, 119, 19), (2, 120, 20),
(2, 121, 21), (2, 122, 22), (2, 123, 23), (2, 124, 24), (2, 125, 25),
(2, 126, 26), (2, 127, 27), (2, 128, 28), (2, 129, 29), (2, 130, 30);
