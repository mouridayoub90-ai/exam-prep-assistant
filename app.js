// Contrôleur Applicatif - EduAI Prep
// Gère l'état global, l'interface utilisateur, la navigation, le RAG et les quiz

// Configure pdf.js worker CDN
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
}

// 1. ÉTAT DE L'APPLICATION
let appState = {
  studentName: "Étudiant PFE",
  xp: 0,
  quizzesCompleted: 0,
  totalCorrectAnswers: 0,
  totalAnswers: 0,
  studyTimeMin: 0,
  subjectActivity: {
    informatique: 0,
    mathematics: 0,
    physique: 0,
    svt: 0
  },
  recentActivities: [],
  apiKey: ""
};

// Cours actif chargé dans le moteur RAG
let currentCourseData = {
  name: "Aucun document chargé",
  text: "",
  chunks: [],
  isCustom: false
};

// Variables globales pour le quiz actif
let activeQuiz = {
  questions: [],
  currentIndex: 0,
  score: 0,
  startTime: null,
  timerInterval: null,
  selectedOption: null,
  hintsUsed: 0
};

// Variables globales pour l'import de fichier temporaire
let uploadedFileTemp = null;
let selectedExampleKey = null;

// Variable globale pour la synthèse vocale
let isVoiceEnabled = false;

// Initialiser le moteur RAG avec les cours locaux
let ragEngine = null;

// Initialiser le graphique Chart.js
let performanceChart = null;

// 2. DOCUMENT READY & INITIALISATION
document.addEventListener("DOMContentLoaded", () => {
  // Charger l'état sauvegardé
  loadStateFromLocalStorage();
  
  // Initialiser le moteur RAG par défaut (si aucun doc chargé)
  if (currentCourseData.chunks.length > 0) {
    ragEngine = new LocalRAGEngine(currentCourseData.chunks);
  } else {
    ragEngine = new LocalRAGEngine(COURS_DATABASE);
  }
  
  // Initialiser les icônes Lucide
  lucide.createIcons();
  
  // Connecter les écouteurs d'événements
  initEventListeners();
  initPortalEventListeners();
  
  // Mettre à jour l'affichage initial
  updateUI();
  
  // Si un document est déjà chargé de la session précédente, entrer directement dans l'application
  if (currentCourseData.chunks.length > 0) {
    enterAppWithDocument();
  }
});

// 3. ÉCOUTEURS D'ÉVÉNEMENTS DU PORTAIL D'ACCUEIL
function initPortalEventListeners() {
  const portalDropZone = document.getElementById("portal-drop-zone");
  const portalFileInput = document.getElementById("portal-file-input");
  const portalBrowseBtn = document.getElementById("portal-browse-btn");
  const portalSubmitBtn = document.getElementById("portal-submit-btn");
  const portalPasteText = document.getElementById("portal-paste-text");

  // Parcourir les fichiers
  if (portalBrowseBtn && portalFileInput) {
    portalBrowseBtn.addEventListener("click", () => portalFileInput.click());
    portalFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handlePortalFileSelected(e.target.files[0]);
      }
    });
  }

  // Glisser-déposer sur le portail
  if (portalDropZone) {
    portalDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      portalDropZone.classList.add("dragover");
    });
    
    portalDropZone.addEventListener("dragleave", () => {
      portalDropZone.classList.remove("dragover");
    });
    
    portalDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      portalDropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        handlePortalFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  // Sélection de documents d'exemples
  document.querySelectorAll(".btn-example-doc").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-example-doc").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedExampleKey = btn.getAttribute("data-example");
      // Vider le fichier sélectionné s'il y en avait un
      uploadedFileTemp = null;
      document.getElementById("portal-file-status").classList.add("hidden");
      document.getElementById("portal-paste-text").value = "";
    });
  });

  // Soumission du portail
  if (portalSubmitBtn) {
    portalSubmitBtn.addEventListener("click", processPortalForm);
  }
}

// 4. ÉCOUTEURS D'ÉVÉNEMENTS GÉNÉRAUX DE L'APP
function initEventListeners() {
  // Navigation latérale
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const sectionId = btn.getAttribute("data-section");
      switchSection(sectionId);
    });
  });

  // Bascule du mode sombre/clair
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);

  // Soumission du formulaire de chat
  document.getElementById("chat-form").addEventListener("submit", handleChatSubmit);

  // Raccourcis de requêtes de chat
  document.querySelectorAll(".shortcut-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.getAttribute("data-query");
      document.getElementById("chat-input").value = query;
      handleChatSubmit({ preventDefault: () => {} });
    });
  });

  // Bouton pour vider la conversation
  document.getElementById("clear-chat-btn").addEventListener("click", clearChat);

  // Synthèse vocale toggle
  document.getElementById("voice-synthesis-toggle").addEventListener("click", toggleVoice);

  // Configuration de Quiz
  document.getElementById("start-quiz-btn").addEventListener("click", generateAndStartQuiz);
  document.getElementById("quiz-hint-btn").addEventListener("click", showQuizHint);
  document.getElementById("quiz-submit-btn").addEventListener("click", submitQuizAnswer);
  document.getElementById("next-question-btn").addEventListener("click", nextQuizQuestion);

  // Filtres de fiches de révision
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const subject = btn.getAttribute("data-subject");
      renderFlashcards(subject);
    });
  });

  // Paramètres API Key
  document.getElementById("save-api-key-btn").addEventListener("click", saveApiKey);
  document.getElementById("clear-api-key-btn").addEventListener("click", deleteApiKey);
  document.getElementById("toggle-key-visibility").addEventListener("click", toggleKeyVisibility);
  
  // Charger données démo / Reset
  document.getElementById("load-demo-data-btn").addEventListener("click", loadDemoData);
  document.getElementById("reset-profile-btn").addEventListener("click", resetProfile);

  // Dépôt de fichier sur le Dashboard (pour changer de document)
  const dashboardDropZone = document.getElementById("drop-zone");
  const dashboardFileInput = document.getElementById("file-upload-input");
  const dashboardBrowseBtn = document.getElementById("browse-files-btn");
  const processDocBtn = document.getElementById("process-doc-btn");
  const clearDocBtn = document.getElementById("clear-doc-btn");

  if (dashboardBrowseBtn && dashboardFileInput) {
    dashboardBrowseBtn.addEventListener("click", () => dashboardFileInput.click());
    dashboardFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleDashboardFileSelected(e.target.files[0]);
      }
    });
  }

  if (dashboardDropZone) {
    dashboardDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dashboardDropZone.classList.add("dragover");
    });
    dashboardDropZone.addEventListener("dragleave", () => {
      dashboardDropZone.classList.remove("dragover");
    });
    dashboardDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dashboardDropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        handleDashboardFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  if (processDocBtn) {
    processDocBtn.addEventListener("click", processDashboardDoc);
  }

  if (clearDocBtn) {
    clearDocBtn.addEventListener("click", clearLoadedDocument);
  }
}

// 5. GESTION DES FICHIERS ET DES EXTRACTIONS
function handlePortalFileSelected(file) {
  uploadedFileTemp = file;
  selectedExampleKey = null;
  document.querySelectorAll(".btn-example-doc").forEach(b => b.classList.remove("active"));
  document.getElementById("portal-paste-text").value = "";
  
  const statusDiv = document.getElementById("portal-file-status");
  const nameSpan = document.getElementById("portal-filename");
  
  nameSpan.innerText = `${file.name} (${Math.round(file.size / 1024)} KB)`;
  statusDiv.classList.remove("hidden");
  
  showToast("Fichier prêt pour le chargement", "info");
}

