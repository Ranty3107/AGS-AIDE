// Dictionnaire de catégorisation intelligent (Insensible aux accents et à la casse)
const TYPES_COURRIELS = [
    {
        id: "titre_executoire",
        nom: "Titre exécutoire",
        keywords: [/titre executoire/i, /executoire/i, /formule executoire/i, /recouvrement force/i]
    },
    {
        id: "lettre_relance",
        nom: "Lettre de relance",
        keywords: [/courrier de relance/i, /sans reglement de votre part/i, /premier rappel/i, /2eme rappel/i, /rappel/i, /(?<!derniere )relance(?! avant poursuites)/i]
    },
    {
        id: "mise_en_demeure",
        nom: "Mise en demeure",
        keywords: [/mise en demeure/i, /sous peine de/i, /derniere relance avant poursuites/i, /sommation/i]
    },
    {
        id: "delai_reglement",
        nom: "Délai de règlement (demande d’échéancier, validation, échelonnement)",
        keywords: [
            /echeancier/i,
            /echelonnement/i,
            /echelonner/i,
            /delais? de paiement/i,
            /restant?s? du/i,
            /montant(s)? verse(s)?/i,
            /preleve(s)?/i,
            /virement(s)? en cours/i,
            /prochain(s)? virement/i,
            /suspension (des )?prelevement/i,
            /payer en plusieurs fois/i,
            /mensualisation/i,
            /accord de delai/i,
            /validation de l.?echeancier/i,
            /confirme les echeances/i,

            // Paiements effectués
            /nouveau virement/i,
            /je viens de realiser un nouveau virement/i,
            /solde du remboursement/i,
            /reste actuellement/i,
            /deja rembourse/i,
            /ferai parvenir dans les meilleurs delais/i,

            // Prélèvements
            /autorisation de prelevement/i,
            /prelevement mensuel/i,
            /mensualite/i,
            /paiement mensuel/i,

            // Suspension / report
            /suspendre le remboursement/i,
            /suspension du remboursement/i,
            /demande de suspension/i,
            /report de paiement/i,
            /suspension de la procedure/i,

            // Installation permettant d'honorer le CESP
            /installation.*zone sous[- ]dotee/i,
            /honorer le cesp/i,
            /pouvoir honorer/i,
            /contrat de collaboration/i,
            /installation sera effective/i,

            // Négociation d'un accord de paiement
            /trouver un accord/i,
            /en negociation/i,
            /honorer ce dit contrat/i
        ]
    },
    {
        id: "recours_gracieux",
        nom: "Recours gracieux",
        keywords: [
            /recours gracieux/i, /a titre gracieux/i, /demande de remise/i, /indulgence/i, 
            /annulation de la dette/i, /remise gracieuse/i, /rembourser moins/i,
            /\beviter le remboursement/i, /ne pas rembourser/i,
            /calcul est.*incorrect/i, /contester.*montant.*penalite/i,
            /pourquoi m'appliquez(-vous)? vous cette penalite/i,
            /pourquoi m'avez(-vous)? vous penalise/i,
            /faible salaire/i,
            /contrat.*mentionne/i,
            /interne cette annee/i
        ]
    },
    {
        id: "recours_hierarchique",
        nom: "Recours hiérarchique",
        keywords: [/recours hierarchique/i, /superieur hierarchique/i, /directeur regional/i, /contestation decision/i]
    },
    {
        id: "recours_ta",
        nom: "Recours TA (Tribunal Administratif)",
        keywords: [/tribunal administratif/i, /greffe ta/i, /recours contentieux/i, /requete introductive/i, /ordonnance du tribunal/i, /\bta\b/i, /piece jointe.*recours/i]
    },
    {
        id: "satd_atd",
        nom: "SATD / ATD (Saisie Administrative sur Tiers Détenteur / Avis à Tiers Détenteur)",
        keywords: [/\bsatd\b/i, /\batd\b/i, /saisie administrative/i, /tiers detenteur/i, /saisie sur compte/i, /avis a tiers detenteur/i]
    },
    {
        id: "surendettement",
        nom: "Surendettement : courrier Banque de France",
        keywords: [/surendettement/i, /banque de france/i, /\bbdf\b/i, /commission de surendettement/i, /plan de redressement/i, /recevabilite/i]
    },
    {
        id: "attestation_paiement",
        nom: "Attestation de paiement / Attestation annuelle",
        keywords: [
            /attestation de paiement/i, /attestation annuelle/i, /fin des paiements/i, 
            /solde de la dette/i, /dette soldee/i, /recu de paiement/i, /justificatif de paiement/i, 
            /prouvant mon reglement/i, /acquittee/i, /facture acquittee/i, /attestation de l'annee/i, 
            /recapitulatif annuel/i, /attestation fiscale/i, 
            /revenus? de/i, /declaration.*revenu/i, // ✨ Placé ici de façon optimale pour éviter les fausses détections
            /solde.*dette/i, /trop(-)?percu/i
        ]
    },
    {
        id: "echanges_internes",
        nom: "Échanges internes (ACN-CNG / sante.gouv.fr sans valeur ajoutée)",
        keywords: [/@cng\.sante\.gouv\.fr/i, /@sante\.gouv\.fr/i, /\bacn\b/i, /\bcng\b/i, /\bagc-cng\b/i, /trf:/i, /fw:/i, /pour info/i, /transfert de message/i, /bonne reception/i]
    },
    {
        id: "autres",
        nom: "Autres (demandes de pièces justificatives ou autres) FA VERIFIEO ALOHA SAO ECHANGE INTERNE",
        keywords: [/piece jointe/i, /justificatif/i, /veuillez trouver ci-joint/i, /envoyer le document/i, /dossier/i, /demande de copie/i, /imposition/i,] // 🛠️ 
    }
];

