const API_BASE_URL = 'http://localhost:8080/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isRegisterMode = false;

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }
});

// -------------------------------------------------------------
// 1. AUTENTIFIKACIJA
// -------------------------------------------------------------

function toggleAuthMode(event) {
    if (event) event.preventDefault();
    isRegisterMode = !isRegisterMode;

    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const emailGroup = document.getElementById('email-group');

    if (isRegisterMode) {
        title.innerText = 'Registracija';
        submitBtn.innerText = 'Registruj se';
        toggleText.innerHTML = 'Već imate račun? <a href="#" onclick="toggleAuthMode(event)">Prijavite se</a>';
        emailGroup.classList.remove('d-none');
    } else {
        title.innerText = 'Prijava';
        submitBtn.innerText = 'Prijavi se';
        toggleText.innerHTML = 'Nemate račun? <a href="#" onclick="toggleAuthMode(event)">Registrujte se</a>';
        emailGroup.classList.add('d-none');
    }
}

async function handleAuth(event) {
    event.preventDefault();

    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const email = document.getElementById('auth-email').value;

    const endpoint = isRegisterMode ? '/users/register' : '/users/login';
    const payload = isRegisterMode
        ? { username, email, password }
        : { username, password };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            alert('Greška: ' + errorMsg);
            return;
        }

        const userData = await response.json();
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        alert(isRegisterMode ? 'Uspješna registracija!' : 'Uspješna prijava!');
        showDashboard();

    } catch (error) {
        console.error('Greška pri komunikaciji sa serverom:', error);
        alert('Ne mogu se povezati sa serverom. Provjerite da li Spring Boot radi!');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('dashboard-section').classList.add('d-none');
    document.getElementById('user-info').classList.add('d-none');
}

// -------------------------------------------------------------
// 2. DASHBOARD I NAVIKE
// -------------------------------------------------------------

async function showDashboard() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    document.getElementById('user-info').classList.remove('d-none');

    const navUser = document.getElementById('nav-username');
    const navLeague = document.getElementById('nav-league');
    const navPoints = document.getElementById('nav-points');
    const dashUser = document.getElementById('dash-username');
    const dashPoints = document.getElementById('dash-points');
    const dashLeague = document.getElementById('dash-league');

    // Element za prikaz broja kupljenih Streak Freeze-ova
    const freezeEl = document.getElementById('dash-freeze-count');

    if (navUser) navUser.innerText = currentUser.username;
    if (navLeague) navLeague.innerText = currentUser.league || 'BRONZE';
    if (navPoints) navPoints.innerText = `${currentUser.points || 0} XP`;

    if (dashUser) dashUser.innerText = currentUser.username;
    if (dashPoints) dashPoints.innerText = currentUser.points || 0;
    if (dashLeague) dashLeague.innerText = currentUser.league || 'BRONZE';

    // Ažuriranje prikaza Streak Freeze stanja
    if (freezeEl) freezeEl.innerText = currentUser.streakFreezeCount || 0;

    loadPointsToNextLeague();
    loadHabits();
    loadLeaderboard();
}

// Funkcija za poziv endpointa prodavnice
async function buyStreakFreeze() {
    if (!currentUser || !currentUser.id) {
        alert("Morate biti prijavljeni!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/buy-streak-freeze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const updatedUser = await response.json();

            // Ažuriramo lokalno stanje korisnika
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            alert('Uspješno ste kupili 1x Streak Freeze! 🛡️');

            // Ponovo učitavamo dashboard da osvježimo XP i broj freeze-ova
            showDashboard();
        } else {
            const errorMsg = await response.text();
            alert('Kupovina nije uspjela: ' + errorMsg);
        }
    } catch (error) {
        console.error('Greška pri komunikaciji sa serverom:', error);
        alert('Došlo je do greške pri povezivanju sa serverom.');
    }
}