function handleDashboardFileSelected(file) {
  uploadedFileTemp = file;
  document.getElementById("paste-text-input").value = "";
  
  const badge = document.getElementById("doc-active-badge");
  badge.innerText = `Fichier sélectionné : ${file.name}`;
  badge.className = "badge badge-purple";
  
  showToast("Fichier sélectionné. Cliquez sur 'Charger le document' pour appliquer.", "info");
}

// Extraction de texte client-side asynchrone pour PDF
async function extractTextFromPDF(arrayBuffer) {
  if (!window.pdfjsLib) {
    throw new Error("Bibliothèque pdf.js non chargée.");
  }
  const typedarray = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: typedarray });
  const pdf = await loadingTask.promise;
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  
  return fullText;
}

// Découpage du texte en chunks (paragraphes de 500-800 caractères)
function chunkText(text, sourceName) {
  // Diviser par lignes vides ou retours chariots multiples
  let paragraphs = text.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 20);
  
  if (paragraphs.length === 0 && text.trim().length > 0) {
    paragraphs = text.split(/\n/).map(p => p.trim()).filter(p => p.length > 20);
  }
  if (paragraphs.length === 0 && text.trim().length > 0) {
    paragraphs = [text.trim()];
  }
  
  const chunks = [];
  let index = 1;
  
  paragraphs.forEach(p => {
    // Si le paragraphe est trop volumineux, le découper en phrases
    if (p.length > 800) {
      const sentences = p.split(/[.!?]\s+/);
      let tempChunk = "";
      sentences.forEach(s => {
        if ((tempChunk + s).length > 800) {
          chunks.push({
            id: `chunk_${index++}`,
            subject: "Cours",
            title: `Extrait de ${sourceName} - Partie ${index - 1}`,
            content: tempChunk.trim(),
            source: sourceName
          });
          tempChunk = s + ". ";
        } else {
          tempChunk += s + ". ";
        }
      });
      if (tempChunk.trim().length > 20) {
        chunks.push({
          id: `chunk_${index++}`,
          subject: "Cours",
          title: `Extrait de ${sourceName} - Partie ${index - 1}`,
          content: tempChunk.trim(),
          source: sourceName
        });
      }
    } else {
      chunks.push({
        id: `chunk_${index++}`,
        subject: "Cours",
        title: `Extrait de ${sourceName} - Partie ${index - 1}`,
        content: p,
        source: sourceName
      });
    }
  });
  
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push({
      id: `chunk_1`,
      subject: "Cours",
      title: `Extrait de ${sourceName}`,
      content: text.trim(),
      source: sourceName
    });
  }
  
  return chunks;
}

// Traiter les données de l'écran d'accueil
async function processPortalForm() {
  const nameInput = document.getElementById("student-name-input").value.trim();
  if (nameInput) {
    appState.studentName = nameInput;
  }
  
  const pasteText = document.getElementById("portal-paste-text").value.trim();
  
  const btnSubmit = document.getElementById("portal-submit-btn");
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<i style="animation: spin 1s infinite linear" class="lucide"></i> Traitement NLP...`;
  
  try {
    if (uploadedFileTemp) {
      // 1. Lire le fichier chargé
      const file = uploadedFileTemp;
      const fileReader = new FileReader();
      
      if (file.name.toLowerCase().endsWith(".pdf")) {
        fileReader.onload = async function(e) {
          try {
            const pdfText = await extractTextFromPDF(e.target.result);
            processTextAndStart(file.name, pdfText, true);
          } catch (err) {
            console.error("PDF Extraction error:", err);
            showToast("Erreur lors de la lecture du fichier PDF.", "error");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="play"></i> Commencer la révision`;
            lucide.createIcons();
          }
        };
        fileReader.readAsArrayBuffer(file);
      } else {
        fileReader.onload = function(e) {
          let text = e.target.result;
          if (file.name.toLowerCase().endsWith(".json")) {
            try {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed)) {
                text = parsed.map(item => item.content || item.text || JSON.stringify(item)).join("\n\n");
              } else if (typeof parsed === "object" && parsed !== null) {
                text = parsed.text || parsed.content || JSON.stringify(parsed);
              }
            } catch (jsonErr) {
              console.error("JSON parse error, treating as plain text:", jsonErr);
            }
          }
          processTextAndStart(file.name, text, true);
        };
        fileReader.readAsText(file);
      }
    } else if (pasteText) {
      // 2. Coller du texte
      processTextAndStart("Texte Copié", pasteText, true);
    } else if (selectedExampleKey) {
      // 3. Exemple sélectionné
      const exampleText = EXAMPLE_DOCUMENTS[selectedExampleKey];
      const exampleTitles = {
        http: "Bases des Réseaux (HTTP)",
        newton: "Physique Newtonienne (Newton)",
        adn: "Biologie Moléculaire (ADN)",
        matrix: "Algèbre Linéaire (Matrices)"
      };
      processTextAndStart(exampleTitles[selectedExampleKey] || "Exemple", exampleText, false);
    } else {
      // 4. Par défaut : Utiliser la base de données intégrée globale
      processTextAndStart("Base globale EduAI", "", false);
    }
  } catch (err) {
    console.error("Portal error:", err);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<i data-lucide="play"></i> Commencer la révision`;
    lucide.createIcons();
  }
}

// Traiter le document chargé depuis le Dashboard
async function processDashboardDoc() {
  const pasteText = document.getElementById("paste-text-input").value.trim();
  const processBtn = document.getElementById("process-doc-btn");
  
  processBtn.disabled = true;
  processBtn.innerText = "Calcul NLP...";
  
  if (uploadedFileTemp) {
    const file = uploadedFileTemp;
    const fileReader = new FileReader();
    
    if (file.name.toLowerCase().endsWith(".pdf")) {
      fileReader.onload = async function(e) {
        try {
          const pdfText = await extractTextFromPDF(e.target.result);
          processTextAndStart(file.name, pdfText, true);
          showToast("Nouveau document PDF chargé !", "success");
          processBtn.disabled = false;
          processBtn.innerHTML = `<i data-lucide="cpu"></i> Charger le document`;
          lucide.createIcons();
        } catch (err) {
          console.error(err);
          showToast("Erreur de parsing PDF", "error");
          processBtn.disabled = false;
          processBtn.innerHTML = `<i data-lucide="cpu"></i> Charger le document`;
          lucide.createIcons();
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.onload = function(e) {
        let text = e.target.result;
        if (file.name.toLowerCase().endsWith(".json")) {
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              text = parsed.map(item => item.content || item.text || JSON.stringify(item)).join("\n\n");
            } else if (typeof parsed === "object" && parsed !== null) {
              text = parsed.text || parsed.content || JSON.stringify(parsed);
            }
          } catch (jsonErr) {
            console.error("JSON parse error, treating as plain text:", jsonErr);
          }
        }
        processTextAndStart(file.name, text, true);
        showToast("Nouveau document chargé !", "success");
        processBtn.disabled = false;
        processBtn.innerHTML = `<i data-lucide="cpu"></i> Charger le document`;
        lucide.createIcons();
      };
      fileReader.readAsText(file);
    }
  } else if (pasteText) {
    processTextAndStart("Texte Copié", pasteText, true);
    showToast("Texte copié chargé avec succès !", "success");
    processBtn.disabled = false;
    processBtn.innerHTML = `<i data-lucide="cpu"></i> Charger le document`;
    lucide.createIcons();
  } else {
    showToast("Veuillez sélectionner un fichier ou coller du texte !", "error");
    processBtn.disabled = false;
    processBtn.innerHTML = `<i data-lucide="cpu"></i> Charger le document`;
    lucide.createIcons();
  }
}

// Fonction maîtresse de chargement du texte et démarrage du RAG
function processTextAndStart(title, text, isCustom) {
  let chunks = [];
  
  if (text.trim() === "") {
    // Utiliser la base de données par défaut si pas de texte
    chunks = COURS_DATABASE;
    currentCourseData = {
      name: "Cours d'Exemple Intégrés",
      text: "Base de cours générale comportant HTTP, SQL, les lois de Newton et la transcription d'ADN.",
      chunks: chunks,
      isCustom: false
    };
  } else {
    // Découper et indexer les chunks
    chunks = chunkText(text, title);
    currentCourseData = {
      name: title,
      text: text,
      chunks: chunks,
      isCustom: isCustom
    };
  }
  
  // Mettre à jour l'indexeur RAG avec les nouveaux chunks
  ragEngine = new LocalRAGEngine(chunks);
  
  // Enregistrer l'activité
  logActivity("doc_loaded", `Document chargé : "${title}" (${chunks.length} paragraphe(s))`, "settings");
  
  // Persister dans le stockage local
  saveStateToLocalStorage();
  
  // Transition vers l'application
  enterAppWithDocument();
  
  // Mettre à jour les flashcards et réinitialiser les quiz basés sur ce cours
  renderFlashcards("all");
  
  // Vider les variables temporaires
  uploadedFileTemp = null;
  selectedExampleKey = null;
  
  // Réinitialiser les champs
  const pasteTextInput = document.getElementById("paste-text-input");
  if (pasteTextInput) pasteTextInput.value = "";
  const portalPasteText = document.getElementById("portal-paste-text");
  if (portalPasteText) portalPasteText.value = "";
}

function enterAppWithDocument() {
  // Masquer le portail d'accueil
  const portal = document.getElementById("welcome-portal");
  if (portal) portal.classList.add("hidden");
  
  // Révéler le container principal
  const appContainer = document.getElementById("app-container");
  if (appContainer) appContainer.classList.remove("hidden");
  
  // Configurer le nom de l'étudiant
  document.querySelector(".user-name").innerText = appState.studentName;
  document.querySelector(".user-avatar").innerText = appState.studentName.charAt(0).toUpperCase();
  
  // Mettre à jour les affichages
  updateUI();
  updateDocumentDashboardUI();
  updateAppDynamicContent();
  initPerformanceChart();
  generateRecommendations();
  
  showToast(`Bonjour ${appState.studentName}, votre session d'étude est prête !`, "success");
}

