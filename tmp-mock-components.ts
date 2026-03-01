import fs from 'fs';
import path from 'path';

const SRC_DIR = '/Users/seuncho/coding/blog-oiyo/src';

const mocks = [
    {
        filePath: 'components/mdx/Callout.astro',
        content: `---\n---\n<div style="padding:1rem;background:#f0f0f0;margin:1rem 0;"><slot /></div>`
    },
    {
        filePath: 'components/mdx/FormulaBlock.astro',
        content: `---\n---\n<div style="padding:1rem;background:#eee;font-family:monospace;margin:1rem 0;"><slot /></div>`
    },
    {
        filePath: 'components/education/PoisonPillExplorer.tsx',
        content: `export default function PoisonPillExplorer() { return <div style={{border:'1px solid #ccc', padding:'1rem'}}>[PoisonPillExplorer UI placeholder]</div>; }`
    },
    {
        filePath: 'components/ui/badge.tsx',
        content: `export function Badge({children}:any) { return <span style={{background:'#ccc', padding:'2px 4px', borderRadius:'4px'}}>{children}</span>; }`
    },
    {
        filePath: 'components/ui/card.tsx',
        content: `
      export function Card({children}:any) { return <div style={{border:'1px solid #ddd', padding:'1rem'}}>{children}</div>; }
      export function CardHeader({children}:any) { return <div style={{fontWeight:'bold'}}>{children}</div>; }
      export function CardTitle({children}:any) { return <h3>{children}</h3>; }
      export function CardContent({children}:any) { return <div>{children}</div>; }
    `
    },
    {
        filePath: 'features/education-behavioral-economics/index.tsx',
        content: `export function BiasLab() { return <div>[BiasLab UI placeholder]</div>; }`
    },
    {
        filePath: 'features/education-game-theory/index.tsx',
        content: `export function GameTheoryPlayground() { return <div>[GameTheoryPlayground UI placeholder]</div>; }`
    },
    {
        filePath: 'features/education-accounting-investing/index.tsx',
        content: `export function InvestmentSimulator() { return <div>[InvestmentSimulator UI placeholder]</div>; }`
    },
    {
        filePath: 'features/education-common/components/LectureVisuals.tsx',
        content: `
      export function LecturePieChart(props:any) { return <div>[LecturePieChart placeholder]</div>; }
      export function LectureTable(props:any) { 
        return <div style={{overflowX:'auto'}}>
          <table border={1} style={{width:'100%'}}>
            {props.title && <caption>{props.title}</caption>}
            <thead><tr>{props.headers?.map((h:any,i:number)=><th key={i}>{h}</th>)}</tr></thead>
            <tbody>{props.rows?.map((r:any,i:number)=><tr key={i}>{r.map((c:any,j:number)=><td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>; 
      }
      export function LectureBarChart(props:any) { return <div>[LectureBarChart placeholder]</div>; }
      export function LectureProcess(props:any) { 
        return <div>
          <h4>Process:</h4>
          <ol>{props.steps?.map((step:any,i:number)=><li key={i}><strong>{step.label}</strong>: {step.description}</li>)}</ol>
        </div>; 
      }
    `
    },
    {
        filePath: 'features/education-finance/FinanceCharts.tsx',
        content: `export function OptionPayoffChart() { return <div>[OptionPayoffChart UI placeholder]</div>; }`
    },
    {
        filePath: 'features/education-negotiation/index.tsx',
        content: `export function NegotiationSimulator() { return <div>[NegotiationSimulator UI placeholder]</div>; }`
    },
    {
        filePath: 'features/education-ai-literacy/index.tsx',
        content: `export function PromptPlayground() { return <div>[PromptPlayground UI placeholder]</div>; }`
    }
];

mocks.forEach(mock => {
    const fullPath = path.join(SRC_DIR, mock.filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(fullPath)) {
        console.log(`Creating mock component: ${mock.filePath}`);
        fs.writeFileSync(fullPath, mock.content);
    } else {
        console.log(`Component already exists, skipping: ${mock.filePath}`);
    }
});
