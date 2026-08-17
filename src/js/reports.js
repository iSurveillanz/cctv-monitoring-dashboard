export function buildReport({unit, clients=[]}){
  const totalCameras = clients.reduce((sum,c)=>sum + Number(c.cameras || 0),0)
  return `📊 CCTV Daily Monitoring Report – ${unit}\n\nTotal Clients: ${clients.length}\nTotal Cameras: ${totalCameras}\n\nGenerated: ${new Date().toLocaleString()}`
}
export async function copyReport(report){ await navigator.clipboard.writeText(report); return report }