function updateDocumentDashboardUI() {
  const badge = document.getElementById("doc-active-badge");
  const statsCard = document.getElementById("doc-stats-card");
  const clearBtn = document.getElementById("clear-doc-btn");
  
  if (badge) {
    badge.innerText = currentCourseData.name;
    badge.className = currentCourseData.isCustom ? "badge badge-accent" : "badge badge-purple";
  }
  
  if (currentCourseData.chunks.length > 0 && statsCard) {
    statsCard.classList.remove("hidden");
    if (clearBtn) clearBtn.classList.remove("hidden");
    
    document.getElementById("doc-stat-name").innerText = currentCourseData.name;
    document.getElementById("doc-stat-size").innerText = `${Math.round(currentCourseData.text.length / 1024)} KB`;
    document.getElementById("doc-stat-words").innerText = currentCourseData.text.split(/\s+/).filter(w => w.length > 0).length;
    document.getElementById("doc-stat-chunks").innerText = currentCourseData.chunks.length;
  } else if (statsCard) {
    statsCard.classList.add("hidden");
    if (clearBtn) clearBtn.classList.add("hidden");
  }
}

function clearLoadedDocument() {
  currentCourseData = {
    name: "Aucun document chargé",
    text: "",
    chunks: [],
    isCustom: false
  };
  
  ragEngine = new LocalRAGEngine(COURS_DATABASE);
  saveStateToLocalStorage();
  updateAppDynamicContent();
  
  // Retourner à l'écran d'accueil pour forcer le choix d'un document
  document.getElementById("app-container").classList.add("hidden");
  document.getElementById("welcome-portal").classList.remove("hidden");
  
  const submitBtn = document.getElementById("portal-submit-btn");
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i data-lucide="play"></i> Commencer la révision`;
  
  // Vider les statuts
  document.getElementById("portal-file-status").classList.add("hidden");
  uploadedFileTemp = null;
  selectedExampleKey = null;
  
  showToast("Document de cours déchargé", "info");
  lucide.createIcons();
}

// Mise à jour de l'interface dynamique en fonction du document chargé
function updateAppDynamicContent() {
  const isCustom = currentCourseData.isCustom && currentCourseData.chunks.length > 0;
  
  // 1. Mettre à jour le message d'accueil de Sophia
  const chatMessagesContainer = document.getElementById("chat-messages-container");
  if (chatMessagesContainer) {
    const defaultIntro = `Bonjour ! Je suis Sophia, votre tuteur académique virtuel. Posez-moi une question sur vos cours (Informatique, Mathématiques, Physique ou SVT). 
<br><br>
Exemples :
<ul>
  <li><em>"Comment fonctionne le protocole HTTP ?"</em></li>
  <li><em>"Explique-moi les lois de Newton"</em></li>
  <li><em>"Quelle est la structure de l'ADN ?"</em></li>
</ul>
Grâce à l'architecture <strong>RAG</strong>, je vais analyser votre demande, chercher dans les cours et vous formuler une réponse structurée !`;

    const customIntro = `Bonjour ! Je suis Sophia, votre tuteur académique virtuel. Je viens d'analyser votre document <strong>"${currentCourseData.name}"</strong>.
<br><br>
Posez-moi des questions sur son contenu ! Grâce au <strong>RAG local</strong>, je vais chercher les extraits pertinents et vous expliquer les concepts clés de votre cours.`;

    const botIntroMessage = chatMessagesContainer.querySelector(".bot-message .message-content");
    if (botIntroMessage) {
      botIntroMessage.innerHTML = isCustom ? customIntro : defaultIntro;
    }
  }

  // 2. Mettre à jour les raccourcis de chat
  const shortcutsContainer = document.querySelector(".chat-shortcuts");
  if (shortcutsContainer) {
    shortcutsContainer.innerHTML = "";
    if (isCustom) {
      // Générer des questions d'exemple depuis le texte
      let questions = [];
      const firstChunks = currentCourseData.chunks.slice(0, 3);
      firstChunks.forEach((c, idx) => {
        const words = c.content.split(' ').slice(0, 6).join(' ');
        questions.push(`Que dit le cours sur : "${words}..." ?`);
      });
      if (questions.length === 0) questions.push("Résume-moi ce document.");
      
      questions.forEach(q => {
        const btn = document.createElement("button");
        btn.className = "shortcut-tag";
        btn.setAttribute("data-query", q);
        btn.innerText = q.substring(0, 30) + "...";
        btn.addEventListener("click", () => {
          document.getElementById("chat-input").value = q;
          handleChatSubmit({ preventDefault: () => {} });
        });
        shortcutsContainer.appendChild(btn);
      });
    } else {
      const defaultShortcuts = [
        { q: "Explique le protocole HTTP et ses codes", label: "Protocole HTTP" },
        { q: "Qu'est-ce que la dérivée géométriquement ?", label: "Dérivée (Géométrie)" },
        { q: "Énonce les trois lois de Newton", label: "Lois de Newton" },
        { q: "Comment se fait la transcription de l'ADN ?", label: "Transcription ADN" }
      ];
      defaultShortcuts.forEach(s => {
        const btn = document.createElement("button");
        btn.className = "shortcut-tag";
        btn.setAttribute("data-query", s.q);
        btn.innerText = s.label;
        btn.addEventListener("click", () => {
          document.getElementById("chat-input").value = s.q;
          handleChatSubmit({ preventDefault: () => {} });
        });
        shortcutsContainer.appendChild(btn);
      });
    }
  }

  // 3. Mettre à jour le menu déroulant du quiz
  const quizSubjectSelect = document.getElementById("quiz-subject-select");
  if (quizSubjectSelect) {
    quizSubjectSelect.innerHTML = "";
    if (isCustom) {
      const optAll = document.createElement("option");
      optAll.value = "all";
      optAll.innerText = `Cours : ${currentCourseData.name}`;
      quizSubjectSelect.appendChild(optAll);
    } else {
      quizSubjectSelect.innerHTML = `
        <option value="all">Toutes les matières</option>
        <option value="informatique">Informatique & Réseaux</option>
        <option value="mathematics">Mathématiques</option>
        <option value="physique">Physique-Chimie</option>
        <option value="svt">Sciences de la Vie et de la Terre</option>
      `;
    }
  }

  // 4. Mettre à jour les filtres de flashcards
  const flashcardsFilters = document.querySelector(".subject-filters");
  if (flashcardsFilters) {
    flashcardsFilters.innerHTML = "";
    if (isCustom) {
      const btn = document.createElement("button");
      btn.className = "filter-btn active";
      btn.setAttribute("data-subject", "all");
      btn.innerText = "Document Actuel";
      flashcardsFilters.appendChild(btn);
    } else {
      flashcardsFilters.innerHTML = `
        <button class="filter-btn active" data-subject="all">Toutes</button>
        <button class="filter-btn" data-subject="informatique">Informatique</button>
        <button class="filter-btn" data-subject="mathematics">Mathématiques</button>
        <button class="filter-btn" data-subject="physique">Physique</button>
        <button class="filter-btn" data-subject="svt">SVT</button>
      `;
      // Ré-attacher les events listeners
      flashcardsFilters.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const subject = btn.getAttribute("data-subject");
          renderFlashcards(subject);
        });
      });
    }
  }
}

