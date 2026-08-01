# Objectif 85

Application mobile React Native / Expo de suivi sportif et alimentaire.

## Fonctionnalités incluses

- page Aujourd'hui avec sélecteur des 7 jours ;
- repas suggérés et validation par case ;
- programme sportif quotidien ;
- objectif de 10 000 pas ;
- écran Suivi pour poids, tour de taille, eau, protéines, pas et sommeil ;
- graphiques simples sur les 30 derniers jours ;
- données stockées localement sur le téléphone.

## Démarrage

```bash
npm install
npx expo start
```

Scanner ensuite le QR code avec Expo Go.

## Builds iOS et Android

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

Un compte Apple Developer est requis pour publier sur l'App Store et un compte Google Play Console pour publier sur Google Play.
