# 🚀 Quick Start Guide - Hacker League

## Requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

## Instalação e Execução

### Opção 1: Executar tudo automaticamente (RECOMENDADO)

**Windows:**
```bash
start-servers.bat
```

**Linux/Mac:**
```bash
chmod +x start-servers.sh
./start-servers.sh
```

Isso vai:
1. Instalar todas as dependências automaticamente
2. Iniciar o backend na porta 5000
3. Iniciar o frontend na porta 3000
4. Abrir o navegador automaticamente

---

### Opção 2: Executar manualmente

#### 1. Instalar dependências do FRONTEND:
```bash
npm install
```

#### 2. Instalar dependências do BACKEND:
```bash
cd backend
npm install
cd ..
```

#### 3. Iniciar o BACKEND (porta 5000):
```bash
cd backend
npm start
```

#### 4. Iniciar o FRONTEND (porta 3000):
Em outra janela de terminal:
```bash
npm start
```

---

## 🌐 Acessar a aplicação

Depois de rodar, acesse:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

O navegador deve abrir automaticamente!

---

## ⚠️ Problemas Comuns

### "Não vejo nada, só pastas"
➡️ Você precisa **rodar o servidor de desenvolvimento**! Use os comandos acima.

### "Port already in use"
➡️ Já tem algo rodando nessas portas. Feche e tente novamente.

### "Module not found"
➡️ Execute `npm install` primeiro.

### "API connection failed"
➡️ Verifique se o backend está rodando na porta 5000.

---

## 📝 Configuração da API

A API principal está em: **https://api.hackerschool.dev**

Se precisar mudar isso, edite: `src/config/api.config.js`

---

## 🆘 Ainda com problemas?

Execute o script de teste:
```bash
test-servers.bat
```

Isso vai verificar se tudo está configurado corretamente!

