const FLAG_BASE_PATH = '/assets/img/flags/';
function flagAsset(code) { return `${FLAG_BASE_PATH}${String(code || '').toUpperCase()}.png`; }

const NATIONAL_TEAMS = [
  { code: 'ALG', name: 'Argélia', flag: '/assets/img/flags/ALG.png' },
  { code: 'ARG', name: 'Argentina', flag: '/assets/img/flags/ARG.png' },
  { code: 'AUS', name: 'Austrália', flag: '/assets/img/flags/AUS.png' },
  { code: 'AUT', name: 'Áustria', flag: '/assets/img/flags/AUT.png' },
  { code: 'BEL', name: 'Bélgica', flag: '/assets/img/flags/BEL.png' },
  { code: 'BIH', name: 'Bósnia e Herzegovina', flag: '/assets/img/flags/BIH.png' },
  { code: 'BRA', name: 'Brasil', flag: '/assets/img/flags/BRA.png' },
  { code: 'CAN', name: 'Canadá', flag: '/assets/img/flags/CAN.png' },
  { code: 'CPV', name: 'Cabo Verde', flag: '/assets/img/flags/CPV.png' },
  { code: 'CIV', name: 'Costa do Marfim', flag: '/assets/img/flags/CIV.png' },
  { code: 'COL', name: 'Colômbia', flag: '/assets/img/flags/COL.png' },
  { code: 'COD', name: 'RD Congo', flag: '/assets/img/flags/COD.png' },
  { code: 'CRO', name: 'Croácia', flag: '/assets/img/flags/CRO.png' },
  { code: 'CUW', name: 'Curaçao', flag: '/assets/img/flags/CUW.png' },
  { code: 'CZE', name: 'Tchéquia', flag: '/assets/img/flags/CZE.png' },
  { code: 'ECU', name: 'Equador', flag: '/assets/img/flags/ECU.png' },
  { code: 'EGY', name: 'Egito', flag: '/assets/img/flags/EGY.png' },
  { code: 'ENG', name: 'Inglaterra', flag: '/assets/img/flags/ENG.png' },
  { code: 'ESP', name: 'Espanha', flag: '/assets/img/flags/ESP.png' },
  { code: 'FRA', name: 'França', flag: '/assets/img/flags/FRA.png' },
  { code: 'GER', name: 'Alemanha', flag: '/assets/img/flags/GER.png' },
  { code: 'GHA', name: 'Gana', flag: '/assets/img/flags/GHA.png' },
  { code: 'HAI', name: 'Haiti', flag: '/assets/img/flags/HAI.png' },
  { code: 'IRN', name: 'Irã', flag: '/assets/img/flags/IRN.png' },
  { code: 'IRQ', name: 'Iraque', flag: '/assets/img/flags/IRQ.png' },
  { code: 'JPN', name: 'Japão', flag: '/assets/img/flags/JPN.png' },
  { code: 'JOR', name: 'Jordânia', flag: '/assets/img/flags/JOR.png' },
  { code: 'KSA', name: 'Arábia Saudita', flag: '/assets/img/flags/KSA.png' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '/assets/img/flags/KOR.png' },
  { code: 'MAR', name: 'Marrocos', flag: '/assets/img/flags/MAR.png' },
  { code: 'MEX', name: 'México', flag: '/assets/img/flags/MEX.png' },
  { code: 'NED', name: 'Holanda', flag: '/assets/img/flags/NED.png' },
  { code: 'NOR', name: 'Noruega', flag: '/assets/img/flags/NOR.png' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '/assets/img/flags/NZL.png' },
  { code: 'PAN', name: 'Panamá', flag: '/assets/img/flags/PAN.png' },
  { code: 'PAR', name: 'Paraguai', flag: '/assets/img/flags/PAR.png' },
  { code: 'POR', name: 'Portugal', flag: '/assets/img/flags/POR.png' },
  { code: 'QAT', name: 'Catar', flag: '/assets/img/flags/QAT.png' },
  { code: 'RSA', name: 'África do Sul', flag: '/assets/img/flags/RSA.png' },
  { code: 'SCO', name: 'Escócia', flag: '/assets/img/flags/SCO.png' },
  { code: 'SEN', name: 'Senegal', flag: '/assets/img/flags/SEN.png' },
  { code: 'SUI', name: 'Suíça', flag: '/assets/img/flags/SUI.png' },
  { code: 'SWE', name: 'Suécia', flag: '/assets/img/flags/SWE.png' },
  { code: 'TUN', name: 'Tunísia', flag: '/assets/img/flags/TUN.png' },
  { code: 'TUR', name: 'Turquia', flag: '/assets/img/flags/TUR.png' },
  { code: 'URU', name: 'Uruguai', flag: '/assets/img/flags/URU.png' },
  { code: 'USA', name: 'Estados Unidos', flag: '/assets/img/flags/USA.png' },
  { code: 'UZB', name: 'Uzbequistão', flag: '/assets/img/flags/UZB.png' }
];


