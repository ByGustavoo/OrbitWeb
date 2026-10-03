# Orbit

## What this is
Frontend of a personal productivity app: tasks, agenda, calendar, priorities, a study timer (free and
Pomodoro), study goals, history and a weekly review. Single user, no login. The backend is OrbitAPI
(Java / Spring Boot); until a build points at it, the app runs on simulated data that answers the
same routes and formats.

## Type
web/frontend - release: branch + PR to `main` (`ci.yml` runs on the PR; `release.yml` publishes the
Docker image and the `vX.Y.Z` tag only when a PR is merged, so a direct push to `main` publishes nothing)

## Stack
React 18, TypeScript 5 (`strict`, `noUncheckedIndexedAccess`), Vite 5, React Router 6 (v7 future
flags on), CSS Modules with custom properties, Recharts, lucide-react, Geist / Geist Mono via
`@fontsource-variable`, Vitest. Same stack and conventions as `D:\Projetos\PrismaWeb`.

## Docs
`docs/` is the source of truth and is kept in sync with the code: `arquitetura.md` (layers, folders,
services, providers, error handling, UI states, simulated data, storage keys), `api-contrato.md`
(every endpoint, DTO and error), `backend.md` (what OrbitAPI must implement), `regras-negocio.md`
and `historico-fases.md` (decisions per phase). Read the relevant one before changing behaviour, and
update it in the same change.

## Structure
| Path | Holds |
|---|---|
| `src/api/` | `clienteHttp` (the only place that makes requests), `rotasApi` (every API path), `ErroApi`, `tratamentoErros`, the `fetch` and simulated transports |
| `src/dados/simulacao/` | API simulator: database in `localStorage`, seeds relative to today, one handler per resource |
| `src/regras/` | Pure business rules with tests: deadline, recurrence, validations, timer, reminder, streak, heat map, history period, weekly review |
| `src/servicos/` | One service per resource, a thin layer over `clienteHttp` |
| `src/modelos/` | DTO types, enums, Portuguese labels (`rotulos.ts`), color tokens |
| `src/provedores/` | Theme, notifications, change versions, task actions (with "Desfazer"), timer, reminders |
| `src/componentes/` | `ui/` (design system), `layout/`, `boasVindas/`, `comum/` (`MarcaOrbit`) and one folder per domain |
| `src/configuracoes/` | `ambiente` (only reader of env and `window.__ORBIT_CONFIG__`), `aplicacao` (name, slogan, storage keys), `navegacao` |
| `src/estilos/` | `tokens.css` (scale), `temas.css` (colors per theme), `global.css` |
| `docker/` | nginx config and `40-orbit-config.sh`, which writes `config.js` from `ORBIT_API_URL` when the container starts |
| `video/` | Separate Remotion package for the presentation video (own `package.json`, outside the app build, CI and Docker context). `src/linhaDoTempo.ts` holds every frame cue; `scripts/gerarAudio.ts` arranges the synthesized soundtrack (150 BPM; every scene start and accent sits on the 12-frame beat grid) on top of the DSP in `scripts/sintese.ts` |

## Commands
| Purpose | Command |
|---|---|
| Install | `npm install` |
| Run (dev) | `npm run dev` (port 5174, after PrismaWeb on 5173) |
| Test | `npm test` |
| Typecheck | `npm run typecheck` (`tsc -b`) |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Presentation video | `npm install --prefix video`, then `npm run render --prefix video` (writes the 3840×2160 `video/out/orbit-apresentacao.mp4`: the 1920×1080 composition rendered at `--scale=2`); `npm run gif --prefix video` rebuilds the README GIF `video/apresentacao.gif` (800px, 12 fps, kept under 10 MB) from that render; `npm run estudio --prefix video` opens Remotion Studio |

No linter or formatter is configured. Before calling a task done, run `npm run typecheck` and `npm test`.

## Conventions
* All identifiers, types, fields, files and folders in Portuguese (`TarefaDTO`, `buscarTarefas`, `aoConcluir`); enum values in UPPER_CASE (`'POMODORO'`, `'CONCLUIDA'`). Interface text is accented pt-BR.
* No comments in source, CSS, config or HTML. The only exceptions are `.env.example` and `/// <reference>`.
* No hex colors in components: colors come from `temas.css` tokens (`[data-tema='claro']`, `[data-tema='escuro']`).
* Pages and components never call `fetch` or `clienteHttp`; they call services. API paths live only in `src/api/rotasApi.ts`, and API errors are interpreted only in `src/api/tratamentoErros.ts`.
* `import.meta.env` and `window.__ORBIT_CONFIG__` are read only in `src/configuracoes/ambiente.ts`.
* Imports between folders use the `@/` alias for `src/`. Each component has its `.module.css` beside it.
* Commits are `OBT-<n> - <change> - <change>`, one sentence per change, in pt-BR.

## Gotchas
* Without a `.env`, the app uses the simulated data (`VITE_FONTE_DADOS=simulada`). With `VITE_FONTE_DADOS=api`, the simulator is not even bundled. In the container, `window.__ORBIT_CONFIG__.urlApi` wins over `VITE_URL_API`.
* The simulated database is versioned by `VERSAO_BANCO` in `src/dados/simulacao/sementes.ts`. Bump it whenever the seeds change, or browsers keep the old data from `localStorage`.
* The seeds are generated relative to today, and the simulator has console controls in development (`orbitSimulacao.restaurar()`, `esvaziar()`, `falhar('/tarefas')`, `latencia(8000)`).
* Page filters, month, day and week live in the browser history state (`useParametrosPagina`), not in the query string.
* The welcome screen shows once per browser session (`orbit:boas-vindas-vista` in `sessionStorage`); a new tab shows it again. Theme is stored as JSON in `localStorage` (`orbit:tema`, e.g. `"escuro"`), and an inline script in `index.html` applies it before React mounts.
* `/componentes` (design system catalogue) exists only in development (`ambiente.desenvolvimento`).
* The presentation video shows the simulated data as it was on 2 Oct 2026 (Friday). The heat map levels in `video/src/cenas/Progresso.tsx` were read from that day's render, so they will not match the app on another date.
