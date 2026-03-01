
      export function LecturePieChart(props:any) { 
        return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>
            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📊</div>
            <div>Pie Chart: {props.title || 'Untitled'}</div>
        </div>; 
      }
      export function LectureTable(props:any) { 
        return <div style={{overflowX:'auto', margin:'2.5rem 0', borderRadius:'0.75rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left', fontSize:'0.95rem', margin:0}}>
            {props.title && <caption style={{padding:'1.25rem 1.5rem', fontWeight:'600', backgroundColor:'#f8fafc', borderBottom:'1px solid #e2e8f0', color:'#0f172a', textAlign:'left'}}>{props.title}</caption>}
            <thead style={{backgroundColor:'#f1f5f9'}}>
                <tr>{props.headers?.map((h:any,i:number)=><th key={i} style={{padding:'1rem 1.5rem', borderBottom:'1px solid #e2e8f0', fontWeight:'600', color:'#334155'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
                {props.rows?.map((r:any,i:number)=><tr key={i} style={{borderBottom: '1px solid #e2e8f0', backgroundColor: i%2===0 ? '#ffffff' : '#f8fafc'}}>
                    {r.map((c:any,j:number)=><td key={j} style={{padding:'1rem 1.5rem', color:'#475569', lineHeight:'1.5'}}>{c}</td>)}
                </tr>)}
            </tbody>
          </table>
        </div>; 
      }
      export function LectureBarChart(props:any) { 
        return <div style={{padding:'3rem 2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', textAlign:'center', color:'#475569', fontWeight:'bold', border:'2px dashed #cbd5e1', margin:'2rem 0'}}>
            <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📉</div>
            <div>Bar Chart: {props.title || 'Untitled'}</div>
        </div>; 
      }
      export function LectureProcess(props:any) { 
        return <div style={{margin:'2.5rem 0', padding:'2rem', backgroundColor:'#f8fafc', borderRadius:'0.75rem', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          {props.title && <h4 style={{marginTop:0, marginBottom:'1.5rem', color:'#0f172a', fontSize:'1.15rem', fontWeight:'600'}}>{props.title}</h4>}
          <ol style={{margin:0, paddingLeft:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
            {props.steps?.map((step:any,i:number)=><li key={i} style={{color:'#475569', lineHeight:'1.6'}}><strong style={{color:'#0f172a', display:'block', marginBottom:'0.25rem'}}>{step.label}</strong> {step.description}</li>)}
          </ol>
        </div>; 
      }
    