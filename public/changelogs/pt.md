# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2025-07-21

### Melhorado

- Memory Helper: os Digimon que já têm 2 cópias no tabuleiro ficam escurecidos no seletor e não podem ser selecionados

### Adicionado

- Script `deploy.sh` para automatizar build, push e deploy remoto com Docker

### Alterado

- O módulo do changelog agora carrega changelogs por idioma a partir de `/changelogs/{locale}.md`
- Changelogs disponíveis nos 6 idiomas suportados (en, es, it, pt, de, ja)
- Removido o `public/CHANGELOG.md` duplicado em favor de arquivos por idioma

## [1.0.0] - 2025-01-20

### Adicionado

- Arquitetura multi-utilidade com App Shell e navegação lateral (sidebar)
- Servidor estático Node.js sem dependências externas
- Sistema de internacionalização (i18n) com suporte para 6 idiomas
- Registro central de módulos para extensibilidade
- Módulo Memory Game Helper (extraído do monólito original)
- Módulo Calculador de Ganho Passivo (nova utilidade)
- Imagens locais de Digimon (12 PNG)
- Design responsivo com sidebar recolhível em dispositivos móveis
- Sistema de versionamento com changelog

### Alterado

- Refatoração de aplicação monolítica (HTML único) para arquitetura modular
- Migração de imagens externas para arquivos locais