async function loadPointsToNextLeague() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/next-league-points`);
        if (res.ok) {
            const pointsNeeded = await res.json();
            const el = document.getElementById('dash-next-league');

            if (el) {
                const currentLeague = (currentUser.league || 'BRONZE').toUpperCase();

                // Određivanje sljedeće lige na osnovu trenutne
                let nextLeague = '';
                if (currentLeague === 'BRONZE') nextLeague = 'SILVER';
                else if (currentLeague === 'SILVER') nextLeague = 'GOLD';
                else if (currentLeague === 'GOLD') nextLeague = 'PLATINUM';
                else if (currentLeague === 'PLATINUM') nextLeague = 'DIAMOND';

                if (nextLeague && pointsNeeded > 0) {
                    el.innerText = `${pointsNeeded} XP (${nextLeague})`;
                } else if (!nextLeague || currentLeague === 'DIAMOND') {
                    el.innerText = 'MAX LIGA 🏆';
                } else {
                    // Ako backend vrati 0 ili nevažeći broj, prikaži bar ime sljedeće lige
                    el.innerText = `Sljedeća: ${nextLeague}`;
                }
            }
        }
    } catch (e) {
        console.error('Greška pri dohvatanju bodova za ligu:', e);
    }
}
async function loadHabits() {
    try {
        const response = await fetch(`${API_BASE_URL}/habits/user/${currentUser.id}`);
        if (!response.ok) return;

        const habits = await response.json();
        const container = document.getElementById('habits-list');
        container.innerHTML = '';

        if (habits.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-4"><p>Nemate još kreiranih navika. Kliknite na "+ Nova Navika" da dodate prvu!</p></div>`;
            return;
        }

        habits.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-3';

            // Provjera tipa navike (sprečava 'undefined')
            const rawType = habit.habitType || habit.type;
            const isQuant = rawType === 'QUANTITATIVE';
            const typeText = isQuant ? 'Kvantitativna' : 'Da / Ne';

            // Prikaz učestalosti (Frequency)
            let freqText = 'Svaki dan';
            const freq = habit.frequency || 'DAILY';
            if (freq === 'ONCE') freqText = 'Samo danas';
            else if (freq === 'WEEKLY') freqText = 'Sedmično';
            else if (freq === 'MONTHLY') freqText = 'Mjesečno';
            else if (freq === 'YEARLY') freqText = 'Godišnje';

            const targetInfo = isQuant ? `<p class="mb-1 text-muted"><small>Cilj: ${habit.targetValue} ${habit.unit || ''}</small></p>` : '';
            const streakVal = habit.currentStreak ?? habit.streak ?? 0;

            card.innerHTML = `
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title text-primary m-0">${habit.title}</h5>
                                <div>
                                    <span class="badge ${isQuant ? 'bg-info' : 'bg-secondary'}">${typeText}</span>
                                    <button class="btn btn-sm btn-outline-danger ms-1 py-0 px-1" title="Izbriši naviku" onclick="deleteHabit(${habit.id})">🗑️</button>
                                </div>
                            </div>
                            <p class="card-text text-muted mb-2 mt-1"><small>${habit.description || 'Bez opisa'}</small></p>
                            ${targetInfo}
                            <p class="mb-1"><small class="text-secondary">Učestalost: <strong>${freqText}</strong></small></p>
                            <p class="mb-2"><strong>🔥 Streak:</strong> ${streakVal} dana</p>
                        </div>
                        <button class="btn btn-outline-success btn-sm w-100 mt-2" onclick="openLogModal(${habit.id}, '${rawType}', '${habit.unit || ''}')">
                            ✏️ Zabilježi napredak
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Greška pri učitavanju navika:', error);
    }
}

// Brisanje navike
async function deleteHabit(habitId) {
    if (!confirm('Jeste li sigurni da želite izbrisati ovu naviku?')) return;

    try {
        const res = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Navika je uspješno izbrisana!');
            loadHabits();
        } else {
            alert('Greška pri brisanju navike sa servera.');
        }
    } catch (e) {
        console.error('Greška pri brisanju:', e);
    }
}

// -------------------------------------------------------------
// 3. KREIRANJE NOVE NAVIKE & MODAL
// -------------------------------------------------------------

function openAddHabitModal() {
    const modalElement = document.getElementById('addHabitModal');
    if (typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    } else {
        alert('Bootstrap skripta nije učitana!');
    }
}

function toggleQuantitativeFields() {
    const type = document.getElementById('habit-type').value;
    const quantFields = document.getElementById('quant-fields');
    if (type === 'QUANTITATIVE') {
        quantFields.classList.remove('d-none');
    } else {
        quantFields.classList.add('d-none');
    }
}

async function createHabit(event) {
    event.preventDefault();

    if (!currentUser || !currentUser.id) {
        alert('Sesija je nevažeća. Odjavite se pa se ponovo prijavite!');
        return;
    }

    const title = document.getElementById('habit-title').value.trim();
    const description = document.getElementById('habit-desc').value.trim();
    let habitType = document.getElementById('habit-type').value;

    // Ako backend za običnu naviku koristi YES_NO umjesto BOOLEAN
    if (habitType === 'BOOLEAN') {
        habitType = 'YES_NO';
    }

    const freqElem = document.getElementById('habit-frequency');
    const frequency = freqElem ? freqElem.value : 'DAILY';

    const targetValInput = document.getElementById('habit-target').value;
    const targetValue = targetValInput !== "" ? parseFloat(targetValInput) : null;
    const unit = document.getElementById('habit-unit').value.trim();

    const payload = {
        title: title,
        description: description,
        habitType: habitType,
        frequency: frequency,
        targetValue: targetValue,
        unit: unit,
        active: true
    };

    try {
        const res = await fetch(`${API_BASE_URL}/habits?userId=${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Navika uspješno dodana!');
            document.getElementById('add-habit-form').reset();

            // Zatvaranje modala
            const modalElement = document.getElementById('addHabitModal');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) modalInstance.hide();
            }

            // Ponovo učitavamo navike sa servera
            loadHabits();
        } else {
            const errorText = await res.text();
            console.error('Backend Error pri kreiranju:', errorText);
            alert('Greška sa servera pri kreiranju navike: ' + errorText);
        }
    } catch (e) {
        console.error('Mrežna greška:', e);
        alert('Došlo je do mrežne greške pri spremanju navike.');
    }
}

