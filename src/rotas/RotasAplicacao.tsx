import { lazy } from 'react';
import type { ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ambiente } from '@/configuracoes/ambiente';
import { LayoutAplicacao } from '@/layouts/LayoutAplicacao';
import { caminhos } from './caminhos';

type ModuloPaginasProvisorias = typeof import('@/paginas/paginasProvisorias');

function carregarProvisoria(nome: keyof ModuloPaginasProvisorias) {
  return lazy(async () => {
    const modulo = await import('@/paginas/paginasProvisorias');
    return { default: modulo[nome] as ComponentType };
  });
}

const PaginaDashboard = carregarProvisoria('PaginaDashboard');
const PaginaCalendario = carregarProvisoria('PaginaCalendario');
const PaginaTarefas = carregarProvisoria('PaginaTarefas');
const PaginaEstudos = carregarProvisoria('PaginaEstudos');
const PaginaHistoricoEstudos = carregarProvisoria('PaginaHistoricoEstudos');
const PaginaRevisaoSemanal = carregarProvisoria('PaginaRevisaoSemanal');
const PaginaConfiguracoes = carregarProvisoria('PaginaConfiguracoes');
const PaginaComponentes = lazy(() => import('@/paginas/PaginaComponentes'));
const PaginaNaoEncontrada = lazy(() => import('@/paginas/PaginaNaoEncontrada'));

export function RotasAplicacao() {
  return (
    <Routes>
      <Route element={<LayoutAplicacao />}>
        <Route path={caminhos.dashboard} element={<PaginaDashboard />} />
        <Route path={caminhos.calendario} element={<PaginaCalendario />} />
        <Route path={caminhos.tarefas} element={<PaginaTarefas />} />
        <Route path={caminhos.estudos} element={<PaginaEstudos />} />
        <Route path={caminhos.historicoEstudos} element={<PaginaHistoricoEstudos />} />
        <Route path={caminhos.revisao} element={<PaginaRevisaoSemanal />} />
        <Route path={caminhos.configuracoes} element={<PaginaConfiguracoes />} />
        {ambiente.desenvolvimento ? <Route path={caminhos.componentes} element={<PaginaComponentes />} /> : null}
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Route>
    </Routes>
  );
}
