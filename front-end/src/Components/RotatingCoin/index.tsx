import './RotatingCoin.scss';

export default function RotatingCoin({
  winningSide
}: {
  winningSide: 'heads' | 'tails';
}) {
  return (
    <div id="rotating-coin">
      <div
        className="coin"
        style={{
          animation: winningSide
            ? `${
                winningSide === 'heads' ? 'rotate3dHeads' : 'rotate3dTails'
              } 3s linear forwards`
            : undefined
        }}
      >
        <div className="coin__front"></div>
        <div className="coin__edge">
          {Array(80)
            .fill('')
            .map(() => (
              <div />
            ))}
        </div>
        <div className="coin__back"></div>
        <div className="coin__shadow"></div>
      </div>
    </div>
  );
}
