/**
 * Instituto Elo Animal – dados/conteudo.js
 * ------------------------------------------------------------
 * Fonte única de dados do site. As views só têm a estrutura (HTML);
 * os textos que se repetem ou mudam com frequência ficam aqui e são
 * transformados em HTML pelos templates (core/templates.js).
 * Para incluir um projeto novo, basta acrescentar um objeto na lista:
 * cartão, submenu, página de detalhe, filtro e tabela se atualizam sozinhos.
 */

/** Categorias usadas nos filtros e nas etiquetas dos projetos. */
export const categorias = {
  saude: 'Saúde animal',
  educacao: 'Educação',
  adocao: 'Adoção',
};

export const projetos = [
  {
    id: 'castracao-solidaria',
    titulo: 'Castração Solidária',
    categoria: 'saude',
    area: 'castracao',
    etiquetas: [
      { texto: 'Saúde animal' },
      { texto: 'Gratuito', variante: 'etiqueta--secundaria' },
    ],
    resumo: 'Mutirões mensais de castração para cães e gatos de famílias de baixa renda.',
    descricao: 'Mutirões de castração gratuita para cães e gatos de famílias de baixa renda. A castração controla a população de animais nas ruas, diminui brigas e fugas e previne doenças como tumores de mama e infecções uterinas.',
    imagem: 'imagens/projetos/castracao.svg',
    alt: 'Gato sentado ao lado de um escudo verde com uma cruz médica e um coração.',
    legenda: 'Mutirões mensais realizados na sede, com triagem, cirurgia e pós-operatório acompanhado.',
    objetivos: [
      'Realizar 1.500 castrações gratuitas por ano;',
      'Reduzir o número de ninhadas abandonadas no bairro;',
      'Orientar os tutores sobre os cuidados no pós-operatório.',
    ],
    publico: 'Famílias inscritas no CadÚnico e protetores independentes cadastrados.',
    resultado: '1.240 castrações',
    voluntarios: 58,
    bairros: 14,
  },
  {
    id: 'clinica-social',
    titulo: 'Clínica Veterinária Social',
    categoria: 'saude',
    area: 'clinica',
    etiquetas: [
      { texto: 'Saúde animal' },
      { texto: 'Preço social', variante: 'etiqueta--info' },
    ],
    resumo: 'Consultas, vacinas e exames de segunda a sábado, com valores conforme a renda.',
    descricao: 'Atendimento clínico de segunda a sábado, feito por médicas-veterinárias voluntárias e estudantes supervisionados. Oferecemos consultas, vacinação, vermifugação e exames básicos a preço social.',
    imagem: 'imagens/projetos/clinica.svg',
    alt: 'Pegada de animal verde ao lado de um estetoscópio.',
    legenda: 'Consultas, vacinas e exames com valores sociais ou gratuitos, conforme a renda da família.',
    objetivos: [
      'Garantir acesso à saúde animal para quem não pode pagar uma clínica particular;',
      'Vacinar cães e gatos contra a raiva e outras doenças transmissíveis;',
      'Detectar precocemente zoonoses, como a leishmaniose e a esporotricose.',
    ],
    publico: 'Tutores com renda familiar de até três salários mínimos e animais resgatados pela ONG.',
    resultado: '3.150 atendimentos',
    voluntarios: 21,
    bairros: 9,
  },
  {
    id: 'educar-para-cuidar',
    titulo: 'Educar para Cuidar',
    categoria: 'educacao',
    area: 'educacao',
    etiquetas: [
      { texto: 'Educação', variante: 'etiqueta--info' },
    ],
    resumo: 'Palestras e oficinas sobre guarda responsável e prevenção de zoonoses nas escolas.',
    descricao: 'Palestras e oficinas em escolas públicas e associações de moradores sobre guarda responsável, prevenção de zoonoses, combate aos maus-tratos e respeito aos animais.',
    imagem: 'imagens/projetos/educacao.svg',
    alt: 'Livro aberto com uma pegada de animal na página e um lápis ao lado.',
    legenda: 'Oficinas lúdicas sobre guarda responsável para crianças do ensino fundamental.',
    objetivos: [
      'Levar educação em Saúde Única a 50 escolas por ano;',
      'Formar multiplicadores entre professores e agentes comunitários;',
      'Estimular a denúncia responsável de maus-tratos.',
    ],
    publico: 'Estudantes, professores e lideranças comunitárias da região.',
    resultado: '42 escolas visitadas',
    voluntarios: 17,
    bairros: 11,
  },
  {
    id: 'adote-um-amigo',
    titulo: 'Adote um Amigo',
    categoria: 'adocao',
    area: 'adocao',
    etiquetas: [
      { texto: 'Adoção', variante: 'etiqueta--secundaria' },
      { texto: 'Feira quinzenal', variante: 'etiqueta--alerta' },
    ],
    resumo: 'Animais resgatados, tratados e castrados à espera de uma família responsável.',
    descricao: 'Cães e gatos resgatados são tratados, castrados e vacinados antes de encontrar uma nova família. Também mantemos uma rede de lares temporários para animais em recuperação.',
    imagem: 'imagens/projetos/adocao.svg',
    alt: 'Cachorro caramelo sentado ao lado de uma casinha com um coração no telhado.',
    legenda: 'Feiras de adoção quinzenais, com entrevista prévia e acompanhamento após a adoção.',
    objetivos: [
      'Promover adoções conscientes e reduzir as devoluções;',
      'Ampliar a rede de lares temporários voluntários;',
      'Acompanhar cada adoção por pelo menos seis meses.',
    ],
    publico: 'Famílias interessadas em adotar e voluntários que oferecem lar temporário.',
    resultado: '386 adoções',
    voluntarios: 34,
    bairros: 8,
  },
];

