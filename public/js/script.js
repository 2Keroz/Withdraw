function filtrerCompetitions() {
    const jeuId = document.getElementById("jeuId").value;
    const competitionSelect = document.getElementById("competitionId");

    console.log("Jeu sélectionné:", jeuId);
    console.log("Compétitions par jeu:", competitionsByJeu);

    competitionSelect.innerHTML = '<option value="">-- Sélectionnez une compétition --</option>';

    if (competitionsByJeu[jeuId]) {
        competitionsByJeu[jeuId].forEach(competition => {
            const option = document.createElement('option');
            option.value = competition.id;
            option.textContent = competition.nom;
            competitionSelect.appendChild(option);
        });
    }
}

// Fonction pour récupérer les équipes en fonction de la compétition sélectionnée
async function getEquipes(competitionId) {
    const response = await fetch(`/admin/equipes/${competitionId}`);

    if (!response.ok) {
        console.error("Erreur lors de la récupération des équipes :", response.statusText);
        return [];
    }

    const data = await response.json();
    return data;
}

// Fonction pour filtrer les équipes en fonction de la compétition sélectionnée
async function filtrerEquipes() {
    const competitionId = document.getElementById("competitionId").value;
    const equipe1Select = document.getElementById("equipe1Id");
    const equipe2Select = document.getElementById("equipe2Id");

    equipe1Select.innerHTML = '<option value="">-- Sélectionnez l\'équipe 1 --</option>';
    equipe2Select.innerHTML = '<option value="">-- Sélectionnez l\'équipe 2 --</option>';

    if (competitionId) {
        const equipes = await getEquipes(competitionId);
        if (equipes.length === 0) {
            console.warn("Aucune équipe trouvée pour la compétition sélectionnée.");
        }
        equipes.forEach(equipe => {
            const option1 = document.createElement('option');
            option1.value = equipe.id;
            option1.textContent = equipe.nom;
            equipe1Select.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = equipe.id;
            option2.textContent = equipe.nom;
            equipe2Select.appendChild(option2);
        });

        // Pré-remplir les équipes après avoir filtré
        if (equipe1Id) {
            equipe1Select.value = equipe1Id;
        }
        if (equipe2Id) {
            equipe2Select.value = equipe2Id;
        }
    }
}

// Fonction pour charger les compétitions d'un jeu spécifique
function loadCompetitions(jeuId) {
    const competitionList = document.getElementById(`competitions-${jeuId}`);

    if (competitionList.childElementCount === 0) {
        fetch(`/home/jeux/${jeuId}/competitions`).then(response => response.json()).then(competitions => {
            competitionList.style.display = 'block';
            competitions.forEach(competition => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" onclick="loadMatchs(${competition.id})" class="text-blue-600 hover:underline">${competition.nom}</a>`;
                competitionList.appendChild(li);
            });
        }).catch(error => console.error("Erreur lors du chargement des compétitions:", error));
    } else {
        competitionList.style.display = (competitionList.style.display === 'none') ? 'block' : 'none';
    }
}

// Fonction pour charger les matchs d'une compétition spécifique
function loadMatchs(competitionId) {
    fetch(`/home/competitions/${competitionId}/matchs`).then(response => response.json()).then(matchs => {
        const matchsContainer = document.getElementById('matchs-container');
        matchsContainer.innerHTML = '<ul class="space-y-4">' + matchs.map(match => `
            <li class="p-4 border border-gray-300 rounded-md">
                <h3 class="text-lg font-bold">${match.equipe1.nom} vs ${match.equipe2.nom}</h3>
                <p class="text-gray-600">Date : ${new Date(match.date).toLocaleDateString()} à ${new Date(match.date).toLocaleTimeString()}</p>
            </li>
        `).join('') + '</ul>';
    }).catch(error => console.error("Erreur lors du chargement des matchs:", error));
}

// Fonction pour charger les matchs passés
function loadMatchsPasses() {
    fetch('/home/matchs-passes').then(response => response.json()).then(matchsPasses => {
        const matchsPassesContainer = document.getElementById('matchs-passes-container');
        if (matchsPasses.length > 0) {
            matchsPassesContainer.innerHTML = '<ul class="space-y-4">' + matchsPasses.map(match => {
                const date = new Date(match.date);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let gagnantText = match.cloture ? `Équipe gagnante : <b>${match.equipeGagnante.nom}</b>` : "<b>Match pas encore clôturé</b>";

                return `
                    <li class="p-4 border border-gray-300 rounded-md">
                        <h3 class="text-lg font-bold">${match.equipe1.nom} vs ${match.equipe2.nom}</h3>
                        <p class="text-gray-600">Date : ${formattedDate} à ${formattedTime}</p>
                        <p class="text-gray-600">${gagnantText}</p>
                    </li>
                `;
            }).join('') + '</ul>';
        } else {
            matchsPassesContainer.innerHTML = '<p class="text-gray-600">Aucun match passé pour le moment.</p>';
        }
    }).catch(error => console.error("Erreur lors du chargement des matchs passés:", error));
}

// Charger automatiquement les matchs passés au chargement de la page
document.addEventListener('DOMContentLoaded', loadMatchsPasses);

// Fonction pour ouvrir la modale de pari
function openBetModal(matchId, equipeChoisie) {
    document.getElementById('betModal').classList.remove('hidden');
    document.getElementById('modalMatchId').value = matchId;
    document.getElementById('modalEquipeChoisie').value = equipeChoisie;
    document.getElementById('modalMatchTitle').textContent = `Parier sur ${equipeChoisie}`;
}

// Fonction pour fermer la modale de pari
function closeBetModal() {
    document.getElementById('betModal').classList.add('hidden');
}

// Vérification de la date et de l'heure du match
document.querySelector('form').addEventListener('submit', function (event) {
    const dateInput = document.getElementById('date').value;
    const selectedDate = new Date(dateInput);
    const currentDate = new Date();
    const errorElement = document.getElementById('dateError');

    errorElement.classList.add('hidden');

    if (selectedDate < currentDate) {
        event.preventDefault();
        errorElement.classList.remove('hidden');
    }
});

// Appel initial pour pré-remplir les sélections
window.onload = () => {
    if (document.getElementById("jeuId")) {
        document.getElementById("jeuId").value = matchJeuId;
        filtrerCompetitions();
        document.getElementById("competitionId").value = matchCompetitionId;
        filtrerEquipes().then(() => {
            document.getElementById("equipe1Id").value = equipe1Id;
            document.getElementById("equipe2Id").value = equipe2Id;
        });
    }
}