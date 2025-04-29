# Spécifications techniques

## 1. Vue d'ensemble
Cette documentation détaille les spécifications techniques pour le développement de l'API backend de l'application Flex Desk Reserve, qui gère les réservations de bureaux flexibles et de salles de réunion.

## 2. Architecture technique recommandée

### 2.1 Stack technique
- **Backend** : Node.js avec Express.js ou NestJS
- **Base de données** : PostgreSQL
- **ORM** : Prisma (recommandé) ou TypeORM
- **Authentification** : JWT (JSON Web Tokens)
- **Documentation API** : Swagger/OpenAPI
- **Tests** : Jest
- **Validation des données** : Zod ou Joi

### 2.2 Structure des dossiers recommandée
```
src/
├── controllers/    # Logique de contrôle des routes
├── services/      # Logique métier
├── models/        # Modèles de données
├── middlewares/   # Middlewares (auth, validation, etc.)
├── utils/         # Utilitaires
├── config/        # Configuration
└── routes/        # Définition des routes
```ee

## 3. Modèles de données

### 3.1 Utilisateurs (Users)
```typescript
interface User {
  id: string;
  email: string;
  password: string; // Hashé avec bcrypt
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Table SQL
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Ressources (Resources)
```typescript
interface Resource {
  id: string;
  type: 'desk' | 'room';
  name: string;     // ex: "bureau_flex_1" ou "salle_reunion_2"
  coordinates: {
    cx: number;     // Position X sur le plan
    cy: number;     // Position Y sur le plan
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Table SQL
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL UNIQUE,
  coordinate_x DECIMAL NOT NULL,
  coordinate_y DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Réservations (Reservations)
```typescript
interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  date: Date;
  startTime: string;    // Format "HH:mm"
  endTime: string;      // Format "HH:mm"
  status: 'active' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Table SQL
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_resource_timespan UNIQUE (resource_id, date, start_time, end_time)
);
```

## 4. Endpoints API

### 4.1 Authentification

#### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response 200
{
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }
}

// Response 401
{
  error: "Invalid credentials"
}
```

#### POST /api/auth/logout
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  success: true
}
```

### 4.2 Ressources

#### GET /api/resources
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  resources: Resource[]
}

// Paramètres de filtrage optionnels
?type=desk|room
?isActive=true|false
```

#### GET /api/resources/:id
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  resource: Resource
}

// Response 404
{
  error: "Resource not found"
}
```

### 4.3 Réservations

#### POST /api/reservations
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Request
{
  resourceId: string;
  date: string;        // Format: "YYYY-MM-DD"
  startTime: string;   // Format: "HH:mm"
  endTime: string;     // Format: "HH:mm"
}

// Response 201
{
  reservation: Reservation
}

// Response 400
{
  error: "Invalid reservation request",
  details: string[]
}

// Response 409
{
  error: "Resource already booked for this time period"
}
```

#### GET /api/reservations/user
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  reservations: Reservation[]
}

// Paramètres de filtrage optionnels
?status=active|cancelled
?fromDate=YYYY-MM-DD
?toDate=YYYY-MM-DD
```

#### GET /api/reservations/date/:date
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  reservations: Reservation[]
}
```

#### DELETE /api/reservations/:id
```typescript
// Headers requis
Authorization: "Bearer {token}"

// Response 200
{
  success: true
}

// Response 403
{
  error: "Not authorized to cancel this reservation"
}
```

## 5. Règles métier

### 5.1 Validation des réservations
- Une ressource ne peut pas être réservée deux fois sur le même créneau
- Les réservations ne peuvent pas être faites dans le passé
- Les créneaux horaires sont par tranches d'une heure (8:00, 9:00, etc.)
- Heures de réservation possibles : 8:00 - 20:00
- Durée minimale de réservation : 1 heure
- Durée maximale de réservation : 12 heures

### 5.2 Restrictions utilisateurs
- Un utilisateur ne peut pas avoir plus de 5 réservations actives simultanément
- Les annulations doivent être faites au moins 1 heure avant le début de la réservation
- Seul le créateur de la réservation ou un admin peut l'annuler

### 5.3 Droits administrateurs
- Peuvent voir toutes les réservations
- Peuvent annuler n'importe quelle réservation
- Peuvent créer/modifier/supprimer des ressources
- Peuvent gérer les utilisateurs

## 6. Sécurité

### 6.1 Authentification
- Utilisation de JWT avec expiration (8h recommandé)
- Refresh token pour renouvellement automatique
- Stockage sécurisé des mots de passe (bcrypt)

### 6.2 Protection des routes
- Rate limiting : 100 requêtes par IP par 15 minutes
- Protection CSRF
- Validation des données entrantes
- Sanitization des données sortantes

### 6.3 Headers de sécurité
```typescript
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
}
```

## 7. Gestion des erreurs

### 7.1 Format standard des erreurs
```typescript
{
  error: string;
  code: string;
  details?: string[];
  timestamp: string;
}
```

### 7.2 Codes HTTP utilisés
- 200 : Succès
- 201 : Création réussie
- 400 : Erreur de validation
- 401 : Non authentifié
- 403 : Non autorisé
- 404 : Ressource non trouvée
- 409 : Conflit
- 429 : Trop de requêtes
- 500 : Erreur serveur

## 8. Tests requis

### 8.1 Tests unitaires
- Validation des données
- Logique métier
- Formatage des réponses

### 8.2 Tests d'intégration
- Flux de réservation complet
- Authentification
- Gestion des conflits de réservation

### 8.3 Tests de charge
- 100 utilisateurs simultanés
- 1000 réservations par heure
- Temps de réponse < 200ms

## 9. Monitoring

### 9.1 Logs requis
- Connexions utilisateurs
- Créations/modifications/annulations de réservations
- Erreurs serveur
- Performances API

### 9.2 Métriques à suivre
- Temps de réponse des endpoints
- Taux d'erreurs
- Nombre de réservations par jour
- Taux d'utilisation des ressources

## 10. Documentation
- Documentation Swagger/OpenAPI complète
- Exemples de requêtes pour chaque endpoint
- Description des codes d'erreur
- Guide de déploiement 