/** Indicadores exibidos na página inicial (contagem animada). */
export const impacto = [
  { valor: 1240, rotulo: 'castrações gratuitas' },
  { valor: 3150, rotulo: 'atendimentos veterinários sociais' },
  { valor: 386, rotulo: 'adoções responsáveis' },
  { valor: 42, rotulo: 'escolas com palestras educativas' },
];

/** Campanhas: meta, valor arrecadado e prazo (a situação é calculada pela data). */
export const campanhas = [
  {
    id: 'vacina-solidaria',
    titulo: 'Vacina Solidária',
    descricao: 'Garantir 500 doses de vacinas antirrábica e polivalente para cães e gatos atendidos pela ONG.',
    unidade: 'reais',
    meta: 15000,
    arrecadado: 9600,
    prazo: '2026-12-15',
  },
  {
    id: 'racao-abrigo',
    titulo: 'Ração para o Abrigo',
    descricao: '2 toneladas de ração para os animais do abrigo temporário até o fim do ano.',
    unidade: 'kg',
    meta: 2000,
    arrecadado: 1200,
    prazo: '2026-12-31',
  },
  {
    id: 'reforma-gatil',
    titulo: 'Reforma do Gatil',
    descricao: 'Telas de proteção, prateleiras e caixas de areia novas para os gatos resgatados.',
    unidade: 'reais',
    meta: 8000,
    arrecadado: 8000,
    prazo: '2026-09-30',
  },
];

/** Custos usados no simulador de doação (valores médios de 2025). */
export const custos = [
  { id: 'vacina', singular: 'dose de vacina', plural: 'doses de vacina', valor: 30 },
  { id: 'consulta', singular: 'consulta na Clínica Social', plural: 'consultas na Clínica Social', valor: 50 },
  { id: 'castracao', singular: 'castração', plural: 'castrações', valor: 120 },
  { id: 'racao', singular: 'kg de ração', plural: 'kg de ração', valor: 8 },
];

/** Prestação de contas: como cada R$ 100 doados foram aplicados em 2025. */
export const aplicacaoRecursos = {
  ano: 2025,
  itens: [
    { rotulo: 'Castrações, consultas e medicamentos', valor: 62 },
    { rotulo: 'Ração e abrigo para animais resgatados', valor: 18 },
    { rotulo: 'Educação e materiais para as escolas', valor: 12 },
    { rotulo: 'Custos administrativos', valor: 8 },
  ],
};

/** Evolução anual dos atendimentos (gráfico de barras). */
export const historico = [
  { ano: 2021, castracoes: 420, atendimentos: 1380, adocoes: 150 },
  { ano: 2022, castracoes: 690, atendimentos: 1910, adocoes: 212 },
  { ano: 2023, castracoes: 905, atendimentos: 2440, adocoes: 268 },
  { ano: 2024, castracoes: 1080, atendimentos: 2790, adocoes: 331 },
  { ano: 2025, castracoes: 1240, atendimentos: 3150, adocoes: 386 },
];

export const perguntas = [
  {
    pergunta: 'Preciso ter experiência para ser voluntário?',
    resposta: 'Não. Todas as pessoas voluntárias participam de uma integração on-line de 2 horas e atuam sempre acompanhadas pela coordenação do projeto escolhido.',
  },
  {
    pergunta: 'Quem pode usar a Clínica Veterinária Social?',
    resposta: 'Tutores com renda familiar de até três salários mínimos e animais resgatados pela ONG. Basta levar um documento com foto e um comprovante de endereço.',
  },
  {
    pergunta: 'A doação tem recibo?',
    resposta: 'Sim. Todo doador recebe o recibo por e-mail e pode consultar a prestação de contas anual na página Transparência.',
  },
  {
    pergunta: 'Como funciona a adoção?',
    resposta: 'Você conhece os animais nas feiras quinzenais, passa por uma entrevista e assina um termo de adoção responsável. A equipe acompanha a adaptação por seis meses.',
  },
  {
    pergunta: 'O site guarda meus dados?',
    resposta: 'Só neste navegador. Rascunho do cadastro, inscrições enviadas, favoritos e preferências ficam no armazenamento local (localStorage) e podem ser apagados a qualquer momento na Minha área.',
  },
];

/** Próximo evento divulgado na página inicial (com contagem regressiva). */
export const proximoEvento = {
  titulo: 'Próximo mutirão de castração',
  inicio: '2026-10-17T08:00:00-03:00',
  descricao: 'na sede do Instituto. Atendimento gratuito para famílias inscritas no CadÚnico.',
};

/** Rótulos das áreas de voluntariado (usados no cadastro e na Minha área). */
export const areasVoluntariado = {
  castracao: 'Mutirões de castração',
  clinica: 'Clínica veterinária social',
  adocao: 'Feiras de adoção',
  'lar-temporario': 'Lar temporário',
  educacao: 'Palestras nas escolas',
  comunicacao: 'Comunicação e redes sociais',
};

export const chavePix = 'contato@institutoeloanimal.org.br';
