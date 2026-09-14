# Trace Strike — Responsabilidades dos Arquivos

## 1. Objetivo

**Trace Strike** é um FPS 2.5D minimalista para navegador, construído com JavaScript, HTML5 Canvas e matemática de geometria/raycasting.

A proposta visual e técnica do projeto é:

- sem texturas;
- sem modelos 3D tradicionais;
- poucas cores;
- cenário representado por geometria;
- renderização leve;
- execução diretamente no navegador;
- arquitetura simples e modular.

O projeto deve priorizar **baixo consumo de recursos, clareza de código e separação de responsabilidades**.

---

# 2. Estrutura do projeto

```text
Trace-Strike/
│
├── index.html
├── README.md
├── LICENSE
├── .gitignore
│
├── src/
│   ├── main.js
│   │
│   ├── core/
│   │   ├── game.js
│   │   ├── loop.js
│   │   ├── input.js
│   │   └── state.js
│   │
│   ├── renderer/
│   │   ├── renderer.js
│   │   ├── camera.js
│   │   ├── raycaster.js
│   │   └── projection.js
│   │
│   ├── world/
│   │   ├── world.js
│   │   ├── map.js
│   │   ├── geometry.js
│   │   └── collision.js
│   │
│   ├── player/
│   │   ├── player.js
│   │   ├── weapon.js
│   │   └── projectile.js
│   │
│   ├── entities/
│   │   ├── entity.js
│   │   ├── enemy.js
│   │   └── enemyAI.js
│   │
│   ├── systems/
│   │   ├── combat.js
│   │   ├── damage.js
│   │   ├── interaction.js
│   │   └── effects.js
│   │
│   ├── ui/
│   │   ├── hud.js
│   │   ├── menu.js
│   │   ├── pause.js
│   │   └── crosshair.js
│   │
│   ├── audio/
│   │   └── audio.js
│   │
│   └── config/
│       ├── constants.js
│       ├── weapons.js
│       ├── enemies.js
│       └── settings.js
│
├── assets/
│   └── audio/
│       ├── shoot.wav
│       ├── hit.wav
│       ├── reload.wav
│       └── damage.wav
│
└── styles/
    └── main.css
```

---

# 3. Arquivos da raiz

## `index.html`

Ponto de entrada do navegador.

Responsabilidades:

- criar o elemento `<canvas>`;
- carregar o CSS;
- carregar `src/main.js`;
- fornecer a estrutura HTML mínima do jogo.

Não deve conter lógica de gameplay.

---

## `README.md`

Documentação principal do projeto.

Responsabilidades:

- explicar o conceito do jogo;
- documentar como executar;
- registrar controles;
- explicar a arquitetura;
- registrar decisões técnicas importantes;
- manter informações úteis para desenvolvedores e agentes de programação.

Este arquivo é documentação e **não contém lógica executável**.

---

## `LICENSE`

Define a licença de uso e distribuição do projeto.

---

## `.gitignore`

Define arquivos que não devem entrar no Git.

Exemplos:

```text
.DS_Store
node_modules/
*.log
.vscode/
dist/
```

---

# 4. `src/main.js`

Ponto de inicialização da aplicação.

Responsabilidades:

1. localizar/criar o Canvas;
2. criar as principais instâncias do jogo;
3. inicializar os sistemas;
4. iniciar o game loop.

Deve permanecer pequeno.

`main.js` não deve concentrar regras de gameplay.

---

# 5. `src/core/`

Infraestrutura principal do jogo.

## `core/game.js`

Orquestrador principal.

Responsabilidades:

- manter referências aos sistemas principais;
- coordenar atualização e renderização;
- conectar player, world, entities, renderer, UI e áudio;
- controlar o ciclo geral do jogo.

Não deve implementar detalhes internos dos sistemas.

---

## `core/loop.js`

Responsável pelo game loop.

Responsabilidades:

```text
input
↓
update
↓
render
↓
input
↓
update
↓
render
```

Usará `requestAnimationFrame()`.

Também deve fornecer `deltaTime` para que o jogo não dependa diretamente da quantidade de FPS.

---

## `core/input.js`

Centraliza entrada do jogador.

Responsabilidades:

- teclado;
- mouse;
- clique;
- teclas especiais;
- estado de teclas pressionadas;
- movimento do mouse.

Exemplo conceitual:

```javascript
input.isDown("KeyW");
input.isDown("KeyA");
input.mouse.deltaX;
```

Nenhum outro sistema deve registrar eventos de teclado/mouse de forma independente sem necessidade.

---

## `core/state.js`

Gerencia os estados globais do jogo.

Estados esperados:

