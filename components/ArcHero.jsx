import { Fragment } from "react";

export default function ArcHero({ arc }) {
  return (
    <div className="container">
      <div className="hero">
        <div className="breadcrumb">
          {arc.breadcrumb.map((crumb) => (
            <Fragment key={crumb}>
              <a href="#">{crumb}</a>
              <span className="sep">›</span>
            </Fragment>
          ))}
          {arc.name}
        </div>

        <h1>{arc.name}</h1>

        <div className="hero-meta">
          <span>{arc.episodes}</span>
          <span className="dot">·</span>
          <span>{arc.seasonPart}</span>
          <span className="dot">·</span>
          <span>{arc.dateRange}</span>
          {arc.badges.map((badge) => (
            <span key={badge.label} className={`badge badge-${badge.type}`}>
              {badge.label}
            </span>
          ))}
        </div>

        <p className="hero-desc">{arc.description}</p>

        <div className="chars">
          {arc.characters.map((char) => (
            <div key={char.id ?? char.name} className="char-chip">
              <div
                className="char-avatar"
                style={
                  char.image
                    ? { backgroundImage: `url(${char.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: char.color }
                }
              >
                {!char.image && char.initials}
              </div>
              {char.name}
              {char.count != null && <span className="char-count">{char.count}</span>}
            </div>
          ))}
        </div>

        <div className="hero-stats">
          {arc.stats.map((stat, i) => (
            <Fragment key={stat.label}>
              {i > 0 && <div className="stat-div"></div>}
              <div className="stat">
                <div className="stat-val">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