// -------------------------------------------------------------
// 4. LOGOVANJE NAVIKE I MINI-DNEVNIK
// -------------------------------------------------------------

function openLogModal(habitId, type, unit) {
    document.getElementById('log-habit-id').value = habitId;
    const valGroup = document.getElementById('log-val-group');
    const unitLabel = document.getElementById('log-unit-label');

    if (type === 'QUANTITATIVE') {
        valGroup.classList.remove('d-none');
        unitLabel.innerText = unit || '';
    } else {
        valGroup.classList.add('d-none');
    }

    const modalElement = document.getElementById('logHabitModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

async function submitHabitLog(event) {
    if (event) event.preventDefault();

    const habitIdInput = document.getElementById('log-habit-id').value;
    if (!habitIdInput) {
        alert('Greška: ID navike nije postavljen u formi!');
        return;
    }

    const habitId = parseInt(habitIdInput, 10);

    const valueInput = document.getElementById('log-value');
    const ratingInput = document.getElementById('log-rating');
    const reflectionInput = document.getElementById('log-reflection');

    const loggedValue = (valueInput && valueInput.value !== "") ? parseFloat(valueInput.value) : null;
    const rating = (ratingInput && ratingInput.value !== "") ? parseInt(ratingInput.value, 10) : 10;
    const reflection = reflectionInput ? reflectionInput.value.trim() : "";

    const payload = {
        habitId: habitId,
        loggedValue: loggedValue,
        rating: rating,
        reflection: reflection
    };

    try {
        const res = await fetch(`${API_BASE_URL}/habits/${habitId}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Aktivnost uspješno zabilježena!');
            document.getElementById('log-habit-form').reset();

            const modalElement = document.getElementById('logHabitModal');
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modalInstance.hide();
            }

            // Provjera da li je navika bila jednokratna ('Samo danas' / ONCE) pa je automatski obriši
            await checkAndDeleteIfOnce(habitId);

            // Ažuriranje korisničkih podataka i preostalih bodova za ligu
            if (typeof refreshUserData === 'function') {
                await refreshUserData();
            }
            if (typeof loadPointsToNextLeague === 'function') {
                await loadPointsToNextLeague();
            }
            if (typeof loadHabits === 'function') {
                loadHabits();
            }
        } else {
            const errorText = await res.text();
            console.error('Backend Log Error:', errorText);
            alert('Greška sa servera: ' + errorText);
        }
    } catch (e) {
        console.error('Mrežna greška pri logovanju:', e);
        alert('Mrežna greška pri komunikaciji sa serverom.');
    }
}

// Pomoćna funkcija: briše naviku ako je 'ONCE' (Samo danas)
async function checkAndDeleteIfOnce(habitId) {
    try {
        const res = await fetch(`${API_BASE_URL}/habits/user/${currentUser.id}`);
        if (!res.ok) return;
        const habits = await res.json();
        const currentHabit = habits.find(h => h.id === habitId);

        if (currentHabit && currentHabit.frequency === 'ONCE') {
            await fetch(`${API_BASE_URL}/habits/${habitId}`, { method: 'DELETE' });
        }
    } catch (e) {
        console.error('Greška pri proveri/brisanju jednodnevne navike:', e);
    }
}

async function refreshUserData() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/leaderboard`);
        if (res.ok) {
            const users = await res.json();
            const me = users.find(u => u.id === currentUser.id);
            if (me) {
                currentUser = me;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showDashboard();
            }
        }
    } catch (e) {
        console.error(e);
    }
}

// -------------------------------------------------------------
// 5. LEADERBOARD (RANG-LISTA)
// -------------------------------------------------------------

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/leaderboard`);
        if (!res.ok) return;

        const users = await res.json();
        const tbody = document.getElementById('leaderboard-tbody');
        tbody.innerHTML = '';

        users.forEach((u, index) => {
            const isMe = currentUser && u.id === currentUser.id;
            const tr = document.createElement('tr');
            if (isMe) tr.className = 'table-primary fw-bold';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${u.username} ${isMe ? '(Ti)' : ''}</td>
                <td><span class="badge bg-primary">${u.points || 0} XP</span></td>
                <td><span class="badge bg-warning text-dark">${u.league || 'BRONZE'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Greška pri učitavanju rang liste:', e);
    }
}
