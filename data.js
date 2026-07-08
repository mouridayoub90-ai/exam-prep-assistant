// Base de connaissances et de quiz pour l'assistant d'études (PFE)
// Contient les documents pour le RAG, les quiz (QCM & ouverts) et les flashcards

const COURS_DATABASE = [
  // INFORMATIQUE
  {
    id: "info_http_1",
    subject: "informatique",
    title: "Le protocole HTTP (HyperText Transfer Protocol)",
    content: "HTTP est un protocole de la couche application du modèle OSI, fonctionnant sur le port 80 en TCP. Il utilise un modèle client-serveur où le client envoie des requêtes et le serveur renvoie des réponses. HTTP est un protocole sans état (stateless), ce qui signifie que chaque transaction est indépendante des précédentes. Pour maintenir l'état, on utilise des cookies ou des sessions. HTTP/1.1 a introduit les connexions persistantes (keep-alive) pour éviter d'ouvrir une connexion TCP pour chaque ressource.",
    source: "Architecture des Réseaux - Section 3.1"
  },
  {
    id: "info_http_2",
    subject: "informatique",
    title: "Méthodes et codes de statut HTTP",
    content: "Les requêtes HTTP utilisent des méthodes comme GET (récupération de ressource), POST (envoi de données pour création), PUT (mise à jour complète) et DELETE (suppression). Les réponses du serveur comportent un code de statut de 3 chiffres : 200 OK (succès), 301/302 Redirect (redirection), 400 Bad Request (requête mal formée), 403 Forbidden (accès refusé), 404 Not Found (ressource introuvable), et 500 Internal Server Error (erreur serveur).",
    source: "Architecture des Réseaux - Section 3.2"
  },
  {
    id: "info_sql_1",
    subject: "informatique",
    title: "Introduction aux bases de données relationnelles et SQL",
    content: "Le langage SQL (Structured Query Language) permet d'interagir avec les bases de données relationnelles (SGBDR) comme MySQL, PostgreSQL ou Oracle. Les données sont stockées dans des tables composées de colonnes (champs) et de lignes (enregistrements). La clé primaire (Primary Key) identifie de manière unique chaque ligne, tandis que la clé étrangère (Foreign Key) établit des relations d'intégrité référentielle entre les tables.",
    source: "Bases de Données Relationnelles - Chapitre 1"
  },
  {
    id: "info_sql_2",
    subject: "informatique",
    title: "Requêtes de sélection et jointures SQL",
    content: "La clause SELECT permet de spécifier les colonnes à récupérer, FROM indique la table, WHERE applique des conditions de filtrage, et ORDER BY trie les résultats. Les jointures (INNER JOIN, LEFT JOIN, RIGHT JOIN) permettent de combiner les lignes de plusieurs tables basées sur une clé commune. Les fonctions d'agrégation comme SUM, AVG, COUNT, MIN et MAX permettent de réaliser des calculs statistiques, souvent groupés à l'aide de GROUP BY et filtrés avec HAVING.",
    source: "Bases de Données Relationnelles - Chapitre 2"
  },
  {
    id: "info_algo_1",
    subject: "informatique",
    title: "Complexité algorithmique et Notation Big O",
    content: "La complexité d'un algorithme mesure les ressources (temps d'exécution et espace mémoire) consommées en fonction de la taille n de l'entrée. On utilise la notation Big O (ex: O(1) pour temps constant, O(log n) pour logarithmique, O(n) pour linéaire, O(n log n) pour quasi-linéaire, O(n²) pour quadratique). Par exemple, la recherche dichotomique a une complexité temporelle de O(log n), alors que la recherche linéaire est en O(n). Les algorithmes de tri comme le Tri Fusion (Merge Sort) s'exécutent en O(n log n) dans le pire des cas.",
    source: "Algorithmique et Structures de Données - Chapitre 1"
  },

  // MATHEMATIQUES
  {
    id: "maths_deriv_1",
    subject: "mathematics",
    title: "Le concept de Dérivée et de Taux de Variation",
    content: "La dérivée d'une fonction f en un point a mesure le taux de variation instantané de f en ce point. Géométriquement, f'(a) représente la pente de la tangente à la courbe de f au point d'abscisse a. La formule de définition de la dérivée est la limite quand h tend vers 0 de [f(a+h) - f(a)] / h. Si cette limite existe, la fonction est dite dérivable en a. Les formules usuelles incluent : (x^n)' = n*x^(n-1), (e^x)' = e^x, et (ln x)' = 1/x.",
    source: "Analyse Mathématique - Dérivabilité"
  },
  {
    id: "maths_deriv_2",
    subject: "mathematics",
    title: "Applications des dérivées et optimisation",
    content: "L'étude du signe de la dérivée première f'(x) permet de déterminer les variations d'une fonction : si f'(x) > 0 sur un intervalle, f y est strictement croissante ; si f'(x) < 0, f y est strictement décroissante. Les points où la dérivée s'annule en changeant de signe correspondent à des extremums locaux (maximums ou minimums). La dérivée seconde f''(x) renseigne sur la concavité de la courbe (concave si f'' < 0, convexe si f'' > 0) et les points d'inflexion où la concavité change de sens.",
    source: "Analyse Mathématique - Optimisation"
  },
  {
    id: "maths_matrix_1",
    subject: "mathematics",
    title: "Matrices, Déterminants et Systèmes Linéaires",
    content: "Une matrice est un tableau rectangulaire de nombres organisé en lignes et colonnes. Pour multiplier deux matrices A et B, le nombre de colonnes de A doit être égal au nombre de lignes de B. Le déterminant d'une matrice carrée 2x2 [a, b; c, d] est calculé par ad - bc. Si le déterminant d'une matrice A est non nul, la matrice est inversible (notée A^-1) et le système linéaire associé AX = B admet une solution unique donnée par X = A^-1 * B.",
    source: "Algèbre Linéaire - Cours Élémentaire"
  },

  // PHYSIQUE
  {
    id: "phys_newton_1",
    subject: "physique",
    title: "Les Trois Lois du Mouvement de Newton",
    content: "La mécanique classique repose sur les trois lois de Newton. La Première Loi (Principe d'inertie) énonce que tout corps persévère dans son état de repos ou de mouvement rectiligne uniforme si les forces qui s'exercent sur lui se compensent. La Deuxième Loi (Principe fondamental de la dynamique) formule que la somme des forces extérieures appliquées à un point matériel est égale au produit de sa masse par son accélération (F = m*a). La Troisième Loi (Principe des actions réciproques) affirme que si un corps A exerce une force sur un corps B, le corps B exerce une force égale et opposée sur le corps A.",
    source: "Physique Newtonienne - Dynamique"
  },
  {
    id: "phys_thermo_1",
    subject: "physique",
    title: "Premier Principe de la Thermodynamique",
    content: "Le premier principe de la thermodynamique est le principe de conservation de l'énergie. Il stipule que pour tout système fermé évoluant d'un état initial à un état final, la variation d'énergie interne dU est égale à la somme des transferts d'énergie avec le milieu extérieur sous forme de travail W et de chaleur Q, soit dU = W + Q. L'énergie globale de l'univers est constante, elle ne peut être ni créée ni détruite, seulement convertie d'une forme à une autre.",
    source: "Thermodynamique - Principes fondamentaux"
  },

  // SVT
  {
    id: "svt_adn_1",
    subject: "svt",
    title: "Structure moléculaire de l'ADN",
    content: "L'ADN (Acide Désoxyribonucléique) est le support de l'information génétique chez tous les êtres vivants. Il est structuré en une double hélice composée de deux brins antiparallèles reliés par des liaisons hydrogène. Chaque brin est un polymère de nucléotides. Un nucléotide comprend un groupement phosphate, un sucre (le désoxyribose) et une base azotée parmi quatre possibles : l'Adénine (A), la Thymine (T), la Cytosine (C) et la Guanine (G). Les liaisons se font toujours par complémentarité stricte : A avec T et C avec G.",
    source: "Biologie Moléculaire - Génétique"
  },
  {
    id: "svt_adn_2",
    subject: "svt",
    title: "Transcription et Traduction : La synthèse des protéines",
    content: "L'expression des gènes se déroule en deux étapes principales : la transcription et la traduction. La transcription a lieu dans le noyau, où l'ADN est copié sous forme d'ARN messager (ARNm) par l'enzyme ARN polymérase (la base Thymine est remplacée par l'Uracile U). L'ARNm migre ensuite dans le cytoplasme. Là, lors de la traduction, les ribosomes lisent le message par codons (groupes de 3 nucléotides) et assemblent les acides aminés correspondants à l'aide des ARN de transfert (ARNt), formant ainsi une protéine fonctionnelle selon le code génétique universel.",
    source: "Biologie Moléculaire - Expression Génique"
  }
];

