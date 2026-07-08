// Moteur NLP (Natural Language Processing) et RAG (Retrieval-Augmented Generation) Local
// Écrit en JavaScript pur pour le PFE de préparation aux examens

const FRENCH_STOP_WORDS = new Set([
  "a", "abord", "absolument", "afin", "ah", "ai", "aie", "ailleurs", "aimant", "ainsi", "allais", "aller", "allo", "allons", "allô", "alors", "anterieur", "anterieure", "anterieures", "apres", "après", "as", "assez", "attendu", "au", "aucun", "aucune", "aujourd", "aujourd'hui", "aupres", "auquel", "aura", "auront", "aussi", "autre", "autrefois", "autrement", "autres", "autrui", "aux", "auxquelles", "auxquels", "avaient", "avais", "avait", "avant", "avec", "avoir", "avons", "ayant", "b", "bah", "bas", "basee", "bat", "beau", "beaucoup", "bien", "bienseant", "conforme", "contre", "d", "dans", "de", "debout", "dedans", "dehors", "deja", "delà", "depuis", "derriere", "derrière", "des", "desormais", "desquelles", "desquels", "dessous", "dessus", "deux", "deuxieme", "deuxièmement", "devant", "devers", "devra", "different", "differente", "differentes", "differents", "dire", "directe", "directement", "dit", "dite", "dits", "divers", "diverse", "diverses", "dix", "dix-huit", "dix-neuf", "dix-sept", "doit", "doivent", "donc", "dont", "dos", "douze", "drôle", "debut", "du", "dudit", "durant", "durant", "dès", "de", "e", "effet", "egalement", "egales", "egaux", "elle", "elles", "en", "encore", "enfin", "entre", "envers", "environ", "es", "est", "et", "etant", "etc", "etre", "eu", "euh", "eux", "eux-mêmes", "exactement", "exclure", "excepté", "f", "fais", "faisaient", "faisant", "fait", "faite", "faites", "faits", "façon", "feront", "fi", "flac", "fois", "font", "force", "g", "gens", "h", "haut", "hein", "helas", "hem", "hormis", "hors", "hou", "houp", "hue", "hui", "huit", "huitieme", "hum", "hurrah", "i", "ici", "il", "ils", "importe", "j", "je", "jusqu", "jusque", "juste", "k", "l", "la", "laquelle", "le", "lequel", "les", "lesquelles", "lesquels", "leur", "leurs", "longtemps", "lors", "lorsque", "lui", "lui-meme", "lui-même", "m", "ma", "maint", "maintenant", "mais", "malgre", "malgré", "me", "meme", "memes", "merci", "mes", "mien", "mienne", "miennes", "miens", "mille", "mince", "moi", "moi-meme", "moi-même", "moindres", "moins", "mon", "moyennant", "multiple", "multiples", "qu", "que", "qui", "sa", "son", "se", "ses", "un", "une", "des", "le", "la", "les", "ce", "cet", "cette", "ces"
]);

// 1. Pipeline NLP : Prétraitement de texte
class NLPPipeline {
  // Supprimer les accents et normaliser en minuscules
  static cleanText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9\s]/g, " ");   // Remplace la ponctuation par des espaces
  }

  // Tokenisation et filtrage
  static tokenize(text) {
    const cleaned = this.cleanText(text);
    return cleaned
      .split(/\s+/)
      .map(token => token.trim())
      .filter(token => token.length > 1 && !FRENCH_STOP_WORDS.has(token));
  }

  // Obtenir les n-grammes (facultatif, pour plus de précision)
  static getNGrams(tokens, n = 2) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(" "));
    }
    return ngrams;
  }
}

// 1b. Parser de Documents
class CourseDocumentParser {
  // Clean raw text and split into paragraphs
  static parseToParagraphs(text) {
    if (!text) return [];
    return text
      .split(/\n\s*\n+/) // split by double newlines
      .map(p => p.trim())
      .filter(p => p.length > 20); // only keep paragraphs of significant length
  }

