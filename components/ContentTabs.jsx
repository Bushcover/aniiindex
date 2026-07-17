// Session 28: tab clicks now do something — added an optional `onSelect`
// callback, fired with the clicked tab's `label`. The caller (ArcContent)
// owns which tab is active and re-passes `tabs` with the right entry's
// `active` flipped, same as before; this component still just renders
// whatever it's given. `<button>` instead of the previous plain `<div>`
// for real keyboard/click semantics — `.tab` in globals.css already had
// `cursor: pointer` but no button-style reset, so that's added there too.
export default function ContentTabs({ tabs, onSelect }) {
  return (
    <div className="tabs-wrap">
      <div className="container">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={`tab${tab.active ? " active" : ""}`}
              onClick={() => onSelect?.(tab.label)}
            >
              {tab.label} <span className="cnt">{tab.count.toLocaleString("en-US")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
