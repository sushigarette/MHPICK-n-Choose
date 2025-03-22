# MHPick - Application de Réservation

## Structure du Projet

### Fichiers Racine
- `index.html` : Point d'entrée HTML de l'application
- `vite.config.ts` : Configuration de Vite (bundler)
- `package.json` : Gestion des dépendances et scripts npm
- `tsconfig.json` : Configuration principale TypeScript
- `tsconfig.app.json` : Configuration TypeScript spécifique à l'application
- `tsconfig.node.json` : Configuration TypeScript pour l'environnement Node
- `tailwind.config.ts` : Configuration de Tailwind CSS
- `postcss.config.js` : Configuration de PostCSS
- `eslint.config.js` : Configuration du linter ESLint
- `components.json` : Configuration des composants shadcn/ui

### Dossier `/src`

#### Composants (`/src/components`)
- `/auth` : Composants liés à l'authentification
- `/floorplan` : Composants pour l'affichage des plans
- `/layout` : Composants structurels (Header, Layout)
- `/reservation` : Composants de gestion des réservations
- `/ui` : Composants UI réutilisables (shadcn/ui)

#### Contextes (`/src/context`)
- `AuthContext.tsx` : Gestion de l'état d'authentification global

#### Pages (`/src/pages`)
- `Index.tsx` : Page d'accueil
- `Login.tsx` : Page de connexion
- `Register.tsx` : Page d'inscription
- `Dashboard.tsx` : Tableau de bord utilisateur
- `ProfilePage.tsx` : Gestion du profil utilisateur
- `Reservations.tsx` : Gestion des réservations
- `NotFound.tsx` : Page 404

#### Autres Dossiers
- `/hooks` : Hooks React personnalisés
- `/lib` : Utilitaires et fonctions partagées

#### Fichiers Principaux
- `App.tsx` : Configuration des routes et structure principale
- `main.tsx` : Point d'entrée React
- `index.css` : Styles globaux et configuration Tailwind
- `App.css` : Styles spécifiques à l'application

## Technologies Utilisées

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router DOM
- React Query
- Framer Motion

### Outils de Développement
- Vite
- ESLint
- PostCSS
- TypeScript

## Installation

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Construction pour production
npm run build

# Prévisualisation de la production
npm run preview
```

## Fonctionnalités Principales

### Authentification
- Connexion/Inscription
- Gestion du profil utilisateur
- Protection des routes

### Réservations
- Création de réservations
- Consultation des réservations
- Modification/Annulation

### Interface Utilisateur
- Design responsive
- Thème personnalisé
- Animations fluides
- Composants réutilisables

## Architecture

### Gestion d'État
- Contexte React pour l'authentification
- React Query pour les requêtes API
- État local pour les composants

### Routage
- Routes publiques et protégées
- Navigation fluide
- Gestion des redirections

### Styles
- Utilisation de Tailwind CSS
- Composants UI personnalisables
- Support des thèmes

## Contribution

1. Fork du projet
2. Création d'une branche (`git checkout -b feature/AmazingFeature`)
3. Commit des changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Création d'une Pull Request

## Licence

[MIT](https://choosealicense.com/licenses/mit/)
