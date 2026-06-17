const FLAG_BASE_PATH = '/assets/img/flags/';
function flagAsset(code) { return `${FLAG_BASE_PATH}${String(code || '').toUpperCase()}.png`; }

const state = {
  token: localStorage.getItem('bolaoTutorToken') || '',
  tutor: JSON.parse(localStorage.getItem('bolaoTutor') || 'null'),
  bolao: null,
  groupFilter: localStorage.getItem('bolaoGroupFilter') || '',
  gameMode: localStorage.getItem('bolaoGameMode') || 'available',
  showOldGames: false,
  standings: [],
  knockout: [],
  standingsUpdatedAt: '',
  rules: null,
  prizes: []
};

const $ = (selector) => document.querySelector(selector);
const toast = $('#toast');
const views = ['loginView', 'registerView', 'forgotView', 'resetView', 'appView'];

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 4200);
}

function showView(id) {
  views.forEach((viewId) => $(`#${viewId}`)?.classList.toggle('hidden', viewId !== id));
  const showAuthChrome = id !== 'appView';
  $('#authLogo')?.classList.toggle('hidden', !showAuthChrome);
  $('#authFooter')?.classList.toggle('hidden', !showAuthChrome);
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
    scheduled: 'Agendado', open: 'Aberto', closed: 'Encerrado para palpites', finished: 'Finalizado', canceled: 'Cancelado',
    pending: 'Pagamento pendente', approved: 'Pagamento aprovado', rejected: 'Pagamento recusado', cancelled: 'Pagamento cancelado', refunded: 'Estornado', expired: 'Expirado',
    correct: 'Ganhador', wrong: 'Não acertou', awarded: 'Prêmio entregue',
    requested: 'Resgate solicitado', processing: 'Resgate em análise', paid: 'Resgate pago', rejected: 'Resgate recusado',
    available: 'Aberto para participar', payment_required: 'Pagamento necessário', prediction_released: 'Palpite liberado', already_predicted: 'Já palpitado', old: 'Jogo antigo', all: 'Todos os jogos'
  })[status] || status || '-';
}

function tag(status) {
  return `<span class="tag tag-${status}">${statusLabel(status)}</span>`;
}

function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
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

