import { useEffect, useState } from 'react'
import { audio } from '../audio/engine'
import { REGIONS } from '../game/regions'
import { useSettings } from '../game/settings'
import { useGame } from '../game/store'
import { AGENTE } from '../game/tuning'

// Todas as telas de interface por cima do Canvas.

// O clique de abertura só acontece uma vez por sessão: voltar das configurações não repete a tela.
let abertura = false

export function TitleScreen() {
  const [started, setStarted] = useState(abertura)
  const { hasSave, newGame, continueGame, openSettings, openCredits } = useGame()
  if (!started) { // o navegador só deixa tocar som depois de um clique: a primeira tela pede esse clique
    return (
      <button className="splash" onClick={() => { audio.unlock(); abertura = true; setStarted(true) }} autoFocus>
        <span className="title">C.R.O.S.</span>
        <span className="hint">clique para começar</span>
      </button>
    )
  }
  return (
    <div className="panel title-panel">
      <div className="eyebrow">Caso 01</div>
      <h1 className="title">C.R.O.S.</h1>
      <div className="subtitle">O Palacete Monteval</div>
      <nav className="menu">
        {hasSave && <button onClick={continueGame}>Continuar</button>}
        <button onClick={newGame} autoFocus={!hasSave}>Novo jogo</button>
        <button onClick={openSettings}>Configurações</button>
        <button onClick={openCredits}>Créditos</button>
      </nav>
      <div className="foot">versão de desenvolvimento · base do projeto</div>
    </div>
  )
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05, fmt }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; fmt?: (v: number) => string }) {
  const id = 'opt-' + label.replace(/\W+/g, '-').toLowerCase()
  return (
    <div className="opt">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="val">{fmt ? fmt(value) : Math.round(value * 100) + '%'}</span>
    </div>
  )
}

function Toggle({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <div className="opt">
      <span className="lbl">{label}</span>
      <button className={'toggle' + (value ? ' on' : '')} aria-pressed={value} onClick={() => onChange(!value)}>{value ? 'Ligado' : 'Desligado'}</button>
      {desc && <span className="desc">{desc}</span>}
    </div>
  )
}

export function SettingsScreen() {
  const s = useSettings()
  const back = useGame((g) => g.back)
  return (
    <div className="panel">
      <h2>Configurações</h2>
      <Toggle label="Filtro retrô" value={s.retro} onChange={(v) => s.set({ retro: v })} desc="resolução baixa e vértices tremidos, como no PS1" />
      <Slider label="Música" value={s.musicVolume} onChange={(v) => s.set({ musicVolume: v })} />
      <Slider label="Efeitos" value={s.sfxVolume} onChange={(v) => s.set({ sfxVolume: v })} />
      <Slider label="Sensibilidade do mouse" value={s.sensitivity} min={0.2} max={3} step={0.1} onChange={(v) => s.set({ sensitivity: v })} fmt={(v) => v.toFixed(1) + '×'} />
      <Toggle label="Inverter o eixo Y" value={s.invertY} onChange={(v) => s.set({ invertY: v })} />
      <nav className="menu row">
        <button onClick={s.reset}>Restaurar padrão</button>
        <button onClick={back} autoFocus>Voltar</button>
      </nav>
    </div>
  )
}

export function CreditsScreen() {
  const back = useGame((g) => g.back)
  return (
    <div className="panel">
      <h2>Créditos</h2>
      <dl className="credits">
        <dt>Criação, direção e design</dt><dd>[SEU NOME]</dd>
        <dt>Trilha sonora</dt><dd>Faixas geradas no Suno; perseguições sintetizadas no laboratório</dd>
        <dt>Feito com</dt><dd>React, Three.js e React Three Fiber</dd>
      </dl>
      <nav className="menu"><button onClick={back} autoFocus>Voltar</button></nav>
    </div>
  )
}

export function LoadingScreen() {
  const to = useGame((s) => s.loadingTo)
  const R = to ? REGIONS[to] : null
  return (
    <div className="loading" role="status" aria-live="polite">
      {R && (
        <>
          <div className="eyebrow">{R.lugar}</div>
          <div className="title small">{R.nome}</div>
          <p className="ficha">{R.ficha}</p>
        </>
      )}
      <div className="dots">carregando</div>
    </div>
  )
}

export function PauseScreen() {
  const { resume, openSettings, quitToMenu, goTo, region } = useGame()
  return (
    <div className="panel">
      <h2>Pausado</h2>
      <nav className="menu">
        <button onClick={resume} autoFocus>Continuar</button>
        <button onClick={openSettings}>Configurações</button>
        <button onClick={quitToMenu}>Sair para o menu</button>
      </nav>
      <div className="dev">
        <span>Desenvolvimento</span>
        {region !== 'porao' && <button onClick={() => void goTo('porao', 'escada')}>Testar carregamento: ir ao porão</button>}
        {region !== 'casa' && <button onClick={() => void goTo('casa', 'chegada')}>Voltar para a casa</button>}
      </div>
    </div>
  )
}

export function Hud() {
  const [obj, setObj] = useState(true)
  useEffect(() => { const t = setTimeout(() => setObj(false), 6000); return () => clearTimeout(t) }, [])
  return (
    <div className="hud">
      <div className={'objetivo' + (obj ? '' : ' hide')}><span>Objetivo</span>Encontre um jeito de subir</div>
      <div className="vida"><span>Vida</span><div className="bar"><i style={{ width: '100%' }} /></div><b>{AGENTE.vida} / {AGENTE.vida}</b></div>
      <div className="arma"><span>Pistola</span>Adaptadora · orbe vazio</div>
      <div className="devnote">base de desenvolvimento · arraste para olhar · role para aproximar · Esc pausa</div>
    </div>
  )
}
