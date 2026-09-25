import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import estilos from './GraficoBarras.module.css';

export interface PontoGraficoBarras {
  chave: string;
  rotulo: string;
  rotuloCompleto: string;
  valor: number;
}

export interface GraficoBarrasProps {
  dados: PontoGraficoBarras[];
  titulo: string;
  resumo: string;
  rotuloValor: string;
  formatarValor: (valor: number) => string;
  formatarEixo?: (valor: number) => string;
  marcasEixo?: number[];
  passoEixo?: number;
  altura?: number;
  preencher?: boolean;
}

function prefereMovimentoReduzido(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function DicaGrafico({
  active,
  payload,
  formatarValor,
}: TooltipProps<number, string> & { formatarValor: (valor: number) => string }) {
  const ponto = payload?.[0]?.payload as PontoGraficoBarras | undefined;
  if (!active || !ponto) return null;

  return (
    <div className={estilos.dica}>
      <span className={estilos.dicaValor}>{formatarValor(ponto.valor)}</span>
      <span className={estilos.dicaRotulo}>{ponto.rotuloCompleto}</span>
    </div>
  );
}

export function GraficoBarras({
  dados,
  titulo,
  resumo,
  rotuloValor,
  formatarValor,
  formatarEixo = String,
  marcasEixo,
  passoEixo,
  altura = 220,
  preencher = false,
}: GraficoBarrasProps) {
  const idResumo = useId();
  const intervalo = passoEixo ?? (dados.length > 14 ? Math.ceil(dados.length / 7) - 1 : 0);

  return (
    <figure className={preencher ? `${estilos.figura} ${estilos.figuraFlexivel}` : estilos.figura} aria-describedby={idResumo}>
      <figcaption className="visualmente-oculto" id={idResumo}>
        {titulo}. {resumo}
      </figcaption>

      <div
        className={preencher ? `${estilos.area} ${estilos.areaFlexivel}` : estilos.area}
        style={preencher ? { minHeight: altura } : { height: altura }}
        aria-hidden="true"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="rotulo"
              axisLine={false}
              tickLine={false}
              interval={intervalo}
              tickMargin={10}
              height={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={formatarEixo}
              ticks={marcasEixo}
              domain={marcasEixo ? [0, marcasEixo[marcasEixo.length - 1] ?? 'auto'] : [0, 'auto']}
              width={44}
              tickMargin={6}
            />
            <Tooltip
              cursor={{ className: estilos.cursor }}
              content={<DicaGrafico formatarValor={formatarValor} />}
              isAnimationActive={false}
            />
            <Bar
              dataKey="valor"
              name={rotuloValor}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              className={estilos.barra}
              isAnimationActive={!prefereMovimentoReduzido()}
              animationDuration={480}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="visualmente-oculto">
        <table>
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">{rotuloValor}</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((ponto) => (
              <tr key={ponto.chave}>
                <th scope="row">{ponto.rotuloCompleto}</th>
                <td>{formatarValor(ponto.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
