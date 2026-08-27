import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { getNewsThumbnail, formatNewsDate } from '../../utils/newsMedia';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const NewsPage = () => {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNewsList(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <div className="font-sans text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors">
            <Navbar />

            <section className="bg-white dark:bg-slate-900 py-12 md:py-16 border-b border-gray-200 dark:border-slate-800 transition-colors">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Berita & Informasi</h1>
                    <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Dapatkan pembaruan terbaru seputar kegiatan, pengumuman akademik, dan pencapaian warga belajar PKBM KARTINI.
                    </p>
                </div>
            </section>

            <main className="container mx-auto px-4 py-12 flex-grow">
                <div className="max-w-4xl mx-auto space-y-8">
                    {loading ? (
                        <p className="text-center text-gray-400">Memuat berita...</p>
                    ) : newsList.length === 0 ? (
                        <p className="text-center text-gray-400">Belum ada berita.</p>
                    ) : (
                        newsList.map((news) => {
                            const imageSrc = getNewsThumbnail(news);
                            return (
                                <Link key={news.id} to={`/berita/${news.id}`} className="block group">
                                    <div className="flex flex-col md:flex-row bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md hover:border-red-200 dark:hover:border-red-500/30">
                                        {/* Thumbnail */}
                                        <div className="relative md:w-1/3 bg-gray-200 dark:bg-slate-700 min-h-[200px] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {imageSrc ? (
                                                <img src={imageSrc} alt={news.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <FontAwesomeIcon icon={faVideo} className="text-gray-400 w-8 h-8" />
                                            )}
                                            {imageSrc && news.tipeMedia === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                                        <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-white ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Konten Text */}
                                        <div className="p-6 md:w-2/3 flex flex-col justify-center">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                                                    {news.tipeMedia === 'video' ? 'VIDEO' : 'BERITA'}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-slate-400">{formatNewsDate(news.createdAt)}</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {news.title}
                                            </h2>
                                            <p className="text-gray-600 dark:text-slate-300 text-sm line-clamp-2">
                                                {news.deskripsi}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsPage;
