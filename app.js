/**
 * ============================================
   SUPER AGENTE - CARTEIRA MÓVEL
   Aplicação Principal
   ============================================
 */

// --- Base de Dados (Supabase + localStorage fallback) ---
var db = {
  supabase: null,
  useSupabase: false,

  init: function(url, key) {
    if (!url || !key) { this.useSupabase = false; return Promise.resolve(); }
    try {
      this.supabase = supabase.createClient(url, key);
      return this.supabase.from('config').select('id').limit(1)
        .then(function() { db.useSupabase = true; })
        .catch(function() { db.useSupabase = false; });
    } catch(e) { db.useSupabase = false; return Promise.resolve(); }
  },

  getAll: function(table) {
    if (this.useSupabase) {
      return this.supabase.from(table).select('*').order('data', {ascending: false});
    }
    var d = JSON.parse(localStorage.getItem('sa_' + table) || '[]');
    return Promise.resolve({ data: d });
  },

  getById: function(table, id) {
    if (this.useSupabase) {
      return this.supabase.from(table).select('*').eq('id', id).single();
    }
    var all = JSON.parse(localStorage.getItem('sa_' + table) || '[]');
    var item = all.find(function(x) { return x.id === id; });
    return Promise.resolve({ data: item });
  },

  insert: function(table, record) {
    if (this.useSupabase) {
      return this.supabase.from(table).insert(record).select().single();
    }
    var all = JSON.parse(localStorage.getItem('sa_' + table) || '[]');
    all.unshift(record);
    localStorage.setItem('sa_' + table, JSON.stringify(all));
    return Promise.resolve({ data: record });
  },

  update: function(table, id, updates) {
    if (this.useSupabase) {
      return this.supabase.from(table).update(updates).eq('id', id).select().single();
    }
    var all = JSON.parse(localStorage.getItem('sa_' + table) || '[]');
    var idx = all.findIndex(function(x) { return x.id === id; });
    if (idx >= 0) { Object.assign(all[idx], updates); }
    localStorage.setItem('sa_' + table, JSON.stringify(all));
    return Promise.resolve({ data: all[idx] });
  },

  remove: function(table, id) {
    if (this.useSupabase) {
      return this.supabase.from(table).delete().eq('id', id);
    }
    var all = JSON.parse(localStorage.getItem('sa_' + table) || '[]');
    all = all.filter(function(x) { return x.id !== id; });
    localStorage.setItem('sa_' + table, JSON.stringify(all));
    return Promise.resolve({ data: null });
  },

  getConfig: function() {
    if (this.useSupabase) {
      return this.supabase.from('config').select('*').eq('id', 'main').single();
    }
    var c = JSON.parse(localStorage.getItem('sa_config') || '{"id":"main","super_agente_nome":"","saldo_inicial":0}');
    return Promise.resolve({ data: c });
  },

  setConfig: function(updates) {
    if (this.useSupabase) {
      return this.supabase.from('config').upsert(Object.assign({id:'main'}, updates)).select().single();
    }
    var c = JSON.parse(localStorage.getItem('sa_config') || '{"id":"main","super_agente_nome":"","saldo_inicial":0}');
    Object.assign(c, updates);
    localStorage.setItem('sa_config', JSON.stringify(c));
    return Promise.resolve({ data: c });
  }
};

// --- Utilitários ---
function uuid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, function() {
    return (Math.random()*16|0).toString(16);
  });
}

function formatMZN(val) {
  if (val === undefined || val === null) return '0,00 MZN';
  var n = Number(val);
  var parts = n.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',') + ' MZN';
}