// 6. NAVIGATION SPA
function switchSection(sectionId) {
  document.querySelectorAll(".app-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    
    const navBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (navBtn) navBtn.classList.add("active");
    
    updateHeaderTitle(sectionId);
    
    if (sectionId === "analytics") {
      setTimeout(() => {
        initPerformanceChart();
        renderMasteryBars();
      }, 100);
    }
  }
}

function updateHeaderTitle(sectionId) {
  const titles = {
    dashboard: "Tableau de Bord - Aperçu global",
    tutor: "Tuteur Virtuel",
    quiz: "Générateur de Quiz",
    flashcards: "Fiches de Révision",
    analytics: "Statistiques & Progression",
    settings: "Paramètres"
  };
  document.getElementById("header-title").innerText = `${titles[sectionId] || "Session d'étude"} | Cours : ${currentCourseData.name}`;
}

// Commutateur de Thèmes
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  
  showToast(`Thème ${newTheme === "dark" ? "Sombre" : "Clair"} activé`, "info");
}

// 7. MOTEUR DE CHAT (TUTEUR IA & RAG)
async function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const query = input.value.trim();
  if (!query) return;
  
  input.value = "";
  
  // 1. Ajouter le message de l'étudiant à l'interface
  appendChatMessage(query, "user");
  detectSubjectFromText(query);
  
  // Afficher l'indicateur de chargement
  const loadingId = appendChatLoading();
  
  try {
    // 2. ÉTAPE RAG : Récupération des chunks pertinents du document actif
    const ragResults = ragEngine.retrieve(query, 2);
    
    // Protection du moniteur de débogage (au cas où il existe ou pas dans l'HTML)
    if (document.getElementById("monitor-tokens")) {
      updateRAGMonitor(ragResults);
    }
    
    let answerText = "";
    let contextDocs = [];
    
    // 4. Générer la réponse
    if (appState.apiKey) {
      // MODE CONNECTÉ : RAG avec l'API Gemini réelle
      const contextString = ragResults.retrievedChunks
        .map(c => `[Extrait: ${c.document.title}] - Contenu: ${c.document.content}`)
        .join("\n\n");
      
      const systemPrompt = `Tu es Sophia, un tuteur académique d'examens.
Réponds à la question de l'étudiant en utilisant UNIQUEMENT le contexte extrait de son cours ci-dessous.
Si l'information n'est pas présente dans le cours fourni, utilise tes connaissances en précisant clairement que cette information ne figure pas dans son cours.
Reste pédagogique, strucure ta réponse en français et propose-lui de faire un quiz pour valider.

---
CONTEXTE DU COURS IMPORTÉ :
${contextString}
---

QUESTION DE L'ÉTUDIANT :
${query}`;

      answerText = await generateGeminiResponse(systemPrompt, appState.apiKey);
      contextDocs = ragResults.retrievedChunks.map(c => c.document.id);
    } else {
      // MODE HORS-LIGNE : Moteur de réponse locale basé sur le RAG
      const localGen = ragEngine.generateLocalResponse(query, ragResults);
      answerText = localGen.answer;
      contextDocs = localGen.contextUsed;
    }
    
    // Afficher la réponse du tuteur
    removeChatLoading(loadingId);
    appendChatMessage(answerText, "bot");
    
    // Enregistrer l'activité
    logActivity("bot_query", `Tuteur : "${query.substring(0, 30)}..."`, "bot");
    appState.xp += 10;
    
    if (isVoiceEnabled) {
      speak(cleanMarkdownForSpeech(answerText));
    }
    
    updateUI();
    saveStateToLocalStorage();
    
  } catch (error) {
    console.error("Erreur Chat:", error);
    removeChatLoading(loadingId);
    appendChatMessage("Une erreur NLP s'est produite. Si vous utilisez une clé API Gemini, assurez-vous qu'elle soit toujours valide.", "bot");
  }
}