function maskWhatsApp(value = '') {
  const digits = String(value).replace(/\D+/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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


function teamLabel(game, side) {
  const flag = game?.[`${side}Flag`] || '';
  const code = game?.[`${side}Code`] || '';
  const name = game?.[`${side}Name`] || (side === 'team1' ? 'Time 1' : game?.opponent || 'Time 2');
  return `${teamFlagHtml(flag, code)}${name}`;
}

function gameLabel(game) {
  return `${teamLabel(game, 'team1')} x ${teamLabel(game, 'team2')}`;
}

function gameGroup(game) {
  return game?.groupName || 'Grupo A';
}

function isPredictionAvailable(game = {}) {
  return Boolean(game.isOpen) && !game.myPrediction && game.status !== 'canceled';
}

function isOldGame(game = {}) {
  return !Boolean(game.isOpen) || ['closed', 'finished', 'canceled'].includes(game.status);
}

function hasUserActivity(game = {}) {
  return Boolean(game.myPrediction) || Boolean(game.myPayment);
}

function gameAvailabilityInfo(game = {}) {
  if (game.myPrediction) {
    return { key: 'already_predicted', label: 'Já palpitado', description: 'Seu palpite já foi registrado para este jogo.' };
  }
  if (game.status === 'finished') {
    return { key: 'finished', label: 'Finalizado', description: 'Resultado lançado no admin. Este jogo fica em Jogos antigos.' };
  }
  if (game.status === 'canceled') {
    return { key: 'canceled', label: 'Cancelado', description: 'Este jogo foi cancelado no admin.' };
  }
  if (!game.isOpen || game.status === 'closed') {
    return { key: 'closed', label: 'Palpites encerrados', description: 'O prazo de palpite já fechou para este jogo.' };
  }
  if (!isPaid(game)) {
    return { key: 'payment_required', label: 'Pagamento necessário', description: `Pague ${money(game.entryFeeCents)} para liberar o palpite.` };
  }
  return { key: 'prediction_released', label: 'Palpite liberado', description: 'Pagamento aprovado. Envie seu palpite antes do fechamento.' };
}

function visibleGames() {
  const games = state.bolao?.games || [];
  const mode = state.gameMode || 'available';
  if (mode === 'standings' || mode === 'rules') return [];
  if (mode === 'old') return games.filter(isOldGame);
  if (mode === 'mine') return games.filter(hasUserActivity);
  if (mode === 'all') return games;
  return games.filter(isPredictionAvailable);
}

function availableGroups() {
  return [...new Set(visibleGames().map(gameGroup).filter(Boolean))];
}

function gameModeMeta(mode = state.gameMode) {
  return ({
    available: { title: 'Jogos disponíveis para palpite', empty: 'Nenhum jogo aberto para palpite no momento.' },
    mine: { title: 'Meus palpites e pagamentos', empty: 'Você ainda não participou de nenhum jogo.' },
    old: { title: 'Jogos antigos', empty: 'Nenhum jogo antigo encontrado.' },
    all: { title: 'Todos os jogos', empty: 'Nenhum jogo cadastrado para exibir.' },
    standings: { title: 'Tabela da Copa', empty: 'Tabela ainda não carregada.' },
    rules: { title: 'Regras e resgate', empty: '' }
  })[mode] || ({ title: 'Jogos disponíveis para palpite', empty: 'Nenhum jogo aberto para palpite no momento.' });
}

function setGameMode(mode = 'available') {
  state.gameMode = ['available', 'mine', 'old', 'all', 'standings', 'rules'].includes(mode) ? mode : 'available';
  state.showOldGames = state.gameMode === 'old';
  localStorage.setItem('bolaoGameMode', state.gameMode);
  renderAppSections();
  if (state.gameMode === 'standings') {
    loadStandings().catch((error) => showToast(error.message));
  }
  if (state.gameMode === 'rules') {
    loadRulesAndPrizes().catch((error) => showToast(error.message));
  }
  renderGroupFilter();
  renderGames();
}

function renderAppSections() {
  const showingStandings = state.gameMode === 'standings';
  const showingRules = state.gameMode === 'rules';
  $('#appStandingsSection')?.classList.toggle('hidden', !showingStandings);
  $('#appRulesSection')?.classList.toggle('hidden', !showingRules);
  $('#gamesContentSection')?.classList.toggle('hidden', showingStandings || showingRules);
  $('#clientStats')?.classList.toggle('hidden', showingStandings || showingRules);
}


function renderGameModeTabs() {
  const container = $('#gameModeTabs');
  if (!container) return;
  const modes = [
    ['available', 'Disponíveis'],
    ['mine', 'Meus palpites'],
    ['old', 'Jogos antigos'],
    ['all', 'Todos os jogos'],
    ['standings', 'Tabela da Copa'],
    ['rules', 'Regras e resgate']
  ];
  container.innerHTML = modes.map(([mode, label]) => `<button class="mode-tab ${state.gameMode === mode ? 'active' : ''}" type="button" data-game-mode="${mode}">${label}</button>`).join('');
}

function renderGroupFilter() {
  const select = $('#groupFilter');
  if (!select) return;
  const groups = availableGroups();
  const current = groups.includes(state.groupFilter) ? state.groupFilter : '';
  state.groupFilter = current;
  select.innerHTML = '<option value="">Todos os grupos</option>' + groups.map((group) => `<option value="${group}">${group}</option>`).join('');
  select.value = current;
  localStorage.setItem('bolaoGroupFilter', current);
  renderGameModeTabs();
}

function deadlineLabel(game) {
  if (!game?.predictionClosesAt) return 'Palpites encerram 10 minutos antes do jogo.';
  const [date, time] = game.predictionClosesAt.split('T');
  return `Palpites até ${formatDate(date, time)}.`;
}

function isPaid(game) {
  return Number(game.entryFeeCents || 0) <= 0 || game.myPayment?.status === 'approved';
}

function cashoutPrizeCents(game = {}) {
  return Math.max(0, Math.floor(Number(game.accumulatedCents || 0) * 0.9));
}

function platformFeeCents(game = {}) {
  return Math.max(0, Math.floor(Number(game.accumulatedCents || 0) * 0.1));
}

function prizeDescription(game = {}) {
  return game.prizeDescription || 'Prêmio do Bolão da Copa';
}

function payoutPerWinnerCents(summary = {}) {
  return Math.max(0, Number(summary.prizePerWinnerCents || 0));
}

function predictionStatusLabel(status = '') {
  return ({ pending: 'Aguardando resultado', correct: 'Ganhador', wrong: 'Não acertou', awarded: 'Prêmio entregue' })[status] || statusLabel(status);
}

function knockoutRoundsWithDefaults(knockout = []) {
  const rounds = ['16 avos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Disputa 3º lugar', 'Final'];
  const map = new Map((knockout || []).map((round) => [round.roundName, round]));
  return rounds.map((roundName) => map.get(roundName) || { roundName, games: [] });
}

function renderStats() {
  const games = state.bolao?.games || [];
  const sent = games.filter((game) => game.myPrediction).length;
  const winners = state.bolao?.winners || 0;
  const paid = games.filter((game) => game.myPayment?.status === 'approved').length;
  const openCount = games.filter(isPredictionAvailable).length;
  $('#clientStats').innerHTML = [
    ['Jogos para palpitar', openCount],
    ['Total de jogos', games.length],
    ['Palpites enviados', sent],
    ['Pagamentos aprovados', paid],
    ['Prêmios ganhos', winners]
  ].map(([label, value]) => `<article class="card stat"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function gameStatusText(game) {
  if (game.myPrediction) {
    return `Seu palpite: ${teamLabel(game, 'team1')} ${game.myPrediction.predictedTeam1Score ?? game.myPrediction.predictedBrazilScore} x ${game.myPrediction.predictedTeam2Score ?? game.myPrediction.predictedOpponentScore} ${teamLabel(game, 'team2')}`;
  }
  const info = gameAvailabilityInfo(game);
  if (info.key === 'prediction_released') return deadlineLabel(game);
  return info.description;
}

function paymentPanel(game) {
  if (game.myPrediction) return '';
  if (Number(game.entryFeeCents || 0) <= 0) return `<div class="card panel mini-panel"><strong>Participação liberada</strong><br>Este bolão está sem cobrança.</div>`;
  const payment = game.myPayment;
  if (payment?.status === 'approved') {
    return `<div class="card panel mini-panel success-panel"><strong>Pagamento aprovado ✅</strong><br>Agora envie seu palpite para ${gameLabel(game)}.</div>`;
  }
  if (!game.isOpen) return '';

  const pixBlock = payment?.pixQrCode || payment?.pixQrCodeBase64 ? `
    <div class="pix-box">
      ${payment.pixQrCodeBase64 ? `<img alt="QR Code Pix" src="data:image/png;base64,${payment.pixQrCodeBase64}" />` : ''}
      ${payment.pixQrCode ? `<textarea readonly>${payment.pixQrCode}</textarea><button class="btn btn-full" data-copy-pix="${game.id}">Copiar Pix copia e cola</button>` : ''}
    </div>` : '';

  return `
    <div class="payment-box card panel">
      <div class="payment-head">
        <div><strong>Participação: ${money(game.entryFeeCents)}</strong><span>${payment ? statusLabel(payment.status) : 'Escolha a forma de pagamento'}</span></div>
        ${payment ? tag(payment.status) : ''}
      </div>
      <div class="payment-actions">
        <button class="btn btn-primary" data-pay-checkout="${game.id}">Cartão crédito/débito</button>
        <button class="btn btn-pink" data-pay-pix="${game.id}">Gerar Pix</button>
        <button class="btn" data-check-payment="${game.id}">Verificar pagamento</button>
      </div>
      ${pixBlock}
      <small>O palpite só libera quando o pagamento constar como aprovado.</small>
    </div>`;
}

function predictionForm(game) {
  const prediction = game.myPrediction;
  const disabled = !game.isOpen || Boolean(prediction) || !isPaid(game);
  if (prediction) {
    return `<div class="card panel mini-panel"><strong>Palpite registrado ✅</strong><br>O palpite fica salvo e não pode ser alterado pelo app.</div>`;
  }
  return `
    <form class="score-form" data-prediction-form="${game.id}">
      <div class="score-team-field"><label>${teamLabel(game, 'team1')}</label><input name="team1Score" type="number" min="0" max="99" ${disabled ? 'disabled' : ''} required></div>
      <div class="score-vs">x</div>
      <div class="score-team-field"><label>${teamLabel(game, 'team2')}</label><input name="team2Score" type="number" min="0" max="99" ${disabled ? 'disabled' : ''} required></div>
      ${disabled ? '' : `<button class="btn btn-primary" style="grid-column:1 / -1">Enviar palpite</button>`}
    </form>`;
}

function renderGames() {
  renderAppSections();
  if (state.gameMode === 'standings') {
    renderGameModeTabs();
    return;
  }
  const allGames = visibleGames();
  const games = state.groupFilter ? allGames.filter((game) => gameGroup(game) === state.groupFilter) : allGames;
  const groupedGames = groupGamesByDate(games);
  const oldBtn = $('#oldGamesBtn');
  if (oldBtn) oldBtn.textContent = state.gameMode === 'old' ? 'Voltar para disponíveis' : 'Jogos antigos';
  renderGameModeTabs();
  const meta = gameModeMeta();
  const title = $('#gamesSectionTitle');
  if (title) title.textContent = meta.title;
  $('#gamesEmpty').textContent = meta.empty;
  $('#gamesEmpty').classList.toggle('hidden', games.length > 0);
  $('#gamesList').innerHTML = groupedGames.map((group) => `
    <section class="date-game-section">
      <div class="date-section-title">
        <span>${formatDateHeading(group.date)}</span>
        <small>${group.games.length} jogo(s)</small>
      </div>
      <div class="stack">
        ${group.games.map((game) => {
          const prediction = game.myPrediction;
          const availability = gameAvailabilityInfo(game);
          const status = availability.key;
          return `
            <article class="game-card card" data-game-card="${game.id}">
              <header class="game-card-header">
                <div class="game-card-title-block">
                  <div class="game-card-group-line"><span class="group-pill">${gameGroup(game)}</span></div>
                  <strong class="game-card-teams-line">${gameLabel(game)}</strong>
                  <div class="game-card-meta-line">${game.roundName || game.title || 'Fase de Grupos'} · ${formatDate(game.matchDate, game.matchTime)}</div>
                </div>
                ${status === 'payment_required' ? '' : tag(status)}
              </header>
              ${status === 'payment_required' ? '' : `<div class="game-state-line ${status}"><strong>${availability.label}</strong><span>${availability.description}</span></div>`}
              <div class="bolao-numbers">
                <div><span>Valor do jogo</span><strong>${money(game.entryFeeCents)}</strong></div>
                <div><span>Acumulado</span><strong>${money(game.accumulatedCents)}</strong></div>
                <div><span>Retirada se acertar</span><strong>${money(cashoutPrizeCents(game))}</strong></div>
              </div>
              <div class="prize-callout">
                <div><span>Premiação</span><strong>${prizeDescription(game)}</strong></div>
                <small>Transparência: acumulado ${money(game.accumulatedCents)} • plataforma 10% (${money(platformFeeCents(game))}) • prêmio líquido ${money(cashoutPrizeCents(game))}.</small>
              </div>
              <button class="btn btn-full btn-soft" type="button" data-game-predictions="${game.id}">Ver palpites e ganhadores</button>
              <p style="margin:0;color:var(--muted);font-weight:800">${gameStatusText(game)}</p>
              ${game.status === 'finished' && game.team1Score !== null ? `<div class="card panel mini-panel"><strong>Resultado final</strong><br>${teamLabel(game, 'team1')} ${game.team1Score} x ${game.team2Score} ${teamLabel(game, 'team2')}</div>` : ''}
              ${paymentPanel(game)}
              ${predictionForm(game)}
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');
}

function closeGamePredictionsModal() {
  const modal = $('#gamePredictionsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function predictionScoreText(prediction = {}) {
  return `${prediction.team1Name || 'Time 1'} ${prediction.predictedTeam1Score ?? prediction.predictedBrazilScore ?? 0} x ${prediction.predictedTeam2Score ?? prediction.predictedOpponentScore ?? 0} ${prediction.team2Name || 'Time 2'}`;
}

function renderGamePredictionsModal(data = {}) {
  const modal = $('#gamePredictionsModal');
  if (!modal) return;
  const game = data.game || {};
  const predictions = data.predictions || [];
  const hasWinners = Number(data.winnersCount || 0) > 0;
  $('#gamePredictionsTitle').textContent = game.team1Name && game.team2Name ? `${game.team1Name} x ${game.team2Name}` : 'Palpites do jogo';
  $('#gamePredictionsSubtitle').textContent = `${game.groupName || 'Grupo'} · ${game.roundName || game.title || 'Fase de Grupos'} · ${formatDate(game.matchDate, game.matchTime)}`;
  $('#gamePredictionsSummary').innerHTML = `
    <div><span>Palpites</span><strong>${data.totalPredictions || predictions.length}</strong></div>
    <div><span>Acumulado</span><strong>${money(data.accumulatedCents)}</strong></div>
    <div><span>Plataforma 10%</span><strong>${money(data.platformFeeCents)}</strong></div>
    <div><span>Valor para ganhadores</span><strong>${money(data.payoutPoolCents)}</strong></div>
  `;
  $('#gamePredictionsWinners').innerHTML = hasWinners
    ? `<strong>${data.winnersCount} ganhador(es)</strong><span>Cada ganhador pode retirar ${money(payoutPerWinnerCents(data))}. O valor já está dividido entre os vencedores e desconta 10% da plataforma.</span>`
    : `<strong>Nenhum ganhador definido ainda</strong><span>Os ganhadores aparecem quando o jogo tiver resultado final e o palpite bater exatamente o placar.</span>`;
  $('#gamePredictionsList').innerHTML = predictions.length ? predictions.map((prediction) => `
    <article class="prediction-row ${prediction.isWinner ? 'winner' : ''}">
      <div class="prediction-user">
        <strong>${escapeHtml(prediction.tutorName || 'Usuário')}</strong>
        <small>${prediction.submittedAt ? `Enviado em ${formatDateTime(prediction.submittedAt)}` : 'Palpite registrado'}</small>
      </div>
      <div class="prediction-score">
        <span>${escapeHtml(predictionScoreText(prediction))}</span>
        ${prediction.isWinner ? `<strong>Ganhador · ${money(prediction.prizeCents)}</strong>` : `<small>${predictionStatusLabel(prediction.status)}</small>`}
      </div>
    </article>
  `).join('') : `<div class="empty-inline">Nenhum usuário palpitou neste jogo ainda.</div>`;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

async function openGamePredictions(gameId) {
  const data = await api(`/api/app/bolao-copa/${gameId}/predictions`);
  renderGamePredictionsModal(data);
}

function renderStandings() {
  const container = $('#appStandingsContainer');
  if (!container) return;
  const groups = state.standings || [];
  const knockout = knockoutRoundsWithDefaults(state.knockout || []);
  $('#appStandingsEmpty')?.classList.toggle('hidden', groups.length > 0);
  const groupsHtml = `
    <div class="standings-block">
      <div class="standings-block-title">
        <div>
          <h3>Fase de grupos — Copa do Mundo 2026</h3>
          <p>Acompanhe os grupos A–L. A tabela atualiza conforme os jogos forem finalizados no admin.</p>
        </div>
        <small>${state.standingsUpdatedAt ? `Atualizado em ${formatDateTime(state.standingsUpdatedAt)}` : 'Atualização automática'}</small>
      </div>
      <div class="standings-grid app-standings-grid">
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
          <p>16 avos, oitavas, quartas, semifinais, disputa de 3º lugar e final aparecem aqui quando cadastrados.</p>
        </div>
      </div>
      <div class="knockout-grid app-knockout-grid">
        ${knockout.map((round) => `
          <article class="knockout-card">
            <header><strong>${round.roundName}</strong><small>${round.games.length ? `${round.games.length} jogo(s)` : 'aguardando jogos'}</small></header>
            <div class="knockout-list">
              ${round.games.length ? round.games.map((game) => `
                <div class="knockout-game">
                  <div>
                    <strong>${teamLabel(game, 'team1')} x ${teamLabel(game, 'team2')}</strong>
                    <small>${formatDate(game.matchDate, game.matchTime)} · ${statusLabel(game.status)}</small>
                  </div>
                  <span>${game.team1Score === null || game.team2Score === null ? '—' : `${game.team1Score} x ${game.team2Score}`}</span>
                </div>`).join('') : `<div class="empty-inline">Aguardando cadastro dos jogos desta fase.</div>`}
            </div>
          </article>`).join('')}
      </div>
    </div>`;
  container.innerHTML = groupsHtml + knockoutHtml;
}


function renderRulesAndPrizes() {
  const rules = state.rules || state.bolao || {};
  const rulesList = $('#rulesList');
  if (rulesList) {
    const items = rules.rules || [
      'Cada jogo possui um valor próprio de participação.',
      'O palpite só é liberado após o pagamento aprovado.',
      '10% do acumulado fica para operação do aplicativo.',
      '90% do acumulado é destinado aos ganhadores.',
      'Se houver mais de um ganhador, o prêmio líquido é dividido igualmente.',
      'O resgate é solicitado por Pix e pago em até 3 dias úteis.'
    ];
    rulesList.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  const pixForm = $('#pixForm');
  if (pixForm && state.tutor) {
    pixForm.elements.pixKeyType.value = state.tutor.pixKeyType || 'cpf';
    pixForm.elements.pixKey.value = state.tutor.pixKey || '';
  }

  const prizes = state.prizes || [];
  const list = $('#prizesList');
  const empty = $('#prizesEmpty');
  if (!list || !empty) return;
  empty.classList.toggle('hidden', prizes.length > 0);
  list.innerHTML = prizes.map((prize) => {
    const game = prize.game || {};
    const redemption = prize.redemption;
    const canRequest = !redemption;
    return `
      <article class="prize-card card panel">
        <div class="prize-card-head">
          <div>
            <span class="trust-badge">Prêmio ganho</span>
            <h3>${escapeHtml(game.team1Name || 'Time 1')} x ${escapeHtml(game.team2Name || 'Time 2')}</h3>
            <p>${escapeHtml(game.groupName || '')} · ${escapeHtml(game.roundName || game.title || 'Fase de Grupos')} · ${formatDate(game.matchDate, game.matchTime)}</p>
          </div>
          ${redemption ? tag(redemption.status) : '<span class="tag tag-correct">Disponível</span>'}
        </div>
        <div class="bolao-numbers">
          <div><span>Acumulado</span><strong>${money(prize.accumulatedCents)}</strong></div>
          <div><span>Taxa do app 10%</span><strong>${money(prize.platformFeeCents)}</strong></div>
          <div><span>Seu resgate</span><strong>${money(prize.prizeCents)}</strong></div>
        </div>
        <p class="trust-note">${Number(prize.winnersCount || 1) > 1 ? `O prêmio líquido foi dividido entre ${prize.winnersCount} ganhadores.` : 'Você foi o único ganhador deste jogo.'} O pagamento será feito via Pix em até 3 dias úteis após a solicitação.</p>
        ${redemption ? `
          <div class="redemption-box success-panel">
            <strong>Resgate solicitado</strong>
            <span>Status: ${statusLabel(redemption.status)} · Pix: ${escapeHtml(redemption.pixKeyType || '')} ${escapeHtml(redemption.pixKey || '')}</span>
          </div>` : `
          <button class="btn btn-primary btn-full" type="button" data-redeem-prize="${prize.prediction?.id || ''}">Solicitar resgate via Pix</button>`}
      </article>`;
  }).join('');
}

async function loadRulesAndPrizes() {
  const data = await api('/api/app/prizes');
  state.rules = { rules: data.rules || [], platformFeePercent: data.platformFeePercent, payoutPercent: data.payoutPercent, redemptionDeadline: data.redemptionDeadline };
  state.prizes = data.prizes || [];
  if (data.tutor) {
    state.tutor = data.tutor;
    localStorage.setItem('bolaoTutor', JSON.stringify(state.tutor));
  }
  renderRulesAndPrizes();
}

async function savePix(form) {
  const data = await api('/api/app/me/pix', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  state.tutor = data.tutor;
  localStorage.setItem('bolaoTutor', JSON.stringify(state.tutor));
  renderRulesAndPrizes();
  showToast(data.message || 'Pix salvo.');
}

async function redeemPrize(predictionId) {
  const data = await api(`/api/app/prizes/${predictionId}/redeem`, { method: 'POST', body: JSON.stringify({}) });
  if (data.tutor) {
    state.tutor = data.tutor;
    localStorage.setItem('bolaoTutor', JSON.stringify(state.tutor));
  }
  showToast(data.message || 'Resgate solicitado.');
  await loadRulesAndPrizes();
}

async function loadStandings() {
  const data = await api('/api/app/bolao-copa/standings');
  state.standings = data.groups || [];
  state.knockout = data.knockout || [];
  state.standingsUpdatedAt = data.updatedAt || '';
  renderStandings();
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function showApp() {
  showView('appView');
  $('#tutorName').textContent = state.tutor?.name || 'Participante';
  load().catch((error) => {
    showToast(error.message);
    if (/sessão|token|participante/i.test(error.message)) logout();
  });
}

async function load() {
  const [me, bolao] = await Promise.all([api('/api/app/me'), api('/api/app/bolao-copa')]);
  state.tutor = me.tutor;
  state.bolao = bolao;
  localStorage.setItem('bolaoTutor', JSON.stringify(state.tutor));
  $('#tutorName').textContent = state.tutor?.name || 'Participante';
  renderAppSections();
  renderGroupFilter();
  renderStats();
  renderGames();
  renderRulesAndPrizes();
  await loadStandings();
}

function logout() {
  localStorage.removeItem('bolaoTutorToken');
  localStorage.removeItem('bolaoTutor');
  state.token = '';
  state.tutor = null;
  state.bolao = null;
  showView('loginView');
}

async function authenticate(path, form) {
  const data = await api(path, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  state.token = data.token;
  state.tutor = data.tutor;
  localStorage.setItem('bolaoTutorToken', state.token);
  localStorage.setItem('bolaoTutor', JSON.stringify(state.tutor));
  showToast(data.message || 'Bem-vindo ao Bolão da Copa!');
  showApp();
}

function openPaymentWindow(title = 'Abrindo Mercado Pago...') {
  const popup = window.open('', '_blank');
  if (!popup) return null;
  try {
    popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8f7ff;color:#25323f;text-align:center}.box{padding:24px;border-radius:22px;background:#fff;box-shadow:0 18px 45px rgba(37,50,63,.14)}strong{display:block;font-size:18px;margin-bottom:8px}</style></head><body><div class="box"><strong>${title}</strong><span>Aguarde um instante.</span></div></body></html>`);
    popup.document.close();
  } catch (_error) {}
  return popup;
}

function redirectPaymentWindow(popup, url) {
  if (!url) {
    if (popup && !popup.closed) popup.close();
    return false;
  }
  if (popup && !popup.closed) {
    popup.location.href = url;
  } else {
    window.open(url, '_blank');
  }
  return true;
}

async function handleCheckout(gameId, popup = null) {
  const data = await api(`/api/app/bolao-copa/${gameId}/payments/checkout`, { method: 'POST', body: '{}' });
  if (data.bolao) state.bolao = data.bolao;
  const opened = redirectPaymentWindow(popup, data.checkoutUrl);
  if (opened) {
    showToast('Checkout aberto em outra aba.');
    await load();
    return;
  }
  showToast(data.message || 'Checkout criado.');
  await load();
}

async function handlePix(gameId, popup = null) {
  const data = await api(`/api/app/bolao-copa/${gameId}/payments/pix`, { method: 'POST', body: '{}' });
  const pixUrl = data.payment?.checkoutUrl || data.checkoutUrl || '';
  const opened = redirectPaymentWindow(popup, pixUrl);
  showToast(opened ? 'Pix aberto em outra aba. O QR Code também fica disponível no app.' : (data.message || 'Pix gerado.'));
  await load();
}

async function checkPayment(gameId) {
  const data = await api(`/api/app/bolao-copa/${gameId}/payment/status`);
  if (data.bolao) state.bolao = data.bolao;
  renderStats();
  renderGroupFilter();
  renderGames();
  showToast(data.payment?.status === 'approved' ? 'Pagamento aprovado. Palpite liberado!' : 'Pagamento ainda não aprovado.');
}

const params = new URLSearchParams(window.location.search);
const paymentParam = params.get('payment');
const resetToken = params.get('resetToken');
if (paymentParam === 'success') showToast('Pagamento enviado pelo Mercado Pago. Verificando status...');
if (paymentParam === 'pending') showToast('Pagamento pendente no Mercado Pago.');
if (paymentParam === 'failure') showToast('Pagamento não concluído. Você pode tentar novamente.');

if (resetToken) {
  $('#resetForm').elements.token.value = resetToken;
  showView('resetView');
} else if (state.token) {
  showApp();
} else {
  showView('loginView');
}

$('#showRegisterBtn').addEventListener('click', () => showView('registerView'));
$('#showForgotBtn').addEventListener('click', () => showView('forgotView'));
$('#backToLoginFromRegister').addEventListener('click', () => showView('loginView'));
$('#backToLoginFromForgot').addEventListener('click', () => showView('loginView'));
$('#backToLoginFromReset').addEventListener('click', () => showView('loginView'));

const registerWhatsappInput = $('#registerForm input[name="whatsapp"]');
registerWhatsappInput?.addEventListener('input', (event) => {
  event.target.value = maskWhatsApp(event.target.value);
});
registerWhatsappInput?.addEventListener('blur', (event) => {
  event.target.value = maskWhatsApp(event.target.value);
});

$('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await authenticate('/api/app/auth/register', event.currentTarget); }
  catch (error) { showToast(error.message); }
});

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await authenticate('/api/app/auth/login', event.currentTarget); }
  catch (error) { showToast(error.message); }
});

