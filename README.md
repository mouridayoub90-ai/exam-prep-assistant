# EduAI Prep - Assistant Intelligent de Préparation aux Examens (Projet PFE)

EduAI Prep est un assistant académique intelligent local-first conçu pour aider les étudiants à réviser leurs examens de manière interactive. L'application combine l'architecture de **Recherche Documentaire Augmentée (RAG)** et des algorithmes de **Traitement du Langage Naturel (NLP)** pour offrir des explications personnalisées, générer des quiz sur-mesure et évaluer automatiquement les réponses rédigées.

## 🌐 Déploiement en ligne
L'application est hébergée et accessible en ligne à l'adresse suivante :
👉 **[https://eduaiprep.netlify.app/](https://eduaiprep.netlify.app/)**

---

## ✨ Fonctionnalités Clés

### 1. 📂 Importation Dynamique de Documents
- **Chargement de Cours** : Glissez-déposez des fichiers (`.txt`, `.md`, `.json`) ou copiez-collez votre texte de cours directement sur le tableau de bord.
- **Indexation Automatique** : Le système découpe instantanément le texte en paragraphes pertinents pour alimenter le moteur RAG.

### 2. 🎓 Tuteur Académique Virtuel (Sophia)
- **Chatbot Contextuel** : Sophia répond à vos questions en se basant exclusivement sur le cours que vous avez importé.
- **Requêtes Hybrides** : Fonctionne 100% hors-ligne localement, ou en ligne avec l'API Gemini si configurée dans les paramètres.
- **Auto-vérification** : Sophia conclut chaque explication par une question ciblée pour s'assurer que vous avez compris.
- **Raccourcis Dynamiques** : Les questions suggérées s'adaptent automatiquement aux concepts clés détectés dans votre document.

### 3. 📝 Générateur de Quiz Intelligent
- **Génération Contextuelle** : Crée automatiquement des QCM de 5 questions basés sur votre document de cours (en ligne via Gemini ou localement via extraction de définitions NLP).
- **Évaluation Sémantique Automatique** : Évalue les réponses aux questions ouvertes sur 20 points en calculant la similarité cosinus TF-IDF et la présence de mots-clés obligatoires.

### 4. 🗂️ Fiches de Révision Dynamiques (Flashcards)
- Génère automatiquement des fiches recto/verso à partir des définitions extraites de votre cours.
- Comporte un bouton de filtrage dynamique **"Cours Importé"** pour travailler spécifiquement sur vos fiches personnalisées.

### 5. 📊 Tableau de Bord et Analyses
- Suivi de votre score moyen, de l'XP accumulée et de la répartition de votre maîtrise par matière.
- Personnalisation complète de votre profil d'étudiant.

---

## 🛠️ Architecture Technique

L'application est construite en **Vanilla HTML, CSS et JavaScript** (Local-first) :
- **Prétraitement NLP** : Tokenisation, normalisation (suppression des accents) et filtrage des mots-vides en JS pur.
- **Recherche RAG** : Modèle vectoriel TF-IDF et calcul de similarité cosinus client-side.
- **Évaluation Sémantique** : Micro-corpus généré à la volée pour comparer s'émantiquement la réponse de l'étudiant à la réponse modèle.
- **Visualisations** : Graphiques de progression dynamiques avec Chart.js.

---

## 🚀 Utilisation en Local

Pour lancer l'application sur votre machine locale sans installer de dépendances complexes :

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/mouridayoub90-ai/exam-prep-assistant.git
   ```
2. Ouvrez un terminal dans le dossier et démarrez un serveur de fichiers statiques (ex: avec Python) :
   ```bash
   python -m http.server 3000
   ```
3. Ouvrez votre navigateur sur `http://localhost:3000`.
