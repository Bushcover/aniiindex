export default function ContentTabs({ tabs }) {
  return (
    <div className="tabs-wrap">
      <div className="container">
        <div className="tabs">
          {tabs.map((tab) => (
            <div key={tab.label} className={`tab${tab.active ? " active" : ""}`}>
              {tab.label} <span className="cnt">{tab.count.toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
