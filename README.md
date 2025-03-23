# Git Commit Helper

![Git Commit Helper Header](img/header.png)

## 📝 Sobre o projeto

O Git Commit Helper é uma ferramenta web que ajuda desenvolvedores, principalmente iniciantes, a criarem mensagens de commit claras e padronizadas seguindo a especificação [Conventional Commits](https://www.conventionalcommits.org/).

Com esta ferramenta, você pode:

- Gerar mensagens de commit padronizadas
- Escolher entre português e inglês
- Transformar descrições simples em commits profissionais
- Facilitar a manutenção de um histórico de projeto organizado

## 🌐 Versão Online

Experimente a versão online: [Git Commit Helper](https://git-commit-helper.vercel.app/) 

> **Nota**: A versão online tem um limite de 3 gerações de commits por dia por usuário devido às limitações da API gratuita do Google Gemini.

## 🚀 Como executar localmente

Para executar o projeto em sua máquina sem limitações de uso, siga estas instruções:

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes do Python)
- Uma chave de API do Google Gemini

### Passo 1: Clonar o repositório

```bash
git clone https://github.com/Moscarde/git-commit-helper.git
cd git-commit-helper
```

### Passo 2: Configurar o ambiente virtual (opcional, mas recomendado)

```bash
# No Windows
python -m venv venv
venv\Scripts\activate

# No Linux/MacOS
python -m venv venv
source venv/bin/activate
```

### Passo 3: Instalar as dependências

```bash
pip install -r requirements.txt
```

### Passo 4: Obter uma API Key do Google Gemini

1. Acesse a [Plataforma Google AI](https://ai.google.dev/)
2. Faça login com sua conta Google
3. No menu, acesse "API Keys" (Chaves API)
4. Clique em "Create API Key" (Criar chave API)
5. Copie a chave gerada

### Passo 5: Configurar as variáveis de ambiente

1. Crie um arquivo `.env` no diretório raiz do projeto:

```bash
cp .env.example .env
```

2. Abra o arquivo `.env` em um editor de texto e preencha com sua chave API: