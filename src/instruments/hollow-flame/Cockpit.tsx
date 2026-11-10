import { useEffect, useSyncExternalStore, type KeyboardEvent } from "react"
import { banner, marginWord, modeHint, phaseLabel, sheetWord, sliderMeta } from "@/instruments/hollow-flame/labels"
import type { Mode, Subject } from "@/instruments/hollow-flame/sim"
import {
  useSim,
  userCamera,
  userGust,
  userIgnite,
  userPlay,
  userQuench,
  userReset,
  userSetAirflow,
  userSetFuel,
  userSetMode,
  userSetOxygen,
  userSetSubject,
} from "@/instruments/hollow-flame/sim"
import { getDock, setDock, subscribeDock, type DockTab } from "@/instruments/hollow-flame/dock"

const MODES: { id: Mode; label: string }[] = [
  { id: "luminous", label: "Luminous" },
  { id: "temperature", label: "Temperature" },
  { id: "reaction", label: "Reaction" },
  { id: "section", label: "Section" },
]

const SUBJECTS: { id: Subject; label: string }[] = [
  { id: "flame", label: "Flame" },
  { id: "plasmoid", label: "Plasmoid" },
  { id: "cell", label: "Cell" },
  { id: "manifold", label: "Hollow Manifold" },
]

const TABS: { id: DockTab; label: string }[] = [
  { id: "ride", label: "Ride" },
  { id: "field", label: "Field" },
  { id: "drivers", label: "Drivers" },
  { id: "compare", label: "Compare" },
]

function fmt(n: number) {
  return (n >= 0 ? "" : "−") + Math.abs(n).toFixed(2)
}

export function Cockpit() {
  const snap = useSim()
  const dock = useSyncExternalStore(subscribeDock, getDock, getDock)
  const { open, tab } = dock
  const sliders = sliderMeta(snap.subject)
  const flameLike = snap.subject === "flame" || snap.subject === "manifold"
  const burning = snap.phase === "stable" || snap.phase === "perturbed" || snap.phase === "igniting"
  const setControl = (key: "fuel" | "oxygen" | "airflow", value: number) => {
    if (key === "fuel") userSetFuel(value)
    else if (key === "oxygen") userSetOxygen(value)
    else userSetAirflow(value)
  }
  const accent = snap.subject === "plasmoid" ? "frost" : snap.subject === "cell" ? "paper" : "ember"

  useEffect(() => {
    const frame = document.getElementById("ride")
    if (frame) frame.dataset.dock = open ? "open" : "shut"
  }, [open])

  function pick(next: DockTab) {
    if (tab === next) setDock({ open: !open })
    else setDock({ tab: next, open: true })
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((item) => item.id === tab)
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault()
      const dir = event.key === "ArrowRight" ? 1 : -1
      const next = TABS[(index + dir + TABS.length) % TABS.length].id
      setDock({ tab: next, open: true })
    } else if (event.key === "Home") {
      event.preventDefault()
      setDock({ tab: "ride", open: true })
    } else if (event.key === "End") {
      event.preventDefault()
      setDock({ tab: "compare", open: true })
    } else if (event.key === "Escape") {
      setDock({ open: false })
    }
  }

  const show = (id: DockTab) => (open && tab === id ? "cockpit-panel" : "cockpit-panel max-lg:hidden")

  return (
    <section className="cockpit" aria-label="Instrument controls" data-accent={accent}>
      <div className="flex items-center justify-between gap-3 px-3 pt-2 lg:hidden">
        <p className="font-mono text-xs tracking-widest text-ember uppercase">{phaseLabel(snap.subject, snap.phase)}</p>
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs text-paper tabular-nums">Margin {fmt(snap.margin)}</p>
          <button
            type="button"
            className="min-h-11 border border-line px-3 font-mono text-xs tracking-widest text-paper uppercase"
            aria-expanded={open}
            aria-controls="cockpit-panels"
            onClick={() => setDock({ open: !open })}
          >
            {open ? "Close" : "Open"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 border-b border-line lg:hidden" role="tablist" aria-label="Cockpit" onKeyDown={onTabsKeyDown}>
        {TABS.map((item) => {
          const on = open && tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={on}
              aria-controls="cockpit-panels"
              tabIndex={tab === item.id ? 0 : -1}
              className={
                on
                  ? "min-h-11 font-mono text-xs tracking-widest text-ink uppercase bg-ember"
                  : "min-h-11 font-mono text-xs tracking-widest text-paper uppercase"
              }
              onClick={() => pick(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div id="cockpit-panels" className={open ? "cockpit-scroll px-3 pb-3 lg:px-4 lg:pb-4" : "lg:px-4 lg:pb-4 lg:pt-4"}>
        <div className={show("ride")} role="tabpanel" aria-labelledby="tab-ride">
          <div className="flex items-start justify-between gap-3 pt-3">
            <div>
              <p className="font-mono text-xs tracking-widest text-dust uppercase">Phase</p>
              <p className="font-display text-2xl text-paper" aria-live="polite">
                {phaseLabel(snap.subject, snap.phase)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs tracking-widest text-dust uppercase">Held</p>
              <p className="font-mono text-lg text-paper tabular-nums">{snap.elapsed > 0.05 ? `${snap.elapsed.toFixed(1)}s` : "—"}</p>
            </div>
          </div>
          <p className="min-h-12 pt-2 text-sm text-dust">{snap.caption}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 border-y border-line py-3">
            <div>
              <dt className="font-mono text-xs tracking-wider text-dust uppercase">{flameLike ? "Peak" : snap.subject === "plasmoid" ? "Sheath" : "Drive"}</dt>
              <dd className="font-mono text-lg text-paper tabular-nums">
                {flameLike && snap.tempC != null ? `${Math.round(snap.tempC)}°` : snap.activity.toFixed(2)}
              </dd>
              <p className="font-mono text-xs text-dust">{flameLike ? "illustrative" : "schematic"}</p>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wider text-dust uppercase">{flameLike ? "Reaction" : snap.subject === "cell" ? "Gradient" : "Gap"}</dt>
              <dd className="font-mono text-lg text-paper tabular-nums">{flameLike ? snap.activity.toFixed(2) : snap.secondary.toFixed(2)}</dd>
              <p className="font-mono text-xs text-dust">{flameLike ? sheetWord(snap.thickness) : "schematic"}</p>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wider text-dust uppercase">Margin</dt>
              <dd className="font-mono text-lg text-paper tabular-nums">{fmt(snap.margin)}</dd>
              <p className={snap.margin < 0 ? "font-mono text-xs text-dust" : "font-mono text-xs text-ember"}>{marginWord(snap.subject, snap.margin)}</p>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-2 pt-3">
            <button type="button" className="col-span-2 min-h-11 bg-ember px-3 font-mono text-xs tracking-widest text-ink uppercase" onClick={userPlay}>
              Play lifecycle
            </button>
            <button
              type="button"
              className="min-h-11 border border-line bg-raised px-3 font-mono text-xs tracking-widest text-paper uppercase disabled:opacity-40"
              onClick={userIgnite}
              disabled={snap.phase === "stable" || snap.phase === "perturbed"}
            >
              {burning && snap.phase !== "igniting" ? "Burning" : snap.phase === "out" ? "Reignite" : "Ignite"}
            </button>
            <button
              type="button"
              className="min-h-11 border border-line bg-raised px-3 font-mono text-xs tracking-widest text-paper uppercase disabled:opacity-40"
              onClick={userGust}
              disabled={snap.phase !== "stable"}
            >
              Gust
            </button>
            <button
              type="button"
              className="min-h-11 border border-line bg-raised px-3 font-mono text-xs tracking-widest text-paper uppercase disabled:opacity-40"
              onClick={userQuench}
              disabled={snap.phase === "cold" || snap.phase === "out"}
            >
              Quench
            </button>
            <button type="button" className="min-h-11 border border-line bg-raised px-3 font-mono text-xs tracking-widest text-dust uppercase" onClick={userReset}>
              Reset
            </button>
          </div>
        </div>

        <div className={show("field")} role="tabpanel" aria-labelledby="tab-field">
          <p className="pt-3 pb-2 font-mono text-xs tracking-widest text-dust uppercase">Field</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Visualization">
            {MODES.map((item) => {
              const on = snap.mode === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={
                    on
                      ? "min-h-11 border border-paper bg-paper px-1 font-mono text-xs tracking-wider text-ink uppercase"
                      : "min-h-11 border border-line bg-raised px-1 font-mono text-xs tracking-wider text-paper uppercase"
                  }
                  onClick={() => userSetMode(item.id)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 flex-1 border border-line font-mono text-xs tracking-widest text-dust uppercase" onClick={() => userCamera("three")}>
              Orbit
            </button>
            <button type="button" className="min-h-11 flex-1 border border-line font-mono text-xs tracking-widest text-dust uppercase" onClick={() => userCamera("above")}>
              Overhead
            </button>
          </div>
          <p className="pt-3 text-sm text-dust">{modeHint(snap.subject, snap.mode)}</p>
        </div>

        <div className={show("drivers")} role="tabpanel" aria-labelledby="tab-drivers">
          <p className="pt-3 font-mono text-xs tracking-widest text-dust uppercase">Drivers</p>
          <div className="flex flex-col">
            {sliders.map((slider) => {
              const value = slider.key === "fuel" ? snap.fuel : slider.key === "oxygen" ? snap.oxygen : snap.airflow
              return (
                <label key={slider.key} className="block">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs tracking-widest text-paper uppercase">{slider.label}</span>
                    <span className="font-mono text-xs text-dust tabular-nums">{Math.round(value * 100)}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(value * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(value * 100)}
                    aria-label={slider.label}
                    onChange={(e) => setControl(slider.key, Number(e.currentTarget.value) / 100)}
                  />
                  <span className="block pb-2 text-sm text-dust">{slider.hint}</span>
                </label>
              )
            })}
          </div>
          <p className="text-sm text-paper">
            Maintenance margin <span className="font-mono tabular-nums">{fmt(snap.margin)}</span>
            <span className="text-dust"> · {marginWord(snap.subject, snap.margin)}</span>
          </p>
          {snap.subject === "manifold" ? <p className="pt-2 text-sm text-dust">Sliders drive the flame only. The plasmoid and the cell stay schematic.</p> : null}
          <details className="border-t border-line pt-3 text-sm text-dust">
            <summary className="min-h-11 cursor-pointer font-mono text-xs tracking-widest text-paper uppercase">What the numbers are</summary>
            <p className="pt-2">
              {flameLike
                ? "Reaction rate is fuel × oxygen, reduced by starvation, oxygen choke, and blow-off. Margin is that rate minus those losses. Temperature is an illustrative peak in the sheet, not a pyrometer."
                : snap.subject === "plasmoid"
                  ? "Sheath strength is drive × density, cut down by disruption. This is a schematic of confinement, not a plasma solver. There is no combustion term."
                  : "Metabolism is nutrient × membrane integrity, reduced by insult. A wounded membrane is allowed to fail. An intact one is biased to recover."}
            </p>
            <p className="pt-2">{banner(snap.subject)}</p>
          </details>
        </div>

        <div className={show("compare")} role="tabpanel" aria-labelledby="tab-compare">
          <p className="pt-3 pb-2 font-mono text-xs tracking-widest text-dust uppercase">Compare</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="System">
            {SUBJECTS.map((item) => {
              const on = snap.subject === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={
                    on
                      ? "min-h-11 border border-ember bg-ember px-2 font-mono text-xs tracking-widest text-ink uppercase"
                      : "min-h-11 border border-line bg-raised px-2 font-mono text-xs tracking-widest text-paper uppercase"
                  }
                  onClick={() => userSetSubject(item.id)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="pt-3 text-sm text-dust">A flame, a plasmoid, and a cell can share a drawing. They do not share a mechanism. The manifold makes that difference visible.</p>
        </div>
      </div>
    </section>
  )
}
