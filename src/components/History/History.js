import React, { useState, useEffect, useCallback } from 'react';
import { getTasks } from '../../services/taskService';
import { getMembers } from '../../services/memberService';
import './History.css';

// Versão com layout IGUAL ao do mock/hardcoded (filtros dentro do header da tabela)
const History = () => {
  // Dados
  const [historyData, setHistoryData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [individuals, setIndividuals] = useState([]);

  // Estado UI
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtros (embutidos no cabeçalho da tabela)
  const [entityType, setEntityType] = useState('teams'); // 'teams' | 'individuals'
  const [selectedEntities, setSelectedEntities] = useState(new Set()); // multi-seleção via botão do cabeçalho
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [pointsType, setPointsType] = useState('all'); // 'all' | 'PJ' | 'PCC'

  // ------- Fetch + Transform -------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [tasks, members] = await Promise.all([
        getTasks(),
        getMembers().catch(() => []),
      ]);

      const usernameToName = new Map((members || []).map(m => [m?.username, m?.name || m?.username || '']));

      const normPointType = (v) => {
        if (v === 'PJ' || v === 'PCC') return v;
        if (typeof v === 'number') return v === 0 ? 'PJ' : v === 1 ? 'PCC' : 'OTHER';
        const inner = (v?.value ?? v?.name ?? v?.key ?? v ?? '').toString().toLowerCase();
        if (inner === 'pj') return 'PJ';
        if (inner === 'pcc') return 'PCC';
        return 'OTHER';
      };

      const history = (tasks || [])
        .filter(t => !!t?.finished_at)
        .map(t => ({
          date: t.finished_at, // ISO
          team: t.project_name || '',
          member: usernameToName.get(t.username) || t.username || '',
          type: normPointType(t.point_type),
          points: Number(t.points) || 0,
          description: t.description || '',
          project: t.project_name || '',
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistoryData(history);
      setTeams(Array.from(new Set(history.map(h => h.team))).filter(Boolean).sort());
      setIndividuals(Array.from(new Set(history.map(h => h.member))).filter(Boolean).sort());
    } catch (err) {
      console.error('History fetch error:', err);
      setLoadError('Não foi possível carregar o histórico.');
      setHistoryData([]);
      setTeams([]);
      setIndividuals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('.entity-dropdown-container')) setShowEntityDropdown(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // ------- Helpers -------
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const opts = { month: 'short', day: '2-digit', year: 'numeric' };
    // Ex.: Jan 15, 2024
    return d.toLocaleDateString('en-US', opts);
  };

  const visibleEntities = entityType === 'teams' ? teams : individuals;

  const filtered = historyData.filter((row) => {
    if (pointsType !== 'all' && row.type !== pointsType) return false;
    if (selectedEntities.size > 0) {
      if (entityType === 'teams' && !selectedEntities.has(row.team)) return false;
      if (entityType === 'individuals' && !selectedEntities.has(row.member)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ------- Render -------
  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Points Log</h1>
        <p>Track all point activities and achievements</p>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading">A carregar…</div>
        ) : loadError ? (
          <div className="loading">{loadError}</div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>
                    <div className="th-group">
                      <span>TEAM</span>
                      <div className="th-controls">
                        <select className="inline-select" value={entityType} onChange={(e) => { setEntityType(e.target.value); setSelectedEntities(new Set()); setCurrentPage(1); }}>
                          <option value="teams">Teams</option>
                          <option value="individuals">Individuals</option>
                        </select>
                        <button type="button" className="inline-select entity-dropdown-toggle" onClick={(e) => { e.stopPropagation(); setShowEntityDropdown(v => !v); }}>
                          ▾
                        </button>
                      </div>
                    </div>
                    {/* Dropdown multi-seleção */}
                    {showEntityDropdown && (
                      <div className="entity-dropdown entity-dropdown-container" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-header">
                          <button className="select-all-btn" onClick={() => setSelectedEntities(new Set(visibleEntities))}>Selecionar todos</button>
                          <button className="clear-btn" onClick={() => setSelectedEntities(new Set())}>Limpar</button>
                        </div>
                        <div className="dropdown-content">
                          {visibleEntities.map((entity) => (
                            <label key={entity} className="entity-selector">
                              <input
                                type="checkbox"
                                checked={selectedEntities.has(entity)}
                                onChange={() => {
                                  const next = new Set(selectedEntities);
                                  next.has(entity) ? next.delete(entity) : next.add(entity);
                                  setSelectedEntities(next);
                                  setCurrentPage(1);
                                }}
                              />
                              <span className="checkmark" />
                              {entity}
                            </label>
                          ))}
                        </div>
                        <div className="dropdown-footer">
                          <span className="selection-summary">{selectedEntities.size} selecionado(s)</span>
                        </div>
                      </div>
                    )}
                  </th>
                  <th>DESCRIPTION</th>
                  <th>
                    <div className="th-group">
                      <span>POINTS</span>
                      <div className="th-controls">
                        <select className="inline-select" value={pointsType} onChange={(e) => { setPointsType(e.target.value); setCurrentPage(1); }}>
                          <option value="all">All</option>
                          <option value="PJ">PJ</option>
                          <option value="PCC">PCC</option>
                        </select>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr><td colSpan={4} className="no-data">Sem resultados</td></tr>
                ) : (
                  currentItems.map((item, idx) => (
                    <tr key={idx} className="history-row">
                      <td className="date-cell">{fmtDate(item.date)}</td>
                      <td className="team-cell"><strong>{item.team}</strong></td>
                      <td className="description-cell">{item.project ? `${item.project} - ` : ''}{item.description || '—'}</td>
                      <td className="points-cell">
                        <span
                          className="points-type pill"
                          style={{
                            color: item.type === 'PJ' ? '#ffd700' : item.type === 'PCC' ? '#00e5ff' : '#e0e0e0'
                          }}
                        >
                          {item.type}
                        </span>
                        <span className="points-value">{item.points > 0 ? `+${item.points}` : item.points}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pagination-controls">
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀ Anterior</button>
              <div className="page-info">Página <span>{currentPage}</span> de <span>{totalPages}</span></div>
              <button className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Seguinte ▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