// Appel direct à l'API Gemini
async function generateGeminiResponse(promptText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`API Gemini a renvoyé une erreur: ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Mise à jour de l'affichage du moniteur RAG (présente dans le code pour rétrocompatibilité)
function updateRAGMonitor(ragResults) {
  const tokensContainer = document.getElementById("monitor-tokens");
  if (tokensContainer) {
    tokensContainer.innerHTML = "";
    if (ragResults.queryTokens.length === 0) {
      tokensContainer.innerHTML = `<span class="empty-placeholder">Aucun token</span>`;
    } else {
      ragResults.queryTokens.forEach(t => {
        const span = document.createElement("span");
        span.className = "token-tag";
        span.innerText = t;
        tokensContainer.appendChild(span);
      });
    }
  }
  
  const vectorContainer = document.getElementById("monitor-vector");
  if (vectorContainer) {
    vectorContainer.innerText = JSON.stringify(ragResults.queryVector, null, 2);
  }
  
  const docContainer = document.getElementById("monitor-documents");
  if (docContainer) {
    docContainer.innerHTML = "";
    if (ragResults.retrievedChunks.length === 0) {
      docContainer.innerHTML = `<p class="empty-placeholder">Aucun paragraphe.</p>`;
    } else {
      ragResults.retrievedChunks.forEach(item => {
        const doc = item.document;
        const pct = (item.similarity * 100).toFixed(1);
        const docDiv = document.createElement("div");
        docDiv.className = "retrieved-doc-item";
        docDiv.innerHTML = `
          <div class="retrieved-doc-title">
            <span>${doc.title}</span>
            <span class="similarity-badge">${pct}% match</span>
          </div>
          <div class="retrieved-doc-snippet">"${doc.content}"</div>
        `;
        docContainer.appendChild(docDiv);
      });
    }
  }
  
  const searchTime = document.getElementById("monitor-search-time");
  if (searchTime) searchTime.innerText = `${ragResults.searchTimeMs} ms`;
}

// Fonctions d'aide pour l'interface de chat
function appendChatMessage(text, sender) {
  const container = document.getElementById("chat-messages-container");
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;
  
  let formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  msgDiv.innerHTML = `
    <div class="message-content">${formattedText}</div>
    <span class="message-time">À l'instant</span>
  `;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function appendChatLoading() {
  const container = document.getElementById("chat-messages-container");
  const loadDiv = document.createElement("div");
  const uniqueId = "loading-" + Date.now();
  loadDiv.id = uniqueId;
  loadDiv.className = "message bot-message";
  loadDiv.innerHTML = `
    <div class="message-content">
      <div style="display: flex; gap: 4px; align-items: center; padding: 4px 8px;">
        <span style="width:6px; height:6px; border-radius:50%; background:var(--text-secondary); animation: bounce 1s infinite alternate"></span>
        <span style="width:6px; height:6px; border-radius:50%; background:var(--text-secondary); animation: bounce 1s infinite alternate; animation-delay: 0.2s"></span>
        <span style="width:6px; height:6px; border-radius:50%; background:var(--text-secondary); animation: bounce 1s infinite alternate; animation-delay: 0.4s"></span>
      </div>
    </div>
  `;
  container.appendChild(loadDiv);
  container.scrollTop = container.scrollHeight;
  return uniqueId;
}

function removeChatLoading(id) {
  const loadDiv = document.getElementById(id);
  if (loadDiv) loadDiv.remove();
}

function clearChat() {
  const container = document.getElementById("chat-messages-container");
  container.innerHTML = `
    <div class="message bot-message">
      <div class="message-content">
        Conversation réinitialisée. Posez-moi des questions basées sur votre document de cours !
      </div>
      <span class="message-time">À l'instant</span>
    </div>
  `;
  showToast("Conversation vidée", "info");
}

// Synthèse vocale
function toggleVoice() {
  isVoiceEnabled = !isVoiceEnabled;
  const btn = document.getElementById("voice-synthesis-toggle");
  if (isVoiceEnabled) {
    btn.classList.add("active");
    btn.style.color = "var(--accent)";
    showToast("Synthèse vocale activée", "success");
    speak("Synthèse vocale activée.");
  } else {
    btn.classList.remove("active");
    btn.style.color = "";
    showToast("Synthèse vocale désactivée", "info");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find(voice => voice.lang.includes("fr-FR"));
  if (frVoice) utterance.voice = frVoice;
  
  window.speechSynthesis.speak(utterance);
}

function cleanMarkdownForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/>/g, '');
}

function detectSubjectFromText(text) {
  const clean = text.toLowerCase();
  if (clean.includes("http") || clean.includes("sql") || clean.includes("base") || clean.includes("algo") || clean.includes("tri") || clean.includes("informatique")) {
    appState.subjectActivity.informatique++;
  } else if (clean.includes("derive") || clean.includes("limite") || clean.includes("matrice") || clean.includes("mathematique") || clean.includes("equation")) {
    appState.subjectActivity.mathematics++;
  } else if (clean.includes("newton") || clean.includes("loi") || clean.includes("thermo") || clean.includes("energie") || clean.includes("physique")) {
    appState.subjectActivity.physique++;
  } else if (clean.includes("adn") || clean.includes("genetique") || clean.includes("transcription") || clean.includes("ribosome") || clean.includes("svt")) {
    appState.subjectActivity.svt++;
  }
}

// 8. GENERATION DE QUIZ DYNAMIQUE
async function generateAndStartQuiz() {
  const subject = document.getElementById("quiz-subject-select").value;
  const difficulty = document.getElementById("quiz-difficulty-select").value;
  const type = document.getElementById("quiz-type-select").value;
  
  let questions = [];
  
  // Si on a importé un document, on génère le quiz de manière DYNAMIQUE à partir du document
  if (currentCourseData.chunks.length > 0) {
    showToast("Génération dynamique du quiz à partir de votre cours...", "info");
    
    if (appState.apiKey) {
      // Génération IA par Gemini
      try {
        const docSnippet = currentCourseData.text.substring(0, 4000); // 4000 char max
        const prompt = `Génère un quiz d'évaluation au format JSON basé sur le cours suivant.
Le format de sortie attendu doit être un tableau d'objets JSON brut (SANS balises de formatage markdown, juste le JSON valide) ayant précisément cette structure :
[
  {
    "subject": "Cours",
    "difficulty": "moyen",
    "type": "qcm",
    "question": "Texte de la question ?",
    "options": ["Choix 0", "Choix 1", "Choix 2", "Choix 3"],
    "correctAnswer": 0,
    "explanation": "Explication pédagogique de la réponse.",
    "hint": "Un indice simple."
  },
  {
    "subject": "Cours",
    "difficulty": "moyen",
    "type": "open",
    "question": "Texte d'une question ouverte exigeant des explications ?",
    "options": null,
    "correctAnswer": ["motclé1", "motclé2"],
    "explanation": "Texte modèle décrivant la réponse correcte.",
    "hint": "Conseils pour l'étudiant."
  }
]
Génère un total de 5 questions (3 QCM et 2 questions ouvertes) portant uniquement sur le texte ci-dessous :

---
COURS :
${docSnippet}`;

        const rawResponse = await generateGeminiResponse(prompt, appState.apiKey);
        // Supprimer d'éventuelles balises de code markdown renvoyées
        const cleanJSON = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        questions = JSON.parse(cleanJSON);
        
      } catch (err) {
        console.error("Gemini Quiz gen failed, fallback to local NLP:", err);
        questions = LocalQuestionGenerator.generate(currentCourseData.chunks, 5);
      }
    } else {
      // Génération NLP locale (hors-ligne)
      questions = LocalQuestionGenerator.generate(currentCourseData.chunks, 5);
    }
  } else {
    // Si aucun document custom n'est chargé, filtrer sur la base de données statique intégrée
    questions = QUIZ_DATABASE.filter(q => {
      const matchSubject = (subject === "all" || q.subject === subject);
      const matchDiff = (difficulty === "all" || q.difficulty === difficulty);
      const matchType = (type === "all" || q.type === type);
      return matchSubject && matchDiff && matchType;
    });
    
    questions.sort(() => 0.5 - Math.random());
    questions = questions.slice(0, 5);
  }
  
  if (questions.length === 0) {
    showToast("Aucune question générée. Veuillez charger un document ou modifier vos filtres.", "error");
    return;
  }
  
  activeQuiz.questions = questions;
  activeQuiz.currentIndex = 0;
  activeQuiz.score = 0;
  activeQuiz.hintsUsed = 0;
  activeQuiz.startTime = new Date();
  
  // Masquer setup, afficher quiz actif
  document.getElementById("quiz-setup").classList.add("hidden");
  document.getElementById("quiz-active").classList.remove("hidden");
  document.getElementById("question-feedback").classList.add("hidden");
  document.getElementById("quiz-results").classList.add("hidden");
  
  startQuizTimer();
  renderQuizQuestion();
  
  showToast("Quiz généré et démarré !", "success");
}

function startQuizTimer() {
  if (activeQuiz.timerInterval) clearInterval(activeQuiz.timerInterval);
  const timerSpan = document.getElementById("quiz-timer");
  let seconds = 0;
  timerSpan.innerText = "00:00";
  
  activeQuiz.timerInterval = setInterval(() => {
    seconds++;
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    timerSpan.innerText = `${min}:${sec}`;
  }, 1000);
}

function renderQuizQuestion() {
  const question = activeQuiz.questions[activeQuiz.currentIndex];
  
  document.getElementById("quiz-badge-subject").innerText = question.subject;
  document.getElementById("quiz-badge-difficulty").innerText = question.difficulty;
  
  const total = activeQuiz.questions.length;
  const currentNum = activeQuiz.currentIndex + 1;
  document.getElementById("quiz-current-num").innerText = currentNum;
  document.getElementById("quiz-total-num").innerText = total;
  document.getElementById("quiz-progress-bar").style.width = `${((currentNum - 1) / total) * 100}%`;
  
  document.getElementById("quiz-question-text").innerText = question.question;
  
  const mcqContainer = document.getElementById("mcq-options");
  const openBox = document.getElementById("open-answer-box");
  mcqContainer.innerHTML = "";
  document.getElementById("open-answer-input").value = "";
  
  activeQuiz.selectedOption = null;
  
  if (question.type === "qcm") {
    mcqContainer.classList.remove("hidden");
    openBox.classList.add("hidden");
    
    question.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `
        <span class="option-marker">${String.fromCharCode(65 + idx)}</span>
        <span>${opt}</span>
      `;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        activeQuiz.selectedOption = idx;
      });
      mcqContainer.appendChild(btn);
    });
  } else {
    mcqContainer.classList.add("hidden");
    openBox.classList.remove("hidden");
  }
  
  document.getElementById("quiz-submit-btn").classList.remove("hidden");
  document.getElementById("question-feedback").classList.add("hidden");
}

function showQuizHint() {
  const question = activeQuiz.questions[activeQuiz.currentIndex];
  showToast(`Indice : ${question.hint}`, "info");
  activeQuiz.hintsUsed++;
}

function submitQuizAnswer() {
  const question = activeQuiz.questions[activeQuiz.currentIndex];
  const feedbackCard = document.getElementById("question-feedback");
  const feedbackTitle = document.getElementById("feedback-header-title");
  const feedbackExplText = document.getElementById("feedback-explanation-text");
  const nlpResultsBox = document.getElementById("nlp-results-box");
  
  let isCorrect = false;
  nlpResultsBox.classList.add("hidden");
  
  if (question.type === "qcm") {
    if (activeQuiz.selectedOption === null) {
      showToast("Veuillez sélectionner une réponse !", "error");
      return;
    }
    
    isCorrect = (activeQuiz.selectedOption === question.correctAnswer);
    if (isCorrect) {
      activeQuiz.score++;
      feedbackCard.className = "feedback-card correct";
      feedbackTitle.innerHTML = `<i data-lucide="check-circle" class="text-green"></i> Réponse correcte !`;
    } else {
      feedbackCard.className = "feedback-card incorrect";
      feedbackTitle.innerHTML = `<i data-lucide="alert-circle" class="text-red"></i> Réponse incorrecte (la réponse était : ${question.options[question.correctAnswer]})`;
    }
  } else {
    // ÉVALUATION AUTOMATIQUE NLP
    const studentAnswer = document.getElementById("open-answer-input").value.trim();
    if (!studentAnswer) {
      showToast("Veuillez rédiger votre réponse !", "error");
      return;
    }
    
    const nlpEvaluation = NLPAutoEvaluator.evaluate(
      studentAnswer,
      question.correctAnswer,
      question.explanation
    );
    
    nlpResultsBox.classList.remove("hidden");
    document.getElementById("nlp-score-number").innerText = nlpEvaluation.score20;
    
    const dashOffset = 251.2 - (251.2 * (nlpEvaluation.scorePercentage));
    document.getElementById("nlp-radial-fill").style.strokeDashoffset = dashOffset;
    
    document.getElementById("nlp-metric-similarity").innerText = `${(nlpEvaluation.semanticSimilarity * 100).toFixed(1)}%`;
    document.getElementById("nlp-metric-time").innerText = `${nlpEvaluation.executionTimeMs} ms`;
    document.getElementById("nlp-appreciation-text").innerText = nlpEvaluation.appreciation;
    
    const keywordsContainer = document.getElementById("nlp-keywords-flex");
    keywordsContainer.innerHTML = "";
    nlpEvaluation.keywordsStatus.forEach(kw => {
      const tag = document.createElement("span");
      tag.className = `keyword-tag-badge ${kw.found ? 'found' : 'missing'}`;
      tag.innerHTML = kw.found 
        ? `<i data-lucide="check" style="width:10px;height:10px"></i> ${kw.keyword}`
        : `<i data-lucide="x" style="width:10px;height:10px"></i> ${kw.keyword}`;
      keywordsContainer.appendChild(tag);
    });
    
    isCorrect = (nlpEvaluation.score20 >= 10);
    if (isCorrect) {
      activeQuiz.score++;
      feedbackCard.className = "feedback-card correct";
      feedbackTitle.innerHTML = `<i data-lucide="check-circle" class="text-green"></i> Réponse validée par l'évaluation NLP (${nlpEvaluation.score20}/20)`;
      if (nlpEvaluation.score20 >= 16) {
        unlockAchievement("ach-2");
      }
    } else {
      feedbackCard.className = "feedback-card incorrect";
      feedbackTitle.innerHTML = `<i data-lucide="x-circle" class="text-red"></i> Réponse insuffisante (${nlpEvaluation.score20}/20)`;
    }
  }
  
  feedbackExplText.innerText = question.explanation;
  
  const xpReward = isCorrect ? (question.difficulty === "easy" ? 15 : 30) : 5;
  appState.xp += xpReward;
  appState.totalAnswers++;
  if (isCorrect) appState.totalCorrectAnswers++;
  
  if (appState.subjectActivity[question.subject] !== undefined) {
    appState.subjectActivity[question.subject]++;
  } else {
    appState.subjectActivity.informatique++; // Matière par défaut
  }
  
  lucide.createIcons();
  feedbackCard.classList.remove("hidden");
  document.getElementById("quiz-submit-btn").classList.add("hidden");
  
  updateUI();
  saveStateToLocalStorage();
}