  // Split text into individual sentences
  static parseToSentences(text) {
    if (!text) return [];
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
}

// 1c. Générateur local de contenu académique (Offline mode)
class LocalAIContentGenerator {
  // Generate MCQs from text
  static generateQuiz(text, count = 3) {
    const paragraphs = CourseDocumentParser.parseToParagraphs(text);
    const sentences = CourseDocumentParser.parseToSentences(text);
    const mcqs = [];
    
    const definitionPattern = /([A-Za-zÀ-ÿœŒ\s'-]{3,30})\s+(est\s+un|est\s+une|signifie|permet\s+de|consiste\s+à|est\s+le|est\s+la)\s+([^.]+)/i;
    const candidates = [];
    
    sentences.forEach(sentence => {
      const match = sentence.match(definitionPattern);
      if (match) {
        const concept = match[1].trim();
        const definition = match[3].trim();
        const formattedConcept = concept.charAt(0).toUpperCase() + concept.slice(1);
        
        if (formattedConcept.length > 2 && definition.length > 10 && !candidates.some(c => c.concept.toLowerCase() === formattedConcept.toLowerCase())) {
          candidates.push({
            concept: formattedConcept,
            definition: definition,
            originalSentence: sentence
          });
        }
      }
    });

    if (candidates.length < count) {
      sentences.forEach(sentence => {
        if (sentence.length > 30 && sentence.length < 150 && candidates.length < 10) {
          const tokens = NLPPipeline.tokenize(sentence);
          const longTokens = tokens.filter(t => t.length > 6);
          if (longTokens.length > 0) {
            const hiddenWord = longTokens[Math.floor(Math.random() * longTokens.length)];
            const concept = "Trouvez le mot manquant";
            const definition = sentence.replace(new RegExp(hiddenWord, "gi"), "_______");
            
            if (!candidates.some(c => c.definition === definition)) {
              candidates.push({
                concept: concept,
                definition: definition,
                hiddenWord: hiddenWord,
                originalSentence: sentence
              });
            }
          }
        }
      });
    }

    candidates.sort(() => 0.5 - Math.random());
    const selected = candidates.slice(0, Math.min(count, candidates.length));
    
    selected.forEach((item, index) => {
      let questionText = "";
      let correctAnswerText = "";
      let distractors = [];
      let hint = "";
      let explain = "";
      
      if (item.hiddenWord) {
        questionText = `Complétez la phrase suivante : "${item.definition}"`;
        correctAnswerText = item.hiddenWord.charAt(0).toUpperCase() + item.hiddenWord.slice(1);
        explain = `La phrase complète est : "${item.originalSentence}"`;
        hint = `Le mot commence par la lettre '${item.hiddenWord[0].toUpperCase()}'.`;
        
        distractors = ["Algorithme", "Protocole", "Technologie", "Structure", "Variable", "Fonction", "Système"]
          .filter(w => w.toLowerCase() !== correctAnswerText.toLowerCase())
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      } else {
        questionText = `Quelle est la définition ou le rôle de : "${item.concept}" ?`;
        correctAnswerText = item.definition.charAt(0).toUpperCase() + item.definition.slice(1) + ".";
        explain = `D'après le cours : "${item.originalSentence}"`;
        hint = `Considérez le rôle principal de ${item.concept} mentionné dans le cours.`;
        
        distractors = candidates
          .filter(c => c.concept !== item.concept)
          .map(c => c.definition.charAt(0).toUpperCase() + c.definition.slice(1) + ".")
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
          
        while (distractors.length < 3) {
          distractors.push(`Une méthode alternative pour optimiser les performances de ${item.concept}.`);
          distractors.push(`Un concept théorique non traité dans cette section.`);
          distractors.push(`Une structure de données obsolète.`);
        }
      }
      
      const options = [correctAnswerText, ...distractors];
      options.sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(correctAnswerText);
      
      mcqs.push({
        id: `local_gen_${index}`,
        subject: "Cours Importé",
        difficulty: "medium",
        type: "qcm",
        question: questionText,
        options: options,
        correctAnswer: correctIndex,
        explanation: explain,
        hint: hint,
        keywords: NLPPipeline.tokenize(correctAnswerText)
      });
    });
    
    return mcqs;
  }

  // Generate flashcards from text
  static generateFlashcards(text, count = 6) {
    const sentences = CourseDocumentParser.parseToSentences(text);
    const cards = [];
    const definitionPattern = /([A-Za-zÀ-ÿœŒ\s'-]{3,30})\s+(est\s+un|est\s+une|signifie|permet\s+de|consiste\s+à|est\s+le|est\s+la)\s+([^.]+)/i;
    
    sentences.forEach(sentence => {
      const match = sentence.match(definitionPattern);
      if (match) {
        const concept = match[1].trim();
        const definition = match[3].trim();
        const formattedConcept = concept.charAt(0).toUpperCase() + concept.slice(1);
        
        if (formattedConcept.length > 2 && definition.length > 10 && !cards.some(c => c.front.toLowerCase() === formattedConcept.toLowerCase())) {
          cards.push({
            subject: "Cours Importé",
            front: `Que désigne ou permet de faire : "${formattedConcept}" ?`,
            back: definition.charAt(0).toUpperCase() + definition.slice(1) + "."
          });
        }
      }
    });
    
    if (cards.length < count) {
      const paragraphs = CourseDocumentParser.parseToParagraphs(text);
      paragraphs.forEach((p, idx) => {
        if (p.length > 50 && p.length < 300 && cards.length < 10) {
          const title = p.split(/\s+/).slice(0, 4).join(" ") + "...";
          if (!cards.some(c => c.front.includes(title))) {
            cards.push({
              subject: "Résumé de Cours",
              front: `Expliquez les points clés du paragraphe : "${title}"`,
              back: p
            });
          }
        }
      });
    }
    
    cards.sort(() => 0.5 - Math.random());
    return cards.slice(0, count);
  }
}

// 2. Moteur d'indexation vectorielle TF-IDF
class TFIDFIndexer {
  constructor(documents = []) {
    this.documents = documents; // Tableau d'objets { id, content, subject, ... }
    this.idf = {};
    this.docVectors = {};
    this.buildIndex();
  }

  buildIndex() {
    if (this.documents.length === 0) return;

    const docCount = this.documents.length;
    const docTermFreqs = [];
    const termDocAppearances = {};

    // 1. Calculer les Term Frequencies (TF) pour chaque document
    this.documents.forEach((doc, idx) => {
      const tokens = NLPPipeline.tokenize(doc.content);
      const tf = {};
      
      tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
      });

      // Normaliser la fréquence (TF = occurrences / total_mots)
      const totalTokens = tokens.length;
      for (let token in tf) {
        tf[token] = tf[token] / totalTokens;
      }

      docTermFreqs.push(tf);

      // Compter le nombre de documents contenant chaque terme
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        termDocAppearances[token] = (termDocAppearances[token] || 0) + 1;
      });
    });

    // 2. Calculer le Inverse Document Frequency (IDF) pour chaque terme
    // IDF = log(Total Documents / Documents contenant le terme) + 1 (pour éviter les divisions par zéro)
    for (let term in termDocAppearances) {
      this.idf[term] = Math.log(docCount / termDocAppearances[term]) + 1;
    }

    // 3. Calculer les vecteurs TF-IDF finaux pour chaque document
    this.documents.forEach((doc, idx) => {
      const tf = docTermFreqs[idx];
      const vector = {};
      
      for (let term in tf) {
        vector[term] = tf[term] * (this.idf[term] || 1);
      }

      this.docVectors[doc.id] = vector;
    });
  }

