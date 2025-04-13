document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    generateRooms();
});

let teams = JSON.parse(localStorage.getItem('teams')) || [];
const rooms = 8;

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
            teams.push({ name: teamName, logo: logoUrl, kills: 0, points: 0 });
            saveTeams();
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
                    oninput="updateKills(${index}, this.value)">
            </td>
            <td>
                <input type="number" value="${team.points}" 
                    oninput="updatePoints(${index}, this.value)">
            </td>
            <td>
                <button onclick="editTeam(${index})">Editar</button>
                <button onclick="deleteTeam(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateKills(index, value) {
    teams[index].kills = parseInt(value) || 0;
    calculatePoints();
}

function updatePoints(index, value) {
    teams[index].points = parseInt(value) || 0;
    saveTeams();
}

function editTeam(index) {
    const newName = prompt("Nuevo nombre del equipo:", teams[index].name);
    const newKills = prompt("Nuevos kills:", teams[index].kills);

    if (newName && !isNaN(newKills) && newKills >= 0) {
        teams[index].name = newName;
        teams[index].kills = parseInt(newKills);
        saveTeams();
        renderTeams();
        generateRooms();  // Refrescar equipos en las salas
    }
}

function deleteTeam(index) {
    teams.splice(index, 1);
    saveTeams();
    renderTeams();
    generateRooms();  // Refrescar salas al eliminar un equipo
}

function calculatePoints() {
    teams.forEach(team => {
        team.points = team.kills * 2; // 2 puntos por kill
    });
    saveTeams();
    renderTeams();
}

function saveTeams() {
    localStorage.setItem('teams', JSON.stringify(teams));
}

function loadTeams() {
    teams = JSON.parse(localStorage.getItem('teams')) || [];
    renderTeams();
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
            option.value = index;
            option.textContent = team.name;
            select.appendChild(option);
        });

        roomContainer.appendChild(roomDiv);
    }
}

function fillRoomData(roomNumber) {
    const teamIndex = document.getElementById(`room-${roomNumber}-team`).value;

    if (teamIndex !== "") {
        const team = teams[teamIndex];

        // Si hay datos guardados, los muestra en los inputs
        document.getElementById(`room-${roomNumber}-position`).value = team[`lastPosition${roomNumber}`] || "";
        document.getElementById(`room-${roomNumber}-kills`).value = team[`lastKills${roomNumber}`] || "";
    }
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
            option.value = index;
            option.textContent = team.name;
            select.appendChild(option);
        });

        roomContainer.appendChild(roomDiv);
    }
}

function fillRoomData(roomNumber) {
    const teamIndex = document.getElementById(`room-${roomNumber}-team`).value;

    if (teamIndex !== "") {
        const team = teams[teamIndex];

        // Cargar los datos específicos de esta sala
        document.getElementById(`room-${roomNumber}-position`).value = team[`room${roomNumber}_position`] || "";
        document.getElementById(`room-${roomNumber}-kills`).value = team[`room${roomNumber}_kills`] || "";
    }
}

function updateRoomPoints(roomNumber) {
    const teamIndex = document.getElementById(`room-${roomNumber}-team`).value;
    const position = parseInt(document.getElementById(`room-${roomNumber}-position`).value) || 0;
    const newKills = parseInt(document.getElementById(`room-${roomNumber}-kills`).value) || 0;

    if (teamIndex !== "") {
        const team = teams[teamIndex];

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

        saveTeams();
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