const GROUP_OPTIONS = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
  'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L',
  '16 avos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Disputa 3º lugar', 'Final'
];

const state = {
  token: localStorage.getItem('bolaoAdminToken') || '',
  games: [],
  predictions: [],
  payments: [],
  users: [],
  standings: [],
  knockout: [],
  standingsUpdatedAt: '',
  selectedGameId: '',
  activeSection: 'games'
};

const $ = (selector) => document.querySelector(selector);
const loginView = $('#loginView');
const adminView = $('#adminView');
const toast = $('#toast');
const gameModal = $('#gameModal');
const confirmModal = $('#confirmModal');
let confirmResolver = null;

// v0.2.9 — menu de ações em camada global para não ficar preso/cortado dentro da tabela.
const floatingActionMenu = document.createElement('div');
floatingActionMenu.id = 'floatingActionMenu';
floatingActionMenu.className = 'action-menu floating-action-menu hidden';
floatingActionMenu.setAttribute('role', 'menu');
document.body.appendChild(floatingActionMenu);

function openGameModal() {
  gameModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  setTimeout(() => $('#team1Select')?.focus(), 40);
}

function closeGameModal() {
  gameModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function confirmAction({ title = 'Confirmar ação', message = 'Confirme para continuar.', confirmText = 'Confirmar', danger = true } = {}) {
  $('#confirmTitle').textContent = title;
  $('#confirmMessage').textContent = message;
  $('#confirmOkBtn').textContent = confirmText;
  $('#confirmOkBtn').classList.toggle('btn-danger', danger);
  $('#confirmOkBtn').classList.toggle('btn-primary', !danger);
  confirmModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  return new Promise((resolve) => { confirmResolver = resolve; });
}

function closeConfirmModal(result = false) {
  confirmModal.classList.add('hidden');
  if (gameModal.classList.contains('hidden')) document.body.classList.remove('modal-open');
  if (confirmResolver) confirmResolver(result);
  confirmResolver = null;
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3800);
}

function showCrudSuccess(action, entity = 'registro') {
  const messages = {
    create: `${entity} cadastrado com sucesso.`,
    update: `${entity} atualizado com sucesso.`,
    delete: `${entity} excluído com sucesso.`,
    evaluate: `${entity} apurado com sucesso.`,
    approve: `${entity} aprovado com sucesso.`,
    award: `${entity} marcado como entregue.`
  };
  showToast(messages[action] || 'Ação executada com sucesso.', 'success');
}

function showCrudError(error) {
  showToast(error?.message || 'Não foi possível executar a ação.', 'error');
}


async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha na requisição.');
  return data;
}

function statusLabel(status) {
  return ({
    scheduled: 'Agendado', open: 'Aberto', closed: 'Encerrado', finished: 'Finalizado', canceled: 'Cancelado',
    pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado', cancelled: 'Cancelado', refunded: 'Estornado', expired: 'Expirado',
    correct: 'Acertou', wrong: 'Errou', awarded: 'Prêmio entregue'
  })[status] || status || '-';
}

function tag(status) {
  return `<span class="tag tag-${status}">${statusLabel(status)}</span>`;
}

function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
}