function formatDate(iso) {
  if (!iso) return '-';
  var d = new Date(iso);
  return d.toLocaleDateString('pt-MZ', { day:'2-digit', month:'2-digit', year:'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-MZ', { hour:'2-digit', minute:'2-digit' });
}

function formatDateShort(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pt-MZ', { day:'2-digit', month:'2-digit' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function resizeImage(file, maxW, quality) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > maxW) { h = (maxW/w)*h; w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- Toast ---
function toast(msg, type) {
  type = type || 'success';
  var c = document.getElementById('toast-container');
  var t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(function() {
    t.classList.add('removing');
    setTimeout(function() { t.remove(); }, 300);
  }, 3500);
}

// --- Modal ---
function openModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// --- SVG Icons ---
var icons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  exchange: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'
};

// --- Estado da Aplicação ---
var appState = {
  currentView: 'dashboard',
  config: null,
  subagentes: [],
  operacoes: [],
  recargas: [],
  selectedRechargeValue: null
};

// --- Navegação ---
function navigateTo(view) {
  appState.currentView = view;
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.querySelectorAll('.mobile-nav-item').forEach(function(n) { n.classList.remove('active'); });

  var el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');

  document.querySelectorAll('[data-view="' + view + '"]').forEach(function(n) { n.classList.add('active'); });

  // Fechar menu mobile
  var mm = document.getElementById('mobile-more-menu');
  if (mm) mm.classList.remove('show');

  // Renderizar a vista
  switch(view) {
    case 'dashboard': renderDashboard(); break;
    case 'subagentes': renderSubagentes(); break;
    case 'operacoes': renderOperacoes(); break;
    case 'recargas': renderRecargas(); break;
    case 'relatorios': renderRelatorios(); break;
    case 'config': renderConfig(); break;
  }
}

// --- Carregar Dados ---
function loadAllData() {
  return Promise.all([
    db.getConfig(),
    db.getAll('subagentes'),
    db.getAll('operacoes'),
    db.getAll('recargas')
  ]).then(function(results) {
    appState.config = results[0].data || { id:'main', super_agente_nome:'', saldo_inicial:0 };
    appState.subagentes = results[1].data || [];
    appState.operacoes = results[2].data || [];
    appState.recargas = results[3].data || [];
  });
}

// --- DASHBOARD ---
function renderDashboard() {
  var cfg = appState.config;
  var ops = appState.operacoes;
  var recs = appState.recargas;

  var totalOperado = ops.reduce(function(s,o) { return s + o.valor; }, 0) +
                     recs.reduce(function(s,r) { return s + r.valor; }, 0);
  var totalComissoes = ops.reduce(function(s,o) { return s + o.comissao; }, 0) +
                       recs.reduce(function(s,r) { return s + r.comissao; }, 0);
  var saldoLiquido = (cfg.saldo_inicial || 0) + totalOperado - totalComissoes;
  var numOps = ops.length + recs.length;
  var numSubs = appState.subagentes.length;

  document.getElementById('dash-agent-name').textContent = cfg.super_agente_nome || 'Super Agente';
  document.getElementById('dash-total-gerido').textContent = formatMZN(totalOperado);
  document.getElementById('dash-saldo-liquido').textContent = formatMZN(saldoLiquido);
  document.getElementById('dash-total-comissoes').textContent = formatMZN(totalComissoes);
  document.getElementById('dash-num-ops').textContent = numOps;
  document.getElementById('dash-num-subs').textContent = numSubs;

  // Últimas 5 operações
  var todas = ops.concat(recs).sort(function(a,b) { return new Date(b.data) - new Date(a.data); });
  var recentes = todas.slice(0, 5);

  var tbody = document.getElementById('dash-recent-tbody');
  if (recentes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">Nenhuma operação registada</td></tr>';
    return;
  }

  tbody.innerHTML = recentes.map(function(op) {
    var isRecarga = !op.tipo;
    var tipo = isRecarga ? 'Recarga' : (LABELS_OPERACAO[op.tipo] || op.tipo);
    var sub = appState.subagentes.find(function(s) { return s.id === op.subagente_id; });
    var subNome = sub ? sub.nome : 'N/A';
    var badgeClass = isRecarga ? 'badge-info' : 'badge-green';
    return '<tr>' +
      '<td>' + formatDate(op.data) + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + tipo + '</span></td>' +
      '<td>' + subNome + '</td>' +
      '<td class="text-accent">' + formatMZN(op.valor) + '</td>' +
      '<td class="text-gold">' + formatMZN(op.comissao) + '</td>' +
      '</tr>';
  }).join('');
}

// --- SUBAGENTES ---
function renderSubagentes(searchTerm) {
  var list = appState.subagentes;
  if (searchTerm) {
    var term = searchTerm.toLowerCase();
    list = list.filter(function(s) {
      return s.nome.toLowerCase().indexOf(term) >= 0 ||
             s.telefone.indexOf(term) >= 0 ||
             s.bi.indexOf(term) >= 0;
    });
  }

  var tbody = document.getElementById('subs-tbody');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">Nenhum subagente encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(function(s) {
    var initials = s.nome.split(' ').map(function(w){return w[0]}).join('').substring(0,2).toUpperCase();
    var comissaoPct = (s.comissao_percent || 0.04) * 100;
    return '<tr>' +
      '<td><div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-family:Outfit;font-weight:700;color:var(--accent);font-size:0.8rem;flex-shrink:0;">' + initials + '</div>' +
        '<div><strong>' + s.nome + '</strong><br><span class="text-xs text-muted">' + s.telefone + '</span></div>' +
      '</div></td>' +
      '<td class="text-sm">' + s.bi + '</td>' +
      '<td><span class="badge badge-gold">' + comissaoPct + '%</span></td>' +
      '<td>' + formatDateShort(s.data_cadastro) + '</td>' +
      '<td>' +
        '<button class="btn-icon" onclick="viewBI(\'' + s.id + '\')" title="Ver BI">' + icons.eye + '</button>' +
        '<button class="btn-icon" onclick="editSubagente(\'' + s.id + '\')" title="Editar">' + icons.edit + '</button>' +
        '<button class="btn-icon" onclick="deleteSubagente(\'' + s.id + '\')" title="Remover" style="color:var(--danger)">' + icons.trash + '</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function openSubagenteForm(editId) {
  var isEdit = !!editId;
  document.getElementById('modal-subs-title').textContent = isEdit ? 'Editar Subagente' : 'Novo Subagente';
  document.getElementById('sub-form-id').value = editId || '';
  document.getElementById('sub-form-bi-preview').innerHTML = '';
  document.getElementById('sub-form-bi-preview').classList.add('hidden');

  if (isEdit) {
    var s = appState.subagentes.find(function(x) { return x.id === editId; });
    if (s) {
      document.getElementById('sub-form-nome').value = s.nome;
      document.getElementById('sub-form-bi').value = s.bi;
      document.getElementById('sub-form-telefone').value = s.telefone;
      document.getElementById('sub-form-comissao').value = (s.comissao_percent || 0.04) * 100;
      if (s.foto_bi) {
        document.getElementById('sub-form-bi-preview').innerHTML = '<img src="' + s.foto_bi + '" class="bi-preview">';
        document.getElementById('sub-form-bi-preview').classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('sub-form-nome').value = '';
    document.getElementById('sub-form-bi').value = '';
    document.getElementById('sub-form-telefone').value = '';
    document.getElementById('sub-form-comissao').value = '4';
    document.getElementById('sub-form-foto').value = '';
  }
  openModal('modal-subs');
}

async function saveSubagente() {
  var id = document.getElementById('sub-form-id').value;
  var nome = document.getElementById('sub-form-nome').value.trim();
  var bi = document.getElementById('sub-form-bi').value.trim();
  var telefone = document.getElementById('sub-form-telefone').value.trim();
  var comissaoPct = parseFloat(document.getElementById('sub-form-comissao').value) / 100;
  var fotoFile = document.getElementById('sub-form-foto').files[0];

  if (!nome || !bi || !telefone) {
    toast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  if (isNaN(comissaoPct) || comissaoPct <= 0) {
    toast('Percentual de comissão inválido.', 'error');
    return;
  }

  var fotoBi = '';
  if (fotoFile) {
    fotoBi = await resizeImage(fotoFile, 400, 0.6);
  } else if (id) {
    var existing = appState.subagentes.find(function(s) { return s.id === id; });
    if (existing) fotoBi = existing.foto_bi || '';
  }

  if (id) {
    await db.update('subagentes', id, {
      nome: nome, bi: bi, telefone: telefone,
      comissao_percent: comissaoPct, foto_bi: fotoBi
    });
    toast('Subagente actualizado com sucesso.');
  } else {
    var record = {
      id: uuid(), nome: nome, bi: bi, telefone: telefone,
      comissao_percent: comissaoPct, foto_bi: fotoBi,
      data_cadastro: new Date().toISOString()
    };
    await db.insert('subagentes', record);
    toast('Subagente registado com sucesso.');
  }

  closeModal('modal-subs');
  await loadAllData();
  renderSubagentes();
}

function editSubagente(id) { openSubagenteForm(id); }

async function deleteSubagente(id) {
  var s = appState.subagentes.find(function(x) { return x.id === id; });
  if (!s) return;
  if (!confirm('Remover o subagente "' + s.nome + '"? Esta acção é irreversível.')) return;
  await db.remove('subagentes', id);
  toast('Subagente removido.', 'info');
  await loadAllData();
  renderSubagentes();
}

function viewBI(id) {
  var s = appState.subagentes.find(function(x) { return x.id === id; });
  if (!s || !s.foto_bi) {
    toast('Foto do BI não disponível.', 'error');
    return;
  }
  document.getElementById('bi-view-img').src = s.foto_bi;
  document.getElementById('bi-view-name').textContent = s.nome;
  openModal('modal-bi-view');
}

// --- OPERAÇÕES ---
function renderOperacoes() {
  // Preencher select de subagentes
  var sel = document.getElementById('op-subagente');
  var currentVal = sel.value;
  sel.innerHTML = '<option value="">Selecione o subagente</option>';
  appState.subagentes.forEach(function(s) {
    sel.innerHTML += '<option value="' + s.id + '">' + s.nome + ' (' + s.telefone + ')</option>';
  });
  sel.value = currentVal;

  // Tabela
  var ops = appState.operacoes.sort(function(a,b) { return new Date(b.data) - new Date(a.data); });
  var tbody = document.getElementById('ops-tbody');

  if (ops.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">Nenhuma operação registada</td></tr>';
    return;
  }

  tbody.innerHTML = ops.map(function(op) {
    var sub = appState.subagentes.find(function(s) { return s.id === op.subagente_id; });
    var subNome = sub ? sub.nome : 'N/A';
    var subTel = sub ? sub.telefone : '';
    var tipoLabel = LABELS_OPERACAO[op.tipo] || op.tipo;
    var waLink = subTel ? 'https://wa.me/258' + subTel.replace(/^0/, '') +
      '?text=' + encodeURIComponent('Olá ' + subNome + ', registámos uma operação de ' + tipoLabel +
      ' no valor de ' + formatMZN(op.valor) + '. A sua comissão é de ' + formatMZN(op.comissao) +
      '. Obrigado pela confiança!') : '#';

    return '<tr>' +
      '<td class="text-sm">' + formatDate(op.data) + '</td>' +
      '<td><span class="badge badge-green">' + tipoLabel + '</span></td>' +
      '<td>' + subNome + '</td>' +
      '<td class="text-accent" style="font-weight:600">' + formatMZN(op.valor) + '</td>' +
      '<td class="text-gold" style="font-weight:600">' + formatMZN(op.comissao) + '</td>' +
      '<td>' +
        '<a href="' + waLink + '" target="_blank" class="btn-icon" title="WhatsApp" style="color:#25D366">' + icons.whatsapp + '</a>' +
        '<button class="btn-icon" onclick="deleteOperacao(\'' + op.id + '\')" title="Remover" style="color:var(--danger)">' + icons.trash + '</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function onOpSubChange() {
  var sel = document.getElementById('op-subagente');
  var subId = sel.value;
  var taxaDisplay = document.getElementById('op-taxa-display');
  if (!subId) { taxaDisplay.textContent = ''; return; }
  var tipo = document.getElementById('op-tipo').value;
  if (!tipo) { taxaDisplay.textContent = ''; return; }
  var pct = getTaxaPercent(tipo);
  taxaDisplay.textContent = 'Taxa: ' + pct + '%';
}

function onOpTipoChange() { onOpSubChange(); }

function onOpValorChange() {
  var tipo = document.getElementById('op-tipo').value;
  var valor = parseFloat(document.getElementById('op-valor').value) || 0;
  var comDisplay = document.getElementById('op-comissao-display');
  if (!tipo || valor <= 0) { comDisplay.textContent = ''; return; }
  var com = calcularComissao(valor, tipo);
  comDisplay.textContent = 'Comissão: ' + formatMZN(com);
}

async function saveOperacao() {
  var subId = document.getElementById('op-subagente').value;
  var tipo = document.getElementById('op-tipo').value;
  var valor = parseFloat(document.getElementById('op-valor').value);

  if (!subId) { toast('Selecione um subagente.', 'error'); return; }
  if (!tipo) { toast('Selecione o tipo de operação.', 'error'); return; }
  if (!valor || valor <= 0) { toast('Insira um valor válido.', 'error'); return; }

  var comissao = calcularComissao(valor, tipo);
  var record = {
    id: uuid(),
    subagente_id: subId,
    tipo: tipo,
    valor: valor,
    comissao: comissao,
    data: new Date().toISOString()
  };

  await db.insert('operacoes', record);
  toast('Operação registada com sucesso.');

  // Enviar WhatsApp
  var sub = appState.subagentes.find(function(s) { return s.id === subId; });
  if (sub && sub.telefone) {
    var tipoLabel = LABELS_OPERACAO[tipo];
    var msg = 'Olá ' + sub.nome + ', registámos uma operação de ' + tipoLabel +
      ' no valor de ' + formatMZN(valor) + '. A sua comissão é de ' + formatMZN(comissao) +
      '. Obrigado pela confiança!';
    var link = 'https://wa.me/258' + sub.telefone.replace(/^0/, '') + '?text=' + encodeURIComponent(msg);
    window.open(link, '_blank');
  }

  document.getElementById('op-valor').value = '';
  document.getElementById('op-comissao-display').textContent = '';
  await loadAllData();
  renderOperacoes();
}

async function deleteOperacao(id) {
  if (!confirm('Remover esta operação?')) return;
  await db.remove('operacoes', id);
  toast('Operação removida.', 'info');
  await loadAllData();
  renderOperacoes();
}

// --- RECARGAS ---
function renderRecargas() {
  // Select subagentes
  var sel = document.getElementById('rec-subagente');
  var currentVal = sel.value;
  sel.innerHTML = '<option value="">Selecione o subagente</option>';
  appState.subagentes.forEach(function(s) {
    sel.innerHTML += '<option value="' + s.id + '">' + s.nome + ' (' + s.telefone + ')</option>';
  });
  sel.value = currentVal;

  // Tabela de valores
  var tabela = getTabelaRecargas();
  var grid = document.getElementById('rec-values-grid');
  grid.innerHTML = tabela.map(function(r) {
    return '<div class="recharge-card' + (appState.selectedRechargeValue === r.valor ? ' selected' : '') +
      '" onclick="selectRecharge(' + r.valor + ')">' +
      '<div class="value">' + formatMZN(r.valor) + '</div>' +
      '<div class="commission">Comissão: ' + formatMZN(r.comissao) + '</div>' +
      '</div>';
  }).join('');

  // Tabela de recargas registadas
  var recs = appState.recargas.sort(function(a,b) { return new Date(b.data) - new Date(a.data); });
  var tbody = document.getElementById('recs-tbody');

  if (recs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">Nenhuma recarga registada</td></tr>';
    return;
  }

  tbody.innerHTML = recs.map(function(r) {
    var sub = appState.subagentes.find(function(s) { return s.id === r.subagente_id; });
    var subNome = sub ? sub.nome : 'N/A';
    var subTel = sub ? sub.telefone : '';
    var waLink = subTel ? 'https://wa.me/258' + subTel.replace(/^0/, '') +
      '?text=' + encodeURIComponent('Olá ' + subNome + ', registámos uma recarga de ' + formatMZN(r.valor) +
      '. A sua comissão é de ' + formatMZN(r.comissao) + '. Obrigado pela confiança!') : '#';

    return '<tr>' +
      '<td class="text-sm">' + formatDate(r.data) + '</td>' +
      '<td>' + subNome + '</td>' +
      '<td class="text-accent" style="font-weight:600">' + formatMZN(r.valor) + '</td>' +
      '<td class="text-gold" style="font-weight:600">' + formatMZN(r.comissao) + '</td>' +
      '<td>' +
        '<a href="' + waLink + '" target="_blank" class="btn-icon" title="WhatsApp" style="color:#25D366">' + icons.whatsapp + '</a>' +
        '<button class="btn-icon" onclick="deleteRecarga(\'' + r.id + '\')" title="Remover" style="color:var(--danger)">' + icons.trash + '</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function selectRecharge(val) {
  appState.selectedRechargeValue = val;
  document.getElementById('rec-comissao-display').textContent = 'Comissão: ' + formatMZN(calcularComissaoRecarga(val));
  renderRecargas();
}

async function saveRecarga() {
  var subId = document.getElementById('rec-subagente').value;
  var valor = appState.selectedRechargeValue;

  if (!subId) { toast('Selecione um subagente.', 'error'); return; }
  if (!valor) { toast('Selecione o valor da recarga.', 'error'); return; }

  var comissao = calcularComissaoRecarga(valor);
  var record = {
    id: uuid(),
    subagente_id: subId,
    valor: valor,
    comissao: comissao,
    data: new Date().toISOString()
  };

  await db.insert('recargas', record);
  toast('Recarga registada com sucesso.');

  // WhatsApp
  var sub = appState.subagentes.find(function(s) { return s.id === subId; });
  if (sub && sub.telefone) {
    var msg = 'Olá ' + sub.nome + ', registámos uma recarga de ' + formatMZN(valor) +
      '. A sua comissão é de ' + formatMZN(comissao) + '. Obrigado pela confiança!';
    var link = 'https://wa.me/258' + sub.telefone.replace(/^0/, '') + '?text=' + encodeURIComponent(msg);
    window.open(link, '_blank');
  }

  appState.selectedRechargeValue = null;
  document.getElementById('rec-comissao-display').textContent = '';
  await loadAllData();
  renderRecargas();
}

async function deleteRecarga(id) {
  if (!confirm('Remover esta recarga?')) return;
  await db.remove('recargas', id);
  toast('Recarga removida.', 'info');
  await loadAllData();
  renderRecargas();
}

// --- RELATÓRIOS ---
function getFilteredData(periodo, dataIni, dataFim) {
  var agora = new Date();
  var ini, fim;

  switch(periodo) {
    case 'diario':
      ini = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      fim = new Date(ini); fim.setDate(fim.getDate()+1);
      break;
    case 'semanal':
      ini = new Date(agora); ini.setDate(ini.getDate()-7);
      fim = agora;
      break;
    case 'mensal':
      ini = new Date(agora.getFullYear(), agora.getMonth(), 1);
      fim = new Date(agora.getFullYear(), agora.getMonth()+1, 1);
      break;
    case 'trimestral':
      ini = new Date(agora); ini.setMonth(ini.getMonth()-3);
      fim = agora;
      break;
    case 'personalizado':
      ini = dataIni ? new Date(dataIni) : new Date(0);
      fim = dataFim ? new Date(dataFim + 'T23:59:59') : agora;
      break;
    default:
      ini = new Date(0); fim = agora;
  }

  var ops = appState.operacoes.filter(function(o) {
    var d = new Date(o.data);
    return d >= ini && d <= fim;
  });

  var recs = appState.recargas.filter(function(r) {
    var d = new Date(r.data);
    return d >= ini && d <= fim;
  });

  return { operacoes: ops, recargas: recs };
}

function renderRelatorios(periodo) {
  periodo = periodo || 'diario';
  var dataIni = document.getElementById('report-date-ini').value;
  var dataFim = document.getElementById('report-date-fim').value;

  // Tabs
  document.querySelectorAll('.report-tab').forEach(function(t) { t.classList.remove('active'); });
  var activeTab = document.querySelector('.report-tab[data-period="' + periodo + '"]');
  if (activeTab) activeTab.classList.add('active');

  // Mostrar/esconder filtros personalizados
  var customFiltros = document.getElementById('report-custom-filters');
  customFiltros.classList.toggle('hidden', periodo !== 'personalizado');

  var filtered = getFilteredData(periodo, dataIni, dataFim);
  var ops = filtered.operacoes;
  var recs = filtered.recargas;

  var totalOps = ops.reduce(function(s,o) { return s + o.valor; }, 0);
  var totalRecs = recs.reduce(function(s,r) { return s + r.valor; }, 0);
  var comOps = ops.reduce(function(s,o) { return s + o.comissao; }, 0);
  var comRecs = recs.reduce(function(s,r) { return s + r.comissao; }, 0);
  var totalGeral = totalOps + totalRecs;
  var totalComissoes = comOps + comRecs;
  var liquido = totalGeral - totalComissoes;

  // Resumo
  document.getElementById('report-val-ops').textContent = formatMZN(totalOps);
  document.getElementById('report-val-recs').textContent = formatMZN(totalRecs);
  document.getElementById('report-val-total').textContent = formatMZN(totalGeral);
  document.getElementById('report-val-comissoes').textContent = formatMZN(totalComissoes);
  document.getElementById('report-val-liquido').textContent = formatMZN(liquido);
  document.getElementById('report-val-num').textContent = ops.length + recs.length;

  // Ranking de subagentes
  var ranking = {};
  appState.subagentes.forEach(function(s) {
    ranking[s.id] = { nome: s.nome, total: 0, comissao: 0, numOps: 0 };
  });
  ops.forEach(function(o) {
    if (ranking[o.subagente_id]) {
      ranking[o.subagente_id].total += o.valor;
      ranking[o.subagente_id].comissao += o.comissao;
      ranking[o.subagente_id].numOps++;
    }
  });
  recs.forEach(function(r) {
    if (ranking[r.subagente_id]) {
      ranking[r.subagente_id].total += r.valor;
      ranking[r.subagente_id].comissao += r.comissao;
      ranking[r.subagente_id].numOps++;
    }
  });

  var rankArr = Object.values(ranking).filter(function(r) { return r.numOps > 0; })
    .sort(function(a,b) { return b.total - a.total; });

  var rankTbody = document.getElementById('report-rank-tbody');
  if (rankArr.length === 0) {
    rankTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">Sem dados no período</td></tr>';
  } else {
    rankTbody.innerHTML = rankArr.map(function(r, i) {
      var medalha = i === 0 ? '<span style="color:var(--gold)">&#9733;</span> ' : '';
      return '<tr>' +
        '<td>' + medalha + (i+1) + '</td>' +
        '<td><strong>' + r.nome + '</strong></td>' +
        '<td class="text-accent">' + formatMZN(r.total) + '</td>' +
        '<td class="text-gold">' + formatMZN(r.comissao) + '</td>' +
        '</tr>';
    }).join('');
  }

  // Guardar dados para exportação
  appState._reportData = {
    periodo: periodo,
    dataGeracao: new Date().toISOString(),
    totalOperacoes: totalOps,
    totalRecargas: totalRecs,
    totalGeral: totalGeral,
    totalComissoes: totalComissoes,
    liquido: liquido,
    numOperacoes: ops.length + recs.length,
    ranking: rankArr,
    operacoes: ops,
    recargas: recs
  };
}

function exportReportJSON() {
  if (!appState._reportData) { toast('Gere o relatório primeiro.', 'error'); return; }
  var dataStr = JSON.stringify(appState._reportData, null, 2);
  var blob = new Blob([dataStr], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio_' + (appState._reportData.periodo || 'geral') + '_' + todayStr() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Relatório exportado em JSON.');
}

// --- ÁREA DO SUBAGENTE ---
function openSubagenteView() {
  var sel = document.getElementById('sv-subagente');
  sel.innerHTML = '<option value="">Selecione o seu número</option>';
  appState.subagentes.forEach(function(s) {
    sel.innerHTML += '<option value="' + s.id + '">' + s.telefone + ' - ' + s.nome + '</option>';
  });
  document.getElementById('sv-content').classList.add('hidden');
  openModal('modal-subagente-view');
}

function loadSubagenteView() {
  var subId = document.getElementById('sv-subagente').value;
  var content = document.getElementById('sv-content');

  if (!subId) { content.classList.add('hidden'); return; }
  content.classList.remove('hidden');

  var sub = appState.subagentes.find(function(s) { return s.id === subId; });
  if (!sub) return;

  var ops = appState.operacoes.filter(function(o) { return o.subagente_id === subId; });
  var recs = appState.recargas.filter(function(r) { return r.subagente_id === subId; });

  var totalComOps = ops.reduce(function(s,o) { return s + o.comissao; }, 0);
  var totalComRecs = recs.reduce(function(s,r) { return s + r.comissao; }, 0);
  var totalCom = totalComOps + totalComRecs;
  var totalVal = ops.reduce(function(s,o) { return s + o.valor; }, 0) + recs.reduce(function(s,r) { return s + r.valor; }, 0);

  var initials = sub.nome.split(' ').map(function(w){return w[0]}).join('').substring(0,2).toUpperCase();

  document.getElementById('sv-avatar').textContent = initials;
  document.getElementById('sv-name').textContent = sub.nome;
  document.getElementById('sv-phone').textContent = sub.telefone;
  document.getElementById('sv-total-com').textContent = formatMZN(totalCom);
  document.getElementById('sv-total-val').textContent = formatMZN(totalVal);
  document.getElementById('sv-num-ops').textContent = ops.length + recs.length;

  // Histórico
  var todas = ops.map(function(o) { return Object.assign({}, o, {tipoLabel: LABELS_OPERACAO[o.tipo] || o.tipo, isRecarga: false}); })
    .concat(recs.map(function(r) { return Object.assign({}, r, {tipoLabel: 'Recarga', isRecarga: true}); }))
    .sort(function(a,b) { return new Date(b.data) - new Date(a.data); });

  var tbody = document.getElementById('sv-history-tbody');
  if (todas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">Sem operações</td></tr>';
  } else {
    tbody.innerHTML = todas.slice(0, 20).map(function(op) {
      var badgeClass = op.isRecarga ? 'badge-info' : 'badge-green';
      return '<tr>' +
        '<td class="text-sm">' + formatDate(op.data) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + op.tipoLabel + '</span></td>' +
        '<td class="text-accent">' + formatMZN(op.valor) + '</td>' +
        '<td class="text-gold">' + formatMZN(op.comissao) + '</td>' +
        '</tr>';
    }).join('');
  }
}

// --- CONFIGURAÇÕES ---
function renderConfig() {
  var cfg = appState.config;
  document.getElementById('cfg-nome').value = cfg.super_agente_nome || '';
  document.getElementById('cfg-saldo').value = cfg.saldo_inicial || 0;

  var statusEl = document.getElementById('cfg-db-status');
  if (db.useSupabase) {
    statusEl.innerHTML = '<span class="status-dot online"></span>Conectado ao Supabase';
  } else {
    statusEl.innerHTML = '<span class="status-dot offline"></span>Usando localStorage (local)';
  }

  document.getElementById('cfg-sb-url').value = localStorage.getItem('sa_sb_url') || '';
  document.getElementById('cfg-sb-key').value = localStorage.getItem('sa_sb_key') || '';
}

async function saveConfig() {
  var nome = document.getElementById('cfg-nome').value.trim();
  var saldo = parseFloat(document.getElementById('cfg-saldo').value) || 0;
  await db.setConfig({ super_agente_nome: nome, saldo_inicial: saldo });
  appState.config = await db.getConfig().then(function(r) { return r.data; });
  toast('Configurações guardadas.');
  navigateTo('dashboard');
}

async function connectSupabase() {
  var url = document.getElementById('cfg-sb-url').value.trim();
  var key = document.getElementById('cfg-sb-key').value.trim();

  if (!url || !key) {
    toast('Preencha a URL e a chave do Supabase.', 'error');
    return;
  }

  toast('A ligar ao Supabase...', 'info');
  localStorage.setItem('sa_sb_url', url);
  localStorage.setItem('sa_sb_key', key);

  await db.init(url, key);

  if (db.useSupabase) {
    toast('Ligado ao Supabase com sucesso!');
    await loadAllData();
    renderConfig();
  } else {
    toast('Falha na ligação. Verifique os dados.', 'error');
  }
}

function disconnectSupabase() {
  db.useSupabase = false;
  db.supabase = null;
  localStorage.removeItem('sa_sb_url');
  localStorage.removeItem('sa_sb_key');
  toast('Desligado do Supabase. Usando localStorage.', 'info');
  renderConfig();
}

// --- Mobile More Menu ---
function toggleMobileMore() {
  document.getElementById('mobile-more-menu').classList.toggle('show');
}

// --- Setup Inicial ---
async function initApp() {
  // Tentar ligar ao Supabase se houver credenciais guardadas
  var sbUrl = localStorage.getItem('sa_sb_url');
  var sbKey = localStorage.getItem('sa_sb_key');
  if (sbUrl && sbKey) {
    await db.init(sbUrl, sbKey);
  }

  await loadAllData();

  // Verificar se é a primeira utilização
  if (!appState.config || !appState.config.super_agente_nome) {
    openModal('modal-setup');
  } else {
    navigateTo('dashboard');
  }
}

async function finishSetup() {
  var nome = document.getElementById('setup-nome').value.trim();
  var saldo = parseFloat(document.getElementById('setup-saldo').value) || 0;

  if (!nome) {
    toast('Insira o seu nome.', 'error');
    return;
  }

  await db.setConfig({ super_agente_nome: nome, saldo_inicial: saldo });
  appState.config = await db.getConfig().then(function(r) { return r.data; });

  closeModal('modal-setup');
  toast('Bem-vindo, ' + nome + '!');
  navigateTo('dashboard');
}

// --- Inicialização quando o DOM estiver pronto ---
document.addEventListener('DOMContentLoaded', initApp);
