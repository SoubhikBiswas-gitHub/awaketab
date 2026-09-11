import type { ILocaleHomeCopy } from './types';

export const fr: ILocaleHomeCopy = {
  whatItDoes: [
    "AwakeTab utilise l’API Wake Lock du navigateur tant que cet onglet est visible, et le statut n’affirme l’éveil qu’après confirmation du navigateur. Choisissez une durée — de 15 minutes à 4 heures, une durée personnalisée allant jusqu’à sept jours, ou une heure précise — et l’écran cesse de s’assombrir, de se mettre en veille et d’afficher l’écran de verrouillage. La pastille affiche Écran allumé uniquement lorsque le navigateur détient réellement le verrou. Masquez cet onglet et le navigateur reprend le verrou : la pastille passe alors à En pause — onglet masqué et le minuteur s’arrête jusqu’à votre retour.",
    "Aucun compte, aucun téléchargement et aucune extension ne sont nécessaires : l’outil, c’est cette page. Les réglages, la session en cours et sept jours de statistiques restent dans ce navigateur. Rien n’est envoyé, sauf si vous laissez activé le témoin d’utilisation optionnel. Cette page ne charge aucun script tiers ni aucune police web, ce qui la garde rapide sur téléphone et lui permet de fonctionner hors ligne après la première visite. L’en-tête propose une option d’installation si vous la voulez sur un écran d’accueil ou un dock ; l’application installée peut alors jouer un carillon et vous avertir lorsqu’une session se termine.",
  ],
  howItWorks: [
    "Vous choisissez une durée. Une durée prédéfinie, une durée personnalisée ou une heure précise démarre une session. Les mêmes choix tiennent en une touche : 1 à 6 pour les durées prédéfinies, 0 pour aucune heure de fin, U pour une heure précise et Espace pour démarrer ou arrêter.",
    "Le navigateur est sollicité pour un verrou d’éveil d’écran. AwakeTab appelle la Screen Wake Lock API — le même mécanisme qu’utilise un lecteur vidéo. Le navigateur peut accepter, refuser ou reprendre le verrou plus tard ; ces trois réponses sont affichées au fur et à mesure qu’elles surviennent.",
    "Le minuteur suit le verrou, pas l’horloge. Le compte à rebours ne s’écoule que pendant que le verrou est détenu, et chaque calcul s’appuie sur l’heure système, si bien qu’un ordinateur portable mis en veille prolongée retrouve un chiffre honnête à son réveil. Une fois le temps écoulé, un carillon retentit et vous pouvez choisir de prolonger ou d’arrêter.",
  ],
  honestLimits: [
    "Un onglet masqué ne peut pas détenir de verrou d’éveil. Changer d’application, réduire la fenêtre ou changer d’onglet met la session en pause. C’est une règle imposée par la plateforme. Pour garder l’écran allumé derrière d’autres fenêtres, utilisez l’extension AwakeTab pour Chrome et Edge.",
    "Fermer le capot met tout de même l’ordinateur en veille. Aucune page web ni extension ne peut changer cela. Il faut un réglage du système d’exploitation, un écran externe ou un outil natif.",
    "L’économiseur de batterie l’emporte toujours. Le mode économie d’énergie de l’iPhone impose un verrouillage automatique après 30 secondes ; l’économiseur de batterie d’Android et de Windows peut refuser la demande. Vous obtenez alors Bloqué — voici la solution, avec la cause indiquée.",
    "Cela ne touche pas votre statut de présence. La présence sur Teams, Slack et Zoom suit l’inactivité du clavier et de la souris, pas l’état de l’écran. Un verrou d’éveil ne vous maintiendra pas « disponible », et AwakeTab ne simule jamais de frappe ni de mouvement de souris pour le falsifier.",
    "La veille de l’écran n’est pas la veille du système. Un verrou d’éveil ne retient que l’écran. Dans nos tests, Chromium sous Windows a aussi retardé la mise en veille pour inactivité ; pas sous macOS. Pour garder l’ordinateur éveillé avec l’écran éteint, utilisez un outil natif.",
    "Les autres logiciels gardent leurs propres règles. Une déconnexion bancaire, une application de surveillance d’examen, un moniteur qui s’éteint en cas de perte de signal ou une politique de verrouillage d’écran d’entreprise échappent tous à la portée d’un verrou d’éveil.",
  ],
};
