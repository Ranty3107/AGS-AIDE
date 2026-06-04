// Dictionnaire de catégorisation intelligent
const TYPES_COURRIELS = [
    {
        id: "titre_executoire",
        nom: "Titre exécutoire",
        keywords: [/titre exécutoire/i, /exécutoire/i, /formule exécutoire/i, /recouvrement forcé/i]
    },
    {
        id: "lettre_relance",
        nom: "Lettre de relance",
        keywords: [/relance/i, /rappel/i, /courrier de relance/i, /sans règlement de votre part/i, /premier rappel/i, /2ème rappel/i]
    },
    {
        id: "mise_en_demeure",
        nom: "Mise en demeure",
        keywords: [/mise en demeure/i, /sous peine de/i, /dernière relance avant poursuites/i, /sommation/i]
    },
    {
        id: "delai_reglement",
        nom: "Délai de règlement (demande d’échéancier, validation, échelonnement)",
        keywords: [
            /échéancier/i, /échelonnement/i, /echelonner/i, /délais? de paiement/i, 
            /restant?s? dû/i, /montant(s)? versé(s)?/i, /prélevé(s)?/i, /virement(s)? en cours/i, 
            /prochain(s)? virement/i, /suspension (des )?prélèvement/i, /payer en plusieurs fois/i,
            /mensualisation/i, /accord de délai/i, /validation de l'échéancier/i
        ]
    },
    {
        id: "recours_gracieux",
        nom: "Recours gracieux",
        keywords: [
            /recours gracieux/i, /à titre gracieux/i, /demande de remise/i, /indulgenced/i, 
            /annulation de la dette/i, /remise gracieuse/i, /rembourser moins/i,
            /éviter.*remboursement/i, /calcul est.*incorrect/i, /contester.*montant/i 
        ]
    },
    {
        id: "recours_hierarchique",
        nom: "Recours hiérarchique",
        keywords: [/recours hiérarchique/i, /supérieur hiérarchique/i, /directeur régional/i, /contestation décision/i]
    },
    {
        id: "recours_ta",
        nom: "Recours TA (Tribunal Administratif)",
        keywords: [/tribunal administratif/i, /greffe TA/i, /recours contentieux/i, /requête introductive/i, /ordonnance du tribunal/i, /\bTA\b/i, /pièce jointe.*recours/i]
    },
    {
        id: "satd_atd",
        nom: "SATD / ATD (Saisie Administrative sur Tiers Détenteur / Avis à Tiers Détenteur)",
        keywords: [/\bSATD\b/i, /\bATD\b/i, /saisie administrative/i, /tiers détenteur/i, /saisie sur compte/i, /avis à tiers détenteur/i]
    },
    {
        id: "surendettement",
        nom: "Surendettement : courrier Banque de France",
        keywords: [/surendettement/i, /banque de france/i, /\bBDF\b/i, /commission de surendettement/i, /plan de redressement/i, /recevabilité/i]
    },
    {
        id: "attestation_paiement",
        nom: "Attestation de paiement / Attestation annuelle",
        keywords: [
            /attestation de paiement/i, /attestation annuelle/i, /fin des paiements/i, 
            /solde de la dette/i, /dette soldée/i, /recu de paiement/i, /justificatif de paiement/i, 
            /prouvant mon règlement/i, /acquittée/i, /facture acquittée/i, /attestation de l'année/i, 
            /récapitulatif annuel/i, /attestation fiscale/i, /avis.*imposition/i, /revenus de/i, /déclaration.*revenu/i,
            /soldé.*dette/i, /trop(-)?perçu/i
        ]
    },
    {
        id: "echanges_internes",
        nom: "Échanges internes (ACN-CNG / sante.gouv.fr sans valeur ajoutée)",
        keywords: [/@cng\.sante\.gouv\.fr/i, /@sante\.gouv\.fr/i, /\bACN\b/i, /\bCNG\b/i, /\bAGC-CNG\b/i, /trf:/i, /fw:/i, /pour info/i, /transfert de message/i, /bonne réception/i]
    },
    {
        id: "autres",
        nom: "Autres (demandes de pièces justificatives ou autres) FA VERIFIEO ALOHA SAO ECHANGE INTERNE",
        keywords: [/pièce jointe/i, /justificatif/i, /veuillez trouver ci-joint/i, /envoyer le document/i, /dossier/i, /demande de copie/i]
    }
];

// Initialisation de la grille mémo en bas
document.addEventListener("DOMContentLoaded", () => {
    const memo = document.getElementById('memoCategories');
    memo.innerHTML = TYPES_COURRIELS.map(t => `
        <div class="col-md-4 col-sm-6 mb-1 text-truncate">🔹 ${t.nom}</div>
    `).join('');
});

function analyserMail() {
    const subject = document.getElementById('mailSubject').value.trim();
    const content = document.getElementById('mailContent').value.trim();

    if (!subject && !content) {
        alert("Veuillez remplir au moins le champ Objet ou le Contenu du courriel.");
        return;
    }

    const texteAAnalyser = (subject + " " + content).toLowerCase();
    let matches = [];

    const estEchangeInterne = /@cng\.sante\.gouv\.fr/i.test(texteAAnalyser) || 
                             /@sante\.gouv\.fr/i.test(texteAAnalyser) || 
                             /\bcng\b/i.test(texteAAnalyser) || 
                             /\bacn\b/i.test(texteAAnalyser) || 
                             /\bagc-cng\b/i.test(texteAAnalyser);

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
            if (subject.toLowerCase().match(regex)) {
                score += 15;
            }
            if (content.toLowerCase().match(regex)) {
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

function copierType(nomType) {
    navigator.clipboard.writeText(nomType).then(() => {
        alert(`Copié dans le presse-papiers : \n"${nomType}"`);
    });
}

function reinitialiser() {
    document.getElementById('mailSubject').value = "";
    document.getElementById('mailContent').value = "";
    document.getElementById('resultPlaceholder').style.display = 'block';
    document.getElementById('suggestionsList').style.display = 'none';
    document.getElementById('confidenceBadge').style.display = "none";
}