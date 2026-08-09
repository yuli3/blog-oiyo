
export function OptionPayoffChart() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📈 Option Payoff Chart (Placeholder)</div>; }
export function FrontierChart({title}: { title?: string }) { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📊 Efficient Frontier Chart: {title || 'Untitled'}</div>; }
export function NPVChart() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📉 NPV Chart (Placeholder)</div>; }

const chartFrame = {
  margin: "2rem 0",
  padding: "1rem",
  backgroundColor: "#fafaf7",
  border: "1px solid #d8dccb",
  borderRadius: "0.75rem",
} as const;

export function CAPMChart() {
  return (
    <figure style={chartFrame}>
      <svg viewBox="0 0 720 330" role="img" aria-labelledby="capm-title capm-desc" style={{display: "block", width: "100%", height: "auto"}}>
        <title id="capm-title">CAPM 요구수익률 구성</title>
        <desc id="capm-desc">무위험수익률 3퍼센트와 베타 1.5에 시장위험프리미엄 6퍼센트를 곱한 9퍼센트를 더해 요구수익률 12퍼센트가 되는 예시</desc>
        <text x="28" y="34" fontSize="19" fontWeight="700" fill="#263016">CAPM 요구수익률은 어떻게 만들어질까?</text>
        <rect x="48" y="104" width="154" height="92" rx="12" fill="#e7eadc" />
        <rect x="282" y="70" width="184" height="126" rx="12" fill="#b8c58b" />
        <rect x="546" y="36" width="126" height="160" rx="12" fill="#667a34" />
        <path d="M214 150h54M478 150h54" stroke="#667085" strokeWidth="3" />
        <path d="m258 141 10 9-10 9M522 141l10 9-10 9" fill="none" stroke="#667085" strokeWidth="3" />
        <text x="125" y="139" textAnchor="middle" fontSize="17" fontWeight="700" fill="#34421f">무위험수익률</text>
        <text x="125" y="169" textAnchor="middle" fontSize="25" fontWeight="800" fill="#263016">3%</text>
        <text x="374" y="111" textAnchor="middle" fontSize="17" fontWeight="700" fill="#263016">위험 보상</text>
        <text x="374" y="143" textAnchor="middle" fontSize="21" fontWeight="800" fill="#263016">β 1.5 × 6%</text>
        <text x="374" y="174" textAnchor="middle" fontSize="20" fill="#263016">= 9%</text>
        <text x="609" y="83" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">요구수익률</text>
        <text x="609" y="126" textAnchor="middle" fontSize="29" fontWeight="800" fill="#fff">12%</text>
        <text x="360" y="244" textAnchor="middle" fontSize="16" fill="#475467">E(Rᵢ) = Rf + βᵢ × [E(Rₘ) − Rf]</text>
        <text x="360" y="279" textAnchor="middle" fontSize="14" fill="#667085">베타가 커질수록 투자자가 요구하는 위험 보상도 커진다.</text>
      </svg>
      <figcaption style={{marginTop: "0.5rem", textAlign: "center", color: "#5f6652", fontSize: "0.875rem"}}>
        무위험수익률에 체계적 위험에 대한 보상을 더하면 CAPM 요구수익률이 됩니다.
      </figcaption>
    </figure>
  );
}

export function SMLChart() {
  return (
    <figure style={chartFrame}>
      <svg viewBox="0 0 720 430" role="img" aria-labelledby="sml-title sml-desc" style={{display: "block", width: "100%", height: "auto"}}>
        <title id="sml-title">증권시장선 SML</title>
        <desc id="sml-desc">가로축 베타와 세로축 기대수익률 사이의 관계. 무위험자산에서 시장 포트폴리오를 지나는 증권시장선 위에는 저평가 자산, 아래에는 고평가 자산이 표시됨</desc>
        <text x="28" y="32" fontSize="19" fontWeight="700" fill="#263016">증권시장선: 베타와 요구수익률</text>
        <path d="M86 346V64M86 346H674" fill="none" stroke="#344054" strokeWidth="2.5" />
        <path d="m79 76 7-12 7 12M662 339l12 7-12 7" fill="none" stroke="#344054" strokeWidth="2.5" />
        <path d="M86 292 628 86" fill="none" stroke="#667a34" strokeWidth="4" />
        <text x="592" y="75" fontSize="16" fontWeight="800" fill="#526229">SML</text>
        <circle cx="86" cy="292" r="6" fill="#667a34" />
        <text x="100" y="313" fontSize="14" fill="#475467">Rf (β = 0)</text>
        <circle cx="357" cy="189" r="7" fill="#263016" />
        <path d="M357 189V346" stroke="#98a276" strokeDasharray="6 6" />
        <text x="370" y="182" fontSize="14" fontWeight="700" fill="#263016">시장 포트폴리오</text>
        <text x="344" y="371" fontSize="14" fill="#475467">1.0</text>
        <circle cx="493" cy="102" r="8" fill="#6f8f3d" />
        <text x="509" y="103" fontSize="15" fontWeight="700" fill="#526229">A: 저평가</text>
        <text x="509" y="121" fontSize="13" fill="#667085">실제 기대수익률 &gt; 요구수익률</text>
        <circle cx="493" cy="236" r="8" fill="#a45c40" />
        <text x="509" y="235" fontSize="15" fontWeight="700" fill="#8b4933">B: 고평가</text>
        <text x="509" y="253" fontSize="13" fill="#667085">실제 기대수익률 &lt; 요구수익률</text>
        <text x="365" y="410" textAnchor="middle" fontSize="15" fontWeight="700" fill="#344054">체계적 위험 β</text>
        <text x="22" y="212" textAnchor="middle" fontSize="15" fontWeight="700" fill="#344054" transform="rotate(-90 22 212)">기대수익률 E(R)</text>
      </svg>
      <figcaption style={{marginTop: "0.5rem", textAlign: "center", color: "#5f6652", fontSize: "0.875rem"}}>
        SML의 기울기는 시장 위험 프리미엄이며, 선과의 거리는 자산의 알파를 보여줍니다.
      </figcaption>
    </figure>
  );
}
