import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ambiente } from '@/configuracoes/ambiente';
import { estadoComParametros } from '@/ganchos/useParametrosPagina';
import { LayoutAplicacao } from '@/layouts/LayoutAplicacao';
import { caminhos } from './caminhos';

const PaginaDashboard = lazy(() => import('@/paginas/PaginaDashboard'));
const PaginaCalendario = lazy(() => import('@/paginas/PaginaCalendario'));
const PaginaTarefas = lazy(() => import('@/paginas/PaginaTarefas'));
const PaginaEstudos = lazy(() => import('@/paginas/PaginaEstudos'));
const PaginaHistorico = lazy(() => import('@/paginas/PaginaHistorico'));
const PaginaRevisaoSemanal = lazy(() => import('@/paginas/PaginaRevisaoSemanal'));
const PaginaConfiguracoes = lazy(() => import('@/paginas/PaginaConfiguracoes'));
const PaginaComponentes = ambiente.desenvolvimento ? lazy(() => import('@/paginas/PaginaComponentes')) : null;
const PaginaNaoEncontrada = lazy(() => import('@/paginas/PaginaNaoEncontrada'));

function RedirecionarParaDashboard() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: caminhos.dashboard, search }} replace />;
}

function RedirecionarParaHistoricoDeEstudos() {
  return <Navigate to={caminhos.historico} state={estadoComParametros({ area: 'estudos' })} replace />;
}

export function RotasAplicacao() {
  return (
    <Routes>
      <Route element={<LayoutAplicacao />}>
        <Route path={caminhos.inicio} element={<RedirecionarParaDashboard />} />
        <Route path={caminhos.dashboard} element={<PaginaDashboard />} />
        <Route path={caminhos.calendario} element={<PaginaCalendario />} />
        <Route path={caminhos.tarefas} element={<PaginaTarefas />} />
        <Route path={caminhos.estudos} element={<PaginaEstudos />} />
        <Route path={caminhos.historico} element={<PaginaHistorico />} />
        <Route path={caminhos.historicoEstudos} element={<RedirecionarParaHistoricoDeEstudos />} />
        <Route path={caminhos.revisao} element={<PaginaRevisaoSemanal />} />
        <Route path={caminhos.configuracoes} element={<PaginaConfiguracoes />} />
        {PaginaComponentes ? <Route path={caminhos.componentes} element={<PaginaComponentes />} /> : null}
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Route>
    </Routes>
  );
}
