const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false });
async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS pengawas (id TEXT PRIMARY KEY, nama TEXT, status TEXT DEFAULT 'Aktif', password TEXT DEFAULT '123456', role TEXT DEFAULT 'pengawas')`);
  await pool.query(`CREATE TABLE IF NOT EXISTS roster (tanggal DATE, nik TEXT, posisi TEXT, PRIMARY KEY (tanggal, nik))`);
  await pool.query(`INSERT INTO pengawas (id,nama,status,password,role) VALUES ('HUSIN','Husin','Aktif','232323','admin') ON CONFLICT (id) DO NOTHING`);
  const list = [['CLS662032026','Miskam'],['CLS660032026','Laurensius Febi'],['CLS655032026','Arif Zainal M'],['CLS653032026','Achmad Zainudin'],['CLS658032026','Heri Mardianto'],['CLS657032026','Heri Dwi Wahyudi'],['CLS656032026','Fransisco E V S'],['CLS661032026','Lulut Muslim'],['CLS666032026','Rusmani'],['CLS516062026','Hendry Jhon Ramme'],['CLS086082022','Muhammad Alfianoor'],['CLS066112024','Joko Julianto'],['CLS069052026','Ananto Widodo']];
  for (let [id,nama] of list) await pool.query(`INSERT INTO pengawas (id,nama) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING`, [id,nama]);
  const cek = await pool.query(`SELECT COUNT(*) FROM roster`);
  if (parseInt(cek.rows[0].count) === 0) {
    const seed = [['2026-11-16','CLS662032026','SHIFT1-PIC'],['2026-11-16','CLS660032026','SHIFT1-HRM'],['2026-11-16','CLS655032026','SHIFT1-ROM A6+G'],['2026-11-16','CLS653032026','SHIFT1-ROM T'],['2026-11-16','CLS658032026','SHIFT2-PIC'],['2026-11-16','CLS657032026','SHIFT2-HRM'],['2026-11-16','CLS656032026','SHIFT2-ROM A6+G'],['2026-11-16','CLS661032026','SHIFT2-ROM T'],['2026-11-16','CLS666032026','SHIFT2-MUARA'],['2026-11-16','CLS516062026','OFF'],['2026-11-16','CLS086082022','OFF'],['2026-11-16','CLS066112024','CUTI'],['2026-11-16','CLS069052026','CUTI']];
    for (let [t,n,p] of seed) await pool.query(`INSERT INTO roster VALUES ($1,$2,$3)`, [t,n,p]);
  }
  console.log('DB Siap!');
}
initDB();
app.post('/api/login', async (req,res)=>{ const {user, pass} = req.body; const r = await pool.query(`SELECT * FROM pengawas WHERE id=$1 AND password=$2`, [user, pass]); if(r.rows.length===0) return res.json({ok:false}); res.json({ok:true, user: r.rows[0]}); });
app.get('/api/data', async (req,res)=>{ const p = await pool.query(`SELECT * FROM pengawas ORDER BY id`); const r = await pool.query(`SELECT * FROM roster ORDER BY tanggal`); res.json({pengawas: p.rows, roster: r.rows}); });
app.post('/api/roster', async (req,res)=>{ const {tanggal, nik, posisi} = req.body; await pool.query(`INSERT INTO roster VALUES ($1,$2,$3) ON CONFLICT (tanggal,nik) DO UPDATE SET posisi=$3`, [tanggal,nik,posisi]); res.json({ok:true}); });
app.post('/api/copy', async (req,res)=>{ const {from, to} = req.body; await pool.query(`DELETE FROM roster WHERE tanggal=$1`, [to]); await pool.query(`INSERT INTO roster SELECT $2, nik, posisi FROM roster WHERE tanggal=$1`, [from, to]); res.json({ok:true}); });
app.post('/api/pengawas', async (req,res)=>{ const {id,nama} = req.body; await pool.query(`INSERT INTO pengawas (id,nama) VALUES ($1,$2)`, [id,nama]); res.json({ok:true}); });
app.post('/api/pengawas/off', async (req,res)=>{ await pool.query(`UPDATE pengawas SET status='Non-Aktif' WHERE id=$1`, [req.body.id]); res.json({ok:true}); });
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 3000; app.listen(PORT, ()=> console.log('Jalan di '+PORT));