export function Badge({children, variant}:any) { 
        const bg = variant === 'destructive' ? '#fef2f2' : '#f1f5f9';
        const color = variant === 'destructive' ? '#ef4444' : '#475569';
        const border = variant === 'destructive' ? '#fca5a5' : '#cbd5e1';
        return <span style={{backgroundColor:bg, color:color, border:`1px solid ${border}`, padding:'0.2rem 0.6rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:'600', display:'inline-flex', alignItems:'center', whiteSpace:'nowrap'}}>{children}</span>; 
    }