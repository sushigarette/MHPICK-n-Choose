# 🎨 Animations de Chargement

Ce dossier contient les animations SVG et Lottie (JSON) utilisées pour les écrans de chargement.

## 📁 Structure

```
src/animations/
├── README.md                    # Ce fichier
├── spinner-1.svg               # Animation SVG 1 - Cercle rotatif
├── spinner-2.svg               # Animation SVG 2 - Points clignotants
├── spinner-3.svg               # Animation SVG 3 - Barres rotatives
├── spinner-4.svg               # Animation SVG 4 - Cercle pulsant
├── spinner-5.svg               # Animation SVG 5 - Carrés imbriqués
├── 8-bit Cat.json              # Animation Lottie 1
├── Bouncing Fruits.json        # Animation Lottie 2
├── Cute Doggie.json            # Animation Lottie 3
├── Meditation.json             # Animation Lottie 4
├── Pixel Duck.json             # Animation Lottie 5
├── Ufo lottie animation.json   # Animation Lottie 6
└── [vos-fichiers]              # Vos animations personnalisées
```

## ➕ Comment ajouter vos animations

### **Animations SVG :**
1. **Placez vos fichiers SVG** dans ce dossier
2. **Nommez-les** avec un format cohérent (ex: `mon-animation.svg`)
3. **Ajoutez le nom** dans le fichier `useLoadingAnimations.ts` :

```typescript
const svgAnimations = [
  'spinner-1',
  'spinner-2',
  'spinner-3',
  'spinner-4',
  'spinner-5',
  'mon-animation', // ← Votre nouvelle animation SVG
];
```

### **Animations Lottie (JSON) :**
1. **Placez vos fichiers JSON** dans ce dossier
2. **Nommez-les** avec un format cohérent (ex: `mon-animation.json`)
3. **Ajoutez le nom** dans le fichier `useLoadingAnimations.ts` :

```typescript
const lottieAnimations = [
  '8-bit Cat',
  'Bouncing Fruits',
  'Cute Doggie',
  'Meditation',
  'Pixel Duck',
  'Ufo lottie animation',
  'mon-animation', // ← Votre nouvelle animation Lottie
];
```

## 🎯 Spécifications recommandées

- **Taille** : 40x40px (ou multiple)
- **Couleur** : Utilisez `currentColor` pour l'adaptation automatique
- **Animation** : Incluse dans le SVG avec `<animate>` ou CSS
- **Format** : SVG optimisé et léger

## 🚀 Utilisation

```tsx
import LoadingAdvanced from '@/components/LoadingAdvanced';

// Animation aléatoire (Lottie + SVG)
<LoadingAdvanced type="random" />

// Seulement SVG
<LoadingAdvanced type="svg" />

// Seulement Lottie
<LoadingAdvanced type="lottie" />
```

## ✨ Fonctionnalités

- **Rotation aléatoire** des animations
- **Changement automatique** toutes les 3 secondes
- **Tailles adaptatives** (sm, md, lg, xl)
- **Couleurs personnalisables**
- **Messages personnalisés**

## 🔧 Personnalisation

Vous pouvez modifier :
- La fréquence de changement (`changeInterval`)
- Les tailles disponibles
- Les couleurs par défaut
- Les messages d'affichage