const QUIZ_DATABASE = [
  // INFORMATIQUE
  {
    id: "q_info_1",
    subject: "informatique",
    difficulty: "easy",
    type: "qcm",
    question: "Quelle méthode HTTP est principalement utilisée pour récupérer des données depuis un serveur ?",
    options: ["POST", "PUT", "GET", "DELETE"],
    correctAnswer: 2,
    explanation: "La méthode GET est conçue uniquement pour demander et récupérer une ressource spécifique depuis le serveur, sans modifier l'état de celle-ci.",
    hint: "C'est l'équivalent anglais de 'obtenir'."
  },
  {
    id: "q_info_2",
    subject: "informatique",
    difficulty: "medium",
    type: "qcm",
    question: "Quelle est la complexité temporelle dans le pire des cas d'une recherche dichotomique (binary search) sur un tableau trié de taille n ?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: 1,
    explanation: "La recherche dichotomique divise par deux la taille de l'espace de recherche à chaque étape, d'où une complexité logarithmique O(log n).",
    hint: "À chaque étape, on divise la taille du problème par 2. Pensez à l'opération mathématique inverse de l'exponentielle."
  },
  {
    id: "q_info_3",
    subject: "informatique",
    difficulty: "hard",
    type: "open",
    question: "Expliquez brièvement pourquoi le protocole HTTP est qualifié de protocole 'sans état' (stateless) et comment les applications web modernes contournent cette limitation.",
    options: null,
    correctAnswer: ["sans etat", "stateless", "cookie", "session", "independante", "token", "jwt", "maintenir"],
    explanation: "HTTP est dit 'sans état' car le serveur ne conserve aucune mémoire des requêtes passées du client ; chaque requête est traitée de façon totalement indépendante. Pour contourner cela, les applications utilisent des mécanismes de persistance d'état côté client ou serveur tels que les cookies, les sessions serveur ou des jetons d'authentification (tokens, JWT) envoyés à chaque requête.",
    hint: "Réfléchissez au fait que chaque requête est isolée, et mentionnez le mot magique qui commence par 'c' pour stocker des données dans le navigateur."
  },

  // MATHEMATIQUES
  {
    id: "q_maths_1",
    subject: "mathematics",
    difficulty: "easy",
    type: "qcm",
    question: "Quelle est la dérivée de la fonction f(x) = e^x ?",
    options: ["f'(x) = x * e^(x-1)", "f'(x) = 1/x", "f'(x) = e^x", "f'(x) = -e^x"],
    correctAnswer: 2,
    explanation: "La fonction exponentielle e^x est sa propre dérivée sur l'ensemble des réels R.",
    hint: "C'est une fonction unique qui ne change pas du tout lorsqu'elle est dérivée."
  },
  {
    id: "q_maths_2",
    subject: "mathematics",
    difficulty: "medium",
    type: "open",
    question: "Géométriquement, que représente la dérivée f'(a) d'une fonction f en un point a de sa courbe représentative ?",
    options: null,
    correctAnswer: ["pente", "tangente", "coefficient directeur", "droite", "variation"],
    explanation: "La dérivée f'(a) représente la pente (ou coefficient directeur) de la droite tangente à la courbe de la fonction f au point d'abscisse a.",
    hint: "Pensez à une droite effleurant la courbe en ce point unique, et à la mesure de son inclinaison."
  },

  // PHYSIQUE
  {
    id: "q_phys_1",
    subject: "physique",
    difficulty: "medium",
    type: "qcm",
    question: "Selon la seconde loi de Newton, quelle est la formule reliant la somme des forces F, la masse m et l'accélération a ?",
    options: ["F = m / a", "F = m * a", "F = 1/2 * m * a²", "F = m * a²"],
    correctAnswer: 1,
    explanation: "La deuxième loi de Newton s'exprime par la formule vectorielle somme(F) = m * a, signifiant que la force nette appliquée est proportionnelle à l'accélération générée.",
    hint: "La force est le produit de la masse par la variation de vitesse temporelle."
  },
  {
    id: "q_phys_2",
    subject: "physique",
    difficulty: "hard",
    type: "open",
    question: "Énoncez le premier principe de la thermodynamique en précisant la formule physique de la variation d'énergie interne pour un système fermé.",
    options: null,
    correctAnswer: ["dU = W + Q", "conservation", "energie", "chaleur", "travail", "interne"],
    explanation: "Le premier principe stipule la conservation de l'énergie. Pour un système fermé, la variation d'énergie interne dU est égale à la somme du travail W et de la chaleur Q échangés avec l'extérieur : dU = W + Q.",
    hint: "La variation d'énergie interne (dU) est égale à la somme des transferts d'énergie sous forme de travail (W) et de chaleur (Q)."
  },

  // SVT
  {
    id: "q_svt_1",
    subject: "svt",
    difficulty: "easy",
    type: "qcm",
    question: "Quelle base azotée s'apparie toujours avec la Thymine (T) dans la structure de l'ADN double brin ?",
    options: ["Cytosine (C)", "Guanine (G)", "Adénine (A)", "Uracile (U)"],
    correctAnswer: 2,
    explanation: "Dans l'ADN, l'Adénine (A) forme toujours deux liaisons hydrogène avec la Thymine (T), tandis que la Cytosine (C) s'associe à la Guanine (G).",
    hint: "C'est la base désignée par la lettre A."
  },
  {
    id: "q_svt_2",
    subject: "svt",
    difficulty: "medium",
    type: "open",
    question: "Décrivez brièvement le rôle du ribosome dans le processus d'expression des gènes.",
    options: null,
    correctAnswer: ["traduction", "arnm", "proteine", "acide amine", "codon", "synthese"],
    explanation: "Le ribosome est l'organite responsable de la traduction de l'ARN messager en protéine. Il parcourt l'ARNm codon par codon et assemble les acides aminés correspondants grâce aux ARNt.",
    hint: "Il intervient dans le cytoplasme après la transcription pour fabriquer des protéines."
  }
];

