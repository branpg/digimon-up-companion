# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.4.0] - 2025-07-23

### Adicionado

- Novo módulo Checklist Diária: lista completa de tarefas diárias para maximizar o progresso
- Estado dos checks persistido por ID estável (sobrevive a correções de texto e novos itens)
- Reset diário automático às 08:00 com banner de confirmação
- Botão de reset manual com confirmação
- Toggle do DemiDevimon Loop integrado na lista com número de tickets configurável que repete ciclos de missões
- Badges de tags inline (Missão, Queima de recursos, Loja, Acampamento, PvP)
- Toggle "Ocultar concluídos" (ativado por padrão) para manter a lista limpa
- Suporte i18n completo: todos os passos e tags traduzidos em 6 idiomas
- Re-renderização ao mudar de idioma via MutationObserver em `<html lang>`

## [1.3.0] - 2025-07-21

### Adicionado

- Nível Gacha: campo "Tempo sem coletar" (HH:MM:SS) com rastreamento de timestamp da última coleta
- Nível Gacha: botão "Atualizar" define hora da última coleta para que o tempo decorrido se atualize automaticamente ao recalcular
- Nível Gacha: exibe "Última coleta: HH:MM" como referência
- Nível Gacha: alerta de coleta quando armazenamento passivo está cheio (≥8h), mostra próximo horário recomendado (+7h)
- Nível Gacha: botões rápidos (+1, +10, +50, +100) para DigiEsmeraldas atuais
- Cálculo de gacha agora considera esmeraldas já acumuladas (máximo 8h de passivo)

## [1.2.0] - 2025-07-21

### Adicionado

- Ganho Passivo: nova aba "Nível Gacha" para calcular quando o gacha sobe de nível
- Gacha de cartas e gacha de suporte, cada um com puxadas feitas/objetivo/restantes e tickets atuais
- Mecânica: 30 tickets por multi (dá 35 puxadas), cada ticket custa 20 DigiEsmeraldas
- Calcula multi-puxadas necessárias, custo em tickets, custo em DigiEsmeraldas e tempo passivo

### Alterado

- Ganho Passivo: dividido em 3 sub-abas (Tempo de espera, Esmeraldas, Nível Gacha)
- Configuração de recompensas sempre visível em todas as abas
- Painel de resultado oculto até pressionar calcular (nas 3 abas)
- Se não há dados do andar configurados, avisa e bloqueia o cálculo
- Botão calcular em largura total

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