function nextQuizQuestion() {
  activeQuiz.currentIndex++;
  if (activeQuiz.currentIndex < activeQuiz.questions.length) {
    renderQuizQuestion();
  } else {
    endQuizSession();
  }
}

function endQuizSession() {
  clearInterval(activeQuiz.timerInterval);
  document.getElementById("quiz-active").classList.add("hidden");
  document.getElementById("question-feedback").classList.add("hidden");
  
  const resultsCard = document.getElementById("quiz-results");
  resultsCard.classList.remove("hidden");
  
  const total = activeQuiz.questions.length;
  const accuracy = Math.round((activeQuiz.score / total) * 100);
  const bonus = activeQuiz.score * 25;
  
  appState.xp += bonus;
  appState.quizzesCompleted++;
  
  const timeDiff = new Date() - activeQuiz.startTime;
  const elapsedMin = Math.ceil(timeDiff / 1000 / 60);
  appState.studyTimeMin += elapsedMin;
  
  const seconds = Math.floor(timeDiff / 1000);
  const minText = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secText = String(seconds % 60).padStart(2, '0');
  
  document.getElementById("quiz-results-summary").innerText = 
    `Évaluation complétée ! Score final : ${activeQuiz.score}/${total} (${accuracy}% de réussite).`;
  document.getElementById("res-xp-gained").innerText = `+${bonus}`;
  document.getElementById("res-avg-accuracy").innerText = `${accuracy}%`;
  document.getElementById("res-time-spent").innerText = `${minText}:${secText}`;
  
  unlockAchievement("ach-1");
  logActivity("quiz_complete", `Quiz : score de ${activeQuiz.score}/${total}`, "quiz");
  
  updateUI();
  saveStateToLocalStorage();
}