```text
MENU
PLAYING
PAUSED
GAME_OVER
```

Pode crescer futuramente conforme novos estados forem necessários.

---

# 6. `src/renderer/`

Sistema responsável por transformar o mundo lógico em imagem.

Esta é uma das partes centrais do Trace Strike.

## `renderer/renderer.js`

Responsabilidade:

- limpar o Canvas;
- coordenar o processo de renderização;
- desenhar paredes, objetos, inimigos e HUD;
- receber dados calculados pelo restante do sistema;
- evitar lógica de gameplay.

O renderer deve ser o mais eficiente possível.

---

## `renderer/camera.js`

Representa a câmera do jogador.

Responsabilidades:

- posição;
- direção;
- FOV;
- altura da câmera;
- orientação;
- parâmetros necessários à perspectiva.

---

## `renderer/raycaster.js`

Responsável pelo raycasting.

Responsabilidades:

- lançar raios a partir da câmera;
- detectar a primeira geometria atingida;
- calcular distância;
- detectar pontos de interseção;
- produzir os dados necessários para desenhar a perspectiva.

Este módulo deve ser tratado como um componente crítico de desempenho.

---

## `renderer/projection.js`

Responsável por converter dados espaciais em coordenadas de tela.

Exemplos:

```text
distância do objeto
↓
tamanho projetado
↓
posição na tela
```

---

# 7. `src/world/`

Representação lógica do mundo.

## `world/world.js`

Gerencia o mundo atual.

Responsabilidades:

- carregar mapa;
- armazenar paredes;
- armazenar objetos;
- manter referências aos elementos do cenário;
- fornecer acesso às entidades espaciais.

---

## `world/map.js`

Define a geometria do mapa.

O mapa deve ser representado por dados simples.

Exemplo:

```javascript
const map = [
    "################",
    "#..............#",
    "#....####......#",
    "#..............#",
    "#......#.......#",
    "################"
];
```

Uma representação vetorial poderá ser adotada posteriormente quando necessário.

---

## `world/geometry.js`

Biblioteca matemática/geométrica do jogo.

Responsabilidades:

- pontos;
- vetores;
- segmentos;
- linhas;
- distância;
- direção;
- ângulos;
- interseção entre segmentos;
- operações geométricas utilizadas pelo raycasting e colisão.

Este arquivo deve concentrar operações matemáticas reutilizáveis.

---

## `world/collision.js`

Responsável pelas colisões.

Exemplos:

- jogador contra parede;
- inimigo contra parede;
- projétil contra obstáculo;
- objetos bloqueáveis.

Nenhum objeto deve implementar sua própria lógica de colisão sem necessidade.

---

# 8. `src/player/`

Sistemas diretamente relacionados ao jogador.

## `player/player.js`

Responsabilidades:

- posição;
- direção;
- velocidade;
- movimentação;
- vida;
- atualização do jogador;
- integração com câmera.

---

## `player/weapon.js`

Responsável pela arma atualmente equipada.

Responsabilidades:

- munição;
- carregador;
- cadência de tiro;
- dano;
- recarga;
- controle do disparo.

---

## `player/projectile.js`

Representa lógica relacionada a projéteis/tracers.

A implementação inicial pode usar hitscan para manter o sistema simples e leve.

Este arquivo existe para permitir evolução futura sem misturar lógica de projétil com a arma.

---

# 9. `src/entities/`

Entidades existentes no mundo.

## `entities/entity.js`

Base comum das entidades.

Pode conter:

- posição;
- vida;
- estado;
- identificação;
- propriedades espaciais comuns.

---

## `entities/enemy.js`

Representação do inimigo.

Responsabilidades:

- estado;
- vida;
- posição;
- movimentação;
- ataque;
- recebimento de dano.

---

## `entities/enemyAI.js`

Inteligência dos inimigos.

Estados iniciais:

```text
IDLE
PATROL
CHASE
ATTACK
DEAD
```

A IA deve ser simples e eficiente antes de receber comportamentos avançados.

---

# 10. `src/systems/`

Sistemas que conectam diferentes partes do jogo.

## `systems/combat.js`

Coordena o combate.

Responsabilidades:

- disparo;
- detecção de acerto;
- cálculo de dano;
- morte de inimigos;
- eventos relacionados ao combate.

---

## `systems/damage.js`

Centraliza aplicação de dano.

Responsabilidades:

- causar dano;
- receber dano;
- verificar vida;
- processar morte.

---

## `systems/interaction.js`

Responsável por interações do jogador com o mundo.

Exemplos:

- abrir porta;
- pegar item;
- ativar mecanismo;
- interagir com elementos do cenário.

---

