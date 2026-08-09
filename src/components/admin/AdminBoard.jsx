import { useAuth } from '../../context/AuthContext.jsx';

const boardColumns = [
    {
        title: 'Rencana',
        marker: 'bg-violet-500',
        cards: [
            { title: 'Verifikasi berkas pendaftar Paket B', tags: ['Pendaftaran', 'Prioritas'], tint: 'bg-blue-100 text-blue-900', progress: 40, people: ['RA', 'DS'], due: '12', files: '4' },
            { title: 'Susun jadwal pembelajaran minggu depan', tags: ['Jadwal', 'Pengajar'], tint: 'bg-violet-100 text-violet-900', progress: 25, people: ['NF'], due: '08', files: '2' },
            { title: 'Perbarui data warga belajar aktif', tags: ['Data WB'], tint: 'bg-rose-100 text-rose-900', progress: 60, people: ['AS', 'RA'], due: '18', files: '5' },
        ],
    },
    {
        title: 'Sedang dikerjakan',
        marker: 'bg-amber-500',
        cards: [
            { title: 'Rekap nilai evaluasi akhir semester', tags: ['Akademik', 'Nilai'], tint: 'bg-amber-100 text-amber-900', progress: 82, people: ['DS', 'NF', 'RA'], due: '06', files: '7' },
            { title: 'Siapkan materi pelatihan keterampilan', tags: ['Program', 'Modul'], tint: 'bg-emerald-100 text-emerald-900', progress: 55, people: ['AS', 'NF'], due: '10', files: '3' },
        ],
    },
    {
        title: 'Perlu ditinjau',
        marker: 'bg-pink-500',
        cards: [
            { title: 'Publikasi kegiatan Hari Kemerdekaan', tags: ['Berita', 'Publikasi'], tint: 'bg-pink-100 text-pink-900', progress: 100, people: ['RA', 'DS'], due: '03', files: '6' },
            { title: 'Persetujuan laporan kegiatan Juli', tags: ['Laporan'], tint: 'bg-indigo-100 text-indigo-900', progress: 90, people: ['AS'], due: '09', files: '2' },
            { title: 'Review usulan program warga belajar', tags: ['Program', 'Review'], tint: 'bg-orange-100 text-orange-900', progress: 70, people: ['NF', 'RA'], due: '14', files: '4' },
        ],
    },
];

const initialsColors = ['bg-slate-700', 'bg-rose-500', 'bg-amber-500'];

const AvatarStack = ({ people }) => (
    <div className="flex -space-x-2">
        {people.map((person, index) => (
            <span
                key={`${person}-${index}`}
                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white ${initialsColors[index % initialsColors.length]}`}
            >
                {person}
            </span>
        ))}
    </div>
);

const TaskCard = ({ card, marker }) => (
    <article className={`${card.tint} rounded-2xl p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
        <div className="mb-4 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-white/65 px-2 py-1 text-[10px] font-semibold">#{tag}</span>
                ))}
            </div>
            <button type="button" aria-label={`Opsi ${card.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/45 text-lg leading-none">⋮</button>
        </div>
        <h3 className="min-h-12 text-sm font-bold leading-5">{card.title}</h3>
        <div className="mt-5">
            <div className="mb-2 flex justify-between text-[11px] font-medium"><span>Progres</span><span>{card.progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/50">
                <div className={`h-full rounded-full ${marker}`} style={{ width: `${card.progress}%` }} />
            </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
            <AvatarStack people={card.people} />
            <div className="flex gap-3 text-[11px] font-medium">
                <span>▣ {card.due}</span>
                <span>⌕ {card.files}</span>
            </div>
        </div>
    </article>
);

const AdminBoard = () => {
    const { currentUser } = useAuth();
    const name = currentUser?.nama || 'Administrator';
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <section className="mx-auto w-full max-w-[1440px]">
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:px-6">
                <div>
                    <p className="text-xs font-medium text-slate-500">Hari ini</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{today}</p>
                </div>
                <div className="hidden h-10 w-px bg-slate-200 sm:block" />
                <div className="flex flex-1 items-center justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-slate-900">Board <span className="text-slate-400">–</span> Aktivitas PKBM</p>
                        <p className="text-xs text-slate-500">Pantau pekerjaan tim dalam satu tempat</p>
                    </div>
                    <AvatarStack people={['RA', 'DS', 'NF']} />
                </div>
            </div>

            <div className="mb-5 flex items-end justify-between px-1">
                <div>
                    <p className="text-sm text-slate-500">Selamat datang,</p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
                </div>
                <button type="button" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">+ Tambah tugas</button>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
                {boardColumns.map((column) => (
                    <section key={column.title} className="rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                        <div className="mb-3 flex items-center justify-between border-b border-slate-200 px-2 pb-3">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><span className={`h-2.5 w-2.5 rounded-full ${column.marker}`} />{column.title}</h2>
                            <div className="flex gap-3 text-lg text-slate-500"><button type="button" aria-label={`Tambah ke ${column.title}`}>+</button><button type="button" aria-label={`Menu ${column.title}`}>⋮</button></div>
                        </div>
                        <div className="space-y-3">
                            {column.cards.map((card) => <TaskCard key={card.title} card={card} marker={column.marker} />)}
                        </div>
                    </section>
                ))}
            </div>
        </section>
    );
};

export default AdminBoard;