const REVISION_CARDS = [
  {
    subject: "informatique",
    front: "Que signifie l'acronyme SQL ?",
    back: "Structured Query Language. C'est le langage standard de programmation pour la gestion et le requêtage de bases de données relationnelles."
  },
  {
    subject: "informatique",
    front: "Quelle est la différence entre HTTP et HTTPS ?",
    back: "HTTPS est la version sécurisée de HTTP. Il utilise le protocole de chiffrement TLS/SSL (sur le port 443 en TCP) pour chiffrer les requêtes et réponses, garantissant confidentialité et authenticité des données échangées."
  },
  {
    subject: "mathematics",
    front: "Formule de la dérivée d'un produit (u * v)",
    back: "(u * v)' = u' * v + u * v'. C'est une formule essentielle pour dériver des fonctions composées de multiplications."
  },
  {
    subject: "mathematics",
    front: "Qu'est-ce qu'une matrice identité (notée I) ?",
    back: "C'est une matrice carrée comportant des 1 sur la diagonale principale et des 0 partout ailleurs. Elle joue le rôle d'élément neutre pour la multiplication matricielle : A * I = I * A = A."
  },
  {
    subject: "physique",
    front: "Quelle est l'unité internationale de l'énergie et du travail ?",
    back: "Le Joule (symbole J). Un Joule correspond au travail d'une force d'un Newton dont le point d'application se déplace d'un mètre dans la direction de la force."
  },
  {
    subject: "svt",
    front: "Qu'est-ce qu'un codon ?",
    back: "Un codon est un triplet de nucléotides sur l'ARN messager codant pour un acide aminé spécifique (ou marquant la fin de la traduction avec un codon Stop). Il y a 64 codons possibles pour 20 acides aminés."
  }
];