$('#forgotForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await api('/api/app/auth/forgot-password', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    showToast(data.message || 'Confira seu e-mail.');
    const box = $('#forgotDevLink');
    if (data.resetUrl) {
      box.innerHTML = `<strong>Link gerado em ambiente local</strong><br><a href="${data.resetUrl}">${data.resetUrl}</a><br><small>Em produção, configure SMTP para enviar por e-mail.</small>`;
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
    }
  } catch (error) {
    showToast(error.message);
  }
});

$('#resetForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await authenticate('/api/app/auth/reset-password', event.currentTarget); }
  catch (error) { showToast(error.message); }
});

$('#logoutBtn').addEventListener('click', logout);
$('#refreshBtn').addEventListener('click', () => load().catch((error) => showToast(error.message)));
$('#pixForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await savePix(event.currentTarget); }
  catch (error) { showToast(error.message); }
});
$('#prizesList')?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-redeem-prize]');
  if (!button) return;
  try { await redeemPrize(button.dataset.redeemPrize); }
  catch (error) { showToast(error.message); }
});
$('#gameModeTabs')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-game-mode]');
  if (!button) return;
  setGameMode(button.dataset.gameMode);
});
$('#groupFilter').addEventListener('change', (event) => {
  state.groupFilter = event.target.value || '';
  localStorage.setItem('bolaoGroupFilter', state.groupFilter);
  renderGames();
});
$('#closeStandingsBtn')?.addEventListener('click', () => setGameMode('available'));
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-predictions-modal]')) closeGamePredictionsModal();
  if (event.target.id === 'gamePredictionsModal') closeGamePredictionsModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeGamePredictionsModal();
});

