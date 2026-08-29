import React from "react";
import Navbar from "../../components/guest/Navbar";
import Footer from "../../components/guest/Footer";
import ContactSection from "../../components/guest/ContactSection";

const ContactPage = () => {
  return (
    <div className="font-sans text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors">
      <Navbar />

      <section className="bg-[#0b1f3d] py-12 md:py-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full translate-x-1/3 -translate-y-1/3 opacity-80 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Kontak Kami</h1>
          <p className="text-gray-300 max-w-2xl">
            Informasi lokasi sekretariat PKBM KARTINI dan cara menghubungi kami.
          </p>
        </div>
      </section>

      <main className="flex-grow">
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
