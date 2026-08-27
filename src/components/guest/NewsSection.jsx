import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { getNewsThumbnail, formatNewsDate } from '../../utils/newsMedia';

const NewsSection = () => {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(2));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNewsList(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <section className="bg-gray-50 dark:bg-slate-950 py-12 transition-colors">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-12">
                <div className="md:w-2/3">
                    <div className="flex justify-between items-center mb-6 border-b-2 border-red-600 pb-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Seputar PKBM</h2>
                        <Link to="/berita" className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Lihat Semua</Link>
                    </div>
                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-sm text-gray-400">Memuat berita...</p>
                        ) : newsList.length === 0 ? (
                            <p className="text-sm text-gray-400">Belum ada berita.</p>
                        ) : (
                            newsList.map((item) => {
                                const imageSrc = getNewsThumbnail(item);
                                return (
                                    <Link key={item.id} to={`/berita/${item.id}`} className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <div className="relative w-1/3 bg-gray-200 dark:bg-slate-700 min-h-[120px] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {imageSrc ? (
                                                <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <FontAwesomeIcon icon={faVideo} className="text-gray-400 w-6 h-6" />
                                            )}
                                            {imageSrc && item.tipeMedia === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                                                        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-white ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 w-2/3 flex flex-col justify-center">
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                                                {item.tipeMedia === 'video' ? 'VIDEO' : 'BERITA'}
                                            </span>
                                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">{item.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{formatNewsDate(item.createdAt)}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="md:w-1/3">
                    <div className="bg-[#f2efe9] dark:bg-slate-800 p-6 rounded-lg">
                        <h3 className="font-bold text-xl text-red-700 dark:text-red-400 mb-4">Akses Cepat</h3>
                        <ul className="space-y-3">
                            <li className="border-b border-gray-300 dark:border-slate-600 pb-2 text-sm text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer">&gt; Kalender Akademik</li>
                            <li className="border-b border-gray-300 dark:border-slate-600 pb-2 text-sm text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer">&gt; Jadwal Mata Pelajaran</li>
                            <li className="border-b border-gray-300 dark:border-slate-600 pb-2 text-sm text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer">&gt; Informasi Biaya</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
