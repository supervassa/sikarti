import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase.js';

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), () => setError('Audit log belum dapat dimuat.')), []);
    const date = (value) => value?.toDate ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value.toDate()) : 'Baru saja';
    return <section className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-violet-600">SUPERADMIN</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Audit Log</h1><p className="mt-2 text-slate-500">50 aktivitas terbaru. Catatan bersifat append-only dari aplikasi.</p>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Aktivitas</th><th className="px-4 py-4">Pelaku</th><th className="px-4 py-4">Target</th><th className="px-6 py-4">Waktu</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">Belum ada aktivitas tercatat.</td></tr> : logs.map((log) => <tr key={log.id} className="border-t border-slate-100"><td className="px-6 py-4"><span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{log.action}</span><p className="mt-1 text-xs text-slate-500">{log.module}</p></td><td className="px-4 py-4"><p className="font-semibold">{log.performedByName}</p><p className="text-xs text-slate-500">{log.performedByEmail}</p></td><td className="px-4 py-4 text-slate-600">{log.targetType} <span className="font-mono text-xs">{log.targetId}</span></td><td className="px-6 py-4 text-xs text-slate-500">{date(log.timestamp)}</td></tr>)}</tbody></table></div>
    </section>;
};

export default AuditLogPage;