  // Vectoriser une nouvelle requête en utilisant l'IDF de l'index
  vectorizeQuery(queryText) {
    const tokens = NLPPipeline.tokenize(queryText);
    const tf = {};
    
    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    const totalTokens = tokens.length || 1;
    const vector = {};

    for (let token in tf) {
      const termTf = tf[token] / totalTokens;
      // On n'utilise que les termes connus de l'index pour la requête
      if (this.idf[token]) {
        vector[token] = termTf * this.idf[token];
      }
    }

    return vector;
  }

  // Calcul de la similarité cosinus entre deux vecteurs
  static cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    // Union des clés des deux vecteurs
    const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    terms.forEach(term => {
      const valA = vecA[term] || 0.0;
      const valB = vecB[term] || 0.0;
      
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    });

    if (normA === 0 || normB === 0) return 0.0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// 3. Moteur RAG Local (Retrieval-Augmented Generation)
class LocalRAGEngine {
  constructor(documents) {
    this.indexer = new TFIDFIndexer(documents);
    this.documents = documents;
  }

  // Rechercher les documents pertinents (RETRIEVAL)
  retrieve(queryText, limit = 2) {
    const startTime = performance.now();
    const queryVector = this.indexer.vectorizeQuery(queryText);
    const queryTokens = NLPPipeline.tokenize(queryText);
    
    const results = [];

    this.documents.forEach(doc => {
      const docVector = this.indexer.docVectors[doc.id] || {};
      const similarity = TFIDFIndexer.cosineSimilarity(queryVector, docVector);
      
      if (similarity > 0.05) { // Seuil minimal de pertinence
        results.push({
          document: doc,
          similarity: similarity
        });
      }
    });

    // Trier par score de similarité décroissant
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);
    const endTime = performance.now();

