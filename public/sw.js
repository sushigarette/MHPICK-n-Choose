// Service worker de DESINSCRIPTION.
//
// Les versions precedentes interceptaient toutes les requetes en cache-first,
// sans versionnage ni nettoyage. Deux d'entre elles remplissaient un cache
// "mhpick-v1" contenant '/', c'est-a-dire index.html — le fichier qui designe
// le bundle. Les navigateurs concernes restaient donc epingles sur une version
// ancienne de l'application, indefiniment : les assets Vite etant haches et
// servis en immutable, l'ancien bundle resolvait encore parfaitement.
//
// Supprimer le fichier ne suffirait pas : un service worker deja installe
// continue de tourner. Il faut lui deployer un remplacant qui se desinscrive.
//
// Ce script ne touche QUE le Cache Storage. localStorage n'est pas concerne,
// donc les sessions Supabase sont preservees : personne n'est deconnecte.
//
// Aucun gestionnaire 'fetch' ici : ce service worker n'intercepte plus rien.

self.addEventListener('install', () => {
  // Ne pas attendre la fermeture des onglets ouverts pour prendre le relais.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Vider tous les caches, dans l'ordre : avant la desinscription,
      //    sinon le script peut etre arrete avant d'avoir termine.
      const noms = await caches.keys();
      await Promise.all(noms.map((nom) => caches.delete(nom)));

      // 2. Se retirer.
      await self.registration.unregister();

      // 3. Recharger les onglets ouverts pour qu'ils reprennent index.html
      //    depuis le reseau. Sans danger de boucle : plus aucun code
      //    n'appelle navigator.serviceWorker.register().
      const onglets = await self.clients.matchAll({ type: 'window' });
      for (const onglet of onglets) {
        onglet.navigate(onglet.url);
      }
    })()
  );
});
