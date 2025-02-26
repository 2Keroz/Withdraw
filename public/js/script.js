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
        errorElement.textContent = "Erreur de date: La date sélectionnée est antérieure à la date actuelle.";
        console.log("Erreur de date: La date sélectionnée est antérieure à la date actuelle.");
    }
});

// Appel initial pour pré-remplir les sélections
window.onload = () => {
    if (typeof matchJeuId !== 'undefined' && matchJeuId !== null) {
        document.getElementById("jeuId").value = matchJeuId;
        filtrerCompetitions();
        document.getElementById("competitionId").value = matchCompetitionId;
        filtrerEquipes().then(() => {
            document.getElementById("equipe1Id").value = equipe1Id;
            document.getElementById("equipe2Id").value = equipe2Id;
        });
    }
};

function filtrerCompetitions() {
    const jeuId = document.getElementById("jeuId").value;
    const competitionSelect = document.getElementById("competitionId");
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
                li.innerHTML = `<a href="#" onclick="loadMatchs(${competition.id})" class="text-gray-700 hover:text-red-600 transition duration-200">• ${competition.nom}</a>`;
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
        matchsContainer.innerHTML = ''; // Clear previous content
        if (matchs.length === 0) {
            const noMatchMessage = document.createElement('p');
            noMatchMessage.textContent = "Aucun match à venir pour le moment.";
            matchsContainer.appendChild(noMatchMessage);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'space-y-4';
            matchs.forEach(match => {
                const date = new Date(match.date);
                const formattedDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const li = document.createElement('li');
                li.className = 'p-4 border border-gray-300 rounded-md';
                li.innerHTML = `
                    <h3 class="text-lg font-bold">${match.equipe1.nom} vs ${match.equipe2.nom}</h3>
                    <p class="text-gray-600">Date : ${formattedDate} à ${formattedTime}</p>
                `;
                ul.appendChild(li);
            });
            matchsContainer.appendChild(ul);
        }
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

document.querySelector('#betModal form').addEventListener('submit', function (event) {
    const pointsMises = parseInt(document.getElementById('pointsMises').value, 10);
    const errorBet = document.getElementById('errorBet');

    errorBet.textContent = ''; // Réinitialiser le message d'erreur
    errorBet.style.color = 'red';

    console.log("Points disponibles : ", userPoints);  // Vérification de la valeur des points

    if (isNaN(pointsMises) || pointsMises <= 0) {
        event.preventDefault();
        errorBet.textContent = "Veuillez entrer un nombre valide de points.";
    } else if (pointsMises > userPoints) {
        event.preventDefault();
        errorBet.textContent = "Vous ne pouvez pas parier plus de points que vous n'en possédez.";
    }
});

// Fonction pour ouvrir la modale
function openBetModal(matchId, equipeChoisie, pointsDisponibles) {
    const betModal = document.getElementById('betModal');
    const modalMatchTitle = document.getElementById('modalMatchTitle');
    const modalMatchId = document.getElementById('modalMatchId');
    const modalEquipeChoisie = document.getElementById('modalEquipeChoisie');
    const errorBet = document.getElementById('errorBet');

    // Configurez les champs de la modale
    modalMatchTitle.textContent = `Parier sur ${equipeChoisie}`;
    modalMatchId.value = matchId;
    modalEquipeChoisie.value = equipeChoisie;

    // Réinitialisez les erreurs et le champ d'entrée
    errorBet.textContent = '';
    document.getElementById('pointsMises').value = '';

    // Affichez la modale
    betModal.style.display = 'flex';
}

// Fonction pour fermer la modale
function closeBetModal() {
    const betModal = document.getElementById('betModal');
    betModal.style.display = 'none';
}

// Validation du formulaire d'inscription
document.getElementById('registerForm')?.addEventListener('submit', function(event) {
    // Suppression des messages d'erreur existants
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Récupération des champs
    const nom = document.getElementById('nom');
    const prenom = document.getElementById('prenom');
    const birth = document.getElementById('birth');
    const mail = document.getElementById('mail');
    const password = document.getElementById('password');
    const confirm_password = document.getElementById('confirm_password');

    let hasError = false;

    // Fonction pour afficher les messages d'erreur
    const showError = (element, message) => {
        hasError = true;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
        element.classList.add('border-red-500');
    };

    // Validation du nom
    if (!nom.value.trim()) {
        showError(nom, 'Le nom est obligatoire');
    }

    // Validation du prénom
    if (!prenom.value.trim()) {
        showError(prenom, 'Le prénom est obligatoire');
    }

    // Validation de la date de naissance
    if (!birth.value) {
        showError(birth, 'La date de naissance est obligatoire');
    }

    // Validation de l'email
    if (!mail.value.trim()) {
        showError(mail, 'L\'email est obligatoire');
    }

    // Validation du mot de passe
    if (!password.value) {
        showError(password, 'Le mot de passe est obligatoire');
    }

    // Validation de la confirmation du mot de passe
    if (!confirm_password.value) {
        showError(confirm_password, 'La confirmation du mot de passe est obligatoire');
    } else if (password.value !== confirm_password.value) {
        showError(confirm_password, 'Les mots de passe ne correspondent pas');
    }

    // Empêcher la soumission du formulaire s'il y a des erreurs
    if (hasError) {
        event.preventDefault();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('profileForm');
    const passwordError = document.getElementById('passwordError');

    form.addEventListener('submit', function (event) {
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        passwordError.textContent = '';
        passwordError.style.color = 'red';

        if (newPassword !== confirmPassword) {
            event.preventDefault();
            passwordError.textContent = "Les mots de passe ne correspondent pas. Veuillez réessayer.";
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordError = document.getElementById('passwordError');

    form.addEventListener('submit', function (event) {
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        passwordError.style.display = 'none';
        passwordError.textContent = '';

        if (password !== confirmPassword) {
            event.preventDefault();
            passwordError.style.display = 'block';
            passwordError.textContent = "Les mots de passe ne correspondent pas. Veuillez réessayer.";
        }
    });
});

// Validation du formulaire de création d'équipe
document.querySelector('form[action="/admin/equipe/creer"]')?.addEventListener('submit', function(event) {
    // Suppression des messages d'erreur existants
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    const nom = document.getElementById('nom');
    const acronyme = document.getElementById('acronyme');
    let hasError = false;

    // Fonction pour afficher les messages d'erreur
    const showError = (element, message) => {
        hasError = true;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
    };

    // Validation du nom (lettres et chiffres uniquement)
    if (!/^[a-zA-Z0-9\s]+$/.test(nom.value)) {
        showError(nom, 'Le nom ne doit contenir que des lettres et des chiffres');
    }

    // Validation de l'acronyme (lettres et chiffres uniquement, sans espaces)
    if (!/^[a-zA-Z0-9]+$/.test(acronyme.value)) {
        showError(acronyme, 'L\'acronyme ne doit contenir que des lettres et des chiffres (sans espaces)');
    }

    if (hasError) {
        event.preventDefault();
    }
});

// Fonctions pour la modale de suppression d'utilisateur
function openDeleteModal(userId) {
    const modal = document.getElementById('deleteModal');
    const form = document.getElementById('deleteUserForm');
    
    // Définir l'action du formulaire
    form.action = `/admin/utilisateur/${userId}/supprimer`;
    
    // Afficher la modale
    modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
}

// Fonctions pour la modale de suppression de match
function openDeleteMatchModal(matchId) {
    const modal = document.getElementById('deleteMatchModal');
    const form = document.getElementById('deleteMatchForm');
    
    // Définir l'action du formulaire
    form.action = `/admin/match/${matchId}/supprimer`;
    
    // Afficher la modale
    modal.classList.remove('hidden');
}

function closeDeleteMatchModal() {
    const modal = document.getElementById('deleteMatchModal');
    modal.classList.add('hidden');
}

// Fermer les modales si on clique en dehors
document.getElementById('deleteModal')?.addEventListener('click', function(event) {
    if (event.target === this) {
        closeDeleteModal();
    }
});

document.getElementById('deleteMatchModal')?.addEventListener('click', function(event) {
    if (event.target === this) {
        closeDeleteMatchModal();
    }
});