    return {
      queryTokens: queryTokens,
      queryVector: queryVector,
      retrievedChunks: topResults,
      searchTimeMs: (endTime - startTime).toFixed(2)
    };
  }

  // Générer une réponse locale basée sur le contexte récupéré
  generateLocalResponse(queryText, retrievalData) {
    const chunks = retrievalData.retrievedChunks;
    
    if (chunks.length === 0) {
      return {
        answer: "Désolé, je ne trouve pas d'informations spécifiques à ce sujet dans ma base de connaissances. Essayez de reformuler avec d'autres mots-clés (comme 'HTTP', 'Newton', 'dérivée' ou 'ADN').",
        contextUsed: []
      };
    }

    // Extraction des faits clés et construction de la réponse avec citations
    let answer = `Voici ce que j'ai trouvé dans vos cours :\n\n`;
    
    chunks.forEach((item, index) => {
      const doc = item.document;
      answer += `**${doc.title}** *(Source: ${doc.source}, Similarité: ${(item.similarity * 100).toFixed(1)}%)*\n`;
      answer += `> ${doc.content}\n\n`;
    });

    answer += `En espérant que ces détails vous aident dans votre préparation ! Posez-moi une autre question ou lancez un quiz pour tester vos acquis.`;

    return {
      answer: answer,
      contextUsed: chunks.map(c => c.document.id)
    };
  }
}

// 4. Système d'Évaluation Automatique NLP
class NLPAutoEvaluator {
  // Évaluer la réponse de l'étudiant
  static evaluate(studentAnswer, modelAnswerKeywords, modelExplanation) {
    const startTime = performance.now();
    
    // Prétraitement
    const studentTokens = NLPPipeline.tokenize(studentAnswer);
    const modelTokens = NLPPipeline.tokenize(modelExplanation);
    
    // 1. Analyse des mots-clés obligatoires
    const cleanStudentAnswer = NLPPipeline.cleanText(studentAnswer);
    const keywordsStatus = modelAnswerKeywords.map(kw => {
      const cleanKw = NLPPipeline.cleanText(kw);
      const isPresent = cleanStudentAnswer.includes(cleanKw);
      return { keyword: kw, found: isPresent };
    });

    const foundCount = keywordsStatus.filter(k => k.found).length;
    const keywordScore = modelAnswerKeywords.length > 0 ? (foundCount / modelAnswerKeywords.length) : 1;

    // 2. Calcul de la similarité cosinus TF-IDF locale (comparaison sémantique directe)
    // On crée un micro-corpus avec la réponse modèle et la réponse étudiant pour calculer les poids
    const docs = [
      { id: "model", content: modelExplanation },
      { id: "student", content: studentAnswer }
    ];
    
    const indexer = new TFIDFIndexer(docs);
    const modelVec = indexer.docVectors["model"] || {};
    const studentVec = indexer.docVectors["student"] || {};
    
    const semanticSimilarity = TFIDFIndexer.cosineSimilarity(modelVec, studentVec);

    // 3. Calcul de la note finale sur 20
    // Pondération : 50% de présence de mots-clés clés, 50% de similarité globale de contenu
    let finalPercentage = (keywordScore * 0.5) + (semanticSimilarity * 0.5);
    
    // Bonus léger si la réponse est bien construite (plus de 10 mots significatifs)
    if (studentTokens.length > 10 && finalPercentage > 0.3) {
      finalPercentage = Math.min(1.0, finalPercentage + 0.05);
    }
    
    const score20 = (finalPercentage * 20).toFixed(1);
    const endTime = performance.now();

    // Appréciation automatique en fonction de la note
    let appreciation = "";
    if (score20 >= 16) appreciation = "Excellent travail ! Votre réponse est précise et utilise la bonne terminologie.";
    else if (score20 >= 12) appreciation = "Bonne réponse. Les concepts essentiels sont là, mais certains détails ou mots-clés manquent.";
    else if (score20 >= 8) appreciation = "Réponse incomplète ou trop vague. Pensez à réviser la fiche de cours correspondante.";
    else appreciation = "Hors-sujet ou réponse insuffisante. Relisez attentivement le cours avant de réessayer.";

    return {
      scorePercentage: finalPercentage,
      score20: parseFloat(score20),
      keywordsStatus: keywordsStatus,
      semanticSimilarity: semanticSimilarity,
      appreciation: appreciation,
      executionTimeMs: (endTime - startTime).toFixed(2),
      studentTokens: studentTokens
    };
  }
}

// 5. Générateur automatique local de Quiz basé sur le NLP
class LocalQuestionGenerator {
  static generate(chunks, count = 5) {
    if (!chunks || chunks.length === 0) return [];
    
    // Indexer les chunks pour calculer les TF-IDF et trouver les mots-clés importants
    const indexer = new TFIDFIndexer(chunks);
    const questions = [];
    
    // Récupérer tous les mots-clés importants de tout le document (pour servir de distracteurs)
    const allKeyTerms = [];
    for (let docId in indexer.docVectors) {
      const vec = indexer.docVectors[docId];
      // Trier les mots par poids TF-IDF
      const sortedTerms = Object.entries(vec)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      if (sortedTerms.length > 0) {
        allKeyTerms.push(...sortedTerms.slice(0, 3));
      }
    }
    const uniqueDistractors = [...new Set(allKeyTerms)].filter(term => term.length > 3);

    // Parcourir les chunks pour générer des questions
    chunks.forEach((chunk, chunkIdx) => {
      const text = chunk.content;
      // Extraire les phrases
      const sentences = text.split(/[.!?]\s+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 180);
      
      // Essayer de trouver une phrase contenant un marqueur de définition
      const definitionMarkers = [" est ", " sont ", " consiste a ", " consiste à ", " permet de ", " signifie "];
      let definitionSentence = null;
      let markerUsed = "";
      
      for (let s of sentences) {
        for (let marker of definitionMarkers) {
          if (s.toLowerCase().includes(marker)) {
            definitionSentence = s;
            markerUsed = marker;
            break;
          }
        }
        if (definitionSentence) break;
      }
      
      let sentenceToUse = definitionSentence || (sentences.length > 0 ? sentences[0] : text);
      
      if (sentenceToUse) {
        // Obtenir le vecteur TF-IDF du chunk
        const vec = indexer.docVectors[chunk.id] || {};
        const sortedChunkTerms = Object.entries(vec)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])
          .filter(t => t.length > 3 && sentenceToUse.toLowerCase().includes(t));
          
        if (sortedChunkTerms.length > 0) {
          const targetTerm = sortedChunkTerms[0]; // Le mot le plus important de la phrase
          
          // Créer une question de type QCM (1 chance sur 2)
          if (chunkIdx % 2 === 0 && uniqueDistractors.length >= 3) {
            // Remplacer le mot-clé dans la phrase
            const regex = new RegExp("\\b" + targetTerm + "\\b", "gi");
            const questionText = sentenceToUse.replace(regex, "_______");
            
            // Sélectionner 3 distracteurs qui ne sont pas le mot cible
            let distractors = uniqueDistractors
              .filter(d => d.toLowerCase() !== targetTerm.toLowerCase())
              .slice(0, 3);
            
            // Si pas assez de distracteurs, en ajouter des génériques
            while (distractors.length < 3) {
              distractors.push("concept_" + distractors.length);
            }
            
            const options = [targetTerm, ...distractors];
            // Mélanger les options
            options.sort(() => 0.5 - Math.random());
            const correctIdx = options.indexOf(targetTerm);
            
            questions.push({
              id: `dyn_qcm_${chunkIdx}`,
              subject: chunk.subject || "Cours",
              difficulty: "moyen",
              type: "qcm",
              question: `Complétez la phrase suivante : "${questionText}"`,
              options: options,
              correctAnswer: correctIdx,
              explanation: `D'après votre cours : "${sentenceToUse}"`,
              hint: `Le terme manquant commence par la lettre '${targetTerm.charAt(0).toUpperCase()}'`
            });
          } else {
            // Créer une question ouverte
            const conceptName = targetTerm.charAt(0).toUpperCase() + targetTerm.slice(1);
            
            // Récupérer les 3 autres mots-clés importants du chunk pour l'évaluation sémantique
            const keyAnswers = sortedChunkTerms.slice(0, 4);
            
            questions.push({
              id: `dyn_open_${chunkIdx}`,
              subject: chunk.subject || "Cours",
              difficulty: "moyen",
              type: "open",
              question: `Expliquez en vos propres termes le concept de "${conceptName}" tel qu'évoqué dans votre cours.`,
              options: null,
              correctAnswer: keyAnswers, // Array de mots-clés attendus
              explanation: chunk.content, // Explication modèle = le paragraphe entier
              hint: `Pensez à mentionner les termes suivants dans votre explication : ${keyAnswers.join(", ")}.`
            });
          }
        }
      }
    });

