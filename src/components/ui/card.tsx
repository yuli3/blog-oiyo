
      export function Card({children}:any) { return <div style={{border:'1px solid #e2e8f0', borderRadius:'0.75rem', overflow:'hidden', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', margin:'2rem 0', backgroundColor:'#ffffff'}}>{children}</div>; }
      export function CardHeader({children}:any) { return <div style={{padding:'1.5rem 1.5rem 0.5rem 1.5rem'}}>{children}</div>; }
      export function CardTitle({children}:any) { return <h3 style={{margin:0, fontSize:'1.25rem', fontWeight:'600', color:'#0f172a', lineHeight:'1.5'}}>{children}</h3>; }
      export function CardContent({children}:any) { return <div style={{padding:'1.5rem', paddingTop:0}}>{children}</div>; }
    