export default function CharacterChips({ characters }) {
  return (
    <div className="chars">
      {characters.map((char) => (
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
  );
}
