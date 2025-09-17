import React, { useEffect, useMemo, useState } from 'react';
import './HallOfFame.css';

// === Services (ajusta os paths se necessário) ===
import { getProjects } from '../../services/projectService';
import { getMembers } from '../../services/memberService';
import { getTasks } from '../../services/taskService';
import { getParticipations } from '../../services/projectParticipationService';
import { getProjectImage, getMemberImage } from '../../services/imageService';

/**
 * HallOfFame — versão API-driven com fallbacks
 * - Tenta calcular vencedores com base nos últimos 30 dias; se não houver dados, cai para all‑time.
 * - Faz matching tolerante de point_type (ex.: PITCH, PITCH_POINTS, DEFENSE/DEFESA...)
 * - Tarefas sem finished_at contam só no modo all‑time (para não enviesar o mensal)
 */

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

// Helpers de datas
const startOfToday = () => new Date(new Date().toDateString());
function inRange(dateStr, start, end) {
  if (!dateStr) return false; // só para janela mensal
  const d = new Date(dateStr);
  return d >= start && d < end;
}
function alwaysTrue() { return true; }

// Helpers de tipos
function normalizeType(t) { return String(t?.point_type || '').toUpperCase(); }
const isPitch = (t) => normalizeType(t).includes('PITCH');
const isDefense = (t) => {
  const s = normalizeType(t);
  return s.includes('DEFEN') || s.includes('DEFESA');
};

// Somatório seguro
function sumPoints(tasks = [], filter = () => true) {
  return (tasks || []).reduce((acc, t) => acc + (filter(t) ? (Number(t.points) || 0) : 0), 0);
}

function tryGet(obj, key, fallback) {
  return obj && obj[key] != null ? obj[key] : fallback;
}

async function safe(fn, ...args) { try { return await fn(...args); } catch (e) { console.error(e); return null; } }

async function getProjectImageUrl(slug) {
  const data = await safe(getProjectImage, slug);
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (data.url) return data.url;
  return null;
}

async function getMemberImageUrl(username) {
  const data = await safe(getMemberImage, username);
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (data.url) return data.url;
  return null;
}

