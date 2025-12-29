# ✅ API Documentation Discovery

## 🎉 PROBLEMA RESOLVIDO!

### Descoberta Importante

Os endpoints **PUT** e **DELETE** para participations **EXISTEM NA API** mas **NÃO ESTÃO DOCUMENTADOS**!

## 📚 Discrepância entre Documentação e Código

### Documentação Oficial (Incompleta)
A [documentação publicada](https://delightful-cat-ae614a.netlify.app/usage-guide/#post-projects-slug-participations) lista apenas:

- ✅ `POST /projects/<slug>/participations`
- ✅ `GET /projects/<slug>/participations`
- ✅ `GET /projects/<slug>/participations/<username>`
- ✅ `GET /members/<username>/participations`

### Código Real da API (Completo)
Analisando `API/app/controllers/project_participation_controller.py`, descobrimos que também existem:

- ✅ `PUT /projects/<slug>/participations/<username>` **(linhas 83-103)**
- ✅ `DELETE /projects/<slug>/participations/<username>` **(linhas 105-124)**

---

## 🛠️ Endpoints Completos Disponíveis

### PUT - Update Participation
```python
# API/app/controllers/project_participation_controller.py (linha 83)
@bp.route("/projects/<slug>/participations/<username>", methods=["PUT"])
@auth_controller.requires_permission(general="participation:update", project="edit-participant")
def update_participation_by_username(username, slug):
    # Atualiza roles e/ou join_date
```

**Request Body** (`UpdateProjectParticipationSchema`):
```json
{
    "roles": ["coordinator"],  // optional - muda participant ↔ coordinator
    "join_date": "2025-01-15"  // optional
}
```

### DELETE - Remove Participation
```python
# API/app/controllers/project_participation_controller.py (linha 105)
@bp.route("/projects/<slug>/participations/<username>", methods=["DELETE"])
@auth_controller.requires_permission(general="participation:delete", project="remove-participant")
def delete_participation_by_username(slug, username):
    # Remove utilizador da equipa
```

**Response**:
```json
{
    "description": "Participation deleted successfully",
    "username": "user123",
    "project_name": "Project Name"
}
```

---

## ✅ Funcionalidades Completas Implementadas

### No Admin Panel (UserManagement)

**Todas as funcionalidades agora funcionam:**

1. ✅ **Adicionar utilizador a teams** - Funciona
2. ✅ **Definir utilizador como coordinator** - Funciona
3. ✅ **Remover utilizador de teams** - **FUNCIONA!**
4. ✅ **Mudar role (coordinator ↔ participant)** - **FUNCIONA!**

### Permissões Necessárias

Para usar estes endpoints, o utilizador precisa ter:

**Para UPDATE:**
- `participation:update` (general scope)
- `edit-participant` (project scope)

**Para DELETE:**
- `participation:delete` (general scope)
- `remove-participant` (project scope)

---

## 📝 Código Atualizado

### `projectParticipationService.js`
✅ Funções `updateParticipation()` e `deleteParticipation()` totalmente funcionais
✅ Documentação atualizada com nota sobre endpoints não documentados
✅ Referência ao ficheiro fonte na API

### `UserManagement.jsx`
✅ Lógica completa de ADD, UPDATE e DELETE restaurada
✅ Remove teams quando desmarcadas
✅ Atualiza role de coordinator automaticamente quando necessário

---

## 🚀 Como Usar

### Adicionar utilizador a uma equipa:
```javascript
await createParticipation('project-slug', {
    username: 'user123',
    join_date: '2025-01-15',
    roles: ['participant']
});
```

### Mudar para coordinator:
```javascript
await updateParticipation('project-slug', 'user123', {
    roles: ['coordinator']
});
```

### Remover de uma equipa:
```javascript
await deleteParticipation('project-slug', 'user123');
```

---

## ⚠️ Nota para Manutenção da API

**Recomendação**: Atualizar a documentação oficial em https://delightful-cat-ae614a.netlify.app/ para incluir os endpoints PUT e DELETE que já existem no código!

---

## 🔗 Referências

- [Documentação Oficial (Incompleta)](https://delightful-cat-ae614a.netlify.app/usage-guide/)
- [Código Real da API](../API/app/controllers/project_participation_controller.py)
- [Schema de Update](../API/app/schemas/update_project_participation_schema.py)
- [Serviço Frontend](./src/services/projectParticipationService.js)
- [Admin Panel](./src/components/Admin/UserManagement/UserManagement.jsx)

