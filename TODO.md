# TODO — QR-reservation

Etat et priorités (mise à jour automatique par l'équipe)

- Navbar dark-mode borders: ✅ terminé
- Test dark mode across app: 🔄 en cours
- Theme customization UI: ⏸️ à démarrer
- Persist theme backend (user/restaurant): ⏸️ à démarrer
- Fix admin customization color refresh: ⏸️ à démarrer
- KDS fixes: ✅ terminé


Fonctionnalités proposées (à prioriser)

- Notifications en temps réel (nouvelle commande, changements de statut)
- Gestion du Menu (CRUD produits, catégories, indisponibilité)
- Système de facturation amélioré (facture imprimable, paiements, pourboire)
- Historique des commandes (recherche, filtrage, réutilisation)
- Dashboard amélioré (temps moyen service, produits les plus vendus, heures de pointe)
- Système KDS (Kitchen Display System) — améliorer files/affichages
- Gestion multi-restaurants (scoping des données et UI)
- Réservations de tables (calendrier, QR confirmation)
- Système de fidélité (points, coupons)
- Support multi-langue & améliorations i18n
- Dark mode: thèmes par utilisateur + scheduler
- Branding: palette, logo, polices par restaurant
- Export / Import des personnalisations (JSON)
- Prévisualisation live des customizations (éditeur)
- Rollback / historique des personnalisations
- Accessibilité: contraste, tailles, ARIA


Tâches techniques / DevOps

- Ajouter tests unitaires front (Jest/RTL)
- Mettre en place CI (GitHub Actions)
- Documenter le déploiement (README)
- Automatiser build & start scripts


Notes rapides pour le debug CSS

- Après chaque changement CSS: hard refresh (Ctrl+F5)
- Si styles persistants: vérifier Service Worker / cache du navigateur
- Inspecter l'élément pour repérer le sélecteur exact appliqué


Prochaines actions proposées (choisir 1)

1. Valider la teinte finale `--bg-secondary` (donner hex si souhaité)
2. Implémenter la persistance backend du thème (PHP endpoint + DB)
3. Créer le panneau UI de personnalisation (React)

---
Si tu veux, je peux créer des issues GitHub depuis cette liste ou commencer l'une des actions ci-dessus — dis-moi laquelle prioriser.