const HallOfFame = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [participationsByProject, setParticipationsByProject] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      const [proj, mem, tks] = await Promise.all([
        safe(getProjects),
        safe(getMembers),
        safe(getTasks)
      ]);
      if (!mounted) return;
      setProjects(Array.isArray(proj) ? proj : []);
      setMembers(Array.isArray(mem) ? mem : []);
      setTasks(Array.isArray(tks) ? tks : []);

      const map = {};
      await Promise.all((Array.isArray(proj) ? proj : []).map(async (p) => {
        const slug = p.slug || p.name;
        const part = await safe(getParticipations, slug);
        map[slug] = Array.isArray(part) ? part : [];
      }));
      if (!mounted) return;
      setParticipationsByProject(map);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Índices de conveniência
  const tasksByProject = useMemo(() => {
    const map = {};
    (tasks || []).forEach(t => {
      const key = t.project_name || t.project || '—';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const tasksByMember = useMemo(() => {
    const map = {};
    (tasks || []).forEach(t => {
      const key = t.username || t.user || '—';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Janelas temporais
  const today = startOfToday();
  const last30Start = useMemo(() => new Date(today.getTime() - DAYS_30), [today]);
  const prev30Start = useMemo(() => new Date(today.getTime() - 2 * DAYS_30), [today]);

  // === Cálculos (com fallback all‑time) ===
  const calcPitchDoMes = useMemo(() => {
    // Primeiro: últimos 30 dias, priorizando PITCH quando existir
    const top30 = (projects || []).map(p => {
      const slug = p.slug || p.name;
      const list = (tasksByProject[slug] || tasksByProject[p.name] || []);
      const hasPitchType = list.some(isPitch);
      const points30 = sumPoints(list, t => inRange(t.finished_at, last30Start, today) && (!hasPitchType || isPitch(t)));
      return { project: p, slug, points30, hasPitchType, list };
    }).sort((a, b) => b.points30 - a.points30)[0];
    if (top30 && top30.points30 > 0) return { project: top30.project, slug: top30.slug, points: top30.points30 };

    // Fallback: all‑time (tarefas sem finished_at contam aqui)
    const all = (projects || []).map(p => {
      const slug = p.slug || p.name;
      const list = (tasksByProject[slug] || tasksByProject[p.name] || []);
      const hasPitchType = list.some(isPitch);
      const points = sumPoints(list, t => (!hasPitchType || isPitch(t)));
      return { project: p, slug, points };
    }).sort((a, b) => b.points - a.points)[0];
    return (all && all.points > 0) ? all : null;
  }, [projects, tasksByProject, last30Start, today]);

  const calcEstrelaAscensao = useMemo(() => {
    // Crescimento % mês sobre mês; se não houver dados suficientes, cai para null
    const rows = (projects || []).map(p => {
      const slug = p.slug || p.name;
      const list = (tasksByProject[slug] || tasksByProject[p.name] || []);
      const prev = sumPoints(list, t => inRange(t.finished_at, prev30Start, last30Start));
      const curr = sumPoints(list, t => inRange(t.finished_at, last30Start, today));
      const delta = curr - prev;
      const growth = prev > 0 ? delta / prev : (curr > 0 ? 1 : 0);
      return { project: p, slug, prev, curr, growth };
    }).sort((a, b) => b.growth - a.growth);

    const top = rows.find(r => r.curr > 0 && r.growth > 0);
    if (top) return top;

    // Sem dados mensais? Opcionalmente podemos mostrar o "mais pontos all‑time" como estrela;
    // aqui preferimos retornar null para não duplicar com Pitch.
    return null;
  }, [projects, tasksByProject, prev30Start, last30Start, today]);

  const calcMembroDoMes = useMemo(() => {
    // Mensal
    const rows30 = (members || []).map(m => {
      const username = m.username;
      const list = tasksByMember[username] || [];
      const points30 = sumPoints(list, t => inRange(t.finished_at, last30Start, today));
      return { member: m, username, points30 };
    }).sort((a, b) => b.points30 - a.points30);
    if (rows30[0] && rows30[0].points30 > 0) return { ...rows30[0], points: rows30[0].points30 };

    // Fallback all‑time
    const all = (members || []).map(m => {
      const username = m.username;
      const list = tasksByMember[username] || [];
      const points = sumPoints(list, alwaysTrue);
      return { member: m, username, points };
    }).sort((a, b) => b.points - a.points)[0];
    return (all && all.points > 0) ? all : null;
  }, [members, tasksByMember, last30Start, today]);

  const calcMaisDefesas = useMemo(() => {
    // Mensal apenas DEFENSE/DEFESA
    const rows30 = (members || []).map(m => {
      const username = m.username;
      const list = tasksByMember[username] || [];
      const hasDefense = list.some(isDefense);
      const points30 = hasDefense ? sumPoints(list, t => isDefense(t) && inRange(t.finished_at, last30Start, today)) : 0;
      return { member: m, username, points30, enabled: hasDefense };
    }).filter(r => r.enabled).sort((a, b) => b.points30 - a.points30);

    if (rows30[0] && rows30[0].points30 > 0) return { ...rows30[0], points: rows30[0].points30 };

    // Fallback all‑time DEFENSE
    const all = (members || []).map(m => {
      const username = m.username;
      const list = tasksByMember[username] || [];
      const hasDefense = list.some(isDefense);
      const points = hasDefense ? sumPoints(list, isDefense) : 0;
      return { member: m, username, points, enabled: hasDefense };
    }).filter(r => r.enabled).sort((a, b) => b.points - a.points)[0];
    return (all && all.points > 0) ? all : null;
  }, [members, tasksByMember, last30Start, today]);

  // Montagem dos cartões
  const [categoryCards, setCategoryCards] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cards = [];

      if (calcPitchDoMes) {
        const photo = await getProjectImageUrl(calcPitchDoMes.slug);
        cards.push({
          id: 'pitch-month',
          title: 'Pitch do Mês',
          subtitle: 'Mais pontos de pitch no período',
          icon: '🎯',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          winner: {
            name: tryGet(calcPitchDoMes.project, 'name', calcPitchDoMes.slug),
            photo: photo || '/images/project-placeholder.jpg',
            score: `${calcPitchDoMes.points.toLocaleString('pt-PT')} pts`,
            achievement: 'Domínio absoluto',
            badge: 'gold',
          },
          rarity: 'legendary',
        });
      }

      if (calcEstrelaAscensao) {
        const photo = await getProjectImageUrl(calcEstrelaAscensao.slug);
        const pct = Math.round((calcEstrelaAscensao.growth || 0) * 100);
        cards.push({
          id: 'rising-star',
          title: 'Estrela em Ascensão',
          subtitle: 'Maior crescimento vs. mês anterior',
          icon: '⭐',
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          winner: {
            name: tryGet(calcEstrelaAscensao.project, 'name', calcEstrelaAscensao.slug),
            photo: photo || '/images/project-placeholder.jpg',
            score: `${calcEstrelaAscensao.curr.toLocaleString('pt-PT')} pts`,
            achievement: `Crescimento de ${pct}%`,
            badge: pct >= 300 ? 'gold' : pct >= 150 ? 'platinum' : 'silver',
          },
          rarity: 'epic',
        });
      }

      if (calcMembroDoMes) {
        const photo = await getMemberImageUrl(calcMembroDoMes.username);
        cards.push({
          id: 'member-month',
          title: 'Membro do Mês',
          subtitle: 'Mais pontos no período',
          icon: '🏆',
          gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          winner: {
            name: tryGet(calcMembroDoMes.member, 'name', calcMembroDoMes.username),
            photo: photo || '/images/member-placeholder.jpg',
            score: `${calcMembroDoMes.points.toLocaleString('pt-PT')} pts`,
            achievement: 'Consistência e impacto',
            badge: 'platinum',
          },
          rarity: 'rare',
        });
      }

      if (calcMaisDefesas) {
        const photo = await getMemberImageUrl(calcMaisDefesas.username);
        cards.push({
          id: 'most-defenses',
          title: 'Mais Defesas',
          subtitle: 'Mais pontos de DEFENSE',
          icon: '🛡️',
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          winner: {
            name: tryGet(calcMaisDefesas.member, 'name', calcMaisDefesas.username),
            photo: photo || '/images/member-placeholder.jpg',
            score: `${calcMaisDefesas.points.toLocaleString('pt-PT')} pts`,
            achievement: 'Parede humana 🧱',
            badge: 'gold',
          },
          rarity: 'rare',
        });
      }

      if (mounted) setCategoryCards(cards);
    })();
    return () => { mounted = false; };
  }, [calcPitchDoMes, calcEstrelaAscensao, calcMembroDoMes, calcMaisDefesas]);

  // === UI ===
  if (loading) {
    return (
      <div className="hall-of-fame">
        <div className="hall-header"><h2>Hall of Fame</h2><p>A carregar…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hall-of-fame">
        <div className="hall-header"><h2>Hall of Fame</h2><p>Ocorreu um erro a carregar os dados.</p></div>
        <pre className="error">{String(error)}</pre>
      </div>
    );
  }

  return (
    <div className="hall-of-fame">
      <div className="hall-header">
        <h2>Hall of Fame</h2>
        <p>Estas categorias são calculadas automaticamente a partir dos dados reais.</p>
      </div>

      {categoryCards.length === 0 && (
        <div className="empty">Ainda não há dados suficientes para mostrar categorias.</div>
      )}

      <div className="categories-grid">
        {categoryCards.map(cat => (
          <div key={cat.id} className={`category-card rarity-${cat.rarity}`} style={{ background: cat.gradient }}>
            <div className="category-header">
              <span className="category-icon">{cat.icon}</span>
              <div>
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-subtitle">{cat.subtitle}</p>
              </div>
            </div>

            <div className="winner">
              <img className="winner-photo" src={cat.winner.photo} alt={cat.winner.name} onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg'; }} />
              <div className="winner-info">
                <div className="winner-name">{cat.winner.name}</div>
                <div className="winner-score">{cat.winner.score}</div>
                <div className="winner-achievement">{cat.winner.achievement}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hall-footer">
        <div className="rotation-info">
          <h3>🔄 Sistema de Rotação</h3>
          <p>As categorias são atualizadas automaticamente com base nos dados dos últimos 30 dias, com fallback para all‑time quando necessário.</p>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;