// 9. FLASHCARDS DYNAMIQUES
async function renderFlashcards(subjectFilter) {
  const container = document.getElementById("flashcards-grid-container");
  container.innerHTML = "";
  
  let cards = [];
  
  // Si cours chargé, générer les flashcards de manière DYNAMIQUE
  if (currentCourseData.chunks.length > 0) {
    if (appState.apiKey) {
      try {
        const prompt = `Génère 6 flashcards de révision au format JSON basé sur le cours suivant.
Le format attendu doit être un tableau d'objets JSON brut (sans markdown) :
[
  { "subject": "Cours", "front": "Concept ou question ?", "back": "Définition détaillée ou réponse." }
]
---
COURS :
${currentCourseData.text.substring(0, 3000)}`;

        const rawResponse = await generateGeminiResponse(prompt, appState.apiKey);
        const cleanJSON = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        cards = JSON.parse(cleanJSON);
      } catch (err) {
        console.error("Gemini Flashcard failed, using local NLP:", err);
        cards = LocalFlashcardGenerator.generate(currentCourseData.chunks);
      }
    } else {
      // Générateur local NLP
      cards = LocalFlashcardGenerator.generate(currentCourseData.chunks);
    }
  } else {
    // Si aucun document custom n'est chargé, filtrer sur la base de données statique
    cards = REVISION_CARDS.filter(c => subjectFilter === "all" || c.subject === subjectFilter);
  }
  
  if (cards.length === 0) {
    container.innerHTML = `<p class="empty-placeholder">Aucune fiche de révision disponible pour ce document.</p>`;
    return;
  }
  
  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "flashcard";
    
    cardEl.innerHTML = `
      <div class="flashcard-inner">
        <div class="card-front">
          <span class="card-subject badge badge-dark">${card.subject || "Cours"}</span>
          <p>${card.front}</p>
          <span class="flip-hint"><i data-lucide="refresh-cw" style="width:10px;height:10px"></i> Retourner</span>
        </div>
        <div class="card-back">
          <p>${card.back}</p>
        </div>
      </div>
    `;
    
    cardEl.addEventListener("click", () => {
      cardEl.classList.toggle("flipped");
      appState.xp += 2;
      updateUI();
      saveStateToLocalStorage();
    });
    
    container.appendChild(cardEl);
  });
  
  lucide.createIcons();
}

// 10. GRAPHIQUES ET ANALYTICS (CHART.JS)
function initPerformanceChart() {
  const ctx = document.getElementById("performance-chart");
  if (!ctx) return;
  
  if (performanceChart) {
    performanceChart.destroy();
  }
  
  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  let dataPoints = [200, 400, 300, 600, 800, 1100, appState.xp];
  if (appState.xp < 200) {
    dataPoints = [0, 0, 0, 0, 0, 0, appState.xp];
  }
  
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const gridColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
  const textColor = isLight ? "#475569" : "#94a3b8";

  performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "XP accumulés",
        data: dataPoints,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#0ea5e9",
        pointBorderColor: "#ffffff",
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: "Outfit", size: 12 } }
        }
      },
      scales: {
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "Inter" } }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: "Inter" } }
        }
      }
    }
  });
}