const ADVICE_TEMPLATES = [
  "Conseil RAG : N'hésitez pas à poser des questions techniques précises au Tuteur Virtuel. Le moteur RAG recherchera automatiquement les passages pertinents dans votre cours avant de synthétiser la réponse.",
  "Conseil NLP : Pour les questions ouvertes, concentrez-vous sur l'utilisation des termes scientifiques appropriés. L'évaluateur automatique analyse la sémantique de vos réponses et pas seulement la syntaxe exacte !",
  "Conseil Révision : Réalisez un quiz de niveau 'Facile' dans une nouvelle matière pour débloquer de l'XP et obtenir des fiches de révision adaptées.",
  "Conseil IA : Si vous disposez d'une clé API Gemini, activez-la dans les Paramètres pour débloquer des explications hyper-détaillées et des générations de quiz illimitées !"
];

const EXAMPLE_DOCUMENTS = {
  http: `Le protocole HTTP (HyperText Transfer Protocol) est un protocole de la couche application du modèle OSI. Il fonctionne généralement sur le port 80 en TCP. Il utilise un modèle client-serveur : le client (navigateur) envoie des requêtes, et le serveur web renvoie des réponses correspondantes.
HTTP est qualifié de protocole 'sans état' (stateless) car chaque transaction est traitée indépendamment sans mémoire des requêtes précédentes.
Pour contourner cette absence de mémoire, les applications web modernes utilisent des cookies ou des jetons de session (sessions, JWT) stockés côté client et transmis à chaque requête.
Les méthodes HTTP définissent l'action demandée. La méthode GET est utilisée pour récupérer des ressources sans effet secondaire. La méthode POST soumet des données pour créer une ressource.
La méthode PUT permet de mettre à jour complètement une résonance ou ressource existante, et la méthode DELETE supprime la ressource spécifiée.
Les codes de statut HTTP indiquent le résultat de la requête : 200 (OK - succès), 301/302 (Redirections), 400 (Bad Request - requête invalide), 403 (Forbidden - accès interdit), 404 (Not Found - ressource introuvable), et 500 (Internal Server Error - erreur interne du serveur).`,
  
  newton: `La dynamique classique repose sur les trois lois fondamentales du mouvement formulées par Isaac Newton.
La Première Loi de Newton, aussi appelée le principe d'inertie, stipule que tout corps conserve son état de repos ou de mouvement rectiligne uniforme à moins qu'une force extérieure n'agisse sur lui. Cela signifie que sans force nette, la vitesse reste constante.
La Deuxième Loi de Newton (principe fondamental de la dynamique) relie la force, la masse et l'accélération. Elle s'exprime par la relation mathématique F = m * a, où F est la somme vectorielle des forces appliquées, m est la masse du corps et a est son accélération.
La Troisième Loi de Newton, ou principe des actions réciproques, énonce que si un corps A exerce une force sur un corps B, le corps B exerce simultanément une force d'égale intensité mais de sens opposé sur le corps A (F_A/B = -F_B/A).
En physique thermodynamique, le Premier Principe stipule la conservation de l'énergie dans les systèmes fermés. La variation d'énergie interne dU est égale à la somme du travail W et de la chaleur Q échangés avec l'extérieur, d'où la relation dU = W + Q.`,
  
  adn: `L'ADN (Acide Désoxyribonucléique) est le support universel de l'information génétique chez les êtres vivants. Sa structure en double hélice est constituée de deux brins antiparallèles reliés par des liaisons hydrogène.
Chaque brin d'ADN est un polymère de nucléotides, contenant un groupement phosphate, un sucre (désoxyribose) et une base azotée. Les quatre bases sont l'Adénine (A), la Thymine (T), la Cytosine (C) et la Guanine (G).
Les liaisons entre les brins d'ADN se font par complémentarité de bases : l'Adénine s'apparie toujours avec la Thymine (A-T) par deux liaisons hydrogène, et la Cytosine s'associe à la Guanine (C-G) par trois liaisons hydrogène.
L'expression génique comporte la transcription, au cours de laquelle l'enzyme ARN polymérase copie un brin d'ADN en ARN messager (ARNm) dans le noyau, en remplaçant la Thymine par l'Uracile (U).
La traduction se déroule ensuite dans le cytoplasme, où les ribosomes décodent l'ARNm par codons (triplets de nucléotides) et assemblent les acides aminés en chaîne peptidique pour former une protéine.`,
  
  matrix: `Une matrice est un tableau ordonné de nombres disposés en lignes et en colonnes. En algèbre linéaire, la multiplication de deux matrices n'est possible que si le nombre de colonnes de la première est égal au nombre de lignes de la seconde.
Le déterminant d'une matrice carrée permet d'évaluer ses propriétés algébriques. Pour une matrice d'ordre 2, le déterminant est donné par det(A) = ad - bc. Si le déterminant est non nul, la matrice est dite inversible.
Une matrice inversible A possède une matrice inverse, notée A^-1, telle que le produit A * A^-1 donne la matrice identité I (comportant des 1 sur la diagonale principale et des 0 ailleurs).
La matrice identité agit comme l'élément neutre de la multiplication matricielle. Les systèmes d'équations linéaires s'écrivent sous la forme matricielle AX = B, et se résolvent par la relation X = A^-1 * B si la matrice de coefficients est inversible.`
};

