# 🐳 Guia Docker - Hacker League

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado

## 🚀 Como rodar com Docker

### Opção 1: Rodar tudo com um comando (RECOMENDADO)

```bash
docker-compose up
```

Isso vai:
- ✅ Construir as imagens do backend e frontend
- ✅ Iniciar ambos os serviços
- ✅ Backend na porta 5000
- ✅ Frontend na porta 3000

### Opção 2: Rodar em background (detached)

```bash
docker-compose up -d
```

Ver os logs:
```bash
docker-compose logs -f
```

### Opção 3: Rebuild (quando mudas código)

```bash
docker-compose up --build
```

---

## 🛑 Parar os containers

```bash
docker-compose down
```

Para remover volumes também:
```bash
docker-compose down -v
```

---

## 🌐 Acessar a aplicação

Depois de rodar, acessa:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Principal**: https://api.hackerschool.dev (já configurado)

---

## 🔧 Comandos úteis

### Ver containers a correr:
```bash
docker-compose ps
```

### Entrar no container do backend:
```bash
docker exec -it hs-backend sh
```

### Entrar no container do frontend:
```bash
docker exec -it hs-frontend sh
```

### Ver logs de um serviço específico:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Reiniciar um serviço específico:
```bash
docker-compose restart backend
docker-compose restart frontend
```

---

## 📁 Estrutura dos containers

```
HS-WebApp/
├── docker-compose.yml       # Orquestra os serviços
├── Dockerfile               # Imagem do frontend React
├── .dockerignore           # Ficheiros a ignorar
└── backend/
    ├── Dockerfile          # Imagem do backend Node.js
    └── .dockerignore       # Ficheiros a ignorar
```

---

## ⚠️ Problemas Comuns

### "Port already in use"
Já tens algo a correr nas portas 3000 ou 5000.

**Solução 1**: Para os processos locais
**Solução 2**: Muda as portas no `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # frontend
  - "5001:5000"  # backend
```

### "Cannot connect to backend"
Verifica se o backend container está a correr:
```bash
docker-compose ps
docker-compose logs backend
```

### Mudanças no código não aparecem
O hot-reload está ativo, mas se não funcionar:
```bash
docker-compose restart frontend
```

---

## 🔄 Desenvolvimento

Os volumes estão mapeados, então:
- ✅ Mudanças no código aparecem automaticamente (hot-reload)
- ✅ Não precisas de rebuild para cada mudança
- ✅ `node_modules` ficam isolados dentro do container

---

## 🚀 Produção

Para produção, cria builds otimizados:

```bash
# Build frontend para produção
docker build -t hs-frontend:prod --target production .

# Ou usa um Dockerfile.prod separado
```

---

## 💡 Dicas

1. **Primeira vez**: O `docker-compose up` pode demorar enquanto instala dependências
2. **Limpar tudo**: `docker system prune -a` (cuidado, remove todas as imagens)
3. **Ver uso de recursos**: `docker stats`

---

## 🆘 Ainda com problemas?

1. Verifica que Docker está a correr: `docker --version`
2. Verifica logs: `docker-compose logs`
3. Recria os containers: `docker-compose down && docker-compose up --build`

