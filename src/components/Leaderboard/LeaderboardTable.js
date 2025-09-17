import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Services (ajusta os paths conforme o teu projeto)
import { getProjects } from "../../services/projectService";
import { getProjectTasks, getMemberTasks } from "../../services/taskService";
import { getMembers } from "../../services/memberService";
import { getParticipations } from "../../services/projectParticipationService";
import "./Leaderboard.css";

/**
 * Alinhado com os schemas fornecidos:
 *  - ProjectSchema: { name: string, slug?: string, ... }
 *  - MemberSchema:  { username: string, name: string, ... }
 *  - TaskSchema:    {
 *      id?: number,
 *      point_type: 'pj' | 'pcc' (normalizamos internamente para 'PJ'|'PCC'),
 *      points: number,
 *      description: string,
 *      finished_at?: 'YYYY-MM-DD',
 *      username: string,
 *      project_name: string
 *    }
 *  - ProjectParticipationSchema: { username: string, project_name: string, ... }
 */

const LeaderboardTable = () => {
  const navigate = useNavigate();

  // State
  const [teams, setTeams] = useState([]); // [{ name, pjPoints, pccPoints, totalPoints }]
  const [individuals, setIndividuals] = useState([]); // [{ name, username, pjPoints, pccPoints, totalPoints }]
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("teams");
  const [sortBy, setSortBy] = useState("totalPoints"); // 'totalPoints' | 'pjPoints' | 'pccPoints'

  // Expanded rows and history caches
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [expandedIndividuals, setExpandedIndividuals] = useState(new Set());
  const [teamHistory, setTeamHistory] = useState({}); // { [teamName]: HistoryEntry[] }
  const [individualHistory, setIndividualHistory] = useState({}); // { [usernameOrName]: HistoryEntry[] }

  // ---------- Helpers (schemas) ----------
  const toProjectName = (p) => p?.name || "Unknown";
  const toMemberUsername = (m) => m?.username;
  const toMemberName = (m) => m?.name || m?.username || "Unknown";

  // normaliza 'pj'/'pcc' → 'PJ'/'PCC'
  const taskType = (t) => {
    const v = t?.point_type;
    if (v == null) return "OTHER";
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "pj") return "PJ";
      if (s === "pcc") return "PCC";
      return "OTHER";
    }
    if (typeof v === "number") {
      if (v === 0) return "PJ";
      if (v === 1) return "PCC";
    }
    if (typeof v === "object") {
      const inner = (v?.value ?? v?.name ?? v?.key ?? "").toString().toLowerCase();
      if (inner === "pj") return "PJ";
      if (inner === "pcc") return "PCC";
    }
    return "OTHER";
  };

  const taskPoints = (t) => {
    const n = Number(t?.points ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const taskWhen = (t) => t?.finished_at || null; // 'YYYY-MM-DD'

  const taskAssigneeName = (t, usernameToName) => {
    const u = t?.username || "";
    return usernameToName.get(u) || u;
  };

  const computeBuckets = (tasks) => {
    let pj = 0;
    let pcc = 0;
    for (const t of tasks || []) {
      const type = taskType(t);
      const pts = taskPoints(t);
      if (type === "PJ") pj += pts;
      else if (type === "PCC") pcc += pts;
    }
    return { pjPoints: pj, pccPoints: pcc, totalPoints: pj + pcc };
  };

  const buildHistoryEntry = (task, usernameToName) => {
    const tipo = taskType(task);
    const pontos = taskPoints(task);
    const when = taskWhen(task);
    const membro = taskAssigneeName(task, usernameToName);
    const descricao = task?.description || "Activity";
    return { membro, data: when, descricao: descricao, tipo, pontos };
  };

  // ---------- Data Fetch ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar projetos e membros em paralelo
        const [projects, members] = await Promise.all([
          getProjects(),
          getMembers(),
        ]);

        // Map username->name
        const usernameToName = new Map((members || []).map((m) => [toMemberUsername(m), toMemberName(m)]));

        // TEAMS: agregação por projeto (somando pontos dos membros participantes; fallback para tasks do projeto)
        const teamRows = [];
        for (const p of projects || []) {
          const projectName = toProjectName(p);

          // 1) Tenta obter participantes do projeto (por name). Se falhar 404, tenta por slug.
          let participants = [];
          let gotParticipants = false;
          try {
            participants = await getParticipations(projectName);
            gotParticipants = true;
          } catch (e) {
            if (e?.response?.status !== 404) {
              // eslint-disable-next-line no-console
              console.warn("Falhou obter participantes do projeto", projectName, e);
            }
          }
          if (!gotParticipants && p?.slug) {
            try {
              participants = await getParticipations(p.slug);
              gotParticipants = true;
            } catch (e2) {
              if (e2?.response?.status !== 404) {
                // eslint-disable-next-line no-console
                console.warn("Falhou obter participantes (slug)", p.slug, e2);
              }
            }
          }

          // 2) Se houver participants, soma pontos a partir das tasks de cada membro
          let pj = 0, pcc = 0;
          if (gotParticipants && participants?.length) {
            for (const part of participants) {
              const username = part?.username;
              if (!username) continue;
              try {
                const memberTasks = await getMemberTasks(username);
                for (const t of memberTasks || []) {
                  // conta apenas tasks deste projeto (segurança extra)
                  if (t?.project_name !== projectName && t?.project_name !== p?.slug) continue;
                  const type = taskType(t);
                  const pts = taskPoints(t);
                  if (type === "PJ") pj += pts;
                  else if (type === "PCC") pcc += pts;
                }
              } catch (e) {
                // eslint-disable-next-line no-console
                console.warn("Falhou obter tasks do membro", username, e);
              }
            }
            teamRows.push({ name: projectName, pjPoints: pj, pccPoints: pcc, totalPoints: pj + pcc });
          } else {
            // 3) Fallback: sem participants → agrega pelas tasks do projeto
            let projectTasks = [];
            try {
              projectTasks = await getProjectTasks(projectName);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn("Falhou obter tasks do projeto (fallback)", projectName, e);
              // último fallback: tenta por slug se existir
              if (p?.slug) {
                try { projectTasks = await getProjectTasks(p.slug); } catch {}
              }
            }
            const buckets = computeBuckets(projectTasks);
            teamRows.push({ name: projectName, ...buckets });
          }
        }

        // INDIVIDUALS: agregação por membro (member.username)
        const individualRows = [];
        for (const m of members || []) {
          const username = toMemberUsername(m);
          let memberTasks = [];
          try {
            memberTasks = await getMemberTasks(username);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("Falhou obter tasks do membro", username, e);
          }
          const buckets = computeBuckets(memberTasks);
          individualRows.push({ name: toMemberName(m), username, ...buckets });
        }

        // Stats simples
        const totalTeams = teamRows.length;
        const totalIndividuals = individualRows.length;
        const totalPoints = teamRows.reduce((acc, t) => acc + (t.totalPoints || 0), 0);
        const statsData = { totalTeams, totalIndividuals, totalPoints };

        setTeams(teamRows);
        setIndividuals(individualRows);
        setStats(statsData);
        setLoading(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Erro a carregar leaderboard", e);
        setError("Falha a carregar o leaderboard. Tenta novamente mais tarde.");
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Expansions (history) ----------
  const toggleTeamExpansion = async (teamName) => {
    const next = new Set(expandedTeams);
    if (next.has(teamName)) {
      next.delete(teamName);
      setExpandedTeams(next);
      return;
    }
    next.add(teamName);
    setExpandedTeams(next);

    if (!teamHistory[teamName]) {
      try {
        // Precisamos de map username->name e também do slug do projeto (para fallback)
        const [members, projects] = await Promise.all([getMembers(), getProjects()]);
        const usernameToName = new Map((members || []).map((m) => [toMemberUsername(m), toMemberName(m)]));
        const project = (projects || []).find((p) => toProjectName(p) === teamName);

        // Obter participantes por name; se 404, tentar por slug
        let participants = [];
        let ok = false;
        try {
          participants = await getParticipations(teamName);
          ok = true;
        } catch (e) {
          if (e?.response?.status !== 404) console.warn("getParticipations(name)", teamName, e);
        }
        if (!ok && project?.slug) {
          try {
            participants = await getParticipations(project.slug);
            ok = true;
          } catch (e2) {
            if (e2?.response?.status !== 404) console.warn("getParticipations(slug)", project?.slug, e2);
          }
        }

        let tasks = [];
        if (ok && participants?.length) {
          // Junta as tasks de todos os membros participantes, filtradas por este projeto
          for (const part of participants) {
            const u = part?.username;
            if (!u) continue;
            try {
              const mt = await getMemberTasks(u);
              for (const t of mt || []) {
                if (t?.project_name === teamName || (project?.slug && t?.project_name === project.slug)) {
                  tasks.push(t);
                }
              }
            } catch (err) {
              console.warn("member tasks for team history", u, err);
            }
          }
        } else {
          // último fallback: usar tasks do projeto
          try { tasks = await getProjectTasks(teamName); } catch {}
          if (!tasks?.length && project?.slug) {
            try { tasks = await getProjectTasks(project.slug); } catch {}
          }
        }

        const recent = (tasks || [])
          .map((t) => buildHistoryEntry(t, usernameToName))
          .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
          .slice(0, 3);

        setTeamHistory((prev) => ({ ...prev, [teamName]: recent }));
      } catch (e) {
        console.warn("Falhou history de equipa", teamName, e);
        setTeamHistory((prev) => ({ ...prev, [teamName]: [] }));
      }
    }
  };

  const toggleIndividualExpansion = async (individualNameOrUsername) => {
    const next = new Set(expandedIndividuals);
    if (next.has(individualNameOrUsername)) {
      next.delete(individualNameOrUsername);
      setExpandedIndividuals(next);
      return;
    }
    next.add(individualNameOrUsername);
    setExpandedIndividuals(next);

    if (!individualHistory[individualNameOrUsername]) {
      try {
        const members = await getMembers();
        const m = (members || []).find(
          (mm) => toMemberName(mm) === individualNameOrUsername || toMemberUsername(mm) === individualNameOrUsername
        );
        const username = toMemberUsername(m) || individualNameOrUsername;

        const usernameToName = new Map((members || []).map((mm) => [toMemberUsername(mm), toMemberName(mm)]));

        let tasks = [];
        try { tasks = await getMemberTasks(username); } catch {}

        const recent = (tasks || [])
          .map((t) => buildHistoryEntry(t, usernameToName))
          .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
          .slice(0, 3);

        setIndividualHistory((prev) => ({ ...prev, [individualNameOrUsername]: recent }));
      } catch (e) {
        console.warn("Falhou history individual", individualNameOrUsername, e);
        setIndividualHistory((prev) => ({ ...prev, [individualNameOrUsername]: [] }));
      }
    }
  };

  // ---------- Sorting ----------
  const sortedTeams = useMemo(() => {
    const list = [...teams];
    list.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    return list;
  }, [teams, sortBy]);

  const sortedIndividuals = useMemo(() => {
    const list = [...individuals];
    list.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    return list;
  }, [individuals, sortBy]);

  // ---------- UI helpers ----------
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [y, m, d] = String(dateString).split("-");
    if (!y || !m || !d) return String(dateString);
    const safe = new Date(Number(y), Number(m) - 1, Number(d));
    if (Number.isNaN(safe.getTime())) return String(dateString);
    return safe.toLocaleDateString("pt-PT", { year: "numeric", month: "short", day: "numeric" });
  };

  const getPointTypeColor = (type) => (type === "PJ" ? "#e74c3c" : type === "PCC" ? "#3498db" : "#ffd700");

  const metricHeader = () => (
    sortBy === "pjPoints" ? (
      <th className="highlighted-column">Pontos PJ</th>
    ) : sortBy === "pccPoints" ? (
      <th className="highlighted-column">Pontos PCC</th>
    ) : (
      <th className="highlighted-column">Pontos Totais</th>
    )
  );

  const metricCellTeam = (team) => (
    sortBy === "pjPoints" ? (
      <td className="pj-points highlighted">{team.pjPoints || 0}</td>
    ) : sortBy === "pccPoints" ? (
      <td className="pcc-points highlighted">{team.pccPoints || 0}</td>
    ) : (
      <td className="total-points highlighted">{team.totalPoints || 0}</td>
    )
  );

  const metricCellInd = (ind) => (
    sortBy === "pjPoints" ? (
      <td className="pj-points highlighted">{ind.pjPoints || 0}</td>
    ) : sortBy === "pccPoints" ? (
      <td className="pcc-points highlighted">{ind.pccPoints || 0}</td>
    ) : (
      <td className="total-points highlighted">{ind.totalPoints || 0}</td>
    )
  );

  const colSpan = 3; // Rank, Nome, Métrica ativa

  // ---------- Render ----------
  if (loading) return <div className="loading">A carregar leaderboard…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{stats && typeof stats.totalTeams !== 'undefined' ? stats.totalTeams : '-'}</span>
            <span className="stat-label">Equipas</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats && typeof stats.totalIndividuals !== 'undefined' ? stats.totalIndividuals : '-'}</span>
            <span className="stat-label">Membros</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats && typeof stats.totalPoints !== 'undefined' ? stats.totalPoints : 0}</span>
            <span className="stat-label">Pontos Totais</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>
                <div className="header-controls">
                  <span>Rank</span>
                  <select className="inline-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="totalPoints">Total</option>
                    <option value="pjPoints">PJ</option>
                    <option value="pccPoints">PCC</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="header-controls">
                  <span>Vista</span>
                  <select className="inline-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                    <option value="teams">Equipas</option>
                    <option value="individuals">Indivíduos</option>
                  </select>
                </div>
              </th>
              {metricHeader()}
            </tr>
          </thead>

          {activeTab === "teams" ? (
            <tbody>
              {sortedTeams.map((team, index) => (
                <React.Fragment key={team.name}>
                  <tr className={index < 3 ? `top-three rank-${index + 1}` : ""} onClick={() => toggleTeamExpansion(team.name)}>
                    <td className="rank">
                      <div className="rank-content">
                        {index === 0 ? <span className="medal">🥇</span> : index === 1 ? <span className="medal">🥈</span> : index === 2 ? <span className="medal">🥉</span> : <span>{index + 1}</span>}
                      </div>
                    </td>
                    <td className="team-name">
                      <div className="team-name-content">
                        <span>{team.name}</span>
                        <span className="expand-icon">{expandedTeams.has(team.name) ? "▲" : "▼"}</span>
                      </div>
                    </td>
                    {metricCellTeam(team)}
                  </tr>

                  {expandedTeams.has(team.name) && (
                    <tr className="history-row">
                      <td colSpan={colSpan}>
                        <div className="team-history">
                          <h4>Atividade Recente</h4>
                          {teamHistory[team.name] ? (
                            <>
                              <div className="history-list">
                                {teamHistory[team.name].map((entry, idx) => (
                                  <div key={idx} className="history-item">
                                    <div className="history-info">
                                      <span className="member-name">{entry.membro}</span>
                                      <span className="activity-date">{formatDate(entry.data)}</span>
                                      <span className="activity-description">{entry.descricao}</span>
                                    </div>
                                    <div className="history-points">
                                      <span className="point-type" style={{ borderColor: getPointTypeColor(entry.tipo), color: getPointTypeColor(entry.tipo) }}>{entry.tipo}</span>
                                      <span className="point-value">{entry.pontos}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                                <div className="history-footer">
                                    <button 
                                        className="btn btn-secondary see-more-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/history');
                                        }}
                                    >
                                        See more...
                                    </button>
                                </div>
                            </>
                          ) : (
                            <div className="loading-history">A carregar…</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          ) : (
            <tbody>
              {sortedIndividuals.map((ind, index) => (
                <React.Fragment key={ind.username || ind.name}>
                  <tr className={index < 3 ? `top-three rank-${index + 1}` : ""} onClick={() => toggleIndividualExpansion(ind.username || ind.name)}>
                    <td className="rank">
                      <div className="rank-content">
                        {index === 0 ? <span className="medal">🥇</span> : index === 1 ? <span className="medal">🥈</span> : index === 2 ? <span className="medal">🥉</span> : <span>{index + 1}</span>}
                      </div>
                    </td>
                    <td className="individual-name">
                      <div className="team-name-content">
                        <span>{ind.name}</span>
                        <span className="expand-icon">{expandedIndividuals.has(ind.username || ind.name) ? "▲" : "▼"}</span>
                      </div>
                    </td>
                    {metricCellInd(ind)}
                  </tr>

                  {expandedIndividuals.has(ind.username || ind.name) && (
                    <tr className="history-row">
                      <td colSpan={colSpan}>
                        <div className="individual-history">
                          <h4>Atividade Recente</h4>
                          {individualHistory[ind.username || ind.name] ? (
                            <>
                              <div className="history-list">
                                {individualHistory[ind.username || ind.name].map((entry, idx) => (
                                  <div key={idx} className="history-item">
                                    <div className="history-info">
                                      <span className="member-name">{entry.membro}</span>
                                      <span className="activity-date">{formatDate(entry.data)}</span>
                                      <span className="activity-description">{entry.descricao}</span>
                                    </div>
                                    <div className="history-points">
                                      <span className="point-type" style={{ borderColor: getPointTypeColor(entry.tipo), color: getPointTypeColor(entry.tipo) }}>{entry.tipo}</span>
                                      <span className="point-value">{entry.pontos}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            <div className="history-footer">
                                <button 
                                    className="btn btn-secondary see-more-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/history');
                                    }}
                                >
                                    See more...
                                </button>
                            </div>
                            </>
                          ) : (
                            <div className="loading-history">A carregar…</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
