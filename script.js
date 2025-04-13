document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    generateRooms();
});

let teams = [];
const rooms = 8;

// Importa las funciones necesarias desde Firebase
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Obtén una referencia a la base de datos
const database = getDatabase();

function addTeam() {
    const teamName = document.getElementById('team-name').value.trim();
    const logoFile = document.getElementById('team-logo').files[0];

    if (teamName && logoFile) {
        if (teams.length >= 12) {  // ✅ Asegura que permite hasta 12 equipos
            alert("Ya has alcanzado el límite de 12 equipos.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const logoUrl = e.target.result;
            const newTeamRef = push(ref(database, 'teams'));
            const newTeamKey = newTeamRef.key;

            set(newTeamRef, {
                name: teamName,
                logo: logoUrl,
                kills: 0,
                points: 0
            });

            // Agrega el equipo a la lista local y actualiza la interfaz
            teams.push({ key: newTeamKey, name: teamName, logo: logoUrl, kills: 0, points: 0 });
            renderTeams();
            generateRooms();  // Actualizar la lista de equipos en las salas
            document.getElementById('team-name').value = '';
            document.getElementById('team-logo').value = '';
        };
        reader.readAsDataURL(logoFile);
    }
}

function renderTeams() { 
    const tbody = document.querySelector('#teams-table tbody');
    tbody.innerHTML = '';
    teams.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${team.logo}" alt="${team.name} Logo" width="50"></td>
            <td>${team.name}</td>
            <td>
                <input type="number" value="${team.kills}" 
                    oninput="updateKills('${team.key}', this.value)">
            </td>
            <td>
                <input type="number" value="${team.points}" 
                    oninput="updatePoints('${team.key}', this.value)">
            </td>
            <td>
                <button onclick="editTeam('${team.key}')">Editar</button>
                <button onclick="deleteTeam('${team.key}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateKills(teamKey, value) {
    const team = teams.find(t => t.key === teamKey);
    if (team) {
        team.kills = parseInt(value) || 0;
        calculatePoints();
    }
}

function updatePoints(teamKey, value) {
    const team = teams.find(t => t.key === teamKey);
    if (team) {
        team.points = parseInt(value) || 0;
        update(ref(database, `teams/${teamKey}`), { points: team.points });
        saveTeams();
    }
}

function editTeam(teamKey) {
    const team = teams.find(t => t.key === teamKey);
    if (!team) return;

    const newName = prompt("Nuevo nombre del equipo:", team.name);
    const newKills = prompt("Nuevos kills:", team.kills);

    if (newName && !isNaN(newKills) && newKills >= 0) {
        team.name = newName;
        team.kills = parseInt(newKills);
        update(ref(database, `teams/${teamKey}`), { name: newName, kills: parseInt(newKills) });
        saveTeams();
        renderTeams();
        generateRooms();  // Refrescar equipos en las salas
    }
}

function deleteTeam(teamKey) {
    const teamIndex = teams.findIndex(t => t.key === teamKey);
    if (teamIndex !== -1) {
        teams.splice(teamIndex, 1);
        remove(ref(database, `teams/${teamKey}`));
        saveTeams();
        renderTeams();
        generateRooms();  // Refrescar salas al eliminar un equipo
    }
}

function calculatePoints() {
    teams.forEach(team => {
        team.points = team.kills * 2; // 2 puntos por kill
    });
    saveTeams();
    renderTeams();
}

function saveTeams() {
    // No es necesario guardar en localStorage, ya que Firebase maneja la persistencia
}

function loadTeams() {
    onValue(ref(database, 'teams'), (snapshot) => {
        teams = [];
        snapshot.forEach((childSnapshot) => {
            const teamData = childSnapshot.val();
            const teamKey = childSnapshot.key;
            teams.push({ key: teamKey, ...teamData });
        });
        renderTeams();
        generateRooms();
    });
}

function generateRooms() {
    const roomContainer = document.querySelector('.room-container');
    roomContainer.innerHTML = ''; // Limpiar antes de regenerar

    for (let i = 1; i <= rooms; i++) {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room';
        roomDiv.innerHTML = `
            <h3>Sala ${i}</h3>
            <select id="room-${i}-team" onchange="fillRoomData(${i})">
                <option value="">Selecciona un equipo</option>
            </select>
            <input type="number" id="room-${i}-position" placeholder="Posición">
            <input type="number" id="room-${i}-kills" placeholder="Kills">
            <button onclick="updateRoomPoints(${i})">Actualizar</button>
        `;

        const select = roomDiv.querySelector(`#room-${i}-team`);
        teams.forEach((team, index) => {
            const option = document.createElement('option');
            option.value = team.key;
            option.textContent = team.name;
            select.appendChild(option);
        });

        roomContainer.appendChild(roomDiv);
    }
}

function fillRoomData(roomNumber) {
    const teamKey = document.getElementById(`room-${roomNumber}-team`).value;

    if (teamKey !== "") {
        const team = teams.find(t => t.key === teamKey);

        // Cargar los datos específicos de esta sala
        document.getElementById(`room-${roomNumber}-position`).value = team[`room${roomNumber}_position`] || "";
        document.getElementById(`room-${roomNumber}-kills`).value = team[`room${roomNumber}_kills`] || "";
    }
}

function updateRoomPoints(roomNumber) {
    const teamKey = document.getElementById(`room-${roomNumber}-team`).value;
    const position = parseInt(document.getElementById(`room-${roomNumber}-position`).value) || 0;
    const newKills = parseInt(document.getElementById(`room-${roomNumber}-kills`).value) || 0;

    if (teamKey !== "") {
        const team = teams.find(t => t.key === teamKey);

        // Guardar valores solo para esta sala
        team[`room${roomNumber}_position`] = position;
        team[`room${roomNumber}_kills`] = newKills;

        // Tabla de puntos por posición
        const positionPoints = [12, 9, 7, 5, 3, 3, 3, 1, 1, 1, 1, 1][position - 1] || 0;
        team[`room${roomNumber}_points`] = positionPoints + (newKills * 2);

        // **Recalcular solo el puntaje de esta sala**
        let totalPoints = 0;
        let totalKills = 0;

        for (let i = 1; i <= rooms; i++) {
            totalPoints += team[`room${i}_points`] || 0;
            totalKills += team[`room${i}_kills`] || 0;
        }

        // Asignar los valores corregidos
        team.points = totalPoints;
        team.kills = totalKills;

        // Actualizar en Firebase
        update(ref(database, `teams/${teamKey}`), {
            [`room${roomNumber}_position`]: position,
            [`room${roomNumber}_kills`]: newKills,
            [`room${roomNumber}_points`]: team[`room${roomNumber}_points`],
            points: totalPoints,
            kills: totalKills
        });

        renderTeams();
        updateResults();
    }
}

function updateResults() {
    const resultsTable = document.querySelector('#results-table tbody');
    resultsTable.innerHTML = '';
    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

    sortedTeams.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${team.logo}" alt="${team.name} Logo" width="50"></td>
            <td>${team.name}</td>
            <td>${team.points}</td>
        `;
        resultsTable.appendChild(row);
    });
}