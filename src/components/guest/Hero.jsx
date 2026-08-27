import React from 'react';
import { Link } from 'react-router-dom';
import HeroImage from '../../assets/hero-image.jpeg';

const Hero = () => {
    return (
        <section className="relative bg-white dark:bg-slate-900 overflow-hidden py-16 md:py-24 flex-grow transition-colors">
            <div className="absolute top-0 right-0 md:right-1/4 w-96 h-96 bg-red-600 rounded-full translate-x-1/2 -translate-y-1/4 opacity-90 z-0"></div>
            <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center">

                {/* Kolom Kiri: Teks */}
                <div className="md:w-1/2 md:pr-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                        {/*Pendidikan <span className="text-red-600 dark:text-red-400">Berdaulat.</span>*/}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-slate-300 mb-8 max-w-lg">
                        Pusat Kegiatan Belajar Masyarakat (PKBM) KARTINI hadir untuk memberikan layanan pendidikan non-formal yang berkualitas, inklusif, dan berorientasi pada kemandirian warga belajar.
                    </p>
                    <Link to="/daftar" className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 shadow-lg transition-transform transform hover:-translate-y-1">
                        Daftar Sekarang &rarr;
                    </Link>
                </div>

                {/* Kolom Kanan: Gambar (Pembungkus div-nya cukup satu saja) */}
                <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
                    <img
                        src={HeroImage}
                        alt="Kegiatan Belajar PKBM KARTINI"
                        className="w-full max-w-md h-auto object-contain rounded-2xl shadow-xl"
                    />
                </div>

            </div>
        </section>
    );
};

export default Hero;
