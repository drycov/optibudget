import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, Save, Trash2 } from "lucide-react";
import {
  isSupabaseConfigured,
  getSessionUser,
  signInWithPassword,
  signUp,
  signOut,
  listProjects,
  saveProject,
  deleteProject,
  type CloudProject
} from "./supabase";
import type { User } from "@supabase/supabase-js";
import { DEFAULT_MAP_CENTER } from "./geo";

type Snapshot = {
  title: string;
  technology: string;
  linear_profile: Record<string, unknown>;
  linear_elements: unknown[];
  topology_nodes: unknown[];
  map_routes: unknown[];
  map_center: { lat: number; lng: number; zoom: number };
};

type Props = {
  getSnapshot: () => Snapshot;
  onLoadProject: (p: CloudProject) => void;
};

export default function CloudSync({ getSnapshot, onLoadProject }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [cloudId, setCloudId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getSessionUser().then(setUser).catch(() => setUser(null));
  }, []);

  async function refreshList() {
    if (!user) return;
    setBusy(true);
    try {
      const list = await listProjects();
      setProjects(list);
      setStatus(`Загружено проектов: ${list.length}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ошибка загрузки проектов");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user) refreshList();
  }, [user]);

  async function handleAuth(mode: "in" | "up") {
    setBusy(true);
    setStatus("");
    try {
      if (mode === "in") {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setStatus("Регистрация отправлена. Проверьте почту, если включено подтверждение.");
      }
      const u = await getSessionUser();
      setUser(u);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ошибка авторизации");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      const snap = getSnapshot();
      const saved = await saveProject({
        id: cloudId ?? undefined,
        title: snap.title,
        technology: snap.technology,
        linear_profile: snap.linear_profile,
        linear_elements: snap.linear_elements,
        topology_nodes: snap.topology_nodes,
        map_routes: snap.map_routes,
        map_center: snap.map_center ?? DEFAULT_MAP_CENTER
      });
      setCloudId(saved.id);
      setStatus(`Сохранено в облако: ${saved.title}`);
      await refreshList();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setProjects([]);
    setCloudId(null);
    setStatus("Вы вышли из аккаунта.");
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Облако (Supabase)</h2>
            <p>Не настроено. Скопируйте <code>.env.example</code> → <code>.env.local</code> и укажите URL + anon key.</p>
          </div>
          <CloudOff size={18} />
        </div>
        <div className="warning">
          Без переменных <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> приложение работает полностью локально
          (карта, каскад, журнал). Облачная синхронизация появится после настройки.
        </div>
        <ol className="footnote" style={{ paddingLeft: 18 }}>
          <li>Создайте проект на supabase.com</li>
          <li>В SQL Editor выполните <code>supabase/schema.sql</code></li>
          <li>Authentication → Providers → Email (включить)</li>
          <li>Settings → API → скопируйте Project URL и anon public key</li>
          <li>Перезапустите <code>npm run dev</code></li>
        </ol>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Облако Supabase</h2>
          <p>Синхронизация проектов: линейный расчёт, каскад и трассы на карте.</p>
        </div>
        <Cloud size={18} />
      </div>

      {!user ? (
        <div className="cloud-auth">
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
          <label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <div className="catalog-actions">
            <button className="btn primary" disabled={busy || !email || !password} onClick={() => handleAuth("in")}>
              <LogIn size={14} /> Войти
            </button>
            <button className="btn" disabled={busy || !email || !password} onClick={() => handleAuth("up")}>
              Регистрация
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="cloud-user-bar">
            <span>{user.email}</span>
            <button className="btn" onClick={handleLogout}><LogOut size={14} /> Выйти</button>
            <button className="btn primary" disabled={busy} onClick={handleSave}><Save size={14} /> Сохранить проект</button>
            <button className="btn" disabled={busy} onClick={refreshList}><RefreshCw size={14} /> Обновить список</button>
          </div>
          {cloudId && <p className="footnote">Текущий cloud id: {cloudId}</p>}
          <div className="journal">
            {projects.length === 0 ? (
              <div className="empty">В облаке пока нет проектов. Нажмите «Сохранить проект».</div>
            ) : (
              projects.map(p => (
                <div className="journal-item" key={p.id}>
                  <div>
                    <strong>{p.title}</strong>
                    <small>
                      {new Date(p.updated_at).toLocaleString("ru-RU")} · {p.technology}
                      {p.id === cloudId ? " · открыт" : ""}
                    </small>
                  </div>
                  <button className="btn" onClick={() => { setCloudId(p.id); onLoadProject(p); setStatus(`Загружен: ${p.title}`); }}>
                    Открыть
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Удалить"
                    onClick={async () => {
                      if (!confirm("Удалить проект из облака?")) return;
                      setBusy(true);
                      try {
                        await deleteProject(p.id);
                        if (cloudId === p.id) setCloudId(null);
                        await refreshList();
                      } catch (e) {
                        setStatus(e instanceof Error ? e.message : "Ошибка удаления");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {status && <p className="footnote" role="status">{status}</p>}
    </section>
  );
}