    // Si on a généré moins de questions que demandé, ou aucune, compléter avec un quiz générique basé sur les paragraphes du texte
    if (questions.length === 0) {
      chunks.forEach((chunk, idx) => {
        if (idx < count) {
          questions.push({
            id: `dyn_fallback_${idx}`,
            subject: chunk.subject || "Cours",
            difficulty: "moyen",
            type: "open",
            question: `Résumez les points essentiels abordés dans ce passage de votre cours : "${chunk.title}"`,
            options: null,
            correctAnswer: NLPPipeline.tokenize(chunk.content).slice(0, 5),
            explanation: chunk.content,
            hint: "Relisez le paragraphe et synthétisez ses idées principales."
          });
        }
      });
    }

    return questions.slice(0, count);
  }
}

// 6. Générateur automatique local de Flashcards basé sur le NLP
class LocalFlashcardGenerator {
  static generate(chunks) {
    if (!chunks || chunks.length === 0) return [];
    
    const indexer = new TFIDFIndexer(chunks);
    const flashcards = [];
    
    chunks.forEach((chunk, idx) => {
      const vec = indexer.docVectors[chunk.id] || {};
      const sortedChunkTerms = Object.entries(vec)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .filter(t => t.length > 3);
        
      if (sortedChunkTerms.length > 0) {
        const keyConcept = sortedChunkTerms[0].toUpperCase();
        // Première phrase comme définition résumée
        const firstSentence = chunk.content.split(/[.!?]\s+/)[0] + ".";
        
        flashcards.push({
          subject: chunk.subject || "Cours",
          front: `Qu'est-ce que le concept de : "${keyConcept}" ?`,
          back: `Définition / Explication : ${firstSentence}\n\nContexte : ${chunk.content.substring(0, 150)}...`
        });
      } else {
        flashcards.push({
          subject: chunk.subject || "Cours",
          front: `Notion clé du chapitre : ${chunk.title}`,
          back: chunk.content
        });
      }
    });
    
    return flashcards;
  }
}