// Initialisation de la grille mémo en bas
document.addEventListener("DOMContentLoaded", () => {
    const memo = document.getElementById('memoCategories');
    if (memo) {
        memo.innerHTML = TYPES_COURRIELS.map(t => `
            <div class="col-md-4 col-sm-6 mb-1 text-truncate">🔹 ${t.nom}</div>
        `).join('');
    }
});

// Fonction utilitaire pour enlever les accents et passer en minuscule
function nettoyerTexte(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function analyserMail() {
    const subjectRaw = document.getElementById('mailSubject').value.trim();
    const contentRaw = document.getElementById('mailContent').value.trim();

    if (!subjectRaw && !contentRaw) {
        alert("Veuillez remplir au moins le champ Objet ou le Contenu du courriel.");
        return;
    }

    // Normalisation complète (Minuscule + Sans accent)
    const subjectNormalise = nettoyerTexte(subjectRaw);
    const contentNormalise = nettoyerTexte(contentRaw);
    const texteAAnalyserMinuscule = subjectNormalise + " " + contentNormalise;
    
    let matches = [];

    // Vérification des échanges internes sur le texte normalisé
    const estEchangeInterne = /@cng\.sante\.gouv\.fr/i.test(texteAAnalyserMinuscule) || 
                              /@sante\.gouv\.fr/i.test(texteAAnalyserMinuscule) || 
                              /\bcng\b/i.test(texteAAnalyserMinuscule) || 
                              /\bacn\b/i.test(texteAAnalyserMinuscule) || 
                              /\bagc-cng\b/i.test(texteAAnalyserMinuscule);

    if (estEchangeInterne) {
        matches.push({ 
            type: "Échanges internes (ACN-CNG / sante.gouv.fr sans valeur ajoutée)", 
            score: 100 
        });
        afficherResultats(matches);
        return;
    }

    TYPES_COURRIELS.forEach(type => {
        if (type.id === "echanges_internes") return;
        
        let score = 0;
        type.keywords.forEach(regex => {
            if (subjectNormalise.match(regex)) {
                score += 50; // Avantage décisif à l'objet
            }
            if (contentNormalise.match(regex)) {
                score += 5;
            }
        });

        if (type.id === "autres" && score > 0) {
            score = score * 0.5;
        }

        if (score > 0) {
            matches.push({ type: type.nom, score: score });
        }
    });

    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        matches.push({ type: "Autres (demandes de pièces justificatives ou autres) / FA VERIFIEO ALOHA SAO ECHANGE INTERNE", score: 1 });
    }

    afficherResultats(matches);
}

function afficherResultats(matches) {
    document.getElementById('resultPlaceholder').style.display = 'none';
    document.getElementById('suggestionsList').style.display = 'block';
    
    const container = document.getElementById('categoriesContainer');
    const badge = document.getElementById('confidenceBadge');
    container.innerHTML = "";

    if (matches[0].score >= 90) {
        badge.className = "badge bg-dark";
        badge.innerText = "Échange Interne Détecté 🏢";
        badge.style.display = "inline-block";
    } else if (matches[0].score >= 15) {
        badge.className = "badge bg-success";
        badge.innerText = "Confiance Élevée 🎯";
        badge.style.display = "inline-block";
    } else if (matches[0].score > 2) {
        badge.className = "badge bg-warning text-dark";
        badge.innerText = "Confiance Modérée ⚖️";
        badge.style.display = "inline-block";
    } else {
        badge.className = "badge bg-danger";
        badge.innerText = "À voir avec Arison Andriamalala 🔍";
        badge.style.display = "inline-block";
    }

    matches.forEach((m, idx) => {
        const isFirst = idx === 0;
        const cardClass = isFirst ? 'suggestion-item best-match p-3 mb-2 bg-white border rounded shadow-sm d-flex justify-content-between align-items-center' : 'suggestion-item p-3 mb-2 bg-white border rounded d-flex justify-content-between align-items-center';
        
        container.innerHTML += `
            <div class="${cardClass}" onclick="copierType('${m.type.replace(/'/g, "\\'")}')" title="Cliquez pour copier la catégorie">
                <div>
                    <span class="type-title fs-6">${m.type}</span>
                    <div class="mt-1"><span class="score-tag">Indice de correspondance : ${Math.round(m.score)}</span></div>
                </div>
                <button class="btn btn-sm btn-outline-primary btn-copy fw-bold" style="font-size:0.75rem;">📋 COPIER</button>
            </div>
        `;
    });
}

// Les fonctions copierType et reinitialiser restent identiques...