# 🚀 Guia: Correr HS-WebApp Localmente com API em Docker

Este guia explica como correr o frontend **HS-WebApp** localmente enquanto a **API Flask** está a correr em Docker.

## 📋 Pré-requisitos

1. **Node.js** (v14 ou superior) - [Download](https://nodejs.org/)
2. **npm** (vem com Node.js)
3. **Docker** e **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
4. **Git** (para clonar o repositório)

## 🐳 Passo 1: Correr a API em Docker

### Opção A: Usar docker-compose.api.yml (Recomendado)

```bash
# Na raiz do projeto Hacker-League
docker-compose -f docker-compose.api.yml up -d
```

Isto vai:
- Construir e iniciar o container da API Flask
- Expor a API na porta `8080` do teu computador
- A API estará disponível em: `http://localhost:8080`

### Opção B: Usar docker-compose.yaml dentro de API/

```bash
cd API
docker-compose up -d
```

### Verificar se a API está a correr

```bash
# Ver logs
docker-compose -f docker-compose.api.yml logs -f api

# Ou verificar se responde
curl http://localhost:8080/me
```

## 💻 Passo 2: Instalar Dependências do Frontend

```bash
cd HS-WebApp
npm install
```

## 🔧 Passo 3: Configurar o Frontend para Usar API Docker

O frontend já está configurado para usar `http://localhost:8080` em desenvolvimento (ver `src/config/api.config.js`).

**Se precisares de alterar**, podes:

### Opção A: Criar ficheiro `.env` (Recomendado)

Cria um ficheiro `.env` na pasta `HS-WebApp/`:

```bash
# HS-WebApp/.env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

### Opção B: Editar diretamente `src/config/api.config.js`

Se não usares `.env`, o código já usa `http://localhost:8080` por padrão em desenvolvimento.

## 🎯 Passo 4: Correr o Frontend Localmente

```bash
# Na pasta HS-WebApp
npm start
```

Isto vai:
- Iniciar o servidor de desenvolvimento React
- Abrir automaticamente `http://localhost:3000` no browser
- Hot-reload quando fizeres alterações no código

## 🔌 Passo 5: Correr o Backend Node.js (Opcional)

O backend Node.js é usado para algumas funcionalidades admin. Se precisares:

```bash
cd HS-WebApp/backend
npm install
npm start
```

O backend Node.js vai correr na porta `5000`.

## 📊 Resumo das Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| **Frontend React** | 3000 | http://localhost:3000 |
| **API Flask (Docker)** | 8080 | http://localhost:8080 |
| **Backend Node.js** | 5000 | http://localhost:5000 |

## ✅ Verificar se Tudo Está a Funcionar

1. **API Flask**: Abre `http://localhost:8080/me` no browser (deve dar erro de autenticação, mas significa que está a responder)

2. **Frontend**: Abre `http://localhost:3000` - deves ver a página de login

3. **Backend Node.js** (se estiver a correr): Abre `http://localhost:5000/api` - deve responder

## 🐛 Troubleshooting

### Problema: Frontend não consegue conectar à API

**Solução 1**: Verifica se a API está a correr
```bash
docker ps
# Deves ver o container "hacker-league-api" a correr
```

**Solução 2**: Verifica os logs da API
```bash
docker-compose -f docker-compose.api.yml logs api
```

**Solução 3**: Verifica se a porta 8080 está livre
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

### Problema: CORS errors no browser

A API já está configurada para aceitar requests de `http://localhost:3000`. Se tiveres problemas:

1. Verifica que `ORIGINS_WHITELIST` no Docker inclui `http://localhost:3000`
2. Reinicia o container da API:
```bash
docker-compose -f docker-compose.api.yml restart api
```

### Problema: Mudanças no código não aparecem

**Frontend**: O React tem hot-reload automático. Se não funcionar:
- Guarda o ficheiro novamente
- Recarrega a página no browser (F5)
- Reinicia `npm start`

**API**: Se alterares código da API, precisas de reconstruir o container:
```bash
docker-compose -f docker-compose.api.yml up -d --build api
```

## 🔄 Workflow de Desenvolvimento

1. **API em Docker**: Deixa sempre a correr em background
   ```bash
   docker-compose -f docker-compose.api.yml up -d
   ```

2. **Frontend Local**: Corre quando estiveres a desenvolver
   ```bash
   cd HS-WebApp
   npm start
   ```

3. **Backend Node.js**: Corre apenas se precisares de funcionalidades admin
   ```bash
   cd HS-WebApp/backend
   npm start
   ```

## 🛑 Parar Tudo

```bash
# Parar frontend: Ctrl+C no terminal onde está a correr npm start

# Parar backend Node.js: Ctrl+C no terminal onde está a correr

# Parar API Docker
docker-compose -f docker-compose.api.yml down
```

## 📝 Notas Importantes

- O frontend em desenvolvimento (`npm start`) usa **hot-reload** - mudanças aparecem automaticamente
- A API em Docker usa **volumes** - mudanças na base de dados persistem mesmo depois de parar o container
- Para mudanças no código da API, precisas de **reconstruir** o container Docker
- O frontend está configurado para usar `localhost:8080` automaticamente em desenvolvimento

## 🎉 Pronto!

Agora tens o frontend a correr localmente e a API em Docker. Podes desenvolver e testar tudo localmente! 🚀