function amountInput(cents) {
  return (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
}

function formatDate(date, time = '') {
  if (!date) return '-';
  const [year, month, day] = String(date).split('-');
  return `${day}/${month}/${year}${time ? ` · ${time}` : ''}`;
}

function formatDateHeading(date) {
  if (!date) return 'Data não definida';
  const [year, month, day] = String(date).split('-');
  const parsed = new Date(`${year}-${month}-${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(parsed);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sortGamesByDateTime(games = []) {
  return [...games].sort((a, b) => `${a.matchDate || '9999-12-31'} ${a.matchTime || '23:59'}`.localeCompare(`${b.matchDate || '9999-12-31'} ${b.matchTime || '23:59'}`));
}

function groupGamesByDate(games = []) {
  const grouped = new Map();
  sortGamesByDateTime(games).forEach((game) => {
    const key = game.matchDate || '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(game);
  });
  return [...grouped.entries()].map(([date, items]) => ({ date, games: items }));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function normalizeTeamKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findTeam(codeOrName) {
  const key = normalizeTeamKey(codeOrName);
  return NATIONAL_TEAMS.find((team) => {
    const code = normalizeTeamKey(team.code);
    const name = normalizeTeamKey(team.name);
    return code === key || name === key;
  });
}

// Mantém compatibilidade com pontos do admin que usam o nome antigo da função.
function findTeamByCodeOrName(codeOrName) {
  return findTeam(codeOrName);
}

function selectedTeam(select) {
  const option = select.selectedOptions[0];
  return {
    code: option?.value || '',
    name: option?.dataset.name || option?.textContent?.replace(/^\S+\s/, '') || '',
    flag: option?.dataset.flag || ''
  };
}

function flagIsImage(value = '') {
  return /\.(png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(String(value)) || String(value).startsWith('/assets/');
}

function teamFlagHtml(flag, code = '') {
  const value = String(flag || '').trim();
  const src = flagIsImage(value) ? value : (code ? flagAsset(code) : '');
  if (src) {
    return `<img class="team-flag team-flag-img" src="${src}" alt="" loading="lazy">`;
  }
  return value ? `<span class="team-flag team-flag-emoji" aria-hidden="true">${value}</span>` : '';
}


function teamText(game, side) {
  const code = game?.[`${side}Code`] || '';
  const name = game?.[`${side}Name`] || (side === 'team1' ? 'Time 1' : game?.opponent || 'Time 2');
  const fromCatalog = findTeamByCodeOrName(code || name);
  const flag = game?.[`${side}Flag`] || fromCatalog?.flag || '';
  return `${teamFlagHtml(flag, code)}${name}`;
}

function scoreText(game) {
  if (game.team1Score === null || game.team2Score === null) return '—';
  return `${teamText(game, 'team1')} ${game.team1Score} x ${game.team2Score} ${teamText(game, 'team2')}`;
}

function actionMenu(items = []) {
  return `
    <div class="kebab">
      <button class="kebab-btn" type="button" data-menu-toggle title="Abrir ações" aria-label="Abrir ações">
        <span aria-hidden="true">⋮</span>
      </button>
      <div class="action-menu hidden" role="menu">
        ${items.map((item) => `<button type="button" role="menuitem" class="${item.danger ? 'danger' : ''}" ${item.attr}>${item.label}</button>`).join('')}
      </div>
    </div>`;
}

function closeActionMenus(except = null) {
  document.querySelectorAll('.action-menu').forEach((menu) => {
    if (menu !== except) menu.classList.add('hidden');
  });
  floatingActionMenu.classList.add('hidden');
  floatingActionMenu.innerHTML = '';
  document.querySelectorAll('.kebab-btn').forEach((button) => {
    button.classList.remove('active');
  });
}

function positionActionMenu(toggle, sourceMenu) {
  if (!sourceMenu) return;

  // Copia as ações para um menu global no <body>. Isso evita falhas quando a tabela tem
  // overflow, animação, transform ou scroll horizontal.
  floatingActionMenu.innerHTML = sourceMenu.innerHTML;
  floatingActionMenu.classList.remove('hidden');
  sourceMenu.classList.add('hidden');
  toggle.classList.add('active');

  const rect = toggle.getBoundingClientRect();
  const menuWidth = floatingActionMenu.offsetWidth || 220;
  const menuHeight = floatingActionMenu.offsetHeight || 220;
  const margin = 12;
  const desiredTop = rect.bottom + 8;
  const top = Math.min(desiredTop, window.innerHeight - menuHeight - margin);
  const left = Math.max(margin, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - margin));

  floatingActionMenu.style.top = `${Math.max(margin, top)}px`;
  floatingActionMenu.style.left = `${left}px`;
}

function populateTeamSelects() {
  const options = NATIONAL_TEAMS.map((team) => `<option value="${team.code}" data-name="${team.name}" data-flag="${team.flag}">${team.code} · ${team.name}</option>`).join('');
  $('#team1Select').innerHTML = options;
  $('#team2Select').innerHTML = options;
  $('#team1Select').value = 'BRA';
  $('#team2Select').value = 'ARG';
  updateScoreLabels();
}

function populateGroupSelect() {
  const options = GROUP_OPTIONS.map((name) => `<option value="${name}">${name}</option>`).join('');
  $('#groupSelect').innerHTML = options;
  $('#groupSelect').value = 'Grupo A';
}

function ensureGroupOption(value) {
  const select = $('#groupSelect');
  if (!value || select.querySelector(`option[value="${CSS.escape(value)}"]`)) return;
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  select.appendChild(option);
}

function ensureOption(select, code, name, flag) {
  if (!code || select.querySelector(`option[value="${code}"]`)) return;
  const option = document.createElement('option');
  option.value = code;
  option.dataset.name = name || code;
  option.dataset.flag = flag || '';
  option.textContent = `${code || ''}${code ? ' · ' : ''}${name || code}`;
  select.appendChild(option);
}

function updateScoreLabels() {
  const team1 = selectedTeam($('#team1Select'));
  const team2 = selectedTeam($('#team2Select'));
  $('#team1ScoreLabel').textContent = `Placar ${team1.code ? `${team1.code} · ` : ''}${team1.name || 'Time 1'}`;
  $('#team2ScoreLabel').textContent = `Placar ${team2.code ? `${team2.code} · ` : ''}${team2.name || 'Time 2'}`;
}

function applySelectedTeamsToPayload(payload) {
  const team1 = selectedTeam($('#team1Select'));
  const team2 = selectedTeam($('#team2Select'));
  payload.team1Name = team1.name;
  payload.team1Code = team1.code;
  payload.team1Flag = team1.flag;
  payload.team2Name = team2.name;
  payload.team2Code = team2.code;
  payload.team2Flag = team2.flag;
  payload.opponent = team2.name;
  payload.title = `${team1.name} x ${team2.name}`;
  payload.groupName = $('#groupSelect').value || 'Grupo A';
  if (team1.code === team2.code) throw new Error('Time 1 e Time 2 precisam ser diferentes.');
}


function showSection(name = 'games') {
  state.activeSection = name;
  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.toggle('hidden', section.dataset.section !== name);
  });
  document.querySelectorAll('.admin-nav-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.sectionTarget === name);
  });
  closeActionMenus();
  if (name === 'payments') loadPayments().catch(showCrudError);
  if (name === 'predictions') loadPredictions().catch(showCrudError);
  if (name === 'standings') loadStandings().catch(showCrudError);
  if (name === 'users') loadUsers().catch(showCrudError);
}

function renderSummary(summary = {}) {
  $('#summaryGrid').innerHTML = [
    ['Jogos', summary.gamesCount || 0],
    ['Ativos', summary.activeGames || 0],
    ['Acumulado pago', money(summary.accumulatedCents || 0)],
    ['Pagamentos pendentes', summary.pendingPaymentsCount || 0],
    ['Palpites', summary.predictionsCount || 0],
    ['Ganhadores', summary.winnersCount || 0]
  ].map(([label, value]) => `<article class="card stat"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderGames() {
  const tbody = $('#gamesTable');
  const groupedGames = groupGamesByDate(state.games);
  $('#gamesEmpty').classList.toggle('hidden', state.games.length > 0);
  tbody.innerHTML = groupedGames.map((group) => `
    <tr class="date-divider-row">
      <td colspan="8">
        <div class="date-divider">
          <strong>${formatDateHeading(group.date)}</strong>
          <span>${group.games.length} jogo(s)</span>
        </div>
      </td>
    </tr>
    ${group.games.map((game) => `
      <tr>
        <td><strong>${game.groupName || 'Grupo A'}</strong><br><small>${game.roundName || 'Fase de grupos'}</small></td>
        <td><strong>${teamText(game, 'team1')} x ${teamText(game, 'team2')}</strong><span>${game.roundName || 'Copa'}</span><br><small>${game.prizeDescription}</small></td>
        <td><strong>${money(game.entryFeeCents)}</strong><span>${game.participantsCount || 0} pago(s)</span><br><small>Acumulado: ${money(game.accumulatedCents)}</small></td>
        <td>${formatDate(game.matchDate, game.matchTime)}<br><small>Fecha: ${game.predictionClosesAt ? game.predictionClosesAt.replace('T', ' ') : '-'}</small></td>
        <td>${tag(game.status)}<br><small>${game.isOpen ? 'Recebendo palpites' : 'Bloqueado'}</small></td>
        <td>${scoreText(game)}</td>
        <td>${game.predictionsCount} palpite(s)<br><small>${game.correctCount} acertos · ${game.awardedCount} entregues</small></td>
        <td class="actions-cell">${actionMenu([
          { label: 'Editar', attr: `data-edit="${game.id}"` },
          { label: 'Ver palpites', attr: `data-predictions="${game.id}"` },
          { label: 'Apurar jogo', attr: `data-evaluate="${game.id}"` },
          { label: 'Excluir', danger: true, attr: `data-delete="${game.id}"` }
        ])}</td>
      </tr>`).join('')}
  `).join('');
}

function renderPayments() {
  const tbody = $('#paymentsTable');
  $('#paymentsEmpty').classList.toggle('hidden', state.payments.length > 0);
  tbody.innerHTML = state.payments.map((payment) => `
    <tr>
      <td><strong>${payment.tutorName || 'Participante'}</strong><span>${payment.tutorWhatsapp || ''}</span><br><small>${payment.tutorEmail || ''}</small></td>
      <td>${teamText(payment, 'team1')} x ${teamText(payment, 'team2')}<br><small>${formatDate(payment.matchDate, payment.matchTime)}</small></td>
      <td><strong>${money(payment.amountCents)}</strong></td>
      <td>${tag(payment.status)}<br><small>${formatDateTime(payment.createdAt)}</small></td>
      <td>${payment.method || '-'}<br><small>${payment.mercadoPagoPaymentId || payment.preferenceId || payment.provider || ''}</small></td>
      <td class="actions-cell">${payment.status !== 'approved' ? actionMenu([{ label: 'Marcar pago', attr: `data-approve-payment="${payment.id}"` }]) : '—'}</td>
    </tr>`).join('');
}

function renderPredictions() {
  const tbody = $('#predictionsTable');
  $('#predictionsEmpty').classList.toggle('hidden', state.predictions.length > 0);
  tbody.innerHTML = state.predictions.map((prediction) => `
    <tr>
      <td><strong>${prediction.tutorName || 'Usuário'}</strong><span>${prediction.tutorWhatsapp || ''}</span><br><small>${prediction.tutorEmail || ''}</small></td>
      <td>${teamText(prediction, 'team1')} x ${teamText(prediction, 'team2')}<br><small>${formatDate(prediction.matchDate, prediction.matchTime)}</small></td>
      <td><strong>${teamText(prediction, 'team1')} ${prediction.predictedTeam1Score ?? prediction.predictedBrazilScore} x ${prediction.predictedTeam2Score ?? prediction.predictedOpponentScore} ${teamText(prediction, 'team2')}</strong></td>
      <td>${tag(prediction.status)}${prediction.awardDescription ? `<br><small>${prediction.awardDescription}</small>` : ''}${prediction.paymentStatus ? `<br><small>Pagamento: ${statusLabel(prediction.paymentStatus)}</small>` : ''}</td>
      <td>${formatDateTime(prediction.submittedAt)}</td>
      <td class="actions-cell">${['correct','awarded'].includes(prediction.status) ? actionMenu([{ label: 'Marcar prêmio entregue', attr: `data-award="${prediction.id}"` }]) : '—'}</td>
    </tr>`).join('');
}


function renderUsers() {
  const tbody = $('#usersTable');
  $('#usersEmpty').classList.toggle('hidden', state.users.length > 0);
  tbody.innerHTML = state.users.map((user) => `
    <tr>
      <td><strong>${user.name || 'Usuário'}</strong><span>${user.email || ''}</span></td>
      <td>${user.whatsapp ? `<a href="https://wa.me/55${user.whatsapp}" target="_blank">${user.whatsapp}</a>` : '—'}</td>
      <td><strong>${user.approvedPaymentsCount || 0} aprovado(s)</strong><span>${money(user.approvedAmountCents || 0)}</span><br><small>${user.pendingPaymentsCount || 0} pendente(s)</small></td>
      <td><strong>${user.predictionsCount || 0}</strong><span>${user.correctPredictionsCount || 0} acerto(s)</span></td>
      <td>${formatDateTime(user.createdAt)}</td>
    </tr>`).join('');
}

function renderStandings() {
  const container = $('#standingsContainer');
  const groups = state.standings || [];
  const knockout = state.knockout || [];
  $('#standingsEmpty').classList.toggle('hidden', groups.length > 0);

  const groupsHtml = `
    <div class="standings-block">
      <div class="standings-block-title">
        <div>
          <h3>Fase de grupos — Copa do Mundo 2026</h3>
          <p>Todos os grupos A–L já aparecem preenchidos. Ao finalizar jogos no admin, pontos, gols e saldo atualizam automaticamente.</p>
        </div>
        <small>${state.standingsUpdatedAt ? `Atualizado em ${formatDateTime(state.standingsUpdatedAt)}` : 'Atualização automática'}</small>
      </div>
      <div class="standings-grid">
        ${groups.map((group) => `
          <article class="standings-card">
            <header><strong>${group.groupName}</strong><small>${group.teams.length} seleções</small></header>
            <div class="table-scroll compact-table">
              <table>
                <thead><tr><th>#</th><th>Seleção</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead>
                <tbody>
                  ${group.teams.map((team, index) => `
                    <tr>
                      <td><strong>${index + 1}</strong></td>
                      <td class="standings-team-cell"><strong class="team-inline">${teamFlagHtml(team.flag, team.code)}<span>${team.name}</span></strong></td>
                      <td><strong>${team.points}</strong></td>
                      <td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </article>`).join('')}
      </div>
    </div>`;

  const knockoutHtml = `
    <div class="standings-block">
      <div class="standings-block-title">
        <div>
          <h3>Mata-mata</h3>
          <p>Cadastre jogos como 16 avos, Oitavas, Quartas, Semifinal, Disputa 3º lugar ou Final para acompanhar o chaveamento.</p>
        </div>
      </div>
      <div class="knockout-grid">
        ${knockout.map((round) => `
          <article class="knockout-card">
            <header><strong>${round.roundName}</strong><small>${round.games.length ? `${round.games.length} jogo(s)` : 'aguardando jogos'}</small></header>
            <div class="knockout-list">
              ${round.games.length ? round.games.map((game) => `
                <div class="knockout-game">
                  <div>
                    <strong>${teamText(game, 'team1')} x ${teamText(game, 'team2')}</strong>
                    <small>${formatDate(game.matchDate, game.matchTime)} · ${statusLabel(game.status)}</small>
                  </div>
                  <span>${game.team1Score === null || game.team2Score === null ? '—' : `${game.team1Score} x ${game.team2Score}`}</span>
                </div>`).join('') : `<div class="empty-inline">Cadastre jogos desta fase no botão + Novo jogo.</div>`}
            </div>
          </article>`).join('')}
      </div>
    </div>`;

  container.innerHTML = groupsHtml + knockoutHtml;
}

function resetForm(game = null) {
  const form = $('#gameForm');
  form.reset();
  form.elements.id.value = game?.id || '';
  const team1Fallback = findTeam(game?.team1Code || game?.team1Name) || findTeam('BRA');
  const team2Fallback = findTeam(game?.team2Code || game?.team2Name || game?.opponent) || findTeam('ARG');
  ensureOption($('#team1Select'), game?.team1Code, game?.team1Name, game?.team1Flag);
  ensureOption($('#team2Select'), game?.team2Code, game?.team2Name, game?.team2Flag);
  $('#team1Select').value = game?.team1Code || team1Fallback?.code || 'BRA';
  $('#team2Select').value = game?.team2Code || team2Fallback?.code || 'ARG';
  ensureGroupOption(game?.groupName);
  form.groupName.value = game?.groupName || 'Grupo A';
  form.roundName.value = game?.roundName || '';
  form.prizeDescription.value = game?.prizeDescription || 'Banho grátis PetFunny';
  form.entryFee.value = amountInput(game?.entryFeeCents ?? 1000);
  form.matchDate.value = game?.matchDate || '';
  form.matchTime.value = game?.matchTime || '16:00';
  form.status.value = game?.status || 'open';
  form.isActive.value = String(game?.isActive ?? true);
  form.team1Score.value = game?.team1Score ?? game?.brazilScore ?? '';
  form.team2Score.value = game?.team2Score ?? game?.opponentScore ?? '';
  updateScoreLabels();
  $('#gameFormTitle').textContent = game ? 'Editar jogo' : 'Novo jogo';
  $('#gameFormSubtitle').textContent = game ? 'Atualize dados do jogo, status, placar, grupo e valor do bolão.' : 'Cadastre grupo, seleções, data, valor do bolão e status da partida.';
  $('#saveGameBtn').textContent = game ? 'Salvar alterações' : 'Cadastrar jogo';
  openGameModal();
}

async function load() {
  const [summary, games] = await Promise.all([
    api('/api/bolao-copa/summary'),
    api('/api/bolao-copa/games')
  ]);
  state.games = games.games || [];
  renderSummary(summary.summary || {});
  renderGames();
  await Promise.all([loadPayments(), loadPredictions(), loadUsers(), loadStandings()]);
}

async function loadPredictions(gameId = state.selectedGameId || '') {
  state.selectedGameId = gameId;
  const status = $('#predictionStatusFilter').value || '';
  const params = new URLSearchParams();
  if (gameId) params.set('gameId', gameId);
  if (status) params.set('status', status);
  const data = await api(`/api/bolao-copa/predictions?${params.toString()}`);
  state.predictions = data.predictions || [];
  renderPredictions();
}

async function loadPayments() {
  const status = $('#paymentStatusFilter').value || '';
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const data = await api(`/api/bolao-copa/payments?${params.toString()}`);
  state.payments = data.payments || [];
  renderPayments();
}

async function loadUsers() {
  const data = await api('/api/bolao-copa/users');
  state.users = data.users || [];
  renderUsers();
}

async function loadStandings() {
  const data = await api('/api/bolao-copa/standings');
  state.standings = data.groups || [];
  state.knockout = data.knockout || [];
  state.standingsUpdatedAt = data.updatedAt || '';
  renderStandings();
}

function showApp() {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  load().then(() => showSection(state.activeSection)).catch(showCrudError);
}

populateTeamSelects();
populateGroupSelect();

if (state.token) showApp();

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    state.token = data.token;
    localStorage.setItem('bolaoAdminToken', state.token);
    showApp();
  } catch (error) { showCrudError(error); }
});

$('#logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('bolaoAdminToken');
  state.token = '';
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
});

$('#team1Select').addEventListener('change', updateScoreLabels);
$('#team2Select').addEventListener('change', updateScoreLabels);
$('#newGameBtn').addEventListener('click', () => resetForm());
$('#newGameBtnInline').addEventListener('click', () => resetForm());
$('#cancelGameBtn').addEventListener('click', closeGameModal);
$('#cancelGameFooterBtn').addEventListener('click', closeGameModal);
$('#refreshBtn').addEventListener('click', () => load().then(() => showSection(state.activeSection)).catch(showCrudError));

async function handleMenuAction(button) {
  if (!button) return;
  const editId = button.dataset.edit;
  const predictionsId = button.dataset.predictions;
  const evaluateId = button.dataset.evaluate;
  const deleteId = button.dataset.delete;
  const approvePaymentId = button.dataset.approvePayment;
  const awardId = button.dataset.award;

  try {
    closeActionMenus();

    if (editId) {
      const game = state.games.find((item) => item.id === editId);
      if (!game) throw new Error('Jogo não encontrado para edição. Atualize a página e tente novamente.');
      resetForm(game);
      return;
    }

    if (predictionsId) {
      await loadPredictions(predictionsId);
      showSection('predictions');
      return;
    }

    if (evaluateId) {
      const ok = await confirmAction({ title: 'Apurar jogo', message: 'Apurar este jogo agora usando o placar cadastrado?', confirmText: 'Apurar jogo', danger: false });
      if (!ok) return;
      const data = await api(`/api/bolao-copa/games/${evaluateId}/evaluate`, { method: 'POST', body: '{}' });
      showToast(data.message || 'Jogo apurado com sucesso.', 'success');
      await load();
      showSection('games');
      return;
    }

    if (deleteId) {
      const ok = await confirmAction({ title: 'Excluir jogo', message: 'Deseja excluir este jogo do bolão? Essa ação remove o jogo das telas e não deve ser usada se já houver participação real.', confirmText: 'Excluir jogo', danger: true });
      if (!ok) return;
      await api(`/api/bolao-copa/games/${deleteId}`, { method: 'DELETE' });
      showCrudSuccess('delete', 'Jogo');
      await load();
      showSection('games');
      return;
    }

    if (approvePaymentId) {
      await api(`/api/bolao-copa/payments/${approvePaymentId}/approve`, { method: 'PATCH', body: '{}' });
      showCrudSuccess('approve', 'Pagamento');
      await load();
      showSection('payments');
      return;
    }

    if (awardId) {
      await api(`/api/bolao-copa/predictions/${awardId}/award`, { method: 'PATCH', body: '{}' });
      showCrudSuccess('award', 'Prêmio');
      await load();
      showSection('predictions');
    }
  } catch (error) {
    showCrudError(error);
  }
}

$('#reloadPredictionsBtn').addEventListener('click', () => loadPredictions().catch(showCrudError));
$('#reloadPaymentsBtn').addEventListener('click', () => loadPayments().catch(showCrudError));
$('#predictionStatusFilter').addEventListener('change', () => loadPredictions().catch(showCrudError));
$('#paymentStatusFilter').addEventListener('change', () => loadPayments().catch(showCrudError));
$('#reloadUsersBtn').addEventListener('click', () => loadUsers().catch(showCrudError));
$('#reloadStandingsBtn').addEventListener('click', () => loadStandings().catch(showCrudError));
$('#adminSectionNav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-section-target]');
  if (!button) return;
  showSection(button.dataset.sectionTarget);
});
$('#confirmCancelBtn').addEventListener('click', () => closeConfirmModal(false));
$('#confirmOkBtn').addEventListener('click', () => closeConfirmModal(true));

document.addEventListener('click', (event) => {
  const floatingButton = event.target.closest('#floatingActionMenu button');
  if (floatingButton) {
    event.preventDefault();
    event.stopPropagation();
    handleMenuAction(floatingButton);
    return;
  }

  const toggle = event.target.closest('[data-menu-toggle]');
  if (toggle) {
    const menu = toggle.parentElement?.querySelector('.action-menu');
    const willOpen = !toggle.classList.contains('active');
    closeActionMenus();
    if (menu && willOpen) positionActionMenu(toggle, menu);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (!event.target.closest('.kebab') && !event.target.closest('#floatingActionMenu')) closeActionMenus();
});

$('#gameForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form));
  const id = payload.id;
  delete payload.id;
  payload.isActive = payload.isActive === 'true';
  try {
    applySelectedTeamsToPayload(payload);
    const data = await api(id ? `/api/bolao-copa/games/${id}` : '/api/bolao-copa/games', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeGameModal();
    showCrudSuccess(id ? 'update' : 'create', 'Jogo');
    await load();
    showSection('games');
  } catch (error) { showCrudError(error); }
});

$('#gamesTable').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || button.dataset.menuToggle !== undefined) return;
  await handleMenuAction(button);
});

$('#paymentsTable').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-approve-payment]');
  if (!button || button.dataset.menuToggle !== undefined) return;
  await handleMenuAction(button);
});

$('#predictionsTable').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-award]');
  if (!button || button.dataset.menuToggle !== undefined) return;
  await handleMenuAction(button);
});


window.addEventListener('resize', () => closeActionMenus());
window.addEventListener('scroll', () => closeActionMenus(), true);

setInterval(() => {
  if (!document.hidden && state.token) load().catch(() => null);
}, 30000);