$('#gamesList').addEventListener('click', async (event) => {
  const predictionsButton = event.target.closest('[data-game-predictions]');
  const checkout = event.target.closest('[data-pay-checkout]');
  const pix = event.target.closest('[data-pay-pix]');
  const check = event.target.closest('[data-check-payment]');
  const copy = event.target.closest('[data-copy-pix]');
  const paymentPopup = checkout ? openPaymentWindow('Abrindo checkout Mercado Pago...') : (pix ? openPaymentWindow('Gerando Pix Mercado Pago...') : null);
  try {
    if (predictionsButton) { await openGamePredictions(predictionsButton.dataset.gamePredictions); return; }
    if (checkout) await handleCheckout(checkout.dataset.payCheckout, paymentPopup);
    if (pix) await handlePix(pix.dataset.payPix, paymentPopup);
    if (check) await checkPayment(check.dataset.checkPayment);
    if (copy) {
      const game = state.bolao?.games?.find((item) => item.id === copy.dataset.copyPix);
      await navigator.clipboard.writeText(game?.myPayment?.pixQrCode || '');
      showToast('Pix copia e cola copiado.');
    }
  } catch (error) {
    if (paymentPopup && !paymentPopup.closed) paymentPopup.close();
    showToast(error.message);
  }
});

$('#gamesList').addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-prediction-form]');
  if (!form) return;
  event.preventDefault();
  const gameId = form.dataset.predictionForm;
  const payload = Object.fromEntries(new FormData(form));
  try {
    const data = await api(`/api/app/bolao-copa/${gameId}/prediction`, { method: 'POST', body: JSON.stringify(payload) });
    state.bolao = data.bolao;
    showToast(data.message || 'Palpite enviado!');
    renderGroupFilter();
    renderStats();
    renderGames();
  } catch (error) { showToast(error.message); }
});

setInterval(() => {
  if (!document.hidden && state.token) load().catch(() => null);
}, 30000);