## `systems/effects.js`

Efeitos visuais simples gerados matematicamente.

Exemplos:

- impacto;
- marca de tiro;
- flash;
- partículas;
- pequenos efeitos geométricos.

Priorizar efeitos sem texturas.

---

# 11. `src/ui/`

Interface do jogo.

## `ui/hud.js`

Responsável pelo HUD.

Exemplos:

```text
HP
AMMO
ENEMIES
SECTOR
```

---

## `ui/menu.js`

Responsável pelo menu inicial.

---

## `ui/pause.js`

Responsável pela tela de pausa.

---

## `ui/crosshair.js`

Responsável pela mira.

A mira poderá reagir ao estado do jogador e dos alvos.

---

# 12. `src/audio/`

## `audio/audio.js`

Centraliza reprodução de áudio.

Responsabilidades:

- carregar sons;
- reproduzir efeitos;
- controlar volume;
- evitar duplicação de lógica de áudio.

Exemplo conceitual:

```javascript
audio.play("shoot");
```

---

# 13. `src/config/`

Configurações centralizadas.

## `config/constants.js`

Constantes gerais.

Exemplos:

```text
PLAYER_SPEED
FOV
MAX_RAYS
GRAVITY
```

Evitar números mágicos espalhados pelo código.

---

## `config/weapons.js`

Configuração das armas.

Exemplos:

```text
damage
fireRate
magazine
reloadTime
```

---

## `config/enemies.js`

Configuração dos inimigos.

Exemplos:

```text
health
speed
damage
attackRange
```

---

## `config/settings.js`

Configurações gerais.

Exemplos:

```text
resolution
volume
FOV
mouse sensitivity
render settings
```

---

# 14. `assets/audio/`

Contém os poucos assets externos do projeto.

Exemplos:

```text
shoot.wav
hit.wav
reload.wav
damage.wav
```

A arquitetura não deve depender de texturas ou modelos 3D.

---

# 15. `styles/main.css`

Responsável exclusivamente pela apresentação HTML/CSS.

Pode conter:

- fundo;
- menus;
- HUD HTML, caso usado;
- elementos da interface;
- ajustes de tela.

A renderização do mundo permanece no Canvas.

---

# 16. Fluxo arquitetural

O fluxo principal esperado é:

```text
index.html
    ↓
main.js
    ↓
game
    ├── input
    ├── world
    ├── player
    ├── entities
    ├── systems
    ├── renderer
    ├── ui
    └── audio
```

O renderer recebe os dados necessários e desenha a cena no Canvas.

---

# 17. Princípios obrigatórios

### 1. Separação de responsabilidades

Cada arquivo deve possuir uma função clara.

### 2. Evitar dependências desnecessárias

O projeto deve permanecer baseado em:

```text
HTML
CSS
JavaScript
Canvas 2D
```

Frameworks ou bibliotecas externas somente quando houver uma necessidade real.

### 3. Performance

O projeto deve priorizar:

- baixo uso de CPU;
- baixo consumo de memória;
- poucas alocações por frame;
- operações matemáticas simples;
- renderização eficiente.

### 4. Geometria como base

Sempre que possível, representar:

- paredes;
- obstáculos;
- impactos;
- objetos;
- efeitos

como geometria e linhas em vez de imagens.

### 5. Código previsível

Evitar lógica espalhada e efeitos colaterais ocultos.

### 6. Evolução incremental

O jogo não deve ser construído inteiro de uma vez.

A sequência recomendada é:

```text
Canvas
↓
game loop
↓
câmera
↓
mapa
↓
raycasting
↓
perspectiva
↓
movimentação
↓
colisão
↓
arma
↓
inimigos
↓
IA
↓
HUD
↓
áudio
↓
polimento
```

---

# 18. Estrutura mínima do primeiro estágio

Não é necessário criar todos os arquivos imediatamente.

O primeiro estágio pode conter apenas:

```text
Trace-Strike/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
│
├── src/
│   └── main.js
│
└── styles/
    └── main.css
```

Os demais arquivos devem ser adicionados conforme os sistemas forem implementados.

---

# 19. Regra importante para agentes de programação

Antes de criar ou alterar código, o agente deve:

1. ler este README;
2. respeitar a responsabilidade de cada arquivo;
3. evitar criar arquivos que dupliquem responsabilidades existentes;
4. não mover lógica para arquivos inadequados apenas por conveniência;
5. preservar a arquitetura salvo quando houver uma justificativa técnica clara;
6. implementar por etapas;
7. testar cada etapa antes de avançar para a próxima.

O objetivo deste documento é servir como **contrato arquitetural inicial do Trace Strike**.