function renderMasteryBars() {
  const container = document.getElementById("mastery-list-container");
  if (!container) return;
  container.innerHTML = "";
  
  const totalActions = Object.values(appState.subjectActivity).reduce((a, b) => a + b, 0) || 1;
  
  Object.entries(appState.subjectActivity).forEach(([subject, count]) => {
    const masteryPct = Math.min(100, Math.round((count / totalActions) * 100));
    
    const item = document.createElement("div");
    item.className = "mastery-item";
    item.innerHTML = `
      <div class="mastery-meta">
        <span class="mastery-subject-name">${subject === "mathematics" ? "Maths" : subject}</span>
        <span class="mastery-score-pct">${masteryPct}%</span>
      </div>
      <div class="mastery-bar-container">
        <div class="mastery-bar-fill" style="width: ${masteryPct}%; background: ${
          subject === "informatique" ? "var(--primary)" : 
          subject === "mathematics" ? "var(--secondary)" : 
          subject === "physique" ? "var(--warning)" : "var(--accent)"
        }"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function unlockAchievement(id) {
  const ach = document.getElementById(id);
  if (ach && ach.classList.contains("locked")) {
    ach.classList.remove("locked");
    const title = ach.querySelector("h5").innerText;
    showToast(`Succès Débloqué : ${title} 🏆`, "success");
    logActivity("achievement", `Succès : "${title}"`, "achievement");
  }
}

// 11. RECOMMANDATIONS & CONSEILS
function generateRecommendations() {
  const container = document.getElementById("recommendations-container");
  if (!container) return;
  container.innerHTML = "";
  
  let recommendations = [];
  
  if (currentCourseData.isCustom) {
    recommendations.push({
      title: "Document personnalisé actif",
      desc: `Vous étudiez "${currentCourseData.name}". Posez des questions spécifiques ou générez un quiz pour valider vos connaissances.`,
      icon: "file-text"
    });
  } else {
    recommendations.push({
      title: "Utilisation du cours d'exemple",
      desc: "Importez vos propres documents de cours (PDF, TXT) depuis l'écran d'accueil ou le tableau de bord pour une étude personnalisée.",
      icon: "file-up"
    });
  }
  
  if (!appState.apiKey) {
    recommendations.push({
      title: "Activez l'IA générative connectée",
      desc: "Renseignez votre clé API Gemini dans les Paramètres pour débloquer des explications hyper-détaillées et des quiz illimités sur votre cours.",
      icon: "key"
    });
  }
  
  const randomAdvice = ADVICE_TEMPLATES[Math.floor(Math.random() * ADVICE_TEMPLATES.length)];
  recommendations.push({
    title: "Conseil de l'Assistant",
    desc: randomAdvice,
    icon: "sparkles"
  });
  
  recommendations.forEach(rec => {
    const item = document.createElement("div");
    item.className = "recommendation-item";
    item.innerHTML = `
      <i data-lucide="${rec.icon}" style="width: 20px; height: 20px; flex-shrink:0;"></i>
      <div>
        <strong>${rec.title}</strong>
        <p>${rec.desc}</p>
      </div>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// 12. PARAMETRES ET SAUVEGARDES
function saveApiKey() {
  const input = document.getElementById("gemini-api-key");
  const key = input.value.trim();
  
  if (!key) {
    showToast("Veuillez saisir une clé API !", "error");
    return;
  }
  
  appState.apiKey = key;
  saveStateToLocalStorage();
  showToast("Clé API Gemini enregistrée !", "success");
  logActivity("settings_change", "Clé API mise à jour", "settings");
  input.value = "";
}

function deleteApiKey() {
  appState.apiKey = "";
  saveStateToLocalStorage();
  showToast("Clé API supprimée", "info");
  logActivity("settings_change", "Clé API supprimée", "settings");
}

function toggleKeyVisibility() {
  const input = document.getElementById("gemini-api-key");
  const icon = document.querySelector("#toggle-key-visibility i");
  if (input.type === "password") {
    input.type = "text";
    icon.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    icon.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
}

function loadDemoData() {
  appState.xp = 1150;
  appState.quizzesCompleted = 8;
  appState.totalAnswers = 40;
  appState.totalCorrectAnswers = 31;
  appState.studyTimeMin = 145;
  appState.subjectActivity = {
    informatique: 15,
    mathematics: 8,
    physique: 10,
    svt: 7
  };
  
  appState.recentActivities = [
    { type: "quiz_complete", desc: "Quiz informatique complété en O(log n) (5/5)", sender: "quiz", date: "Hier" },
    { type: "bot_query", desc: "Question RAG : 'Mécanique Newtonienne'", sender: "bot", date: "Il y a 2 jours" },
    { type: "achievement", desc: "Succès : 'Savant Local'", sender: "achievement", date: "Il y a 3 jours" }
  ];
  
  saveStateToLocalStorage();
  updateUI();
  
  initPerformanceChart();
  renderMasteryBars();
  
  unlockAchievement("ach-1");
  unlockAchievement("ach-2");
  
  showToast("Données démo chargées !", "success");
}

function resetProfile() {
  if (confirm("Réinitialiser toutes vos données d'étude ?")) {
    appState = {
      studentName: "Étudiant PFE",
      xp: 0,
      quizzesCompleted: 0,
      totalCorrectAnswers: 0,
      totalAnswers: 0,
      studyTimeMin: 0,
      subjectActivity: {
        informatique: 0,
        mathematics: 0,
        physique: 0,
        svt: 0
      },
      recentActivities: [],
      apiKey: ""
    };
    
    currentCourseData = {
      name: "Aucun document chargé",
      text: "",
      chunks: [],
      isCustom: false
    };
    
    localStorage.removeItem("eduaiprep_state");
    document.querySelectorAll(".achievement-item").forEach(ach => ach.classList.add("locked"));
    
    updateUI();
    
    // Retourner à l'écran d'accueil
    document.getElementById("app-container").classList.add("hidden");
    document.getElementById("welcome-portal").classList.remove("hidden");
    
    const submitBtn = document.getElementById("portal-submit-btn");
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="play"></i> Commencer la révision`;
    
    // Vider les statuts
    document.getElementById("portal-file-status").classList.add("hidden");
    uploadedFileTemp = null;
    selectedExampleKey = null;
    
    showToast("Profil réinitialisé !", "warning");
    lucide.createIcons();
  }
}

// Activités et LocalStorage
function logActivity(type, desc, sender) {
  const act = {
    type: type,
    desc: desc,
    sender: sender,
    date: "À l'instant"
  };
  appState.recentActivities.unshift(act);
  if (appState.recentActivities.length > 5) appState.recentActivities.pop();
}

function saveStateToLocalStorage() {
  const fullSave = {
    appState: appState,
    currentCourseData: currentCourseData
  };
  localStorage.setItem("eduaiprep_state", JSON.stringify(fullSave));
}

function loadStateFromLocalStorage() {
  const saved = localStorage.getItem("eduaiprep_state");
  if (saved) {
    try {
      const fullSave = JSON.parse(saved);
      if (fullSave.appState) appState = fullSave.appState;
      if (fullSave.currentCourseData) currentCourseData = fullSave.currentCourseData;
    } catch (e) {
      console.error("LocalStorage load error:", e);
    }
  }
}

function updateUI() {
  document.getElementById("user-xp-display").innerText = appState.xp;
  document.getElementById("stat-quizzes").innerText = appState.quizzesCompleted;
  
  const accuracy = appState.totalAnswers > 0 
    ? Math.round((appState.totalCorrectAnswers / appState.totalAnswers) * 100) 
    : 0;
  document.getElementById("stat-avg-score").innerText = `${accuracy}%`;
  
  let fav = "-";
  let maxActivity = 0;
  Object.entries(appState.subjectActivity).forEach(([sub, count]) => {
    if (count > maxActivity) {
      maxActivity = count;
      fav = sub === "mathematics" ? "Maths" : sub.charAt(0).toUpperCase() + sub.slice(1);
    }
  });
  document.getElementById("stat-favorite-subject").innerText = fav;
  
  const container = document.getElementById("activity-container");
  if (container) {
    container.innerHTML = "";
    if (appState.recentActivities.length === 0) {
      container.innerHTML = `<div class="timeline-empty">Aucune activité récente.</div>`;
    } else {
      appState.recentActivities.forEach(act => {
        const item = document.createElement("div");
        item.className = "activity-item";
        let icon = "book";
        if (act.sender === "quiz") icon = "award";
        else if (act.sender === "bot") icon = "bot";
        else if (act.sender === "achievement") icon = "trophy";
        else if (act.sender === "settings") icon = "settings";
        
        item.innerHTML = `
          <div class="activity-icon"><i data-lucide="${icon}" style="width:14px;height:14px"></i></div>
          <div class="activity-details">
            <h5>${act.desc}</h5>
            <p>${act.date}</p>
          </div>
        `;
        container.appendChild(item);
      });
      lucide.createIcons();
    }
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  else if (type === "error") icon = "alert-triangle";
  else if (type === "warning") icon = "alert-circle";
  
  toast.innerHTML = `
    <i data-lucide="${icon}" style="width:16px;height:16px"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.classList.add("hide");
    
    let removed = false;
    const removeToast = () => {
      if (!removed) {
        removed = true;
        toast.remove();
      }
    };
    
    toast.addEventListener("animationend", removeToast);
    // Fallback in case animationend doesn't fire
    setTimeout(removeToast, 350);
  }, 4000);
}
