import fs from 'fs';
import path from 'path';

const SRC_DIR = '/Users/seuncho/coding/blog-oiyo/src';

const mocks = [
    {
        filePath: 'components/mdx/Callout.astro',
        content: ["---", "---", "<div style=\"padding:1.5rem; background-color:#f8fafc; border-left:4px solid #3b82f6; border-radius:0.5rem; margin:1.5rem 0; color:#1e293b; font-size:1.05rem; box-shadow:0 1px 3px rgba(0,0,0,0.1); line-height:1.6;\"><slot /></div>"].join('\\n')
    },
    {
        filePath: 'components/mdx/FormulaBlock.astro',
        content: ["---", "---", "<div style=\"padding:1.5rem; background-color:#f1f5f9; font-family:'Courier New', Courier, monospace; margin:1.5rem 0; text-align:center; font-size:1.2rem; border-radius:0.5rem; border:1px solid #e2e8f0; overflow-x:auto;\"><slot /></div>"].join('\\n')
    },
    {
        filePath: 'components/education/PoisonPillExplorer.tsx',
        content: "export default function PoisonPillExplorer() { return <div style={{padding:'2rem', backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'0.5rem', textAlign:'center', color:'#991b1b', fontWeight:'bold', margin:'2rem 0'}}>🧪 Poison Pill Explorer (Interactive Preview Placeholder)</div>; }"
    },
    {
        filePath: 'components/ui/badge.tsx',
        content: "export function Badge({children, variant}:any) { \n        const bg = variant === 'destructive' ? '#fef2f2' : '#f1f5f9';\n        const color = variant === 'destructive' ? '#ef4444' : '#475569';\n        const border = variant === 'destructive' ? '#fca5a5' : '#cbd5e1';\n        return <span style={{backgroundColor:bg, color:color, border:`1px solid ${border}`, padding:'0.2rem 0.6rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:'600', display:'inline-flex', alignItems:'center', whiteSpace:'nowrap'}}>{children}</span>; \n    }"
    },
    {
        filePath: 'components/ui/card.tsx',
        content: "\n      export function Card({children}:any) { return <div style={{border:'1px solid #e2e8f0', borderRadius:'0.75rem', overflow:'hidden', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', margin:'2rem 0', backgroundColor:'#ffffff'}}>{children}</div>; }\n      export function CardHeader({children}:any) { return <div style={{padding:'1.5rem 1.5rem 0.5rem 1.5rem'}}>{children}</div>; }\n      export function CardTitle({children}:any) { return <h3 style={{margin:0, fontSize:'1.25rem', fontWeight:'600', color:'#0f172a', lineHeight:'1.5'}}>{children}</h3>; }\n      export function CardContent({children}:any) { return <div style={{padding:'1.5rem', paddingTop:0}}>{children}</div>; }\n    "
    },
    {
        filePath: 'features/education-behavioral-economics/index.tsx',
        content: "export function BiasLab() { return <div style={{padding:'3rem 2rem', backgroundColor:'#eff6ff', borderRadius:'0.75rem', textAlign:'center', color:'#1d4ed8', fontWeight:'bold', border:'1px solid #bfdbfe', margin:'2rem 0'}}>🧠 Cognitive Bias Lab (Interactive Module Placeholder)</div>; }"
    },
    {
        filePath: 'features/education-game-theory/index.tsx',
        content: "export function GameTheoryPlayground() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f0fdf4', borderRadius:'0.75rem', textAlign:'center', color:'#15803d', fontWeight:'bold', border:'1px solid #bbf7d0', margin:'2rem 0'}}>🎲 Game Theory Playground (Interactive Module Placeholder)</div>; }"
    },
    {
        filePath: 'features/education-accounting-investing/index.tsx',
        content: "export function InvestmentSimulator() { return <div style={{padding:'3rem 2rem', backgroundColor:'#fdf4ff', borderRadius:'0.75rem', textAlign:'center', color:'#a21caf', fontWeight:'bold', border:'1px solid #f5d0fe', margin:'2rem 0'}}>📈 Investment Simulator (Interactive Module Placeholder)</div>; }"
    },
    {
        filePath: 'features/education-common/components/LectureVisuals.tsx',
        content: "\n      export function LecturePieChart(props:any) { \n        return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>\n            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📊</div>\n            <div>Pie Chart: {props.title || 'Untitled'}</div>\n        </div>; \n      }\n      export function LectureTable(props:any) { \n        return <div style={{overflowX:'auto', margin:'2.5rem 0', borderRadius:'0.75rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>\n          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left', fontSize:'0.95rem', margin:0}}>\n            {props.title && <caption style={{padding:'1.25rem 1.5rem', fontWeight:'600', backgroundColor:'#f8fafc', borderBottom:'1px solid #e2e8f0', color:'#0f172a', textAlign:'left'}}>{props.title}</caption>}\n            <thead style={{backgroundColor:'#f1f5f9'}}>\n                <tr>{props.headers?.map((h:any,i:number)=><th key={i} style={{padding:'1rem 1.5rem', borderBottom:'1px solid #e2e8f0', fontWeight:'600', color:'#334155'}}>{h}</th>)}</tr>\n            </thead>\n            <tbody>\n                {props.rows?.map((r:any,i:number)=><tr key={i} style={{borderBottom: '1px solid #e2e8f0', backgroundColor: i%2===0 ? '#ffffff' : '#f8fafc'}}>\n                    {r.map((c:any,j:number)=><td key={j} style={{padding:'1rem 1.5rem', color:'#475569', lineHeight:'1.5'}}>{c}</td>)}\n                </tr>)}\n            </tbody>\n          </table>\n        </div>; \n      }\n      export function LectureBarChart(props:any) { \n        return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>\n            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📉</div>\n            <div>Bar Chart: {props.title || 'Untitled'}</div>\n        </div>; \n      }\n      export function LectureProcess(props:any) { \n        return <div style={{margin:'2.5rem 0', padding:'2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>\n          {props.title && <h4 style={{marginTop:0, marginBottom:'1.5rem', color:'#0f172a', fontSize:'1.15rem', fontWeight:'600'}}>{props.title}</h4>}\n          <ol style={{margin:0, paddingLeft:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>\n            {props.steps?.map((step:any,i:number)=><li key={i} style={{color:'#475569', lineHeight:'1.6'}}><strong style={{color:'#0f172a', display:'block', marginBottom:'0.25rem'}}>{step.label}</strong> {step.description}</li>)}\n          </ol>\n        </div>; \n      }\n    "
    },
    {
        filePath: 'features/education-finance/FinanceCharts.tsx',
        content: "\n        export function OptionPayoffChart() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📈 Option Payoff Chart (Placeholder)</div>; }\n        export function FrontierChart({title}:any) { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📊 Efficient Frontier Chart: {title || 'Untitled'}</div>; }\n        export function NPVChart() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📉 NPV Chart (Placeholder)</div>; }\n        export function SMLChart() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>📈 SML Chart (Placeholder)</div>; }\n    "
    },
    {
        filePath: 'features/education-negotiation/index.tsx',
        content: "export function NegotiationSimulator() { return <div style={{padding:'3rem 2rem', backgroundColor:'#fffbeb', borderRadius:'0.75rem', textAlign:'center', color:'#b45309', fontWeight:'bold', border:'1px solid #fde68a', margin:'2rem 0'}}>🤝 Negotiation Simulator (Interactive Module Placeholder)</div>; }"
    },
    {
        filePath: 'features/education-ai-literacy/index.tsx',
        content: "export function PromptPlayground() { return <div style={{padding:'3rem 2rem', backgroundColor:'#f5f3ff', borderRadius:'0.75rem', textAlign:'center', color:'#6d28d9', fontWeight:'bold', border:'1px solid #ddd6fe', margin:'2rem 0'}}>🤖 AI Prompt Playground (Interactive Module Placeholder)</div>; }"
    }
];

mocks.forEach(mock => {
    const fullPath = path.join(SRC_DIR, mock.filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    console.log('Overwriting mock component: ' + mock.filePath);
    fs.writeFileSync(fullPath, mock.content.replace(/\\\\n/g, '\\n'));
});
