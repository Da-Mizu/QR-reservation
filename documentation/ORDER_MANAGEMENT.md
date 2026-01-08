# Système de Gestion des Commandes

## Vue d'ensemble
Le système de gestion des commandes gère le cycle de vie complet d'une commande restaurant, de la prise de commande jusqu'à la facturation et la fermeture.

## Statuts des Commandes

### Hiérarchie complète
```
En attente (🟡 Warning)
    ↓
En préparation (🔵 Info)
    ↓
Prête (🟢 Success)
    ↓
Servie (🟢 Success)
    ↓
En attente de paiement (🔷 Primary)
    ↓
Terminée (⚫ Secondary)
```

### Détails des statuts

| Statut | Code BDD | Couleur | Description |
|--------|----------|---------|-------------|
| En attente | `en_attente` | Jaune (#FFC107) | Commande reçue, en attente de cuisine |
| En préparation | `en_preparation` | Bleu (#17A2B8) | Commande en cours de préparation |
| Prête | `prete` | Vert (#28A745) | Commande préparée, attente service |
| Servie | `servie` | Vert (#28A745) | Commande servie au client |
| En attente de paiement | `en_attente_de_paiement` | Bleu (#007BFF) | En attente du paiement client |
| Terminée | `terminee` | Gris (#6C757D) | Commande complétée et payée |
| Annulée | `annulea` | Rouge (#DC3545) | Commande annulée/non servie |

## Actions Disponibles par Statut

### Dashboard Principal

#### En attente
```javascript
[Préparer] → en_preparation
[Annuler] → annulee
```

#### En préparation
```javascript
[Prête] → prete
[Retour] → en_attente
```

#### Prête
```javascript
[Servie] → servie
[Retour] → en_preparation
```

#### Servie
```javascript
[En attente de paiement] → en_attente_de_paiement
[Retour] → prete
```

#### En attente de paiement
```javascript
[Terminée] → terminee
[Retour] → servie
```

#### Terminée
```javascript
[Retour] → en_attente_de_paiement  (cas exceptionnel)
```

#### Annulée
```javascript
Pas d'actions disponibles
```

### Plan du Restaurant (Table Map)

**Double-click sur une table** : Progresse automatiquement dans les statuts
```
en_attente 
  → en_preparation 
    → prete 
      → servie 
        → en_attente_de_paiement 
          → terminee 
            → en_attente (cycle)
```

## Système de Revenus

### Calcul
- Les revenus comptabilisent **uniquement les commandes avec le statut `terminee`**
- Formule : `SUM(commande.total) WHERE statut = 'terminee'`
- Les commandes annulées ou en cours ne sont pas incluses

### Affichage
- Widget "Revenus" dans le Dashboard Stats
- Mise à jour en temps réel avec polling 5 secondes
- Format : Montant total en devise du restaurant

### Exemples
```
Commande 1: €50 - Terminée ✓ → Comptée (+€50)
Commande 2: €30 - En attente de paiement ✗ → Non comptée
Commande 3: €20 - Annulée ✗ → Non comptée
Commande 4: €40 - Prête ✗ → Non comptée

Total Revenus = €50 (seulement les terminées)
```

## Flux de Mise à Jour

### Via Dashboard
1. User clique sur bouton d'action
2. Appel `mettreAJourStatut(commandeId, newStatut)`
3. PATCH `/api/commandes/{id}/statut` avec validation server-side
4. Mise à jour affichage local
5. Auto-refresh (5s) synchronise avec backend

### Via Table Map
1. User double-click sur table
2. Récupère commande pour `table_number`
3. Progresse statut automatiquement
4. PATCH `/api/commandes/{id}/statut`
5. Mise à jour couleur table immédiate
6. Auto-refresh resynchronise

### Validation Server-Side
```php
$statuts_valides = [
    'en_attente',
    'en_preparation',
    'prete',
    'servie',
    'en_attente_de_paiement',
    'terminee',
    'annulea'
];

if (!in_array($nouveau_statut, $statuts_valides)) {
    return error_response(400, "Statut invalide");
}
```

## Stockage des Données

### Commandes (Table MySQL)
```sql
CREATE TABLE commandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    table_number INT,
    statut VARCHAR(50) DEFAULT 'en_attente',
    total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
```

### Structure API Response
```json
{
    "id": 1,
    "restaurant_id": 1,
    "table_number": 5,
    "statut": "en_preparation",
    "total": "45.50",
    "created_at": "2026-01-08 10:30:00",
    "items": [
        {
            "id": 1,
            "produit_id": 1,
            "quantite": 2,
            "prix_unitaire": "12.50"
        }
    ]
}
```

## Intégration avec Table Map

### Coloration des Tables
```javascript
function getStatusColor(statut) {
    const colors = {
        'en_attente': '#FFC107',           // Jaune
        'en_preparation': '#17A2B8',       // Bleu clair
        'prete': '#28A745',                // Vert
        'servie': '#28A745',               // Vert
        'en_attente_de_paiement': '#007BFF', // Bleu
        'terminee': '#6C757D',             // Gris
        'annulea': '#DC3545'               // Rouge
    };
    return colors[statut] || '#CCCCCC';
}
```

### Mise à Jour Automatique
- Auto-refresh: Toutes les 5 secondes, récupère les commandes
- Redraw: Les tables sont recoloriées selon le dernier statut
- Persistance: Les positions des tables sont sauvegardées en localStorage

## Points d'Intégration

### Frontend Admin
- **Dashboard.js** : Gestion du statut principal via buttons
- **TableMap.js** : Gestion du statut via double-click sur tables
- **AuthContext.js** : Vérification du restaurant associé

### Backend
- **index.php** : Route PATCH `/api/commandes/{id}/statut`
- **db.php** : Requête UPDATE avec validation restaurant_id
- **encryption.php** : Décodage du token pour vérifier restaurant_id

### Base de Données
- **Table commandes** : Colonne `statut` (VARCHAR 50)
- **Index** : Sur `restaurant_id` et `statut` pour performance

## Considérations de Performance

### Polling
- Intervalle: 5 secondes par défaut
- Peut être activé/désactivé dans Dashboard et TableMap
- Alternative future: WebSocket pour real-time

### Optimisations
1. **Server-side** : Indexer sur `restaurant_id` et `statut`
2. **Client-side** : Déduplication des requêtes
3. **Caching** : localStorage pour positions tables (non-critical data)

## Scénarios d'Utilisation Courants

### Scénario 1: Commande Simple
```
1. Client scanne QR
2. Admin voit commande "En attente"
3. Admin clique [Préparer]
4. Cuisine prépare
5. Admin double-click table sur map → Prête
6. Admin double-click table → Servie
7. Admin double-click table → En attente de paiement
8. Client paie
9. Admin clique [Terminée]
✓ Commande dans revenus
```

### Scénario 2: Annulation
```
1. Client commande
2. Admin clique [Annuler]
3. Commande = Annulée
✗ N'affecte pas les revenus
```

### Scénario 3: Correction
```
1. Commande en "Prête"
2. Admin remarque erreur
3. Admin clique [Retour] → En préparation
4. Cuisine refait le plat
5. Admin continue normalement
```

## Dépannage

| Problème | Cause Possible | Solution |
|----------|-----------------|----------|
| Statut ne change pas | Token expiré | Reconnecter |
| Revenus ne montent pas | Commande pas "terminee" | Vérifier statut |
| Table pas coloriée | Pas de commande pour table | Vérifier table_number |
| Double-click en boucle | Auto-refresh trop rapide | Vérifier intervalle polling |

## Futures Améliorations

1. **Historique Statuts** : Tracer tous les changements de statut
2. **Timestamps** : created_at, prepared_at, served_at, paid_at
3. **Notes** : Ajouter des notes à chaque statut
4. **Notifications** : Alerter cuisine des nouvelles commandes
5. **Priorités** : VIP, Urgent, Normal
6. **Multi-table** : Accepter commandes sur plusieurs tables
